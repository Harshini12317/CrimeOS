from sqlalchemy import Column
from sqlalchemy import String
from sqlalchemy import Text
from sqlalchemy import DateTime
from sqlalchemy.sql import func

from database.db import Base


class Complaint(Base):

    __tablename__ = "complaints"

    complaint_id = Column(String, primary_key=True)

    complainant_name = Column(String)

    phone = Column(String)

    email = Column(String)

    crime_type = Column(String)

    location = Column(Text)

    description = Column(Text)

    status = Column(String, default="Pending")

    created_at = Column(DateTime(timezone=True), server_default=func.now())