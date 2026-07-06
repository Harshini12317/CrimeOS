from sqlalchemy import Column
from sqlalchemy import String

from database.db import Base


class Officer(Base):

    __tablename__ = "officers"

    officer_id = Column(String, primary_key=True)

    badge_number = Column(String)

    name = Column(String)

    rank = Column(String)

    station = Column(String)