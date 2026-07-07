from sqlalchemy import Column
from sqlalchemy import String
from sqlalchemy import ForeignKey

from database.db import Base


class Case(Base):

    __tablename__ = "cases"

    case_id = Column(String, primary_key=True)

    complaint_id = Column(
        String,
        ForeignKey("complaints.complaint_id")
    )

    officer_id = Column(String)

    status = Column(String)

    priority = Column(String)