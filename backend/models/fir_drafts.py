"""SQLAlchemy model for the `fir_drafts` table.

Matches the existing database schema exactly:

    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid()
    complaint_id    TEXT        NOT NULL
    crime_category  TEXT
    summary         TEXT
    draft_content   JSONB       NOT NULL DEFAULT '{}'
    status          TEXT        NOT NULL DEFAULT 'draft'
                                 CHECK (status IN ('draft','under_review','approved'))
    officer_notes   TEXT
    approved_by     TEXT
    approved_at     TIMESTAMPTZ
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()

Indexes: fir_drafts_complaint_idx (complaint_id), fir_drafts_status_idx (status)

NOTE: complaint_id is TEXT, not UUID — it stores whatever id complaints.id
uses (e.g. 'COMP001'), matching the existing /legal-sections/analyze route,
which already accepts non-UUID complaint ids. See
migrate_fir_drafts_complaint_id.sql for the corresponding DB migration.
"""
from sqlalchemy import CheckConstraint, Column, DateTime, Index, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID as PG_UUID

from database.db import Base

# NOTE: Base lives here (not alongside SessionLocal in app/db.py) — this only
# resolves if the repo root is on the Python path when the backend runs. If
# your backend process's working directory / PYTHONPATH is scoped to
# `backend/` only, adjust this import to whatever actually reaches
# frontend/database/db.py from there (e.g. a relative path or a symlink/shared
# package). This model doesn't need Base's engine — it only uses Base as the
# declarative registry so the class maps correctly; queries still go through
# app.db.SessionLocal.

ALLOWED_STATUSES = ("draft", "under_review", "approved")


class FirDraft(Base):
    __tablename__ = "fir_drafts"

    id = Column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        server_default=func.gen_random_uuid(),
    )
    complaint_id = Column(Text, nullable=False)
    crime_category = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)
    draft_content = Column(JSONB, nullable=False, server_default="{}")
    status = Column(Text, nullable=False, server_default="draft")
    officer_notes = Column(Text, nullable=True)
    approved_by = Column(String, nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    __table_args__ = (
        CheckConstraint(f"status IN {ALLOWED_STATUSES}", name="fir_drafts_status_check"),
        Index("fir_drafts_complaint_idx", "complaint_id"),
        Index("fir_drafts_status_idx", "status"),
    )