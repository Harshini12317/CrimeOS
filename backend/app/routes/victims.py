import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.db import get_db
from models.complaint import Complaint
from models.victim import Victim

from app.schemas.victim import (
    VictimCreate,
    VictimResponse
)


router = APIRouter(
    prefix="/api/victims",
    tags=["Victims"]
)


# ==========================================================
# CREATE VICTIM
# ==========================================================

@router.post(
    "",
    response_model=VictimResponse
)
def create_victim(
    data: VictimCreate,
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
    # Create victim
    # ------------------------------------------------------

    victim = Victim(
        victim_id=str(uuid.uuid4()),

        complaint_id=data.complaint_id,

        name=data.name,
        contact=data.contact,
        relationship=data.relationship,
        statement=data.statement,
        type=data.type,
        description=data.description,
        address=data.address,
        photo_url=data.photo_url
    )

    db.add(victim)

    db.commit()

    db.refresh(victim)

    return victim


# ==========================================================
# GET VICTIMS FOR A COMPLAINT
# ==========================================================

@router.get(
    "/complaint/{complaint_id}",
    response_model=list[VictimResponse]
)
def get_victims(
    complaint_id: str,
    db: Session = Depends(get_db)
):

    return db.query(
        Victim
    ).filter(
        Victim.complaint_id == complaint_id
    ).order_by(
        Victim.created_at.asc()
    ).all()