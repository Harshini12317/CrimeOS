from sqlalchemy import Column
from sqlalchemy import String
from sqlalchemy import ForeignKey

from database.db import Base


class Evidence(Base):

    __tablename__ = "evidences"

    evidence_id = Column(String, primary_key=True)

    case_id = Column(
        String,
        ForeignKey("cases.case_id")
    )

    evidence_type = Column(String)

    file_path = Column(String)