from sqlalchemy import (
    Column,
    String,
    Text,
    Date,
    DateTime,
    Integer,
    ForeignKey,
)
from sqlalchemy.sql import func

from database.db import Base


class Case(Base):
    __tablename__ = "cases"

    case_id = Column(
        String,
        primary_key=True,
        nullable=False,
    )

    complaint_id = Column(
        String,
        nullable=True,
    )

    assigned_officer_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True,
    )

    case_number = Column(
        String,
        nullable=True,
    )

    title = Column(
        String,
        nullable=True,
    )

    status = Column(
        String,
        nullable=True,
        default="Open",
    )

    priority = Column(
        String,
        nullable=True,
    )

    description = Column(
        Text,
        nullable=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        nullable=True,
        server_default=func.now(),
    )

    updated_at = Column(
        DateTime(timezone=True),
        nullable=True,
    )

    closed_at = Column(
        DateTime(timezone=True),
        nullable=True,
    )

    district = Column(
        String,
        nullable=True,
    )

    police_station = Column(
        String,
        nullable=True,
    )

    fir_no = Column(
        String,
        nullable=True,
    )

    fir_year = Column(
        Integer,
        nullable=True,
    )

    fir_date = Column(
        Date,
        nullable=True,
    )

    incident_datetime = Column(
        DateTime(timezone=True),
        nullable=True,
    )

    original_chargesheet_no = Column(
        String,
        nullable=True,
    )

    original_chargesheet_date = Column(
        Date,
        nullable=True,
    )

    supplementary_chargesheet_no = Column(
        String,
        nullable=True,
    )

    supplementary_reason = Column(
        Text,
        nullable=True,
    )

    court_name = Column(
        String,
        nullable=True,
    )

    court_no = Column(
        String,
        nullable=True,
    )

    current_stage = Column(
        String,
        nullable=True,
    )