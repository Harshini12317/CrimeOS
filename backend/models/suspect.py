from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func

from database.db import Base


class Suspect(Base):
    __tablename__ = "suspects"

    suspect_id = Column(
        String,
        primary_key=True,
        index=True
    )

    complaint_id = Column(
        String,
        ForeignKey(
            "complaints.complaint_id",
            ondelete="CASCADE"
        ),
        nullable=False,
        index=True
    )

    name = Column(
        String,
        nullable=True
    )

    contact = Column(
        String,
        nullable=True
    )

    description = Column(
        Text,
        nullable=True
    )

    status = Column(
        String,
        nullable=True
    )

    type = Column(
        String,
        nullable=True
    )

    address = Column(
        Text,
        nullable=True
    )

    photo_url = Column(
        Text,
        nullable=True
    )

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now()
    )

    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now()
    )