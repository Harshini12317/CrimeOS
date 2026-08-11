import os
import tempfile
import uuid
from datetime import datetime

import requests

from fastapi import APIRouter, Depends, HTTPException
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

from app.services.ai_service import (
    analyze_operator_request,
    AIServiceError,
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

from app.services.gmail_response_service import (
    fetch_new_responses,
)

from app.services.legal_response_processor import (
    process_gmail_responses,
)


# ==========================================================
# ROUTER
# ==========================================================

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
    """
    Create a legal request manually.

    This endpoint only creates the database record.
    PDF generation/email sending are handled separately.
    """

    # ======================================================
    # 1. VERIFY COMPLAINT
    # ======================================================

    complaint = (
        db.query(Complaint)
        .filter(
            Complaint.complaint_id
            == data.complaint_id
        )
        .first()
    )

    if not complaint:
        raise HTTPException(
            status_code=404,
            detail="Complaint not found",
        )

    # ======================================================
    # 2. VERIFY CASE
    # ======================================================

    case = (
        db.execute(
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
    # 3. VERIFY CASE -> COMPLAINT
    # ======================================================

    if str(case["complaint_id"]) != str(
        data.complaint_id
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "The selected case does not "
                "belong to the selected complaint."
            ),
        )

    # ======================================================
    # 4. CREATE REQUEST
    # ======================================================

    now = datetime.utcnow()

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
        created_at=now,
        updated_at=now,
    )

    db.add(request)
    db.commit()
    db.refresh(request)

    return request


# ==========================================================
# GENERATE LEGAL REQUEST
# ==========================================================

@router.post("/generate")
def generate_request(
    data: LegalRequestGenerate,
    db: Session = Depends(get_db),
):
    """
    Generate a legal request using:

        Case
          ↓
        Complaint
          ↓
        Victims
          ↓
        Suspects
          ↓
        Evidence
          ↓
        AI
          ↓
        Minimum required operator information
          ↓
        Official request
          ↓
        PDF
          ↓
        Cloudinary
          ↓
        Database
    """

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
                "Complaint linked to this case "
                "was not found"
            ),
        )

    complaint_id = case["complaint_id"]

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
    # 6. BUILD INTERNAL COMPLAINT CONTEXT
    #
    # IMPORTANT:
    #
    # This context is used internally by the AI.
    #
    # We do NOT dump the complete complaint into the
    # operator email.
    # ======================================================

    complaint_context = {
        # --------------------------------------------------
        # BASIC COMPLAINT
        # --------------------------------------------------

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

        # --------------------------------------------------
        # VICTIMS
        # --------------------------------------------------

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

        # --------------------------------------------------
        # SUSPECTS
        # --------------------------------------------------

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

        # --------------------------------------------------
        # DOCUMENTS
        #
        # No Document model is imported in this route.
        # Therefore we intentionally do not fabricate data.
        # --------------------------------------------------

        "documents": [],

        # --------------------------------------------------
        # EVIDENCE
        # --------------------------------------------------

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

                # Limit text sent to AI.
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
    #
    # Determine the minimum information required from
    # THIS specific operator.
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

        generated = generate_legal_request(

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
    # 9. CREATE DATABASE RECORD
    # ======================================================

    now = datetime.utcnow()

    request = LegalRequest(
        request_id=str(uuid.uuid4()),

        case_id=
            case["case_id"],

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

        created_at=now,

        updated_at=now,
    )

    db.add(request)
    db.commit()
    db.refresh(request)

    # ======================================================
    # 10. GENERATE PDF
    # ======================================================

    pdf_path = None

    try:

        pdf_path = generate_legal_request_pdf(

            request_id=
                request.request_id,

            subject=
                generated["subject"],

            body=
                generated["body"],
        )

    except Exception as e:

        db.rollback()

        request.status = "GENERATION_FAILED"
        request.updated_at = datetime.utcnow()

        db.add(request)
        db.commit()

        print(
            "LEGAL REQUEST PDF ERROR:",
            repr(e),
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Legal request was created "
                "but PDF generation failed: "
                f"{str(e)}"
            ),
        )

    # ======================================================
    # 11. UPLOAD PDF TO CLOUDINARY
    # ======================================================

    try:

        upload_result = (
            upload_legal_request_pdf(

                file_path=
                    pdf_path,

                request_id=
                    request.request_id,
            )
        )

    except Exception as e:

        request.status = "UPLOAD_FAILED"
        request.updated_at = datetime.utcnow()

        db.commit()

        print(
            "LEGAL REQUEST CLOUDINARY ERROR:",
            repr(e),
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "PDF was generated but "
                "Cloudinary upload failed: "
                f"{str(e)}"
            ),
        )

    finally:

        # --------------------------------------------------
        # Delete temporary local PDF
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
                    "temporary PDF:",
                    cleanup_error,
                )

    # ======================================================
    # 12. SAVE CLOUDINARY URL
    # ======================================================

    request.document_url = (
        upload_result["url"]
    )

    request.status = "GENERATED"

    request.updated_at = datetime.utcnow()

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
# SEND LEGAL REQUEST BY EMAIL
# ==========================================================

