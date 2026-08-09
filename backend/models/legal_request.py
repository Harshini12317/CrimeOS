from sqlalchemy import (
    Column,
    Text,
    String,
    DateTime,
    ForeignKey
)

from database.db import Base


class LegalRequest(Base):

    __tablename__ = "legal_requests"

    # ======================================================
    # PRIMARY KEY
    # ======================================================

    request_id = Column(
        Text,
        primary_key=True,
        nullable=False,
        index=True
    )

    # ======================================================
    # RELATIONSHIPS
    # ======================================================

    case_id = Column(
        Text,
        ForeignKey("cases.case_id"),
        nullable=False,
        index=True
    )

    complaint_id = Column(
        Text,
        ForeignKey("complaints.complaint_id"),
        nullable=False,
        index=True
    )

    # ======================================================
    # AGENCY
    # ======================================================

    agency_type = Column(
        String,
        nullable=False
    )

    agency_name = Column(
        String,
        nullable=False
    )

    recipient_email = Column(
        String,
        nullable=False
    )

    # ======================================================
    # REQUEST
    # ======================================================

    subject = Column(
        String,
        nullable=False
    )

    document_url = Column(
        Text,
        nullable=True
    )

    # ======================================================
    # STATUS
    # ======================================================

    status = Column(
        String,
        nullable=True
    )

    sent_at = Column(
        DateTime,
        nullable=True
    )

    responded_at = Column(
        DateTime,
        nullable=True
    )

    # ======================================================
    # TIMESTAMPS
    # ======================================================

    created_at = Column(
        DateTime,
        nullable=True
    )

    updated_at = Column(
        DateTime,
        nullable=True
    )