from sqlalchemy import Column
from sqlalchemy import String
from sqlalchemy import Text
from sqlalchemy import DateTime
from sqlalchemy import BigInteger
from sqlalchemy import CheckConstraint
from sqlalchemy.sql import func

from database.db import Base


class LegalSectionMapping(Base):
    __tablename__ = "legal_section_mappings"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    act_pair = Column(String(20), nullable=False)
    new_act = Column(String(10), nullable=False)
    old_act = Column(String(10), nullable=False)
    new_section = Column(Text, nullable=False)
    old_section = Column(Text)
    subject = Column(Text)
    summary_of_comparison = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    __table_args__ = (
        CheckConstraint("act_pair IN ('BNS_IPC', 'BNSS_CRPC', 'BSA_IEA')", name="legal_section_mappings_act_pair_check"),
        CheckConstraint("new_act IN ('BNS', 'BNSS', 'BSA')", name="legal_section_mappings_new_act_check"),
        CheckConstraint("old_act IN ('IPC', 'CrPC', 'IEA')", name="legal_section_mappings_old_act_check"),
    )
