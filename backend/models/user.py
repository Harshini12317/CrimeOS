"""
Only three roles exist. There is no signup endpoint anywhere in this app
— accounts are created exclusively by scripts/seed_users.py.

If models/ already has other files (e.g. Investigation) importing Base
from database.db, this uses the exact same import so everything shares
one metadata/Base — required for db.create_all() or Alembic to see all
tables together.
"""
import enum
from datetime import datetime

from sqlalchemy import Column, Integer, String, Enum, Boolean, DateTime

from database.db import Base


class Role(str, enum.Enum):
    IO = "IO"                    # Investigating Officer
    SHO = "SHO"                  # Station House Officer
    LEGAL_ADVISOR = "LEGAL_ADVISOR"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    name = Column(String(120), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(Role), nullable=False)

    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)