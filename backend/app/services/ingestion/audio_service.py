import os
import json
import whisper
import ssl
from pathlib import Path
from dotenv import load_dotenv
from google import genai
from google.genai import types

# Load environment variables (API Keys) securely
BACKEND_ROOT = Path(__file__).resolve().parents[3]
load_dotenv(BACKEND_ROOT / ".env")

# Quick fix for macOS SSL certificate issues
ssl._create_default_https_context = ssl._create_unverified_context

EXTRACTION_SYSTEM_PROMPT = """You are an information extraction engine for a police \
complaint-management system (CrimeOS). You will receive raw audio transcription text that may be \
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
- If a field is not present in the text, use an empty string or empty list.
- Keep extracted names/places in their original script (do not transliterate).
- "key_facts" should be short, factual bullet-style strings summarizing the complaint.
- Output valid JSON only.
"""

def transcribe_audio(file_path: str) -> dict:
    try:
        model = whisper.load_model("base")
        result = model.transcribe(file_path)
        return {
            "text": result.get("text", ""),
            "language": result.get("language", "unknown")
        }
    except Exception as e:
        raise RuntimeError(f"Error during audio transcription: {str(e)}")

def extract_structured_json(text: str) -> dict:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY environment variable is missing.")
        
    client = genai.Client(api_key=api_key)
    
    try:
        response = client.models.generate_content(
            model='gemini-3.1-flash-lite',
            contents=text[:15000],
            config=types.GenerateContentConfig(
                system_instruction=EXTRACTION_SYSTEM_PROMPT,
                response_mime_type="application/json",
                temperature=0,
            ),
        )
        return json.loads(response.text)
    except Exception as e:
        raise RuntimeError(f"Error extracting JSON from Gemini: {str(e)}")

def process_audio_complaint(file_path: str, original_filename: str) -> dict:
    # 1. Transcribe the audio
    transcription = transcribe_audio(file_path)
    raw_text = transcription["text"]
    detected_lang = transcription["language"]

    if not raw_text.strip():
        raise ValueError("Could not extract any spoken text from the audio file.")

    # 2. Extract details using Gemini
    llm_result = extract_structured_json(raw_text)
    
    # 3. Build the final output matching ComplaintRecord schema
    sections = llm_result.get("sections", {})
    sections["narrative_text"] = raw_text
    
    final_output = {
        "document_meta": {
            "source_file": original_filename,
            "languages_detected": [detected_lang],
            "page_count": 1,
            "extraction_methods": ["audio-whisper"]
        },
        "sections": sections,
        "entities": llm_result.get("entities", {
            "people": [], "locations": [], "dates": [], "phone_numbers": [], "organizations": []
        }),
        "key_facts": llm_result.get("key_facts", []),
        "regex_extracted": {},
        "confidence_flags": {
            "ocr_used": False,
            "llm_extraction_used": True,
            "needs_human_review": len(raw_text.strip()) < 50
        }
    }
    
    return final_output