@router.post("/{request_id}/send")
async def send_legal_request(
    request_id: str,
    db: Session = Depends(get_db),
):
    """
    Send generated legal request to the external agency.

    The email contains:
        - Case ID
        - Complaint ID
        - Agency
        - Subject
        - Generated PDF

    It does NOT send the complete complaint details
    directly in the email.
    """

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
    # 2. CHECK EMAIL
    # ======================================================

    if not request.recipient_email:

        raise HTTPException(
            status_code=400,
            detail=(
                "Recipient email is not configured"
            ),
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
        # 6. SAVE TEMPORARY PDF
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
        #
        # Keep this minimal.
        # Detailed complaint information stays in
        # CrimeOS / attached official document.
        # ==================================================

        email_body = f"""
Dear Sir/Madam,

Please find attached the official legal information
request related to the investigation.

CrimeOS Request ID:
{request.request_id}

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
        # 9. UPDATE STATUS
        # ==================================================

        request.status = "SENT"

        request.sent_at = datetime.utcnow()

        request.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(request)

        # ==================================================
        # 10. RETURN
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

        print(
            "LEGAL REQUEST PDF DOWNLOAD ERROR:",
            repr(e),
        )

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

        # ==================================================
        # DELETE TEMPORARY PDF
        # ==================================================

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
# GET ALL LEGAL REQUESTS FOR A CASE
# ==========================================================

@router.get(
    "/case/{case_id}",
    response_model=list[LegalRequestResponse],
)
def get_case_legal_requests(
    case_id: str,
    db: Session = Depends(get_db),
):
    """
    Return all legal requests belonging to one case.

    Used by:

        IO Case Details Page

    This includes:
        - Request information
        - Sent status
        - Response information
        - AI response summary
        - AI response data
    """

    # ======================================================
    # VERIFY CASE EXISTS
    # ======================================================

    case_exists = (
        db.execute(
            text(
                """
                SELECT case_id
                FROM cases
                WHERE case_id = :case_id
                LIMIT 1
                """
            ),
            {
                "case_id": case_id,
            },
        )
        .first()
    )

    if not case_exists:

        raise HTTPException(
            status_code=404,
            detail="Case not found",
        )

    # ======================================================
    # GET REQUESTS
    # ======================================================

    requests_for_case = (
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

    return requests_for_case


# ==========================================================
# TEST GMAIL RESPONSES
# ==========================================================

@router.get(
    "/test-gmail-responses"
)
def test_gmail_responses():
    """
    Development/testing endpoint.

    Searches Gmail for CrimeOS-related emails.

    It does not modify legal_requests.
    """

    try:

        responses = fetch_new_responses(
            limit=20
        )

        return {
            "success": True,

            "emails_found":
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
    """
    Read Gmail responses, match them to legal_requests,
    extract attachments, analyze them with AI, and update
    the legal_requests table.
    """

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
# ==========================================================

@router.get(
    "/{request_id}",
    response_model=LegalRequestResponse,
)
def get_legal_request(
    request_id: str,
    db: Session = Depends(get_db),
):
    """
    Get one legal request by request ID.
    """

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