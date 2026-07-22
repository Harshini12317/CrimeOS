"""
Cases list endpoint — powers the /cases and /legal/cases frontend pages
(components/case/CaseList.tsx, components/case/LegalCaseList.tsx).

NEW file — this route did not exist before (frontend was calling
/api/cases against nothing).

Reuses the shared engine from database.db, same as investigation/*.py.

Mount in your main FastAPI app:

    from investigation.cases_router import router as cases_router
    app.include_router(cases_router, prefix="/api", tags=["cases"])

Endpoint becomes available at: GET /api/cases

NOTE ON JOIN: `complaints` has no separate "complaint number" column —
just `complaint_id` (VARCHAR PK, already human-readable e.g.
"CMP-2026-0001"). So the frontend's "Complaint" column is populated
from complaints.complaint_id directly; no complaint_number field exists
to join on. The join to `complaints` is kept anyway since it's the
natural place to pull other complaint fields from later (crime_type,
category, etc.) if the frontend wants them.
"""
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Query
from sqlalchemy import text

from database.db import engine

router = APIRouter()


@router.get("/cases")
def list_cases(
    status: Optional[str] = Query(None, description="Exact match on cases.status"),
    priority: Optional[str] = Query(None, description="Exact match on cases.priority"),
    search: Optional[str] = Query(
        None,
        description="Substring match across case_number, complaint_number, title, description",
    ),
) -> Dict[str, List[Dict[str, Any]]]:
    """
    Returns all cases (optionally filtered), each with its complaint_number
    resolved via a join. Server-side filters are optional — the frontend
    currently filters client-side after fetching the full list, so these
    params default to no-op and just narrow the result set if passed.
    """
    filters = []
    params: Dict[str, Any] = {}

    if status:
        filters.append("cases.status = :status")
        params["status"] = status
    if priority:
        filters.append("cases.priority = :priority")
        params["priority"] = priority
    if search:
        filters.append(
            "("
            "cases.case_number ILIKE :search OR "
            "cases.complaint_id ILIKE :search OR "
            "cases.title ILIKE :search OR "
            "cases.description ILIKE :search"
            ")"
        )
        params["search"] = f"%{search}%"

    where_clause = f"WHERE {' AND '.join(filters)}" if filters else ""

    sql = text(f"""
        SELECT
            cases.case_id,
            cases.case_number,
            cases.complaint_id,
            cases.complaint_id AS complaint_number,
            cases.title,
            cases.description,
            cases.status,
            cases.priority,
            cases.created_at
        FROM cases
        LEFT JOIN complaints ON complaints.complaint_id = cases.complaint_id
        {where_clause}
        ORDER BY cases.created_at DESC;
    """)

    with engine.connect() as conn:
        rows = conn.execute(sql, params).mappings().all()
        cases = [dict(r) for r in rows]

    # created_at comes back as a datetime from SQLAlchemy — serialize to
    # ISO so `new Date(caseItem.created_at)` on the frontend works as-is.
    for c in cases:
        if c.get("created_at") is not None:
            c["created_at"] = c["created_at"].isoformat()

    return {"cases": cases}