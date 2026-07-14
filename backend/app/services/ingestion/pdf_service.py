"""
CrimeOS - Multilingual PDF Complaint Extractor
================================================
Converts complaint PDFs (native-text or scanned) into structured JSON.
Supports Gujarati, Hindi, and English (single documents, mixed-language
documents, and code-mixed lines).

Pipeline:
    1. Detect whether each PDF page has a native text layer or is scanned.
    2. Extract text accordingly (pdfplumber for native, Tesseract OCR for scanned).
    3. Identify language per text block (script-based + langdetect fallback).
    4. Normalize Unicode (NFC) and clean OCR noise.
    5. Run regex-based extraction for high-precision fields (phone, date, FIR no, pincode).
    6. Run LLM-based structured extraction (Claude) for entities/sections/key facts,
       if GOOGLE_API_KEY is available. Falls back to regex-only output otherwise.
    7. Validate the final structure with Pydantic before returning/saving JSON.

Usage:
    python extractor.py path/to/complaint.pdf
    python extractor.py path/to/complaint.pdf --out result.json
    python extractor.py path/to/folder/ --out results/   (batch mode)
"""

import os
import re
import sys
import json
import glob
import argparse
import unicodedata
from typing import List, Dict, Any, Optional

import pdfplumber
import pytesseract
from pdf2image import convert_from_path
from langdetect import detect_langs, DetectorFactory
from pydantic import BaseModel, Field, ValidationError
from google import genai
from google.genai import types
from dotenv import load_dotenv
from pathlib import Path


# .env lives at backend/.env, but this file is at backend/app/services/ingestion/
# so walk up to the backend root explicitly rather than relying on CWD
BACKEND_ROOT = Path(__file__).resolve().parents[3]  # ingestion -> services -> app -> backend
load_dotenv(BACKEND_ROOT / ".env")
print("Key loaded:", bool(os.environ.get("GOOGLE_API_KEY")))

DetectorFactory.seed = 0  # deterministic langdetect results

# --------------------------------------------------------------------------
# 1. Unicode script ranges used for fast, reliable script-based language ID.
#    This is more robust than statistical language ID for short lines and
#    for telling Gujarati/Devanagari/Latin apart in code-mixed complaints.
# --------------------------------------------------------------------------
SCRIPT_RANGES = {
    "gujarati": (0x0A80, 0x0AFF),
    "devanagari": (0x0900, 0x097F),  # Hindi
    "latin": (0x0041, 0x024F),        # English + extended Latin
}

LANG_LABELS = {
    "gujarati": "gu",
    "devanagari": "hi",
    "latin": "en",
}


def detect_script(text: str) -> Dict[str, float]:
    """Return proportion of characters belonging to each known script."""
    counts = {k: 0 for k in SCRIPT_RANGES}
    total = 0
    for ch in text:
        cp = ord(ch)
        if ch.isspace() or unicodedata.category(ch).startswith("P"):
            continue
        total += 1
        for name, (lo, hi) in SCRIPT_RANGES.items():
            if lo <= cp <= hi:
                counts[name] += 1
                break
    if total == 0:
        return {k: 0.0 for k in SCRIPT_RANGES}
    return {k: v / total for k, v in counts.items()}


def identify_languages(text: str) -> List[str]:
    """
    Identify all languages present in a block of text.
    Uses script detection first (fast, reliable for Indic scripts),
    and falls back to langdetect for ambiguous Latin-only text
    (e.g. distinguishing English from romanized Gujarati/Hindi).
    """
    scripts = detect_script(text)
    langs = set()
    for name, ratio in scripts.items():
        if ratio > 0.15:  # present in meaningful proportion -> code-mixed doc
            langs.add(LANG_LABELS[name])

    if not langs:
        try:
            for guess in detect_langs(text):
                if guess.prob > 0.5:
                    langs.add(guess.lang)
        except Exception:
            pass

    return sorted(langs) if langs else ["unknown"]


# --------------------------------------------------------------------------
# 2. PDF type detection + text extraction
# --------------------------------------------------------------------------
def page_has_native_text(page, min_chars: int = 20) -> bool:
    text = page.extract_text() or ""
    return len(text.strip()) >= min_chars


def ocr_page(pil_image, langs: str = "guj+hin+eng") -> str:
    """OCR a single page image with combined Gujarati+Hindi+English models."""
    config = "--oem 1 --psm 3"
    return pytesseract.image_to_string(pil_image, lang=langs, config=config)


