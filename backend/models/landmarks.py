from sqlalchemy import Column
from sqlalchemy import Text
from sqlalchemy import DateTime
from sqlalchemy import Date
from sqlalchemy import BigInteger
from sqlalchemy import Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from database.db import Base
from models._types import Vector


class Landmark(Base):
    __tablename__ = "landmarks"
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    case_id = Column(BigInteger)
    case_title = Column(Text)
    court = Column(Text)
    case_date = Column(Date)
    judge = Column(Text)
    ipc_sections = Column(Text)
    bail_type = Column(Text)
    bail_cancellation_case = Column(Boolean)
    is_landmark = Column(Boolean)
    accused_gender = Column(Text)
    prior_cases = Column(Text)
    bail_outcome = Column(Text)
    bail_outcome_detailed = Column(Text)
    crime_type = Column(Text)
    facts = Column(Text)
    legal_issues = Column(Text)
    judgment_reason = Column(Text)
    summary = Column(Text)
    bias_flag = Column(Boolean)
    parity_argument_used = Column(Boolean)
    legal_principles_discussed = Column(Text)
    region = Column(Text)
    special_laws = Column(Text)
    source_filename = Column(Text)
    embedding = Column(Vector(1024), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
