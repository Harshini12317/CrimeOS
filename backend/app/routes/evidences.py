import json
import uuid
import traceback

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    File,
    Form,
    UploadFile,
)

from sqlalchemy.orm import Session

from database.db import get_db
from models.complaint import Complaint
from models.evidence import Evidence

from app.schemas.evidence import EvidenceResponse
from app.services.evidence_service import upload_evidence


router = APIRouter(
    prefix="/api/evidences",
    tags=["Evidences"],
)


# ==========================================================
# CREATE / SAVE EVIDENCE
# ==========================================================

@router.post("/")
async def create_evidence(
    complaint_id: str = Form(...),
    evidence_type: str = Form("Unknown"),
    extraction_data: str = Form("{}"),
    extracted_text: str = Form(""),
    summary: str = Form(""),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    Save one evidence file.

    Flow:

        Frontend
            ↓
        UploadFile
            ↓
        Cloudinary
            ↓
        Evidence DB record
    """

    try:
        # ------------------------------------------------------
        # 1. Validate complaint
        # ------------------------------------------------------

        complaint = (
            db.query(Complaint)
            .filter(
                Complaint.complaint_id == complaint_id
            )
            .first()
        )

        if not complaint:
            raise HTTPException(
                status_code=404,
                detail="Complaint not found.",
            )

        # ------------------------------------------------------
        # 2. Validate file
        # ------------------------------------------------------

        if not file:
            raise HTTPException(
                status_code=400,
                detail="Evidence file is required.",
            )

        if not file.filename:
            raise HTTPException(
                status_code=400,
                detail="Evidence filename is missing.",
            )

        # ------------------------------------------------------
        # 3. Parse extraction JSON
        # ------------------------------------------------------

        try:
            parsed_extraction = json.loads(
                extraction_data or "{}"
            )
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=400,
                detail="Invalid extraction_data JSON.",
            )

        # ------------------------------------------------------
        # 4. Upload evidence to Cloudinary
        # ------------------------------------------------------

        cloudinary_result = upload_evidence(
            file=file,
            complaint_id=complaint_id,
        )

        cloudinary_url = cloudinary_result.get("url")
        cloudinary_public_id = cloudinary_result.get(
            "public_id"
        )

        if not cloudinary_url:
            raise HTTPException(
                status_code=500,
                detail="Cloudinary upload failed: URL was not returned.",
            )

        # ------------------------------------------------------
        # 5. Create Evidence DB record
        # ------------------------------------------------------

        evidence = Evidence(
            evidence_id=str(uuid.uuid4()),

            complaint_id=complaint_id,

            # Case is not necessarily created yet.
            case_id=None,

            evidence_type=evidence_type,

            file_path=None,

            file_name=file.filename,

            file_type=file.content_type,

            cloudinary_url=cloudinary_url,

            cloudinary_public_id=cloudinary_public_id,

            extracted_text=extracted_text or None,

            summary=summary or None,

            extraction_data=parsed_extraction,
        )

        # ------------------------------------------------------
        # 6. Save to DB
        # ------------------------------------------------------

        db.add(evidence)
        db.commit()
        db.refresh(evidence)

        # ------------------------------------------------------
        # 7. Return saved evidence
        # ------------------------------------------------------

        return {
            "message": "Evidence saved successfully.",

            "evidence": {
                "evidence_id": evidence.evidence_id,
                "complaint_id": evidence.complaint_id,
                "case_id": evidence.case_id,

                "evidence_type": evidence.evidence_type,

                "file_name": evidence.file_name,
                "file_type": evidence.file_type,

                "cloudinary_url": evidence.cloudinary_url,
                "cloudinary_public_id": evidence.cloudinary_public_id,

                "extracted_text": evidence.extracted_text,
                "summary": evidence.summary,
                "extraction_data": evidence.extraction_data,

                "created_at": evidence.created_at,
                "updated_at": evidence.updated_at,
            },
        }

    except HTTPException:
        raise

    except Exception as e:
        db.rollback()

        print("\n=== EVIDENCE SAVE ERROR ===")
        traceback.print_exc()

        raise HTTPException(
            status_code=500,
            detail=f"Failed to save evidence: {str(e)}",
        )


# ==========================================================
# GET ALL EVIDENCE FOR A COMPLAINT
# ==========================================================

@router.get(
    "/complaint/{complaint_id}",
    response_model=list[EvidenceResponse],
)
def get_complaint_evidence(
    complaint_id: str,
    db: Session = Depends(get_db),
):

    # ------------------------------------------------------
    # Check complaint exists
    # ------------------------------------------------------

    complaint = (
        db.query(Complaint)
        .filter(
            Complaint.complaint_id == complaint_id
        )
        .first()
    )

    if not complaint:
        raise HTTPException(
            status_code=404,
            detail="Complaint not found",
        )

    # ------------------------------------------------------
    # Get evidence
    # ------------------------------------------------------

    evidence = (
        db.query(Evidence)
        .filter(
            Evidence.complaint_id == complaint_id
        )
        .order_by(
            Evidence.created_at.asc()
        )
        .all()
    )

    return evidence