import uuid
import os
import tempfile
import requests

from datetime import datetime

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from sqlalchemy import text
from sqlalchemy.orm import Session

from database.db import get_db

from models.complaint import Complaint
from models.legal_request import LegalRequest

from app.schemas.legal_request import (
    LegalRequestCreate,
    LegalRequestResponse,
    LegalRequestGenerate,
)

from app.services.legal_request_generator import (
    generate_legal_request,
)

from app.services.legal_request_pdf import (
    generate_legal_request_pdf,
)

from app.services.legal_request_storage import (
    upload_legal_request_pdf,
)

from app.services.email_service import send_email


router = APIRouter(
    prefix="/api/legal-requests",
    tags=["Legal Requests"],
)


# ==========================================================
# CREATE LEGAL REQUEST MANUALLY
# ==========================================================

@router.post(
    "",
    response_model=LegalRequestResponse,
)
def create_legal_request(
    data: LegalRequestCreate,
    db: Session = Depends(get_db),
):

    # ======================================================
    # VERIFY COMPLAINT
    # ======================================================

    complaint = db.query(
        Complaint
    ).filter(
        Complaint.complaint_id == data.complaint_id
    ).first()

    if not complaint:
        raise HTTPException(
            status_code=404,
            detail="Complaint not found",
        )

    # ======================================================
    # VERIFY CASE
    #
    # IMPORTANT:
    # We intentionally DO NOT use Case ORM here.
    # This protects the existing FIR Case model.
    # ======================================================

    case = db.execute(
        text(
            """
            SELECT
                case_id,
                complaint_id
            FROM cases
            WHERE case_id = :case_id
            LIMIT 1
            """
        ),
        {
            "case_id": data.case_id,
        },
    ).mappings().first()

    if not case:
        raise HTTPException(
            status_code=404,
            detail="Case not found",
        )

    # ======================================================
    # CHECK CASE -> COMPLAINT LINK
    # ======================================================

    if case["complaint_id"] != data.complaint_id:
        raise HTTPException(
            status_code=400,
            detail=(
                "The selected case does not "
                "belong to the selected complaint."
            ),
        )

    # ======================================================
    # CREATE REQUEST
    # ======================================================

    request = LegalRequest(
        request_id=str(uuid.uuid4()),

        case_id=data.case_id,

        complaint_id=data.complaint_id,

        agency_type=data.agency_type,

        agency_name=data.agency_name,

        recipient_email=data.recipient_email,

        subject=data.subject,

        document_url=data.document_url,

        status="DRAFT",

        created_at=datetime.utcnow(),

        updated_at=datetime.utcnow(),
    )

    db.add(request)

    db.commit()

    db.refresh(request)

    return request


# ==========================================================
# GENERATE LEGAL REQUEST
# ==========================================================

