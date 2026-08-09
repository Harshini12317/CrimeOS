import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.db import get_db
from models.complaint import Complaint
from models.suspect import Suspect

from app.schemas.suspect import (
    SuspectCreate,
    SuspectResponse
)


router = APIRouter(
    prefix="/api/suspects",
    tags=["Suspects"]
)


# ==========================================================
# CREATE SUSPECT
# ==========================================================

@router.post(
    "",
    response_model=SuspectResponse
)
def create_suspect(
    data: SuspectCreate,
    db: Session = Depends(get_db)
):

    # ------------------------------------------------------
    # Check complaint
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
    # Create suspect
    # ------------------------------------------------------

    suspect = Suspect(
        suspect_id=str(uuid.uuid4()),

        complaint_id=data.complaint_id,

        name=data.name,
        contact=data.contact,
        description=data.description,
        status=data.status,
        type=data.type,
        address=data.address,
        photo_url=data.photo_url
    )

    db.add(suspect)

    db.commit()

    db.refresh(suspect)

    return suspect


# ==========================================================
# GET SUSPECTS FOR A COMPLAINT
# ==========================================================

@router.get(
    "/complaint/{complaint_id}",
    response_model=list[SuspectResponse]
)
def get_suspects(
    complaint_id: str,
    db: Session = Depends(get_db)
):

    return db.query(
        Suspect
    ).filter(
        Suspect.complaint_id == complaint_id
    ).order_by(
        Suspect.created_at.asc()
    ).all()