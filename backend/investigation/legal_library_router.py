"""
Legal Library search endpoint — NEW, did not exist before this file.

Reuses the same embedding model / engine as the FR2 investigation pipeline
(embedding.py, database.db.engine) so results are comparable, but this is
a standalone read-only search over legal_sections + landmarks + the
IPC/CrPC/IEA crosswalk — not tied to a specific case/complaint.

Mount this in your main FastAPI app, e.g. in main.py / app.py:

    from investigation.legal_library_router import router as legal_library_router
    app.include_router(legal_library_router, prefix="/api/legal-library", tags=["legal-library"])

Frontend calls:
    GET /api/legal-library/search?q=<text>&act_code=BNS&category=<text>&top_k=6

If `q` is omitted, falls back to plain filtering (browse mode, no vector
search) ordered by section_number.
"""
from typing import List, Dict, Any, Optional

from fastapi import APIRouter, Query
from sqlalchemy import text

from database.db import engine
from investigation.embedding import embed_query
from investigation.config import TOP_K_LEGAL_SECTIONS, TOP_K_LANDMARKS

router = APIRouter()


def _search_sections(
    query_vec: Optional[List[float]],
    act_code: Optional[str],
    category: Optional[str],
    top_k: int,
) -> List[Dict[str, Any]]:
    filters = []
    params: Dict[str, Any] = {"top_k": top_k}

    if act_code:
        filters.append("act_code = :act_code")
        params["act_code"] = act_code
    if category:
        filters.append("category ILIKE :category")
        params["category"] = f"%{category}%"

    where_clause = f"WHERE {' AND '.join(filters)}" if filters else ""

    if query_vec is not None:
        params["qvec"] = query_vec
        sql = text(f"""
            SELECT id, act_code, section_number, title, section_text, category,
                   1 - (embedding <=> (:qvec)::vector) AS similarity
            FROM legal_sections
            {where_clause}
            ORDER BY embedding <=> (:qvec)::vector
            LIMIT :top_k;
        """)
    else:
        # Browse mode — no query text, so no meaningful similarity ordering.
        sql = text(f"""
            SELECT id, act_code, section_number, title, section_text, category,
                   NULL::float AS similarity
            FROM legal_sections
            {where_clause}
            ORDER BY act_code, section_number
            LIMIT :top_k;
        """)

    with engine.connect() as conn:
        rows = conn.execute(sql, params).mappings().all()
        return [dict(r) for r in rows]


def _get_crosswalk_for_sections(sections: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
    """
    For each (act_code, section_number) in `sections`, find the old-act
    (IPC/CrPC/IEA) equivalent(s) via legal_section_mappings.new_act /
    new_section. Keyed by f"{act_code}:{section_number}" so the caller can
    attach results back to the right section.
    """
    if not sections:
        return {}

    pairs = [(s["act_code"], s["section_number"]) for s in sections]

    # Per-row lookup rather than a single IN (tuple) query — this table is
    # small and this endpoint is not on a hot path, and it keeps the SQL
    # simple/portable across SQLAlchemy versions.
    result: Dict[str, List[Dict[str, Any]]] = {}
    with engine.connect() as conn:
        for act_code, section_number in pairs:
            row_sql = text("""
                SELECT new_act, new_section, old_act, old_section, subject, summary_of_comparison
                FROM legal_section_mappings
                WHERE new_act = :act_code AND new_section = :section_number
            """)
            rows = conn.execute(row_sql, {"act_code": act_code, "section_number": section_number}).mappings().all()
            key = f"{act_code}:{section_number}"
            result[key] = [dict(r) for r in rows]
    return result


def _search_landmarks_by_similarity(query_vec: List[float], top_k: int) -> List[Dict[str, Any]]:
    sql = text("""
        SELECT id, case_id, case_title, court, case_date, crime_type,
               bail_outcome, bail_outcome_detailed, summary,
               legal_principles_discussed, ipc_sections,
               1 - (embedding <=> (:qvec)::vector) AS similarity
        FROM landmarks
        ORDER BY embedding <=> (:qvec)::vector
        LIMIT :top_k;
    """)
    with engine.connect() as conn:
        rows = conn.execute(sql, {"qvec": query_vec, "top_k": top_k}).mappings().all()
        return [dict(r) for r in rows]


def _search_landmarks_by_old_section(old_section: str, top_k: int = 5) -> List[Dict[str, Any]]:
    """Explicit keyword match against landmarks.ipc_sections, used to surface
    judgments tied to the crosswalked IPC/CrPC/IEA section even if they don't
    rank highly by embedding similarity."""
    sql = text("""
        SELECT id, case_id, case_title, court, case_date, crime_type,
               bail_outcome, bail_outcome_detailed, summary,
               legal_principles_discussed, ipc_sections,
               NULL::float AS similarity
        FROM landmarks
        WHERE ipc_sections ILIKE :pattern
        LIMIT :top_k;
    """)
    with engine.connect() as conn:
        rows = conn.execute(sql, {"pattern": f"%{old_section}%", "top_k": top_k}).mappings().all()
        return [dict(r) for r in rows]


@router.get("/search")
def search_legal_library(
    q: Optional[str] = Query(None, description="Free-text search (semantic, uses embedding). Omit for browse mode."),
    act_code: Optional[str] = Query(None, description="Filter: BNS | BNSS | BSA"),
    category: Optional[str] = Query(None, description="Filter: substring match on legal_sections.category"),
    top_k: int = Query(TOP_K_LEGAL_SECTIONS, ge=1, le=50),
):
    query_vec = embed_query(q) if q else None

    sections = _search_sections(query_vec, act_code, category, top_k)
    crosswalk_by_section = _get_crosswalk_for_sections(sections)

    # Attach crosswalk + related landmarks (both semantic and IPC-keyword
    # matched) onto each section result.
    enriched_sections = []
    for s in sections:
        key = f"{s['act_code']}:{s['section_number']}"
        crosswalk = crosswalk_by_section.get(key, [])

        related_landmarks: List[Dict[str, Any]] = []
        for cw in crosswalk:
            related_landmarks.extend(_search_landmarks_by_old_section(cw["old_section"]))

        enriched_sections.append({
            **s,
            "crosswalk": crosswalk,  # old-act (IPC/CrPC/IEA) equivalents
            "related_landmarks": related_landmarks,
        })

    # Separately, top-k landmarks by pure semantic similarity to the query
    # itself (useful when the officer searches by fact pattern, not by
    # section number).
    semantic_landmarks = _search_landmarks_by_similarity(query_vec, TOP_K_LANDMARKS) if query_vec else []

    return {
        "sections": enriched_sections,
        "semantic_landmarks": semantic_landmarks,
    }