from sqlalchemy import (
    Column,
    String,
    Text,
    Boolean,
    DateTime,
    ForeignKey,
)
from sqlalchemy.sql import func

from database.db import Base


class CaseSummary(Base):
    __tablename__ = "case_summaries"

    # 1:1 with complaints — complaint_id doubles as PK and FK, so there's
    # exactly one summary row per complaint and upserts are trivial.
    complaint_id = Column(
        String(100),
        ForeignKey("complaints.complaint_id"),
        primary_key=True,
        nullable=False,
    )

    summary = Column(
        Text,
        nullable=False,
    )

    model_used = Column(
        String(100),
        nullable=True,
    )

    # True if an officer typed/edited this summary by hand (via the
    # "Re-analyze" textarea). Auto-regeneration jobs should skip these rows.
    is_manual_override = Column(
        Boolean,
        nullable=False,
        default=False,
    )

    generated_at = Column(
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