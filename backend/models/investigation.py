"""
ORM model for the FR2 investigation_suggestions table.
Uses the shared `Base` from backend/database/db.py so this participates
in the same metadata as FR1's models / any Alembic autogenerate setup.
"""
import uuid

from sqlalchemy import Column, String, Text, TIMESTAMP, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from database.db import Base


class InvestigationSuggestion(Base):
    __tablename__ = "investigation_suggestions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    case_id = Column(String, ForeignKey("cases.case_id"), nullable=False)
    complaint_id = Column(String, ForeignKey("complaints.complaint_id"))

    # core AI output (FR2a)
    suggested_path = Column(JSONB)
    recommended_sections = Column(JSONB)
    case_law_refs = Column(JSONB)

    # on-demand output (FR2b)
    step_by_step_guidance = Column(JSONB)
    guidance_requested_at = Column(TIMESTAMP(timezone=True))
    guidance_requested_by = Column(String, ForeignKey("officers.officer_id"))

    # feedback loop
    officer_feedback = Column(String)          # 'accepted' | 'rejected' | 'edited'
    officer_feedback_notes = Column(Text)

    # traceability / audit
    model_used = Column(String)
    retrieval_debug = Column(JSONB)
    generated_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    created_by = Column(String)

    case = relationship("Case", backref="investigation_suggestions", foreign_keys=[case_id])