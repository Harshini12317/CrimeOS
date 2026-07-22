"""FIR draft endpoints.

Mounted in your FastAPI app with:

    from app.apis.fir_drafts import router as fir_drafts_router
    app.include_router(fir_drafts_router)

Matches the calls made from the frontend's legal-sections page:
    POST /api/fir-drafts                -> handleSaveDraft()
    GET  /api/fir-drafts/{id}/download  -> handleDownloadDraft()

Every POST inserts a brand-new row — drafts are append-only. If an officer
re-analyzes a complaint and saves again, that produces a second, independent
fir_drafts row for the same complaint_id rather than overwriting the first,
so the full selection history for a complaint is always retrievable via
GET /api/fir-drafts?complaint_id=....

Uses the project's synchronous `SessionLocal` (regular sessionmaker), not
an async session.

NOTE: complaint_id is a plain string (e.g. "COMP001"), matching complaints.id
— it is NOT a UUID. Only draft_id (the fir_drafts primary key) is a UUID.
See migrate_fir_drafts_complaint_id.sql for the DB-side fix this depends on.
"""
from datetime import datetime, timezone
from typing import Generator, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from database.db import SessionLocal
from app.schemas.fir_drafts import (
    ALLOWED_STATUSES,
    FirDraftCreate,
    FirDraftEnvelope,
    FirDraftResponse,
    FirDraftUpdate,
)
from investigation.fir_document_generator import build_fir_docx
from models.fir_drafts import FirDraft

# Import lazily / defensively: the Complaint model lives elsewhere in the
# codebase and its exact module path may differ from this stub.
try:
    from models.complaint import Complaint  # type: ignore
except ImportError:  # pragma: no cover - keeps this router importable in isolation
    Complaint = None  # type: ignore

router = APIRouter(prefix="/api/fir-drafts", tags=["fir-drafts"])


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _get_draft_or_404(draft_id: UUID, db: Session) -> FirDraft:
    draft = db.get(FirDraft, draft_id)
    if draft is None:
        raise HTTPException(status_code=404, detail="FIR draft not found")
    return draft


def _validate_status(status: str) -> None:
    if status not in ALLOWED_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"status must be one of {sorted(ALLOWED_STATUSES)}",
        )


@router.post("", response_model=FirDraftEnvelope, status_code=201)
def create_fir_draft(
    payload: FirDraftCreate,
    db: Session = Depends(get_db),
) -> FirDraftEnvelope:
    """Persist a new FIR draft (selected sections + judgments) for a complaint.

    Always inserts — never updates an existing row — so each distinct
    "Save FIR draft" click from the UI is stored as its own record.
    """
    if Complaint is not None:
        complaint = db.get(Complaint, payload.complaint_id)
        if complaint is None:
            raise HTTPException(status_code=404, detail="Complaint not found")

    draft = FirDraft(
        complaint_id=payload.complaint_id,
        crime_category=payload.crime_category,
        summary=payload.summary,
        draft_content=payload.draft_content,
    )
    db.add(draft)
    db.commit()
    db.refresh(draft)
    return FirDraftEnvelope(data=FirDraftResponse.model_validate(draft))


@router.get("", response_model=list[FirDraftResponse])
def list_fir_drafts(
    complaint_id: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    limit: int = Query(default=50, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> list[FirDraft]:
    """List FIR drafts, optionally filtered by complaint or status.
    Uses fir_drafts_complaint_idx / fir_drafts_status_idx."""
    stmt = select(FirDraft).order_by(FirDraft.created_at.desc()).limit(limit).offset(offset)
    if complaint_id is not None:
        stmt = stmt.where(FirDraft.complaint_id == complaint_id)
    if status is not None:
        _validate_status(status)
        stmt = stmt.where(FirDraft.status == status)
    result = db.execute(stmt)
    return list(result.scalars().all())


@router.get("/{draft_id}", response_model=FirDraftResponse)
def get_fir_draft(draft_id: UUID, db: Session = Depends(get_db)) -> FirDraft:
    return _get_draft_or_404(draft_id, db)


@router.patch("/{draft_id}", response_model=FirDraftEnvelope)
def update_fir_draft(
    draft_id: UUID,
    payload: FirDraftUpdate,
    db: Session = Depends(get_db),
) -> FirDraftEnvelope:
    """Review workflow only: move status draft -> under_review -> approved,
    attach officer notes / approver. Does not touch draft_content."""
    draft = _get_draft_or_404(draft_id, db)

    if payload.status is not None:
        _validate_status(payload.status)
        draft.status = payload.status
        if payload.status == "approved":
            draft.approved_at = datetime.now(timezone.utc)

    if payload.officer_notes is not None:
        draft.officer_notes = payload.officer_notes

    if payload.approved_by is not None:
        draft.approved_by = payload.approved_by

    db.commit()
    db.refresh(draft)
    return FirDraftEnvelope(data=FirDraftResponse.model_validate(draft))


@router.delete("/{draft_id}", status_code=204)
def delete_fir_draft(draft_id: UUID, db: Session = Depends(get_db)) -> None:
    draft = _get_draft_or_404(draft_id, db)
    db.delete(draft)
    db.commit()


@router.get("/{draft_id}/download")
def download_fir_draft(draft_id: UUID, db: Session = Depends(get_db)) -> StreamingResponse:
    """Render the FIR draft into the blank-FIR-template layout and return
    it as a downloadable .docx — this is what the frontend's
    `handleDownloadDraft` fetches and saves as `fir_draft_{id}.docx`."""
    draft = _get_draft_or_404(draft_id, db)

    complaint = None
    if Complaint is not None:
        complaint = db.get(Complaint, draft.complaint_id)

    buffer = build_fir_docx(draft, complaint)
    filename = f"fir_draft_{draft.id}.docx"

    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )