import uuid
import os
import tempfile
import requests

from datetime import datetime, timezone

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from pydantic import BaseModel, EmailStr

from sqlalchemy import text
from sqlalchemy.orm import Session

from database.db import get_db

from models.complaint import Complaint
from models.legal_request import LegalRequest
from models.victim import Victim
from models.suspect import Suspect
from models.evidence import Evidence

from app.schemas.legal_request import (
    LegalRequestCreate,
    LegalRequestResponse,
    LegalRequestGenerate,
)

from app.services.legal_response_processor import (
    process_gmail_responses,
)

from app.services.ai_service import (
    analyze_operator_request,
    AIServiceError,
)

from app.services.gmail_response_service import (
    fetch_new_responses,
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

from app.services.email_service import (
    send_email,
)


# ==========================================================
# ROUTER
# ==========================================================

router = APIRouter(
    prefix="/api/legal-requests",
    tags=["Legal Requests"],
)


# ==========================================================
# MANUAL REQUEST SCHEMA
#
# This is used by the NEW Case View button.
#
# The frontend sends:
#
# {
#   case_id,
#   complaint_id,
#   agency_type,
#   agency_name,
#   recipient_email,
#   subject,
#   message
# }
# ==========================================================

class ManualLegalRequest(BaseModel):

    case_id: str

    complaint_id: str | None = None

    agency_type: str

    agency_name: str

    recipient_email: EmailStr

    subject: str

    message: str


# ==========================================================
# HELPER
# ==========================================================

def get_case_and_verify_complaint(
    db: Session,
    case_id: str,
    complaint_id: str | None,
):
    """
    Verify:

        case exists

    and, when complaint_id is supplied:

        case.complaint_id == complaint_id

    Returns:
        case mapping
        complaint ORM object
    """

    # ------------------------------------------------------
    # CASE
    # ------------------------------------------------------

    case = (
        db.execute(
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
                "case_id": case_id,
            },
        )
        .mappings()
        .first()
    )

    if not case:

        raise HTTPException(
            status_code=404,
            detail="Case not found",
        )

    # ------------------------------------------------------
    # CASE -> COMPLAINT
    # ------------------------------------------------------

    actual_complaint_id = (
        case["complaint_id"]
    )

    if not actual_complaint_id:

        raise HTTPException(
            status_code=400,
            detail=(
                "This case is not linked "
                "to a complaint."
            ),
        )

    # ------------------------------------------------------
    # VERIFY PROVIDED COMPLAINT ID
    # ------------------------------------------------------

    if (
        complaint_id
        and actual_complaint_id
        != complaint_id
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "The selected case does not "
                "belong to the selected complaint."
            ),
        )

    # ------------------------------------------------------
    # COMPLAINT
    # ------------------------------------------------------

    complaint = (
        db.query(Complaint)
        .filter(
            Complaint.complaint_id
            == actual_complaint_id
        )
        .first()
    )

    if not complaint:

        raise HTTPException(
            status_code=404,
            detail=(
                "Complaint linked to "
                "this case was not found."
            ),
        )

    return case, complaint


# ==========================================================
# CREATE + SEND MANUAL LEGAL REQUEST
#
# THIS IS THE IMPORTANT NEW FLOW.
#
# Case View calls:
#
# POST /api/legal-requests
#
# It will:
#
# 1. Verify case
# 2. Verify complaint
# 3. Create DB request
# 4. Generate PDF
# 5. Upload PDF to Cloudinary
# 6. Send email through Gmail SMTP
# 7. Mark request SENT
#
# So the frontend does NOT need to call /send separately.
# ==========================================================