def extract_text_from_pdf(pdf_path: str) -> Dict[str, Any]:
    """
    Extract text page-by-page, choosing native extraction or OCR per page.
    Returns per-page text plus an overall extraction method summary.
    """
    pages_text = []
    methods = []

    with pdfplumber.open(pdf_path) as pdf:
        native_flags = [page_has_native_text(p) for p in pdf.pages]

    # OCR only the pages that need it (scanned or text-sparse pages)
    ocr_needed_indices = [i for i, native in enumerate(native_flags) if not native]
    ocr_images = {}
    if ocr_needed_indices:
        images = convert_from_path(pdf_path, dpi=300)
        for idx in ocr_needed_indices:
            if idx < len(images):
                ocr_images[idx] = images[idx]

    with pdfplumber.open(pdf_path) as pdf:
        for i, page in enumerate(pdf.pages):
            if native_flags[i]:
                text = page.extract_text() or ""
                methods.append("native")
            else:
                text = ocr_page(ocr_images.get(i)) if i in ocr_images else ""
                methods.append("ocr")
            pages_text.append(text)

    return {
        "pages": pages_text,
        "methods": methods,
        "full_text": "\n\n".join(pages_text),
    }


# --------------------------------------------------------------------------
# 3. Cleaning / normalization
# --------------------------------------------------------------------------
def clean_text(text: str) -> str:
    text = unicodedata.normalize("NFC", text)
    # collapse excessive whitespace introduced by OCR line breaks
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


# --------------------------------------------------------------------------
# 4. Regex-based high-precision field extraction (safety net, language-agnostic
#    where possible since these patterns are numeric/structural, not lexical)
# --------------------------------------------------------------------------
REGEX_PATTERNS = {
    "phone_numbers": r"(?:\+91[\-\s]?)?[6-9]\d{9}\b",
    "pincodes": r"\b\d{6}\b",
    "dates": r"\b\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4}\b",
    "fir_numbers": r"\b(?:FIR|F\.I\.R\.?)\s*(?:No\.?|Number|#)?\s*[:\-]?\s*[\w/\-]+",
    "aadhaar_like": r"\b\d{4}\s?\d{4}\s?\d{4}\b",
}


def regex_extract(text: str) -> Dict[str, List[str]]:
    results = {}
    for field, pattern in REGEX_PATTERNS.items():
        matches = re.findall(pattern, text, flags=re.IGNORECASE)
        results[field] = sorted(set(m.strip() for m in matches))
    return results


# --------------------------------------------------------------------------
# 5. LLM-based structured extraction (entities, sections, key facts)
#    Uses Claude via the Anthropic API if GOOGLE_API_KEY is set.
#    This is what makes the extraction genuinely language-agnostic for
#    free-text fields (narrative, complainant/accused details) instead of
#    needing a separate NER model per language.
# --------------------------------------------------------------------------
EXTRACTION_SYSTEM_PROMPT = """You are an information extraction engine for a police \
complaint-management system (CrimeOS). You will receive raw complaint text that may be \
in Gujarati, Hindi, English, or a mix of these. Extract structured information and \
return ONLY a single valid JSON object -- no markdown fences, no commentary, no preamble.

Required JSON shape:
{
  "sections": {
    "complainant_details": {"name": "", "address": "", "phone": "", "id_proof": ""},
    "incident_details": {"date": "", "location": "", "description": ""},
    "accused_details": [{"name": "", "description": ""}],
    "narrative_text": ""
  },
  "entities": {
    "people": [], "locations": [], "dates": [], "phone_numbers": [], "organizations": []
  },
  "key_facts": []
}

Rules:
- If a field is not present in the text, use an empty string or empty list -- never invent data.
- Keep extracted names/places in their original script (do not transliterate).
- "key_facts" should be short, factual bullet-style strings summarizing the complaint's core allegations.
- Output valid JSON only.
"""


def llm_extract(text: str, model: str = "gemini-2.5-flash") -> Optional[Dict[str, Any]]:
    api_key = os.environ.get("GOOGLE_API_KEY")
    ...
    client = genai.Client(api_key=api_key)
    response = client.models.generate_content(
        model=model,
        contents=text[:15000],
        config=types.GenerateContentConfig(
            system_instruction=EXTRACTION_SYSTEM_PROMPT,
            response_mime_type="application/json",  # forces valid JSON directly
            temperature=0,
        ),
    )
    raw = response.text
    return json.loads(raw)


