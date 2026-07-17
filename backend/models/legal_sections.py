from sqlalchemy import Column
from sqlalchemy import Text
from sqlalchemy import DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from database.db import Base
from models._types import Vector


class LegalSection(Base):

    __tablename__ = "legal_sections"
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    act_code = Column(Text, nullable=False)
    section_number = Column(Text, nullable=False)
    title = Column(Text)
    section_text = Column(Text, nullable=False)
    category = Column(Text)
    embedding = Column(Vector(1024), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
