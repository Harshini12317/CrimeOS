from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
)

from sqlalchemy.orm import Session

from database.db import get_db

from models.complaint import Complaint

from app.services.person_photo_service import (
    upload_person_photo,
)


router = APIRouter(
    prefix="/api/person-photos",
    tags=["Person Photos"],
)


# ==========================================================
# UPLOAD VICTIM / SUSPECT PHOTO
# ==========================================================

@router.post("/upload")
async def upload_person_photo_route(
    complaint_id: str = Form(...),

    person_type: str = Form(...),

    file: UploadFile = File(...),

    db: Session = Depends(get_db),
):

    # ------------------------------------------------------
    # Validate person type
    # ------------------------------------------------------

    if person_type not in {
        "victim",
        "suspect",
    }:

        raise HTTPException(
            status_code=400,

            detail=(
                "person_type must be "
                "'victim' or 'suspect'."
            ),
        )


    # ------------------------------------------------------
    # Validate complaint
    # ------------------------------------------------------

    complaint = (
        db.query(Complaint)
        .filter(
            Complaint.complaint_id ==
            complaint_id
        )
        .first()
    )


    if not complaint:

        raise HTTPException(
            status_code=404,

            detail="Complaint not found.",
        )


    # ------------------------------------------------------
    # Validate file
    # ------------------------------------------------------

    if not file.filename:

        raise HTTPException(
            status_code=400,

            detail="Photo filename is missing.",
        )


    if not file.content_type:

        raise HTTPException(
            status_code=400,

            detail="Photo content type is missing.",
        )


    if not file.content_type.startswith(
        "image/"
    ):

        raise HTTPException(
            status_code=400,

            detail=(
                "Only image files are "
                "allowed for person photos."
            ),
        )


    # ------------------------------------------------------
    # Upload to Cloudinary
    # ------------------------------------------------------

    try:

        result = upload_person_photo(
            file=file,

            complaint_id=
                complaint_id,

            person_type=
                person_type,
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,

            detail=(
                f"Photo upload failed: {str(e)}"
            ),
        )


    # ------------------------------------------------------
    # Validate Cloudinary response
    # ------------------------------------------------------

    if not result.get("url"):

        raise HTTPException(
            status_code=500,

            detail=(
                "Cloudinary did not return "
                "a secure URL."
            ),
        )


    # ------------------------------------------------------
    # Return URL to frontend
    # ------------------------------------------------------

    return {
        "message":
            "Photo uploaded successfully.",

        "url":
            result.get("url"),

        "public_id":
            result.get("public_id"),

        "resource_type":
            result.get("resource_type"),

        "person_type":
            person_type,

        "complaint_id":
            complaint_id,
    }