"""
FR2: AI-Powered Investigation Paths — FastAPI microservice.

Deployable independently of FR1's ingestion service; only shares the
same Postgres DB. Two endpoints:

  POST /cases/{case_id}/suggest-investigation
      -> runs retrieval + LLM synthesis, stores + returns
         suggested_path, recommended_sections, case_law_refs (FR2a, FR2c)

  POST /cases/{case_id}/step-by-step-guidance
      -> ONLY called when officer explicitly requests it (FR2b),
         generates detailed steps from the already-stored suggestion

Run locally:
    uvicorn main:app --reload --port 8002
"""
from typing import Optional
import json

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import psycopg2
import psycopg2.extras

from config import DATABASE_URL
from query_builder import build_query_from_complaint
from retrieval import retrieve_all
from llm_synthesis import generate_suggestion, generate_step_by_step

app = FastAPI(title="FR2 - AI-Powered Investigation Paths")


def _get_conn():
    return psycopg2.connect(DATABASE_URL)


def _fetch_complaint_for_case(case_id: str) -> dict:
    sql = """
        SELECT co.*
        FROM cases c
        JOIN complaints co ON co.complaint_id = c.complaint_id
        WHERE c.case_id = %s;
    """
    with _get_conn() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(sql, (case_id,))
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail=f"No complaint found for case_id={case_id}")
            return dict(row)


class SuggestRequest(BaseModel):
    force_regenerate: bool = False


@app.post("/cases/{case_id}/suggest-investigation")
def suggest_investigation(case_id: str, req: SuggestRequest = SuggestRequest()):
    complaint = _fetch_complaint_for_case(case_id)

    rq = build_query_from_complaint(complaint)
    retrieved = retrieve_all(rq)

    result = generate_suggestion(
        complaint_facts=rq.query_text,
        retrieved_sections=retrieved["legal_sections"],
        retrieved_landmarks=retrieved["landmarks"],
        section_crosswalk=retrieved["section_crosswalk"],
    )

    # persist
    insert_sql = """
        INSERT INTO investigation_suggestions
            (case_id, complaint_id, suggested_path, recommended_sections,
             case_law_refs, model_used, retrieval_debug, created_by)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id;
    """
    with _get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                insert_sql,
                (
                    case_id,
                    complaint["complaint_id"],
                    json.dumps(result.get("suggested_path", [])),
                    json.dumps(result.get("recommended_sections", [])),
                    json.dumps(result.get("case_law_refs", [])),
                    "claude-haiku-4-5",
                    json.dumps({
                        "legal_section_ids": [str(s["id"]) for s in retrieved["legal_sections"]],
                        "landmark_ids": [str(l["id"]) for l in retrieved["landmarks"]],
                    }),
                    "system",
                ),
            )
            suggestion_id = cur.fetchone()[0]
        conn.commit()

    return {"suggestion_id": suggestion_id, **result}


@app.post("/suggestions/{suggestion_id}/step-by-step-guidance")
def step_by_step_guidance(suggestion_id: str, officer_id: Optional[str] = None):
    """FR2b - on demand only. Called when the officer clicks the button."""
    with _get_conn() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """SELECT s.*, co.description, co.ai_summary
                   FROM investigation_suggestions s
                   JOIN complaints co ON co.complaint_id = s.complaint_id
                   WHERE s.id = %s""",
                (suggestion_id,),
            )
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Suggestion not found")

    prior_suggestion = {
        "suggested_path": row["suggested_path"],
        "recommended_sections": row["recommended_sections"],
        "case_law_refs": row["case_law_refs"],
    }
    complaint_facts = row.get("ai_summary") or row.get("description") or ""

    guidance = generate_step_by_step(complaint_facts, prior_suggestion)

    with _get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """UPDATE investigation_suggestions
                   SET step_by_step_guidance = %s,
                       guidance_requested_at = now(),
                       guidance_requested_by = %s
                   WHERE id = %s""",
                (json.dumps(guidance), officer_id, suggestion_id),
            )
        conn.commit()

    return guidance


@app.get("/health")
def health():
    return {"status": "ok"}