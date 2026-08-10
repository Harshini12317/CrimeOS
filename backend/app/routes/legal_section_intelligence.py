import json
import re
import traceback
from typing import Optional
import os

import requests
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlalchemy import literal_column
from sqlalchemy.types import Float

from database.db import SessionLocal
from models.complaint import Complaint
from models.legal_sections import LegalSection
from models.landmarks import Landmark
from models.legal_section_mappings import LegalSectionMapping
from investigation.embedding import embed_query
from models.case_summary import CaseSummary
from investigation.case_summary_generator import generate_case_summary

router = APIRouter(prefix="/api/complaints", tags=["legal-section-intelligence"])

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "openai/gpt-oss-20b"  # faster
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

NEW_ACTS = {"BNS", "BNSS", "BSA"}
OLD_ACTS = {"IPC", "CrPC", "IEA"}


class AnalyzeRequest(BaseModel):
    case_summary: Optional[str] = None


# ---------- vector helpers ----------
# models/_types.py's Vector is a plain UserDefinedType (no cosine_distance()
# comparator like pgvector.sqlalchemy.Vector provides), so distance queries
# are built as raw SQL using pgvector's `<=>` cosine-distance operator.
# The literal is safe to interpolate directly: it's built entirely from
# floats we generate ourselves (the query embedding), never from user input.

def _vector_literal(embedding: list[float]) -> str:
    return "[" + ",".join(f"{v:.8f}" for v in embedding) + "]"


def _cosine_distance_clause(embedding: list[float]):
    return literal_column(
        f"embedding <=> '{_vector_literal(embedding)}'::vector", type_=Float
    )


# ---------- retrieval ----------

def _retrieve_candidates(db, case_summary: str, top_k_sections: int = 20, top_k_judgments: int = 10):
    query_embedding = embed_query(case_summary)

    section_distance = _cosine_distance_clause(query_embedding)
    section_rows = (
        db.query(LegalSection, section_distance.label("distance"))
        .order_by(section_distance)
        .limit(top_k_sections)
        .all()
    )
    sections = []
    for section, distance in section_rows:
        section._similarity = 1 - distance  # transient attribute, not persisted
        sections.append(section)

    judgment_distance = _cosine_distance_clause(query_embedding)
    judgment_rows = (
        db.query(Landmark, judgment_distance.label("distance"))
        .order_by(judgment_distance)
        .limit(top_k_judgments)
        .all()
    )
    judgments = []
    for judgment, distance in judgment_rows:
        judgment._similarity = 1 - distance
        judgments.append(judgment)

    return sections, judgments


# ---------- cross-referencing (BNS<->IPC, BNSS<->CrPC, BSA<->IEA) ----------

def _word_boundary_pattern(section_number: str) -> str:
    return r"\y" + re.escape(section_number.strip()) + r"\y"


def _cross_references(db, act_code: str, section_number: str) -> list[dict]:
    if not section_number:
        return []
    pattern = _word_boundary_pattern(section_number)

    if act_code in NEW_ACTS:
        rows = (
            db.query(LegalSectionMapping)
            .filter(LegalSectionMapping.new_act == act_code)
            .filter(LegalSectionMapping.new_section.op("~")(pattern))
            .all()
        )
        return [
            {
                "act": r.old_act,
                "section": r.old_section,
                "subject": r.subject,
                "summary_of_comparison": r.summary_of_comparison,
            }
            for r in rows
        ]
    elif act_code in OLD_ACTS:
        rows = (
            db.query(LegalSectionMapping)
            .filter(LegalSectionMapping.old_act == act_code)
            .filter(LegalSectionMapping.old_section.op("~")(pattern))
            .all()
        )
        return [
            {
                "act": r.new_act,
                "section": r.new_section,
                "subject": r.subject,
                "summary_of_comparison": r.summary_of_comparison,
            }
            for r in rows
        ]
    return []


# ---------- LLM reranking ----------

import time

