from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.db import get_db

from app.schemas.complaint import (
    ComplaintCreate,
    ComplaintResponse,
)

from app.services.complaint.complaint_service import create_complaint

from app.services.complaint.complaint_categories import (
    CRIME_CATEGORIES,
)
from models.complaint import Complaint


router = APIRouter(
    prefix="/api/complaints",
    tags=["Complaints"],
)


# ============================================================
# GET ALL CRIME CATEGORIES
# ============================================================

@router.get("/categories")
def get_crime_categories():
    return CRIME_CATEGORIES


# ============================================================
# REGISTER NEW COMPLAINT
# ============================================================

@router.post(
    "",
    response_model=ComplaintResponse,
    status_code=201,
)
def register_complaint(
    data: ComplaintCreate,
    db: Session = Depends(get_db),
):

    # --------------------------------------------------------
    # Validate crime category
    # --------------------------------------------------------

    valid_subcategories = CRIME_CATEGORIES.get(
        data.crime_category
    )

    if valid_subcategories is None:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Invalid crime category: "
                f"'{data.crime_category}'."
            ),
        )

    # --------------------------------------------------------
    # Validate subcategory belongs to selected category
    # --------------------------------------------------------

    if data.crime_subcategory not in valid_subcategories:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Invalid subcategory "
                f"'{data.crime_subcategory}' "
                f"for category "
                f"'{data.crime_category}'."
            ),
        )

    # --------------------------------------------------------
    # Create complaint
    # --------------------------------------------------------

    try:
        complaint = create_complaint(
            db=db,
            data=data,
        )

        return complaint

    except HTTPException:
        raise

    except Exception as e:
        db.rollback()

        print(
            "ERROR WHILE REGISTERING COMPLAINT:",
            repr(e),
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to register complaint.",
        )


@router.get(
    "/{complaint_id}",
    response_model=ComplaintResponse,
)
def get_complaint(
    complaint_id: str,
    db: Session = Depends(get_db),
):
    complaint = (
        db.query(Complaint)
        .filter(
            Complaint.complaint_id == complaint_id
        )
        .first()
    )

    if complaint is None:
        raise HTTPException(
            status_code=404,
            detail="Complaint not found.",
        )

    return complaint