from typing import Optional
from datetime import datetime

from pydantic import BaseModel


class SuspectCreate(BaseModel):
    complaint_id: str

    name: Optional[str] = None
    contact: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    type: Optional[str] = None
    address: Optional[str] = None
    photo_url: Optional[str] = None


class SuspectResponse(BaseModel):
    suspect_id: str
    complaint_id: str

    name: Optional[str] = None
    contact: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    type: Optional[str] = None
    address: Optional[str] = None
    photo_url: Optional[str] = None

    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True