# models/legal_section_analysis.py
from sqlalchemy import Column, String, JSON, DateTime, ForeignKey
from sqlalchemy.sql import func
from database.db import Base

class LegalSectionAnalysis(Base):
    __tablename__ = "legal_section_analyses"

    complaint_id = Column(String, ForeignKey("complaints.complaint_id"), primary_key=True)
    sections = Column(JSON, nullable=False)   # Stores array of serialized section objects
    judgments = Column(JSON, nullable=False)  # Stores array of serialized judgment objects
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())