from sqlalchemy import Column, Text, String, DateTime
from sqlalchemy.dialects.postgresql import JSONB

from database.db import Base


class LegalRequest(Base):

    __tablename__ = "legal_requests"

    # ======================================================
    # REQUEST
    # ======================================================

    request_id = Column(
        Text,
        primary_key=True,
    )

    case_id = Column(
        Text,
        nullable=False,
    )

    complaint_id = Column(
        Text,
        nullable=False,
    )

    agency_type = Column(
        String,
        nullable=False,
    )

    agency_name = Column(
        String,
        nullable=False,
    )

    recipient_email = Column(
        String,
        nullable=False,
    )

    subject = Column(
        String,
        nullable=False,
    )

    document_url = Column(
        Text,
        nullable=True,
    )

    # ======================================================
    # REQUEST STATUS
    # ======================================================

    status = Column(
        String,
        nullable=True,
        default="Draft",
    )

    sent_at = Column(
        DateTime,
        nullable=True,
    )

    responded_at = Column(
        DateTime,
        nullable=True,
    )

    # ======================================================
    # RESPONSE
    # ======================================================

    response_received_at = Column(
        DateTime(timezone=True),
        nullable=True,
    )

    response_document_url = Column(
        Text,
        nullable=True,
    )

    response_file_name = Column(
        String,
        nullable=True,
    )

    response_file_type = Column(
        String,
        nullable=True,
    )

    response_summary = Column(
        Text,
        nullable=True,
    )

    response_data = Column(
        JSONB,
        nullable=True,
    )

    # ======================================================
    # TIMESTAMPS
    # ======================================================

    created_at = Column(
        DateTime,
        nullable=True,
    )

    updated_at = Column(
        DateTime,
        nullable=True,
    )