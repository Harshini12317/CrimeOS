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
# FIND LEGAL REQUEST
# ==========================================================

def find_legal_request(
    db: Session,
    identifier: str | None,
):
    """
    Find a LegalRequest using multiple possible identifiers.

    The Gmail parser may return:

        1. legal request ID
        2. case ID
        3. complaint ID

    We try all relevant possibilities.
    """

    if not identifier:
        return None

    identifier = identifier.strip()

    # ------------------------------------------------------
    # 1. ACTUAL LEGAL REQUEST ID
    # ------------------------------------------------------

    legal_request = (
        db.query(LegalRequest)
        .filter(
            LegalRequest.request_id
            == identifier
        )
        .first()
    )

    if legal_request:
        return legal_request

    # ------------------------------------------------------
    # 2. CASE ID
    #
    # This is important for your current emails because
    # the outgoing email currently labels the case ID.
    # ------------------------------------------------------

    legal_request = (
        db.query(LegalRequest)
        .filter(
            LegalRequest.case_id
            == identifier
        )
        .order_by(
            LegalRequest.created_at.desc()
        )
        .first()
    )

    if legal_request:
        return legal_request

    # ------------------------------------------------------
    # 3. COMPLAINT ID
    # ------------------------------------------------------

    legal_request = (
        db.query(LegalRequest)
        .filter(
            LegalRequest.complaint_id
            == identifier
        )
        .order_by(
            LegalRequest.created_at.desc()
        )
        .first()
    )

    return legal_request


# ==========================================================
# PROCESS GMAIL RESPONSES
# ==========================================================

