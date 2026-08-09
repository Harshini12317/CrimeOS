import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.db import get_db
from models.complaint import Complaint
from models.complainant import Complainant

from app.schemas.complainant import (
    ComplainantCreate,
    ComplainantResponse
)


router = APIRouter(
    prefix="/api/complainants",
    tags=["Complainants"]
)


# ==========================================================
# CREATE COMPLAINANT
# ==========================================================

@router.post(
    "",
    response_model=ComplainantResponse
)
def create_complainant(
    data: ComplainantCreate,
    db: Session = Depends(get_db)
):

    # ------------------------------------------------------
    # Check that complaint exists
    # ------------------------------------------------------

    complaint = db.query(Complaint).filter(
        Complaint.complaint_id == data.complaint_id
    ).first()

    if not complaint:
        raise HTTPException(
            status_code=404,
            detail="Complaint not found"
        )

    # ------------------------------------------------------
    # Create complainant
    # ------------------------------------------------------

    complainant = Complainant(
        complainant_id=str(uuid.uuid4()),

        complaint_id=data.complaint_id,

        name=data.name,
        contact=data.contact,
        relationship=data.relationship,
        statement=data.statement,
        type=data.type,
        address=data.address
    )

    db.add(complainant)

    db.commit()

    db.refresh(complainant)

    return complainant


# ==========================================================
# GET COMPLAINANTS FOR A COMPLAINT
# ==========================================================

@router.get(
    "/complaint/{complaint_id}",
    response_model=list[ComplainantResponse]
)
def get_complainants(
    complaint_id: str,
    db: Session = Depends(get_db)
):

    return db.query(
        Complainant
    ).filter(
        Complainant.complaint_id == complaint_id
    ).order_by(
        Complainant.created_at.asc()
    ).all()