@router.post(
    "/generate"
)
def generate_request(
    data: LegalRequestGenerate,
    db: Session = Depends(get_db),
):

    # ======================================================
    # 1. FETCH REQUIRED CASE COLUMNS
    #
    # DO NOT use Case ORM.
    # ======================================================

    case = db.execute(
        text(
            """
            SELECT
                case_id,
                complaint_id,
                case_number,
                title,
                description,
                district,
                police_station,
                fir_no,
                fir_year
            FROM cases
            WHERE case_id = :case_id
            LIMIT 1
            """
        ),
        {
            "case_id": data.case_id,
        },
    ).mappings().first()

    # ======================================================
    # CASE NOT FOUND
    # ======================================================

    if not case:
        raise HTTPException(
            status_code=404,
            detail="Case not found",
        )

    # ======================================================
    # 2. VERIFY COMPLAINT
    # ======================================================

    complaint = db.query(
        Complaint
    ).filter(
        Complaint.complaint_id == case["complaint_id"]
    ).first()

    if not complaint:
        raise HTTPException(
            status_code=404,
            detail=(
                "Complaint linked to "
                "this case was not found"
            ),
        )

    # ======================================================
    # 3. GENERATE LEGAL REQUEST CONTENT
    # ======================================================

    try:

        generated = generate_legal_request(

            agency_type=data.agency_type,

            agency_name=data.agency_name,

            request_type=data.request_type,

            case_number=(
                case["case_number"]
                or case["case_id"]
            ),

            police_station=case["police_station"],

            district=case["district"],

            fir_no=case["fir_no"],

            fir_year=case["fir_year"],

            case_title=case["title"],

            case_description=case["description"],
        )

    except ValueError as e:

        raise HTTPException(
            status_code=400,
            detail=str(e),
        )

    # ======================================================
    # 4. CREATE LEGAL REQUEST DB RECORD
    # ======================================================

    request = LegalRequest(

        request_id=str(uuid.uuid4()),

        case_id=case["case_id"],

        complaint_id=case["complaint_id"],

        agency_type=data.agency_type,

        agency_name=data.agency_name,

        recipient_email=data.recipient_email,

        subject=generated["subject"],

        document_url=None,

        status="GENERATED",

        created_at=datetime.utcnow(),

        updated_at=datetime.utcnow(),
    )

    db.add(request)

    db.commit()

    db.refresh(request)

    # ======================================================
    # 5. GENERATE PDF IN TEMPORARY DIRECTORY
    # ======================================================

    pdf_path = None

    try:

        pdf_path = generate_legal_request_pdf(

            request_id=request.request_id,

            subject=generated["subject"],

            body=generated["body"],
        )

    except Exception as e:

        request.status = "GENERATION_FAILED"

        request.updated_at = datetime.utcnow()

        db.commit()

        raise HTTPException(
            status_code=500,
            detail=(
                "Legal request was created "
                "but PDF generation failed: "
                f"{str(e)}"
            ),
        )

    # ======================================================
    # 6. UPLOAD PDF TO CLOUDINARY
    # ======================================================

    try:

        upload_result = upload_legal_request_pdf(

            file_path=pdf_path,

            request_id=request.request_id,
        )

    except Exception as e:

        request.status = "UPLOAD_FAILED"

        request.updated_at = datetime.utcnow()

        db.commit()

        raise HTTPException(
            status_code=500,
            detail=(
                "PDF was generated but "
                "Cloudinary upload failed: "
                f"{str(e)}"
            ),
        )

    finally:

        # ==================================================
        # DELETE LOCAL TEMPORARY PDF
        # ==================================================

        if pdf_path:

            try:

                if os.path.exists(pdf_path):

                    os.unlink(pdf_path)

            except Exception as cleanup_error:

                print(
                    "Warning: could not delete "
                    f"temporary PDF: {cleanup_error}"
                )

    # ======================================================
    # 7. SAVE CLOUDINARY URL
    # ======================================================

    request.document_url = upload_result["url"]

    request.status = "GENERATED"

    request.updated_at = datetime.utcnow()

    db.commit()

    db.refresh(request)

    # ======================================================
    # 8. RETURN
    # ======================================================

    return {

        "request_id":
            request.request_id,

        "case_id":
            request.case_id,

        "complaint_id":
            request.complaint_id,

        "agency_type":
            request.agency_type,

        "agency_name":
            request.agency_name,

        "recipient_email":
            request.recipient_email,

        "subject":
            generated["subject"],

        "body":
            generated["body"],

        "document_url":
            request.document_url,

        "status":
            request.status,
    }


# ==========================================================
# SEND LEGAL REQUEST BY EMAIL
# ==========================================================

