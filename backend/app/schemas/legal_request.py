from typing import Optional
from datetime import datetime

from pydantic import BaseModel


# ==========================================================
# CREATE LEGAL REQUEST
# ==========================================================

class LegalRequestCreate(BaseModel):
    case_id: str
    complaint_id: str

    agency_type: str
    agency_name: str

    recipient_email: str

    subject: str

    document_url: Optional[str] = None


# ==========================================================
# GENERATE LEGAL REQUEST
# ==========================================================

class LegalRequestGenerate(BaseModel):
    case_id: str

    agency_type: str

    agency_name: str

    recipient_email: str

    request_type: str


# ==========================================================
# RESPONSE
# ==========================================================

class LegalRequestResponse(BaseModel):
    request_id: str

    case_id: str

    complaint_id: str

    agency_type: str

    agency_name: str

    recipient_email: str

    subject: str

    document_url: Optional[str] = None

    status: Optional[str] = None

    sent_at: Optional[datetime] = None

    responded_at: Optional[datetime] = None

    created_at: Optional[datetime] = None

    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True