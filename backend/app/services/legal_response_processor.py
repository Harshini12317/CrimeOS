from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy.orm import Session

from models.legal_request import LegalRequest

from app.services.gmail_response_service import (
    fetch_new_responses,
)

from app.services.legal_response_analyzer import (
    extract_pdf_text,
    analyze_operator_response,
)


# ==========================================================
# PROCESS GMAIL RESPONSES
# ==========================================================

def process_gmail_responses(
    db: Session,
    limit: int = 20,
) -> dict:
    """
    Read unread Gmail responses, match them to legal_requests,
    analyze attachments using Groq, and save the result.
    """

    # ------------------------------------------------------
    # Read Gmail
    # ------------------------------------------------------

    responses = fetch_new_responses(
        limit=limit
    )

    processed = []
    skipped = []
    errors = []

    # ------------------------------------------------------
    # Process every email
    # ------------------------------------------------------

    for response in responses:

        request_id = (
            response.get(
                "request_id"
            )
        )

        # --------------------------------------------------
        # No CrimeOS request ID
        # --------------------------------------------------

        if not request_id:

            skipped.append({
                "reason": "CrimeOS request ID not found",
                "subject": response.get(
                    "subject"
                ),
                "sender": response.get(
                    "sender"
                ),
            })

            continue

        # --------------------------------------------------
        # Find legal request
        # --------------------------------------------------

        legal_request = (
            db.query(LegalRequest)
            .filter(
                LegalRequest.request_id
                == request_id
            )
            .first()
        )

        if not legal_request:

            skipped.append({
                "request_id": request_id,
                "reason": "Legal request not found",
            })

            continue

        # --------------------------------------------------
        # Prevent duplicate processing
        # --------------------------------------------------

        if (
            legal_request.response_received_at
            is not None
        ):

            skipped.append({
                "request_id": request_id,
                "reason": "Response already processed",
            })

            continue

        try:

            # ==============================================
            # GET ATTACHMENTS
            # ==============================================

            attachments = (
                response.get(
                    "attachments",
                    []
                )
            )

            # ==============================================
            # NO ATTACHMENT
            # ==============================================

            if not attachments:

                # Analyze email body itself
                response_text = (
                    response.get(
                        "body"
                    )
                    or ""
                )

                if not response_text.strip():

                    skipped.append({
                        "request_id": request_id,
                        "reason": "No response body or attachment",
                    })

                    continue

                analysis = (
                    analyze_operator_response(
                        response_text=response_text,
                        request_context={
                            "agency_type":
                                legal_request.agency_type,

                            "agency_name":
                                legal_request.agency_name,

                            "request_type":
                                legal_request.subject,

                            "required_information":
                                [],
                        },
                    )
                )

                legal_request.response_summary = (
                    analysis.get(
                        "summary",
                        "",
                    )
                )

                legal_request.response_data = (
                    analysis
                )

                legal_request.response_file_name = (
                    None
                )

                legal_request.response_file_type = (
                    None
                )

                legal_request.response_document_url = (
                    None
                )

                legal_request.response_received_at = (
                    datetime.now(
                        timezone.utc
                    )
                )

                legal_request.responded_at = (
                    datetime.now(
                        timezone.utc
                    )
                )

                legal_request.status = (
                    "RESPONDED"
                )

                legal_request.updated_at = (
                    datetime.now(
                        timezone.utc
                    )
                )

                db.commit()

                db.refresh(
                    legal_request
                )

                processed.append({
                    "request_id":
                        request_id,

                    "status":
                        "RESPONDED",

                    "source":
                        "email_body",

                    "summary":
                        legal_request.response_summary,
                })

                continue

            # ==============================================
            # FIND SUPPORTED ATTACHMENT
            # ==============================================

            attachment = None

            for item in attachments:

                file_path = Path(
                    item.get(
                        "file_path",
                        ""
                    )
                )

                extension = (
                    file_path.suffix.lower()
                )

                if extension in [
                    ".pdf",
                    ".txt",
                    ".docx",
                    ".xlsx",
                    ".csv",
                ]:

                    attachment = item

                    break

            # ==============================================
            # NO SUPPORTED ATTACHMENT
            # ==============================================

            if not attachment:

                skipped.append({
                    "request_id":
                        request_id,

                    "reason":
                        "No supported response attachment found",
                })

                continue

            # ==============================================
            # CURRENTLY PDF ANALYSIS
            # ==============================================

            file_path = Path(
                attachment.get(
                    "file_path"
                )
            )

            if file_path.suffix.lower() != ".pdf":

                skipped.append({
                    "request_id":
                        request_id,

                    "reason":
                        "Only PDF response analysis is currently enabled",

                    "file_name":
                        attachment.get(
                            "file_name"
                        ),
                })

                continue

            # ==============================================
            # EXTRACT TEXT
            # ==============================================

            response_text = (
                extract_pdf_text(
                    str(file_path)
                )
            )

            # ==============================================
            # ANALYZE USING GROQ
            # ==============================================

            analysis = (
                analyze_operator_response(
                    response_text=response_text,
                    request_context={
                        "agency_type":
                            legal_request.agency_type,

                        "agency_name":
                            legal_request.agency_name,

                        "request_type":
                            legal_request.subject,

                        "required_information":
                            [],
                    },
                )
            )

            # ==============================================
            # SAVE RESPONSE
            # ==============================================

            legal_request.response_summary = (
                analysis.get(
                    "summary",
                    "",
                )
            )

            legal_request.response_data = (
                analysis
            )

            legal_request.response_document_url = (
                str(file_path)
            )

            legal_request.response_file_name = (
                attachment.get(
                    "file_name"
                )
            )

            legal_request.response_file_type = (
                attachment.get(
                    "file_type"
                )
            )

            legal_request.response_received_at = (
                datetime.now(
                    timezone.utc
                )
            )

            legal_request.responded_at = (
                datetime.now(
                    timezone.utc
                )
            )

            legal_request.status = (
                "RESPONDED"
            )

            legal_request.updated_at = (
                datetime.now(
                    timezone.utc
                )
            )

            # ==============================================
            # COMMIT
            # ==============================================

            db.commit()

            db.refresh(
                legal_request
            )

            # ==============================================
            # SUCCESS
            # ==============================================

            processed.append({

                "request_id":
                    request_id,

                "status":
                    "RESPONDED",

                "file_name":
                    attachment.get(
                        "file_name"
                    ),

                "summary":
                    legal_request.response_summary,

                "response_data":
                    legal_request.response_data,
            })

        except Exception as e:

            db.rollback()

            print(
                "LEGAL RESPONSE PROCESSING ERROR:",
                request_id,
                repr(e),
            )

            errors.append({

                "request_id":
                    request_id,

                "error":
                    str(e),
            })

    # ======================================================
    # RETURN RESULT
    # ======================================================

    return {

        "success":
            True,

        "emails_found":
            len(responses),

        "processed":
            processed,

        "skipped":
            skipped,

        "errors":
            errors,
    }