@router.post(
    "",
)
async def create_legal_request(
    data: ManualLegalRequest,
    db: Session = Depends(get_db),
):
    """
    Create and immediately send a legal request.

    Used by the IO Case View.
    """

    # ======================================================
    # 1. BASIC VALIDATION
    # ======================================================

    if not data.case_id.strip():

        raise HTTPException(
            status_code=400,
            detail="Case ID is required.",
        )

    if not data.agency_type.strip():

        raise HTTPException(
            status_code=400,
            detail="Agency type is required.",
        )

    if not data.agency_name.strip():

        raise HTTPException(
            status_code=400,
            detail="Agency name is required.",
        )

    if not str(
        data.recipient_email
    ).strip():

        raise HTTPException(
            status_code=400,
            detail="Recipient email is required.",
        )

    if not data.subject.strip():

        raise HTTPException(
            status_code=400,
            detail="Subject is required.",
        )

    if not data.message.strip():

        raise HTTPException(
            status_code=400,
            detail="Request details are required.",
        )

    # ======================================================
    # 2. VERIFY CASE + COMPLAINT
    # ======================================================

    case, complaint = (
        get_case_and_verify_complaint(
            db=db,
            case_id=data.case_id,
            complaint_id=data.complaint_id,
        )
    )

    # ======================================================
    # 3. CREATE DATABASE REQUEST
    # ======================================================

    request = LegalRequest(

        request_id=str(
            uuid.uuid4()
        ),

        case_id=case["case_id"],

        complaint_id=case["complaint_id"],

        agency_type=data.agency_type.strip(),

        agency_name=data.agency_name.strip(),

        recipient_email=str(
            data.recipient_email
        ).strip(),

        subject=data.subject.strip(),

        document_url=None,

        status="GENERATING",

        created_at=datetime.now(
            timezone.utc
        ),

        updated_at=datetime.now(
            timezone.utc
        ),
    )

    db.add(request)

    db.commit()

    db.refresh(request)

    # ======================================================
    # 4. GENERATE PDF
    # ======================================================

    pdf_path = None

    try:

        pdf_path = (
            generate_legal_request_pdf(

                request_id=
                    request.request_id,

                subject=
                    data.subject.strip(),

                body=
                    data.message.strip(),
            )
        )

    except Exception as e:

        db.rollback()

        # Re-fetch the request because rollback
        # invalidates the current transaction.

        failed_request = (
            db.query(LegalRequest)
            .filter(
                LegalRequest.request_id
                == request.request_id
            )
            .first()
        )

        if failed_request:

            failed_request.status = (
                "GENERATION_FAILED"
            )

            failed_request.updated_at = (
                datetime.now(timezone.utc)
            )

            db.commit()

        raise HTTPException(
            status_code=500,
            detail=(
                "Legal request was created, "
                "but PDF generation failed: "
                f"{str(e)}"
            ),
        )

    # ======================================================
    # 5. UPLOAD PDF TO CLOUDINARY
    # ======================================================

    try:

        upload_result = (
            upload_legal_request_pdf(
                file_path=pdf_path,
                request_id=
                    request.request_id,
            )
        )

    except Exception as e:

        request.status = (
            "UPLOAD_FAILED"
        )

        request.updated_at = (
            datetime.now(timezone.utc)
        )

        db.commit()

        raise HTTPException(
            status_code=500,
            detail=(
                "PDF was generated, "
                "but Cloudinary upload failed: "
                f"{str(e)}"
            ),
        )

    finally:

        # --------------------------------------------------
        # DELETE TEMPORARY PDF
        # --------------------------------------------------

        if pdf_path:

            try:

                if os.path.exists(
                    pdf_path
                ):

                    os.unlink(
                        pdf_path
                    )

            except Exception as cleanup_error:

                print(
                    "Warning: could not delete "
                    "temporary legal request PDF:",
                    cleanup_error,
                )

    # ======================================================
    # 6. SAVE CLOUDINARY URL
    # ======================================================

    request.document_url = (
        upload_result["url"]
    )

    request.status = "GENERATED"

    request.updated_at = (
        datetime.now(timezone.utc)
    )

    db.commit()

    db.refresh(request)

    # ======================================================
    # 7. PREPARE EMAIL
    # ======================================================

    email_body = f"""
Dear Sir/Madam,

Please find attached the official legal information
request related to the investigation.

Case Number:
{case["case_number"] or case["case_id"]}

Case Number:
{case["case_number"]}

Case ID:
{case["case_id"]}

Legal Request ID:
{request.request_id}

Complaint ID:
{case["complaint_id"]}

Agency:
{data.agency_name}

Subject:
{data.subject}

Request Details:

{data.message}

Please process the request through the appropriate
official communication channel.

Regards,

Investigating Officer
CrimeOS
""".strip()

    # ======================================================
    # 8. DOWNLOAD PDF FROM CLOUDINARY
    #
    # We send the generated PDF as an attachment.
    # ======================================================

    temp_email_path = None

    try:

        response = requests.get(
            request.document_url,
            timeout=30,
        )

        response.raise_for_status()

        # --------------------------------------------------
        # SAVE TEMPORARY EMAIL PDF
        # --------------------------------------------------

        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=".pdf",
        ) as temp_file:

            temp_file.write(
                response.content
            )

            temp_email_path = (
                temp_file.name
            )

        # ==================================================
        # 9. SEND EMAIL
        # ==================================================

        await send_email(

            recipient_email=
                request.recipient_email,

            subject=
                request.subject,

            body=
                email_body,

            attachment_path=
                temp_email_path,
        )

        # ==================================================
        # 10. EMAIL SUCCESS
        # ==================================================

        request.status = "SENT"

        request.sent_at = (
            datetime.now(timezone.utc)
        )

        request.updated_at = (
            datetime.now(timezone.utc)
        )

        db.commit()

        db.refresh(request)

        return {

            "success": True,

            "message":
                "Legal request sent successfully.",

            "request_id":
                request.request_id,

            "case_id":
                request.case_id,

            "complaint_id":
                request.complaint_id,

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

        # --------------------------------------------------
        # PDF DOWNLOAD FAILED
        # --------------------------------------------------

        request.status = (
            "EMAIL_FAILED"
        )

        request.updated_at = (
            datetime.now(timezone.utc)
        )

        db.commit()

        print(
            "LEGAL REQUEST PDF DOWNLOAD ERROR:",
            repr(e),
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Legal request PDF was generated "
                "but could not be downloaded "
                "for email attachment: "
                f"{str(e)}"
            ),
        )

    except Exception as e:

        # --------------------------------------------------
        # EMAIL FAILED
        # --------------------------------------------------

        request.status = (
            "EMAIL_FAILED"
        )

        request.updated_at = (
            datetime.now(timezone.utc)
        )

        db.commit()

        print(
            "LEGAL REQUEST EMAIL ERROR:",
            repr(e),
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Legal request was created, "
                "but the email could not be sent: "
                f"{str(e)}"
            ),
        )

    finally:

        # --------------------------------------------------
        # DELETE TEMPORARY EMAIL PDF
        # --------------------------------------------------

        if temp_email_path:

            try:

                if os.path.exists(
                    temp_email_path
                ):

                    os.unlink(
                        temp_email_path
                    )

            except Exception as cleanup_error:

                print(
                    "Warning: could not delete "
                    "temporary email PDF:",
                    cleanup_error,
                )


