import uuid

from sqlalchemy import (
    Column,
    String,
    Text,
    DateTime,
    ForeignKey,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func

from database.db import Base


class Evidence(Base):
    __tablename__ = "evidences"

    evidence_id = Column(
        String(100),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    # --------------------------------------------------------
    # Complaint relationship
    # --------------------------------------------------------

    complaint_id = Column(
        String(100),
        ForeignKey(
            "complaints.complaint_id",
            ondelete="CASCADE",
        ),
        nullable=True,
        index=True,
    )

    # --------------------------------------------------------
    # Case relationship
    # --------------------------------------------------------

    case_id = Column(
        String(100),
        ForeignKey(
            "cases.case_id",
        ),
        nullable=True,
        index=True,
    )

    # --------------------------------------------------------
    # File information
    # --------------------------------------------------------

    evidence_type = Column(
        String(50),
        nullable=True,
    )

    file_name = Column(
        String(255),
        nullable=True,
    )

    file_type = Column(
        String(100),
        nullable=True,
    )

    # Keep existing field for compatibility
    file_path = Column(
        String,
        nullable=True,
    )

    # --------------------------------------------------------
    # Cloudinary
    # --------------------------------------------------------

    cloudinary_url = Column(
        Text,
        nullable=True,
    )

    cloudinary_public_id = Column(
        Text,
        nullable=True,
    )

    # --------------------------------------------------------
    # Extraction
    # --------------------------------------------------------

    extracted_text = Column(
        Text,
        nullable=True,
    )

    summary = Column(
        Text,
        nullable=True,
    )

    extraction_data = Column(
        JSONB,
        nullable=True,
    )

    # --------------------------------------------------------
    # Timestamps
    # --------------------------------------------------------

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