from typing import Any, Optional
from datetime import datetime

from pydantic import BaseModel


class EvidenceResponse(BaseModel):
    evidence_id: str

    complaint_id: Optional[str] = None
    case_id: Optional[str] = None

    evidence_type: Optional[str] = None

    file_path: Optional[str] = None
    file_name: Optional[str] = None
    file_type: Optional[str] = None

    cloudinary_url: Optional[str] = None
    cloudinary_public_id: Optional[str] = None

    extracted_text: Optional[str] = None
    summary: Optional[str] = None
    extraction_data: Optional[Any] = None

    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True