# ==========================================================
# GENERATE LEGAL REQUEST
#
# EXISTING AI-BASED WORKFLOW
#
# Kept separately so your existing functionality
# continues to work.
# ==========================================================

@router.post("/generate")
def generate_request(
    data: LegalRequestGenerate,
    db: Session = Depends(get_db),
):
    # ======================================================
    # 1. FETCH CASE
    # ======================================================

    case = (
        db.execute(
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
        )
        .mappings()
        .first()
    )

    if not case:

        raise HTTPException(
            status_code=404,
            detail="Case not found",
        )

    # ======================================================
    # 2. FETCH COMPLAINT
    # ======================================================

    complaint = (
        db.query(Complaint)
        .filter(
            Complaint.complaint_id
            == case["complaint_id"]
        )
        .first()
    )

    if not complaint:

        raise HTTPException(
            status_code=404,
            detail=(
                "Complaint linked to "
                "this case was not found"
            ),
        )

    complaint_id = (
        case["complaint_id"]
    )

    # ======================================================
    # 3. FETCH VICTIMS
    # ======================================================

    victims = (
        db.query(Victim)
        .filter(
            Victim.complaint_id
            == complaint_id
        )
        .all()
    )

    # ======================================================
    # 4. FETCH SUSPECTS
    # ======================================================

    suspects = (
        db.query(Suspect)
        .filter(
            Suspect.complaint_id
            == complaint_id
        )
        .all()
    )

    # ======================================================
    # 5. FETCH EVIDENCE
    # ======================================================

    evidence = (
        db.query(Evidence)
        .filter(
            Evidence.complaint_id
            == complaint_id
        )
        .all()
    )

    # ======================================================
    # 6. BUILD COMPLAINT CONTEXT
    # ======================================================

    complaint_context = {

        "complaint_id":
            complaint.complaint_id,

        "complaint_number":
            complaint.complaint_number,

        "complaint_type":
            complaint.complaint_type,

        "crime_category":
            complaint.crime_category,

        "crime_subcategory":
            complaint.crime_subcategory,

        "priority":
            complaint.priority,

        "incident_date": (
            complaint.incident_date.isoformat()
            if complaint.incident_date
            else None
        ),

        "incident_time": (
            complaint.incident_time.isoformat()
            if complaint.incident_time
            else None
        ),

        "location":
            complaint.location,

        "description":
            complaint.description,

        "ai_summary":
            complaint.ai_summary,

        "officer_notes":
            complaint.officer_notes,

        "victims": [

            {
                "victim_id":
                    victim.victim_id,

                "name":
                    victim.name,

                "contact":
                    victim.contact,

                "relationship":
                    victim.relationship,

                "statement":
                    victim.statement,

                "type":
                    victim.type,

                "description":
                    victim.description,

                "address":
                    victim.address,
            }

            for victim in victims
        ],

        "suspects": [

            {
                "suspect_id":
                    suspect.suspect_id,

                "name":
                    suspect.name,

                "contact":
                    suspect.contact,

                "description":
                    suspect.description,

                "status":
                    suspect.status,

                "type":
                    suspect.type,

                "address":
                    suspect.address,
            }

            for suspect in suspects
        ],

        "documents": [],

        "evidence": [

            {
                "evidence_id":
                    item.evidence_id,

                "evidence_type":
                    item.evidence_type,

                "file_name":
                    item.file_name,

                "file_type":
                    item.file_type,

                "cloudinary_url":
                    item.cloudinary_url,

                "summary":
                    item.summary,

                "extracted_text": (
                    item.extracted_text[:5000]
                    if item.extracted_text
                    else None
                ),

                "extraction_data":
                    item.extraction_data,
            }

            for item in evidence
        ],
    }

    # ======================================================
    # 7. AI ANALYSIS
    # ======================================================

    try:

        operator_requirements = (
            analyze_operator_request(

                agency_type=
                    data.agency_type,

                agency_name=
                    data.agency_name,

                request_type=
                    data.request_type,

                case_number=(
                    case["case_number"]
                    or case["case_id"]
                ),

                complaint_context=
                    complaint_context,
            )
        )

    except AIServiceError as e:

        print(
            "AI OPERATOR REQUEST ERROR:",
            repr(e),
        )

        raise HTTPException(
            status_code=500,
            detail=str(e),
        )

    except Exception as e:

        print(
            "UNEXPECTED AI ERROR:",
            repr(e),
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to determine "
                "operator information requirements."
            ),
        )

    # ======================================================
    # 8. GENERATE OFFICIAL REQUEST
    # ======================================================

    try:

        generated = (
            generate_legal_request(

                agency_type=
                    data.agency_type,

                agency_name=
                    data.agency_name,

                request_type=
                    data.request_type,

                case_number=(
                    case["case_number"]
                    or case["case_id"]
                ),

                police_station=
                    case["police_station"],

                district=
                    case["district"],

                fir_no=
                    case["fir_no"],

                fir_year=
                    case["fir_year"],

                case_title=
                    case["title"],

                case_description=
                    case["description"],

                complaint_context=
                    complaint_context,

                operator_requirements=
                    operator_requirements,
            )
        )

    except ValueError as e:

        raise HTTPException(
            status_code=400,
            detail=str(e),
        )

    except Exception as e:

        print(
            "LEGAL REQUEST GENERATION ERROR:",
            repr(e),
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to generate legal request: "
                f"{str(e)}"
            ),
        )

    # ======================================================
    # 9. CREATE REQUEST
    # ======================================================

    request = LegalRequest(

        request_id=str(
            uuid.uuid4()
        ),

        case_id=case["case_id"],

        complaint_id=
            case["complaint_id"],

        agency_type=
            data.agency_type,

        agency_name=
            data.agency_name,

        recipient_email=
            data.recipient_email,

        subject=
            generated["subject"],

        document_url=None,

        status="GENERATED",

        created_at=datetime.now(
            timezone.utc
        ),

        updated_at=datetime.now(
            timezone.utc
        ),
    )

    db.add(request)

    db.commit()

    db.refresh(request)

    # ======================================================
    # 10. GENERATE PDF
    # ======================================================

    pdf_path = None

    try:

        pdf_path = (
            generate_legal_request_pdf(

                request_id=
                    request.request_id,

                subject=
                    generated["subject"],

                body=
                    generated["body"],
            )
        )

    except Exception as e:

        request.status = (
            "GENERATION_FAILED"
        )

        request.updated_at = (
            datetime.now(timezone.utc)
        )

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
    # 11. UPLOAD PDF
    # ======================================================

    try:

        upload_result = (
            upload_legal_request_pdf(

                file_path=pdf_path,

                request_id=
                    request.request_id,
            )
        )

    except Exception as e:

        request.status = (
            "UPLOAD_FAILED"
        )

        request.updated_at = (
            datetime.now(timezone.utc)
        )

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

        if pdf_path:

            try:

                if os.path.exists(
                    pdf_path
                ):

                    os.unlink(
                        pdf_path
                    )

            except Exception:
                pass

    # ======================================================
    # 12. SAVE URL
    # ======================================================

    request.document_url = (
        upload_result["url"]
    )

    request.status = "GENERATED"

    request.updated_at = (
        datetime.now(timezone.utc)
    )

    db.commit()

    db.refresh(request)

    # ======================================================
    # 13. RETURN
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

        "operator_requirements":
            operator_requirements,
    }