@router.post(
    "/{request_id}/send"
)
async def send_legal_request(
    request_id: str,
    db: Session = Depends(get_db),
):

    # ======================================================
    # 1. FIND REQUEST
    # ======================================================

    request = db.query(
        LegalRequest
    ).filter(
        LegalRequest.request_id == request_id
    ).first()

    if not request:

        raise HTTPException(
            status_code=404,
            detail="Legal request not found",
        )

    # ======================================================
    # 2. CHECK EMAIL
    # ======================================================

    if not request.recipient_email:

        raise HTTPException(
            status_code=400,
            detail="Recipient email is not configured",
        )

    # ======================================================
    # 3. CHECK DOCUMENT
    # ======================================================

    if not request.document_url:

        raise HTTPException(
            status_code=400,
            detail=(
                "Legal request document "
                "is not available"
            ),
        )

    # ======================================================
    # 4. PREVENT DUPLICATE SEND
    # ======================================================

    if request.status == "RESPONSE_PENDING":

        raise HTTPException(
            status_code=400,
            detail=(
                "This legal request has "
                "already been sent"
            ),
        )

    # ======================================================
    # TEMPORARY EMAIL PDF
    # ======================================================

    temp_path = None

    try:

        # ==================================================
        # 5. DOWNLOAD PDF FROM CLOUDINARY
        # ==================================================

        response = requests.get(
            request.document_url,
            timeout=30,
        )

        response.raise_for_status()

        # ==================================================
        # 6. CREATE TEMPORARY PDF
        # ==================================================

        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=".pdf",
        ) as temp_file:

            temp_file.write(
                response.content
            )

            temp_path = temp_file.name

        # ==================================================
        # 7. EMAIL BODY
        # ==================================================

        email_body = f"""
Dear Sir/Madam,

Please find attached the official legal information
request related to the investigation.

Case ID:
{request.case_id}

Complaint ID:
{request.complaint_id}

Agency:
{request.agency_name}

Subject:
{request.subject}

Please process the request through the
appropriate official channel.

Regards,

Investigating Officer
CrimeOS
""".strip()

        # ==================================================
        # 8. SEND EMAIL
        # ==================================================

        await send_email(

            recipient_email=
                request.recipient_email,

            subject=
                request.subject,

            body=
                email_body,

            attachment_path=
                temp_path,
        )

        # ==================================================
        # 9. UPDATE DATABASE
        # ==================================================

        request.status = "SENT"

        request.sent_at = datetime.utcnow()

        request.updated_at = datetime.utcnow()

        db.commit()

        db.refresh(request)

        # ==================================================
        # 10. RESPONSE
        # ==================================================

        return {

            "success": True,

            "message":
                "Legal request sent successfully",

            "request_id":
                request.request_id,

            "recipient_email":
                request.recipient_email,

            "status":
                request.status,

            "sent_at":
                request.sent_at,

            "document_url":
                request.document_url,
        }

    except requests.RequestException as e:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to download "
                "legal request PDF: "
                f"{str(e)}"
            ),
        )

    except Exception as e:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to send legal request: "
                f"{str(e)}"
            ),
        )

    finally:

        # ==================================================
        # DELETE EMAIL TEMPORARY PDF
        # ==================================================

        if temp_path:

            try:

                if os.path.exists(temp_path):

                    os.unlink(temp_path)

            except Exception as cleanup_error:

                print(
                    "Warning: could not delete "
                    f"email temporary PDF: {cleanup_error}"
                )


# ==========================================================
# GET REQUESTS FOR A CASE
# ==========================================================

@router.get(
    "/case/{case_id}",
    response_model=list[LegalRequestResponse],
)
def get_case_legal_requests(
    case_id: str,
    db: Session = Depends(get_db),
):

    return db.query(
        LegalRequest
    ).filter(
        LegalRequest.case_id == case_id
    ).order_by(
        LegalRequest.created_at.desc()
    ).all()


# ==========================================================
# GET SINGLE REQUEST
# ==========================================================

@router.get(
    "/{request_id}",
    response_model=LegalRequestResponse,
)
def get_legal_request(
    request_id: str,
    db: Session = Depends(get_db),
):

    request = db.query(
        LegalRequest
    ).filter(
        LegalRequest.request_id == request_id
    ).first()

    if not request:

        raise HTTPException(
            status_code=404,
            detail="Legal request not found",
        )

    return request