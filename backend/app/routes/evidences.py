import uuid

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    File,
    Form,
    UploadFile
)

from sqlalchemy.orm import Session

from database.db import get_db
from models.complaint import Complaint
from models.evidence import Evidence

from app.schemas.evidence import EvidenceResponse


router = APIRouter(
    prefix="/api/evidences",
    tags=["Evidences"]
)


# ==========================================================
# GET ALL EVIDENCE FOR A COMPLAINT
# ==========================================================

@router.get(
    "/complaint/{complaint_id}",
    response_model=list[EvidenceResponse]
)
def get_complaint_evidence(
    complaint_id: str,
    db: Session = Depends(get_db)
):

    # Check complaint exists
    complaint = db.query(
        Complaint
    ).filter(
        Complaint.complaint_id == complaint_id
    ).first()

    if not complaint:
        raise HTTPException(
            status_code=404,
            detail="Complaint not found"
        )

    evidence = db.query(
        Evidence
    ).filter(
        Evidence.complaint_id == complaint_id
    ).order_by(
        Evidence.created_at.asc()
    ).all()

    return evidence