# --------------------------------------------------------------------------
# 6. Output schema + validation
# --------------------------------------------------------------------------
class ComplainantDetails(BaseModel):
    name: str = ""
    address: str = ""
    phone: str = ""
    id_proof: str = ""


class IncidentDetails(BaseModel):
    date: str = ""
    location: str = ""
    description: str = ""


class AccusedDetail(BaseModel):
    name: str = ""
    description: str = ""


class Sections(BaseModel):
    complainant_details: ComplainantDetails = Field(default_factory=ComplainantDetails)
    incident_details: IncidentDetails = Field(default_factory=IncidentDetails)
    accused_details: List[AccusedDetail] = Field(default_factory=list)
    narrative_text: str = ""


class Entities(BaseModel):
    people: List[str] = Field(default_factory=list)
    locations: List[str] = Field(default_factory=list)
    dates: List[str] = Field(default_factory=list)
    phone_numbers: List[str] = Field(default_factory=list)
    organizations: List[str] = Field(default_factory=list)


class DocumentMeta(BaseModel):
    source_file: str
    languages_detected: List[str]
    page_count: int
    extraction_methods: List[str]


class ConfidenceFlags(BaseModel):
    ocr_used: bool
    llm_extraction_used: bool
    needs_human_review: bool = False


class ComplaintRecord(BaseModel):
    document_meta: DocumentMeta
    sections: Sections
    entities: Entities
    key_facts: List[str] = Field(default_factory=list)
    regex_extracted: Dict[str, List[str]] = Field(default_factory=dict)
    confidence_flags: ConfidenceFlags


# --------------------------------------------------------------------------
# 7. Orchestration
# --------------------------------------------------------------------------
def process_pdf(pdf_path: str) -> Dict[str, Any]:
    raw = extract_text_from_pdf(pdf_path)
    text = clean_text(raw["full_text"])
    languages = identify_languages(text)
    regex_fields = regex_extract(text)
    llm_result = llm_extract(text)

    ocr_used = "ocr" in raw["methods"]
    llm_used = llm_result is not None

    if llm_result:
        sections = llm_result.get("sections", {})
        entities = llm_result.get("entities", {})
        key_facts = llm_result.get("key_facts", [])
    else:
        # Fallback: populate what we can from regex alone, leave the rest
        # empty and flag for human review -- no LLM available.
        sections = {
            "complainant_details": {},
            "incident_details": {},
            "accused_details": [],
            "narrative_text": text[:2000],
        }
        entities = {
            "people": [], "locations": [],
            "dates": regex_fields.get("dates", []),
            "phone_numbers": regex_fields.get("phone_numbers", []),
            "organizations": [],
        }
        key_facts = []

    needs_review = ocr_used or not llm_used or len(text.strip()) < 50

    record = ComplaintRecord(
        document_meta=DocumentMeta(
            source_file=os.path.basename(pdf_path),
            languages_detected=languages,
            page_count=len(raw["pages"]),
            extraction_methods=raw["methods"],
        ),
        sections=Sections(**sections),
        entities=Entities(**entities),
        key_facts=key_facts,
        regex_extracted=regex_fields,
        confidence_flags=ConfidenceFlags(
            ocr_used=ocr_used,
            llm_extraction_used=llm_used,
            needs_human_review=needs_review,
        ),
    )
    return record.model_dump()


def main():
    parser = argparse.ArgumentParser(description="Multilingual PDF Complaint Extractor for CrimeOS")
    parser.add_argument("input", help="Path to a PDF file or a folder of PDFs")
    parser.add_argument("--out", help="Output JSON file (single) or folder (batch)", default=None)
    args = parser.parse_args()

    if os.path.isdir(args.input):
        pdf_files = sorted(glob.glob(os.path.join(args.input, "*.pdf")))
        out_dir = args.out or args.input
        os.makedirs(out_dir, exist_ok=True)
        for pdf_file in pdf_files:
            try:
                result = process_pdf(pdf_file)
            except (ValidationError, Exception) as e:
                print(f"[error] Failed on {pdf_file}: {e}", file=sys.stderr)
                continue
            out_path = os.path.join(out_dir, os.path.splitext(os.path.basename(pdf_file))[0] + ".json")
            with open(out_path, "w", encoding="utf-8") as f:
                json.dump(result, f, ensure_ascii=False, indent=2)
            print(f"[ok] {pdf_file} -> {out_path}")
    else:
        result = process_pdf(args.input)
        out_path = args.out or os.path.splitext(args.input)[0] + ".json"
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        print(f"[ok] {args.input} -> {out_path}")
        print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()