def process_gmail_responses(
    db: Session,
    limit: int = 20,
) -> dict:
    """
    Read Gmail responses, match them to legal requests,
    analyze attachments/email body, and save the result.
    """

    # ------------------------------------------------------
    # READ GMAIL
    # ------------------------------------------------------

    responses = fetch_new_responses(
        limit=limit
    )

    processed = []
    skipped = []
    errors = []

    # ------------------------------------------------------
    # PROCESS EACH EMAIL
    # ------------------------------------------------------

    for response in responses:

        # ==================================================
        # GET IDENTIFIER
        # ==================================================

        request_id = (
            response.get("request_id")
        )

        subject = (
            response.get("subject")
            or ""
        )

        sender = (
            response.get("sender")
            or ""
        )

        body = (
            response.get("body")
            or ""
        )

        # ==================================================
        # NO IDENTIFIER
        # ==================================================

        if not request_id:

            skipped.append({

                "reason":
                    "CrimeOS request ID not found",

                "subject":
                    subject,

                "sender":
                    sender,
            })

            continue

        # ==================================================
        # FIND LEGAL REQUEST
        #
        # We now search by:
        #
        # request_id
        # case_id
        # complaint_id
        # ==================================================

        legal_request = (
            find_legal_request(
                db=db,
                identifier=request_id,
            )
        )

        # ==================================================
        # NOT FOUND
        # ==================================================

        if not legal_request:

            skipped.append({

                "request_id":
                    request_id,

                "reason":
                    "Legal request not found",

                "subject":
                    subject,

                "sender":
                    sender,
            })

            continue

        # ==================================================
        # PREVENT DUPLICATE PROCESSING
        # ==================================================

        if (
            legal_request
            .response_received_at
            is not None
        ):

            skipped.append({

                "request_id":
                    legal_request.request_id,

                "reason":
                    "Response already processed",
            })

            continue

        try:

            # ==================================================
            # GET ATTACHMENTS
            # ==================================================

            attachments = (
                response.get(
                    "attachments",
                    [],
                )
            )

            # ==================================================
            # NO ATTACHMENT
            # ==================================================

            if not attachments:

                response_text = body

                if not response_text.strip():

                    skipped.append({

                        "request_id":
                            legal_request.request_id,

                        "reason":
                            "No response body or attachment",
                    })

                    continue

                # ----------------------------------------------
                # ANALYZE EMAIL BODY
                # ----------------------------------------------

                analysis = (
                    analyze_operator_response(

                        response_text=
                            response_text,

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

                # ----------------------------------------------
                # SAVE RESPONSE
                # ----------------------------------------------

                now = datetime.now(
                    timezone.utc
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
                    now
                )

                legal_request.responded_at = (
                    now
                )

                legal_request.status = (
                    "RESPONDED"
                )

                legal_request.updated_at = (
                    now
                )

                db.commit()

                db.refresh(
                    legal_request
                )

                processed.append({

                    "request_id":
                        legal_request.request_id,

                    "case_id":
                        legal_request.case_id,

                    "status":
                        "RESPONDED",

                    "source":
                        "email_body",

                    "summary":
                        legal_request.response_summary,
                })

                continue

            # ==================================================
            # FIND SUPPORTED ATTACHMENT
            # ==================================================

            attachment = None

            for item in attachments:

                file_path = Path(
                    item.get(
                        "file_path",
                        "",
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

            # ==================================================
            # NO SUPPORTED ATTACHMENT
            # ==================================================

            if not attachment:

                # Even if the attachment isn't supported,
                # we can still process the email body.

                if body.strip():

                    analysis = (
                        analyze_operator_response(

                            response_text=body,

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

                    now = datetime.now(
                        timezone.utc
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

                    legal_request.response_received_at = (
                        now
                    )

                    legal_request.responded_at = (
                        now
                    )

                    legal_request.status = (
                        "RESPONDED"
                    )

                    legal_request.updated_at = (
                        now
                    )

                    db.commit()

                    db.refresh(
                        legal_request
                    )

                    processed.append({

                        "request_id":
                            legal_request.request_id,

                        "case_id":
                            legal_request.case_id,

                        "status":
                            "RESPONDED",

                        "source":
                            "email_body",

                        "summary":
                            legal_request.response_summary,
                    })

                    continue

                skipped.append({

                    "request_id":
                        legal_request.request_id,

                    "reason":
                        "No supported response attachment found",
                })

                continue

            # ==================================================
            # CURRENTLY PDF ANALYSIS
            # ==================================================

            file_path = Path(
                attachment.get(
                    "file_path",
                    "",
                )
            )

            if file_path.suffix.lower() != ".pdf":

                skipped.append({

                    "request_id":
                        legal_request.request_id,

                    "reason":
                        "Only PDF response analysis is currently enabled",

                    "file_name":
                        attachment.get(
                            "file_name"
                        ),
                })

                continue

            # ==================================================
            # CHECK FILE EXISTS
            # ==================================================

            if not file_path.exists():

                raise FileNotFoundError(
                    f"Response attachment not found: "
                    f"{file_path}"
                )

            # ==================================================
            # EXTRACT PDF TEXT
            # ==================================================

            response_text = (
                extract_pdf_text(
                    str(file_path)
                )
            )

            # ==================================================
            # IF PDF HAS NO TEXT
            # ==================================================

            if not response_text.strip():

                response_text = body

            # ==================================================
            # ANALYZE USING GROQ
            # ==================================================

            analysis = (
                analyze_operator_response(

                    response_text=
                        response_text,

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

            # ==================================================
            # SAVE RESPONSE
            # ==================================================

            now = datetime.now(
                timezone.utc
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
                now
            )

            legal_request.responded_at = (
                now
            )

            legal_request.status = (
                "RESPONDED"
            )

            legal_request.updated_at = (
                now
            )

            # ==================================================
            # COMMIT
            # ==================================================

            db.commit()

            db.refresh(
                legal_request
            )

            # ==================================================
            # SUCCESS
            # ==================================================

            processed.append({

                "request_id":
                    legal_request.request_id,

                "case_id":
                    legal_request.case_id,

                "complaint_id":
                    legal_request.complaint_id,

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