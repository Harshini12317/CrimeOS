"""
FR2: AI-Powered Investigation Paths — router.

This is an APIRouter, not a standalone app — mounted into the shared
backend app in main.py (already wired: from app.routes.investigation
import router as investigation_router).

Endpoints:
  POST /investigation/cases/{case_id}/suggest-investigation
      -> runs retrieval + LLM synthesis, stores + returns
         suggested_path, recommended_sections, case_law_refs (FR2a, FR2c)

  POST /investigation/suggestions/{suggestion_id}/step-by-step-guidance
      -> ONLY called when officer explicitly requests it (FR2b)

Both endpoints require login (IO or SHO) — added on top of the original
implementation, which had no auth check at all.
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from database.db import SessionLocal
from investigation.query_builder import build_query_from_complaint
from investigation.retrieval import retrieve_all
from investigation.llm_synthesis import generate_suggestion, generate_step_by_step
from models import InvestigationSuggestion
from app.core.deps import require_role
from models.user import User, Role

router = APIRouter(prefix="/investigation", tags=["FR2 - Investigation Paths"])

# Both IO and SHO can pull investigation suggestions. Add Role.LEGAL_ADVISOR
# here too if legal advisors should be able to view (not just request) them.
allowed_roles = require_role(Role.IO, Role.SHO)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _fetch_complaint_for_case(db: Session, case_id: str) -> dict:
    sql = text("""
        SELECT co.*
        FROM cases c
        JOIN complaints co ON co.complaint_id = c.complaint_id
        WHERE c.case_id = :case_id;
    """)
    row = db.execute(sql, {"case_id": case_id}).mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail=f"No complaint found for case_id={case_id}")
    return dict(row)


class SuggestRequest(BaseModel):
    force_regenerate: bool = False


@router.post("/cases/{case_id}/suggest-investigation")
def suggest_investigation(
    case_id: str,
    req: SuggestRequest = SuggestRequest(),
    db: Session = Depends(get_db),
    user: User = Depends(allowed_roles),
):
    complaint = _fetch_complaint_for_case(db, case_id)

    rq = build_query_from_complaint(complaint)
    retrieved = retrieve_all(rq)

    result = generate_suggestion(
        complaint_facts=rq.query_text,
        retrieved_sections=retrieved["legal_sections"],
        retrieved_landmarks=retrieved["landmarks"],
        section_crosswalk=retrieved["section_crosswalk"],
    )

    suggestion = InvestigationSuggestion(
        case_id=case_id,
        complaint_id=complaint["complaint_id"],
        suggested_path=result.get("suggested_path", []),
        recommended_sections=result.get("recommended_sections", []),
        case_law_refs=result.get("case_law_refs", []),
        model_used="gemini-2.0-flash",
        retrieval_debug={
            "legal_section_ids": [str(s["id"]) for s in retrieved["legal_sections"]],
            "landmark_ids": [str(l["id"]) for l in retrieved["landmarks"]],
        },
        created_by=str(user.id),
    )
    db.add(suggestion)
    db.commit()
    db.refresh(suggestion)

    return {"suggestion_id": str(suggestion.id), **result}


@router.post("/suggestions/{suggestion_id}/step-by-step-guidance")
def step_by_step_guidance(
    suggestion_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(allowed_roles),
):
    """FR2b - on demand only. Called when the officer clicks the button."""
    suggestion = db.get(InvestigationSuggestion, suggestion_id)
    if not suggestion:
        raise HTTPException(status_code=404, detail="Suggestion not found")

    complaint_row = db.execute(
        text("SELECT description, ai_summary FROM complaints WHERE complaint_id = :cid"),
        {"cid": suggestion.complaint_id},
    ).mappings().first()
    complaint_facts = (complaint_row or {}).get("ai_summary") or (complaint_row or {}).get("description") or ""

    prior_suggestion = {
        "suggested_path": suggestion.suggested_path,
        "recommended_sections": suggestion.recommended_sections,
        "case_law_refs": suggestion.case_law_refs,
    }

    guidance = generate_step_by_step(complaint_facts, prior_suggestion)

    suggestion.step_by_step_guidance = guidance
    suggestion.guidance_requested_by = str(user.id)  # from the token, not client-supplied
    db.execute(
        text("UPDATE investigation_suggestions SET guidance_requested_at = now() WHERE id = :id"),
        {"id": suggestion_id},
    )
    db.commit()

    return guidance


@router.get("/health")
def health():
    return {"status": "ok"}