# ==========================================================
# SEND EXISTING GENERATED REQUEST
#
# This keeps your OLD workflow working.
#
# /generate
#      ↓
# /{request_id}/send
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

    request = (
        db.query(LegalRequest)
        .filter(
            LegalRequest.request_id
            == request_id
        )
        .first()
    )

    if not request:

        raise HTTPException(
            status_code=404,
            detail="Legal request not found",
        )

    # ======================================================
    # 2. RECIPIENT
    # ======================================================

    if not request.recipient_email:

        raise HTTPException(
            status_code=400,
            detail=(
                "Recipient email is not configured"
            ),
        )

    # ======================================================
    # 3. DOCUMENT
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
    # 4. DUPLICATE
    # ======================================================

    if request.status in [
        "SENT",
        "RESPONSE_PENDING",
    ]:

        raise HTTPException(
            status_code=400,
            detail=(
                "This legal request has "
                "already been sent"
            ),
        )

    temp_path = None

    try:

        # ==================================================
        # 5. DOWNLOAD PDF
        # ==================================================

        response = requests.get(
            request.document_url,
            timeout=30,
        )

        response.raise_for_status()

        # ==================================================
        # 6. TEMP FILE
        # ==================================================

        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=".pdf",
        ) as temp_file:

            temp_file.write(
                response.content
            )

            temp_path = (
                temp_file.name
            )

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

