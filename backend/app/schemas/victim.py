from typing import Optional
from datetime import datetime

from pydantic import BaseModel


class VictimCreate(BaseModel):
    complaint_id: str

    name: str
    contact: Optional[str] = None
    relationship: Optional[str] = None
    statement: Optional[str] = None
    type: Optional[str] = None
    description: Optional[str] = None
    address: Optional[str] = None
    photo_url: Optional[str] = None


class VictimResponse(BaseModel):
    victim_id: str
    complaint_id: str

    name: str
    contact: Optional[str] = None
    relationship: Optional[str] = None
    statement: Optional[str] = None
    type: Optional[str] = None
    description: Optional[str] = None
    address: Optional[str] = None
    photo_url: Optional[str] = None

    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True