def _rerank_with_llm(case_summary: str, sections: list, judgments: list, max_retries: int = 3):
    sections_text = "\n".join(
        f"[S{i}] {s.act_code} Sec {s.section_number} - {s.title}: {(s.section_text or '')[:300]}"
        for i, s in enumerate(sections)
    )
    judgments_text = "\n".join(
        f"[J{i}] {j.case_title} ({j.court}, {j.case_date}) - IPC {j.ipc_sections}: {(j.summary or '')[:300]}"
        for i, j in enumerate(judgments)
    )

    prompt = f"""You are a legal assistant helping an Indian police officer identify applicable law.

CASE SUMMARY:
{case_summary}

CANDIDATE LEGAL SECTIONS (indices S0 to S{len(sections)-1} ONLY):
{sections_text}

CANDIDATE LANDMARK JUDGMENTS (indices J0 to J{len(judgments)-1} ONLY):
{judgments_text}

Task: Select only the sections and judgments that are TRULY relevant to this case summary.
Rank them by relevance. Discard anything not clearly applicable.
IMPORTANT: Only use "ref" values that exist in the lists above. Do NOT invent indices beyond what is listed."""

    schema = {
        "type": "object",
        "properties": {
            "sections": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "ref": {"type": "string"},
                        "relevance_reason": {"type": "string"}
                    },
                    "required": ["ref", "relevance_reason"]
                }
            },
            "judgments": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "ref": {"type": "string"},
                        "relevance_reason": {"type": "string"}
                    },
                    "required": ["ref", "relevance_reason"]
                }
            }
        },
        "required": ["sections", "judgments"]
    }

    result = None
    last_error = None

    for attempt in range(max_retries + 1):
        response = requests.post(
            GROQ_URL,
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": GROQ_MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "response_format": {
                    "type": "json_schema",
                    "json_schema": {"name": "reranking_result", "schema": schema}
                },
                "temperature": 0,
            },
            timeout=60,
        )

        if response.status_code == 429:
            retry_after = int(response.headers.get("Retry-After", 5))
            time.sleep(retry_after)
            last_error = response.text
            continue

        if response.status_code == 400:
            last_error = response.text
            continue

        response.raise_for_status()
        raw = response.json()["choices"][0]["message"]["content"].strip()
        raw = raw.replace("```json", "").replace("```", "").strip()

        try:
            result = json.loads(raw)
            break
        except json.JSONDecodeError:
            last_error = raw
            continue

    if result is None:
        print("WARNING: All retries failed. Last error:\n", last_error)
        return [], []

    ranked_sections = []
    for item in result.get("sections", []):
        try:
            idx = int(item["ref"][1:])
            if 0 <= idx < len(sections):
                ranked_sections.append((sections[idx], item["relevance_reason"]))
        except (ValueError, KeyError, IndexError):
            print(f"Skipping malformed section item: {item}")

    ranked_judgments = []
    for item in result.get("judgments", []):
        try:
            idx = int(item["ref"][1:])
            if 0 <= idx < len(judgments):
                ranked_judgments.append((judgments[idx], item["relevance_reason"]))
        except (ValueError, KeyError, IndexError):
            print(f"Skipping malformed judgment item: {item}")

    return ranked_sections, ranked_judgments


# ---------- serialization ----------

def _serialize_section(db, section: LegalSection, reason: str) -> dict:
    return {
        "id": str(section.id),
        "act_code": section.act_code,
        "section_number": section.section_number,
        "title": section.title,
        "section_text": section.section_text,
        "category": section.category,
        "similarity": float(getattr(section, "_similarity", 0.0)),
        "reason": reason,
        "cross_references": _cross_references(db, section.act_code, section.section_number),
    }


def _serialize_judgment(judgment: Landmark, reason: str) -> dict:
    return {
        "id": str(judgment.id),
        "case_title": judgment.case_title,
        "court": judgment.court,
        "case_date": judgment.case_date.isoformat() if judgment.case_date else None,
        "ipc_sections": judgment.ipc_sections,
        "crime_type": judgment.crime_type,
        "summary": judgment.summary,
        "judgment_reason": judgment.judgment_reason,
        "bail_outcome": judgment.bail_outcome,
        "similarity": float(getattr(judgment, "_similarity", 0.0)),
        "reason": reason,
    }


# ---------- endpoint ----------

@router.post("/{complaint_id}/legal-sections/analyze")
def analyze_legal_sections(complaint_id: str, payload: AnalyzeRequest):
    db = SessionLocal()
    try:
        complaint = (
            db.query(Complaint)
            .filter(Complaint.complaint_id == complaint_id)
            .first()
        )
        if not complaint:
            raise HTTPException(status_code=404, detail="Complaint not found")
 
        case_summary = payload.case_summary
 
        if case_summary and case_summary.strip():
            # Officer explicitly supplied/edited a summary (e.g. via the
            # "Re-analyze" textarea) — persist it as a manual override so
            # any future auto-regeneration job leaves it alone.
            existing = db.get(CaseSummary, complaint_id)
            if existing:
                existing.summary = case_summary.strip()
                existing.is_manual_override = True
                existing.model_used = None
            else:
                db.add(CaseSummary(
                    complaint_id=complaint_id,
                    summary=case_summary.strip(),
                    is_manual_override=True,
                    model_used=None,
                ))
            db.commit()
 
        else:
            # No summary passed — check for a stored one first.
            existing = db.get(CaseSummary, complaint_id)
            if existing:
                case_summary = existing.summary
            else:
                # Nothing stored yet — generate one now (lazy generation).
                generated = generate_case_summary(complaint)
 
                if generated:
                    case_summary = generated
                    db.add(CaseSummary(
                        complaint_id=complaint_id,
                        summary=generated,
                        model_used=GROQ_MODEL,
                        is_manual_override=False,
                    ))
                    db.commit()
                else:
                    # LLM generation failed — fall back to raw description
                    # rather than blocking the officer with a 422. We don't
                    # persist this as a CaseSummary row, so a later request
                    # will retry generation instead of reusing a bad fallback.
                    case_summary = complaint.description
 
        if not case_summary or not case_summary.strip():
            raise HTTPException(
                status_code=422,
                detail="No case summary available for this complaint. "
                       "Pass `case_summary` in the request body.",
            )
 
        sections, judgments = _retrieve_candidates(db, case_summary)
        ranked_sections, ranked_judgments = _rerank_with_llm(case_summary, sections, judgments)
 
        return {
            "complaint_id": complaint_id,
            "case_summary": case_summary,
            "sections": [_serialize_section(db, s, reason) for s, reason in ranked_sections],
            "judgments": [_serialize_judgment(j, reason) for j, reason in ranked_judgments],
        }
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {type(e).__name__}: {e}",
        )
    finally:
        db.close()
 