Please process the request through the appropriate
official communication channel.

Regards,

Investigating Officer
CrimeOS
""".strip()

        # ==================================================
        # 8. SEND
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
        # 9. UPDATE STATUS
        # ==================================================

        request.status = "SENT"

        request.sent_at = (
            datetime.now(timezone.utc)
        )

        request.updated_at = (
            datetime.now(timezone.utc)
        )

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

        request.status = (
            "EMAIL_FAILED"
        )

        request.updated_at = (
            datetime.now(timezone.utc)
        )

        db.commit()

        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to download legal "
                "request PDF: "
                f"{str(e)}"
            ),
        )

    except Exception as e:

        request.status = (
            "EMAIL_FAILED"
        )

        request.updated_at = (
            datetime.now(timezone.utc)
        )

        db.commit()

        print(
            "LEGAL REQUEST EMAIL ERROR:",
            repr(e),
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to send legal request: "
                f"{str(e)}"
            ),
        )

    finally:

        if temp_path:

            try:

                if os.path.exists(
                    temp_path
                ):

                    os.unlink(
                        temp_path
                    )

            except Exception as cleanup_error:

                print(
                    "Warning: could not delete "
                    "temporary email PDF:",
                    cleanup_error,
                )


# ==========================================================
# GET ALL REQUESTS FOR CASE
# ==========================================================

@router.get(
    "/case/{case_id}",
    response_model=list[
        LegalRequestResponse
    ],
)
def get_case_legal_requests(
    case_id: str,
    db: Session = Depends(get_db),
):

    return (
        db.query(LegalRequest)
        .filter(
            LegalRequest.case_id
            == case_id
        )
        .order_by(
            LegalRequest.created_at.desc()
        )
        .all()
    )


# ==========================================================
# TEST GMAIL RESPONSES
# ==========================================================

@router.get(
    "/test-gmail-responses"
)
def test_gmail_responses():

    try:

        responses = (
            fetch_new_responses(
                limit=20
            )
        )

        return {

            "success": True,

            "count":
                len(responses),

            "responses":
                responses,
        }

    except Exception as e:

        print(
            "GMAIL RESPONSE ERROR:",
            repr(e),
        )

        raise HTTPException(
            status_code=500,
            detail=str(e),
        )


# ==========================================================
# PROCESS GMAIL RESPONSES
# ==========================================================

@router.post(
    "/process-gmail-responses"
)
def process_gmail_response_route(
    db: Session = Depends(get_db),
):

    try:

        result = (
            process_gmail_responses(
                db=db,
                limit=20,
            )
        )

        return result

    except Exception as e:

        print(
            "GMAIL RESPONSE PROCESSING ERROR:",
            repr(e),
        )

        raise HTTPException(
            status_code=500,
            detail=str(e),
        )


# ==========================================================
# GET SINGLE LEGAL REQUEST
#
# IMPORTANT:
# This route is intentionally at the END.
# ==========================================================

@router.get(
    "/{request_id}",
    response_model=LegalRequestResponse,
)
def get_legal_request(
    request_id: str,
    db: Session = Depends(get_db),
):

    request = (
        db.query(LegalRequest)
        .filter(
            LegalRequest.request_id
            == request_id
        )
        .first()
    )

    if not request:

        raise HTTPException(
            status_code=404,
            detail="Legal request not found",
        )

    return request