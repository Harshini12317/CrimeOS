from datetime import datetime
import uuid

from sqlalchemy import Column
from sqlalchemy import String
from sqlalchemy import DateTime
from sqlalchemy import LargeBinary
from sqlalchemy import ForeignKey

from database.db import Base


class LegalRequest(Base):

    __tablename__ = "legal_requests"

    request_id = Column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )

    case_id = Column(
        String,
        ForeignKey("cases.case_id"),
        nullable=False
    )

    complaint_id = Column(
        String,
        ForeignKey("complaints.complaint_id"),
        nullable=False
    )

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

    subject = Column(
        String,
        nullable=False
    )

    

    status = Column(
        String,
        default="Draft"
    )

    sent_at = Column(
        DateTime,
        nullable=True
    )

    responded_at = Column(
        DateTime,
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )