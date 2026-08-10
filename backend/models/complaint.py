import uuid

from sqlalchemy import (
    Boolean,
    Column,
    String,
    Text,
    Date,
    Time,
    DateTime,
)
from sqlalchemy.sql import func

from database.db import Base


class Complaint(Base):
    __tablename__ = "complaints"

    complaint_id = Column(
        String(100),
        primary_key=True,
        nullable=False,
        default=lambda: str(uuid.uuid4()),
    )

    complaint_number = Column(
        String(30),
        unique=True,
        nullable=False,
        index=True,
    )

    complaint_type = Column(
        String(50),
        nullable=False,
    )

    crime_category = Column(
        String(100),
        nullable=False,
    )

    crime_subcategory = Column(
        String(100),
        nullable=False,
    )

    priority = Column(
        String(20),
        nullable=False,
        default="Medium",
    )

    incident_date = Column(
        Date,
        nullable=True,
    )

    incident_time = Column(
        Time,
        nullable=True,
    )

    location = Column(
        Text,
        nullable=True,
    )

    description = Column(
        Text,
        nullable=False,
    )

    ai_summary = Column(
        Text,
        nullable=True,
    )

    officer_notes = Column(
        Text,
        nullable=True,
    )

    status = Column(
        String(30),
        nullable=False,
        default="Registered",
        index=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    source_type = Column(String(20), nullable=True)
    # 'audio' | 'pdf' | 'image' | 'manual'

    detected_languages = Column(String(100), nullable=True)
    # comma-separated, e.g. "gu,en"

    raw_extracted_text = Column(Text, nullable=True)
    # narrative_text exactly as extracted — original script, "as recorded"

    translated_text = Column(Text, nullable=True)
    # English translation of raw_extracted_text

    needs_human_review = Column(
        Boolean,
        nullable=False,
        default=False,
    )