from typing import Optional, Any
from datetime import datetime

from pydantic import BaseModel, ConfigDict


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

    # ======================================================
    # REQUEST INFORMATION
    # ======================================================

    request_id: str

    case_id: str

    complaint_id: str

    agency_type: str

    agency_name: str

    recipient_email: str

    subject: str

    document_url: Optional[str] = None

    # ======================================================
    # REQUEST STATUS
    # ======================================================

    status: Optional[str] = None

    sent_at: Optional[datetime] = None

    responded_at: Optional[datetime] = None

    # ======================================================
    # OPERATOR RESPONSE
    # ======================================================

    response_received_at: Optional[datetime] = None

    response_document_url: Optional[str] = None

    response_file_name: Optional[str] = None

    response_file_type: Optional[str] = None

    response_summary: Optional[str] = None

    response_data: Optional[dict[str, Any]] = None

    # ======================================================
    # TIMESTAMPS
    # ======================================================

    created_at: Optional[datetime] = None

    updated_at: Optional[datetime] = None

    # ======================================================
    # SQLAlchemy MODEL SUPPORT
    # ======================================================

    model_config = ConfigDict(
        from_attributes=True
    )