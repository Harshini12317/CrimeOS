from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


# =====================================================
# Generate Legal Request
# =====================================================

class GenerateWorkflowRequest(BaseModel):

    case_id: str = Field(...)

    complaint_id: str = Field(...)

    agency_type: str = Field(
        ...,
        examples=["Bank", "Telecom", "Hospital"]
    )

    agency_name: str

    recipient_email: EmailStr

    subject: str


# =====================================================
# Send Request
# =====================================================

class SendWorkflowRequest(BaseModel):

    request_id: str


# =====================================================
# Update Status (optional)
# =====================================================

class UpdateWorkflowStatusRequest(BaseModel):

    status: str


# =====================================================
# Workflow Response
# =====================================================

class WorkflowResponse(BaseModel):

    success: bool

    message: str

    request_id: str

    download_url: str


# =====================================================
# Workflow Details
# =====================================================

class WorkflowStatusResponse(BaseModel):

    request_id: str

    case_id: str

    complaint_id: str

    agency_type: str

    agency_name: str

    recipient_email: EmailStr

    subject: str

    status: str

    document_name: Optional[str] = None

    sent_at: Optional[datetime] = None

    responded_at: Optional[datetime] = None

    created_at: datetime

    updated_at: datetime


# =====================================================
# List Item
# =====================================================

class WorkflowListItem(BaseModel):

    request_id: str

    case_id: str

    complaint_id: str

    agency_name: str

    agency_type: str

    status: str

    recipient_email: EmailStr


# =====================================================
# List Response
# =====================================================

class WorkflowListResponse(BaseModel):

    requests: list[WorkflowListItem]