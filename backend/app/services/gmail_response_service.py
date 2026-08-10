import os
import imaplib
import email
import re

from pathlib import Path
from email.header import decode_header
from email.message import Message

from dotenv import load_dotenv


# ==========================================================
# LOAD ENVIRONMENT VARIABLES
# ==========================================================

load_dotenv()


# ==========================================================
# IMAP CONFIGURATION
# ==========================================================

IMAP_HOST = os.getenv(
    "IMAP_HOST",
    "imap.gmail.com",
)

IMAP_PORT = int(
    os.getenv(
        "IMAP_PORT",
        "993",
    )
)

IMAP_USERNAME = os.getenv(
    "IMAP_USERNAME",
)

IMAP_PASSWORD = os.getenv(
    "IMAP_PASSWORD",
)


# ==========================================================
# RESPONSE STORAGE
# ==========================================================

BASE_DIR = Path(
    os.getenv(
        "LEGAL_RESPONSE_DIR",
        "storage/legal_responses",
    )
)

BASE_DIR.mkdir(
    parents=True,
    exist_ok=True,
)


# ==========================================================
# CUSTOM ERROR
# ==========================================================

class GmailResponseError(Exception):
    pass


# ==========================================================
# DECODE EMAIL HEADER
# ==========================================================

def decode_email_header(
    value: str | None,
) -> str:

    if not value:
        return ""

    try:

        decoded_parts = decode_header(
            value
        )

    except Exception:

        return str(value)

    result = []

    for part, encoding in decoded_parts:

        if isinstance(
            part,
            bytes,
        ):

            try:

                result.append(
                    part.decode(
                        encoding
                        or "utf-8",
                        errors="replace",
                    )
                )

            except Exception:

                result.append(
                    part.decode(
                        "utf-8",
                        errors="replace",
                    )
                )

        else:

            result.append(
                str(part)
            )

    return "".join(result)


# ==========================================================
# GET EMAIL BODY
# ==========================================================

def get_email_body(
    message: Message,
) -> str:
    """
    Extract the plain-text body from an email.

    If the email is multipart, text/plain is preferred.
    HTML is used as a fallback.
    """

    # ------------------------------------------------------
    # SIMPLE EMAIL
    # ------------------------------------------------------

    if not message.is_multipart():

        payload = message.get_payload(
            decode=True
        )

        if not payload:
            return ""

        charset = (
            message.get_content_charset()
            or "utf-8"
        )

        try:

            return payload.decode(
                charset,
                errors="replace",
            ).strip()

        except Exception:

            return payload.decode(
                "utf-8",
                errors="replace",
            ).strip()

    # ------------------------------------------------------
    # MULTIPART EMAIL
    # ------------------------------------------------------

    plain_parts = []
    html_parts = []

    for part in message.walk():

        content_type = (
            part.get_content_type()
        )

        disposition = (
            part.get(
                "Content-Disposition",
                "",
            )
        )

        # Never treat attachments as email body.
        if "attachment" in (
            disposition.lower()
        ):

            continue

        payload = part.get_payload(
            decode=True
        )

        if not payload:
            continue

        charset = (
            part.get_content_charset()
            or "utf-8"
        )

        try:

            text = payload.decode(
                charset,
                errors="replace",
            )

        except Exception:

            text = payload.decode(
                "utf-8",
                errors="replace",
            )

        if content_type == "text/plain":

            plain_parts.append(
                text
            )

        elif content_type == "text/html":

            html_parts.append(
                text
            )

    # ------------------------------------------------------
    # Prefer plain text
    # ------------------------------------------------------

    if plain_parts:

        return "\n".join(
            plain_parts
        ).strip()

    # ------------------------------------------------------
    # HTML fallback
    # ------------------------------------------------------

    if html_parts:

        html = "\n".join(
            html_parts
        )

        # Basic HTML cleanup.
        html = re.sub(
            r"<br\s*/?>",
            "\n",
            html,
            flags=re.IGNORECASE,
        )

        html = re.sub(
            r"</p\s*>",
            "\n",
            html,
            flags=re.IGNORECASE,
        )

        html = re.sub(
            r"<[^>]+>",
            "",
            html,
        )

        return html.strip()

    return ""


# ==========================================================
# SANITIZE FILENAME
# ==========================================================

def sanitize_filename(
    filename: str,
) -> str:

    filename = Path(
        filename
    ).name

    # Remove problematic characters.
    filename = re.sub(
        r"[^A-Za-z0-9._()\- ]+",
        "_",
        filename,
    )

    filename = filename.strip()

    if not filename:
        filename = "attachment"

    return filename


# ==========================================================
# SAVE EMAIL ATTACHMENTS
# ==========================================================

def save_attachments(
    message: Message,
    request_id: str,
) -> list[dict]:
    """
    Save all email attachments under:

    storage/legal_responses/<request_id>/

    Returns metadata for every saved attachment.
    """

    request_directory = (
        BASE_DIR / request_id
    )

    request_directory.mkdir(
        parents=True,
        exist_ok=True,
    )

    attachments = []

    for part in message.walk():

        disposition = (
            part.get(
                "Content-Disposition",
                "",
            )
        )

        # --------------------------------------------------
        # Only actual attachments
        # --------------------------------------------------

        if "attachment" not in (
            disposition.lower()
        ):

            continue

        filename = part.get_filename()

        if not filename:
            continue

        filename = decode_email_header(
            filename
        )

        filename = sanitize_filename(
            filename
        )

        payload = part.get_payload(
            decode=True
        )

        if not payload:
            continue

        # --------------------------------------------------
        # Avoid overwriting an existing file
        # --------------------------------------------------

        file_path = (
            request_directory
            / filename
        )

        counter = 1

        while file_path.exists():

            stem = file_path.stem
            suffix = file_path.suffix

            file_path = (
                request_directory
                / f"{stem}_{counter}{suffix}"
            )

            counter += 1

        # --------------------------------------------------
        # Write attachment
        # --------------------------------------------------

        with open(
            file_path,
            "wb",
        ) as file:

            file.write(
                payload
            )

        attachments.append({

            "file_name":
                file_path.name,

            "file_path":
                str(file_path),

            "file_type":
                part.get_content_type(),

            "size":
                len(payload),

        })

    return attachments


# ==========================================================
# EXTRACT CRIMEOS REQUEST ID
# ==========================================================

def extract_request_id(
    subject: str,
    body: str,
) -> str | None:
    """
    Extract the CrimeOS Legal Request ID.

    Expected format:

    CrimeOS Request ID:
    1d21da84-7aae-48ba-abcb-dae4c797fb5e

    or:

    [CrimeOS Request ID: 1d21da84-...]
    """

    combined_text = (
        f"{subject}\n{body}"
    )

    # ------------------------------------------------------
    # First look for explicit CrimeOS Request ID
    # ------------------------------------------------------

    explicit_match = re.search(
        r"CrimeOS\s+"
        r"(?:Legal\s+)?"
        r"Request\s+ID"
        r"\s*[:#\-]?\s*"
        r"([0-9a-fA-F]{8}-"
        r"[0-9a-fA-F]{4}-"
        r"[0-9a-fA-F]{4}-"
        r"[0-9a-fA-F]{4}-"
        r"[0-9a-fA-F]{12})",
        combined_text,
        re.IGNORECASE,
    )

    if explicit_match:

        return explicit_match.group(
            1
        )

    # ------------------------------------------------------
    # Fallback: find any UUID
    #
    # We only use this because your current test email
    # contains the request UUID in the body.
    # ------------------------------------------------------

    uuid_match = re.search(
        r"\b"
        r"[0-9a-fA-F]{8}-"
        r"[0-9a-fA-F]{4}-"
        r"[0-9a-fA-F]{4}-"
        r"[0-9a-fA-F]{4}-"
        r"[0-9a-fA-F]{12}"
        r"\b",
        combined_text,
    )

    if uuid_match:

        return uuid_match.group(
            0
        )

    return None


# ==========================================================
# CONNECT TO GMAIL
# ==========================================================

def connect_to_gmail():
    """
    Connect to Gmail using IMAP.

    Uses the same Gmail App Password as SMTP.
    """

    if not IMAP_USERNAME:

        raise GmailResponseError(
            "IMAP_USERNAME is not configured."
        )

    if not IMAP_PASSWORD:

        raise GmailResponseError(
            "IMAP_PASSWORD is not configured."
        )

    try:

        mail = imaplib.IMAP4_SSL(
            IMAP_HOST,
            IMAP_PORT,
        )

        mail.login(
            IMAP_USERNAME,
            IMAP_PASSWORD,
        )

        return mail

    except Exception as e:

        raise GmailResponseError(
            "Failed to connect to Gmail: "
            f"{str(e)}"
        )


# ==========================================================
# FETCH A SINGLE EMAIL
# ==========================================================

def _fetch_message(
    mail,
    message_id: bytes,
):
    """
    Fetch a complete email from Gmail.
    """

    status, message_data = (
        mail.fetch(
            message_id,
            "(RFC822)",
        )
    )

    if status != "OK":
        return None

    raw_email = None

    for item in message_data:

        if isinstance(
            item,
            tuple,
        ):

            raw_email = item[1]

            break

    if not raw_email:
        return None

    try:

        return email.message_from_bytes(
            raw_email
        )

    except Exception:

        return None


# ==========================================================
# PROCESS ONE EMAIL
# ==========================================================

def _process_message(
    mail,
    message_id: bytes,
    mark_as_read: bool = True,
) -> dict | None:
    """
    Convert a Gmail message into a CrimeOS response.

    Returns None if the email is not a CrimeOS request.
    """

    message = _fetch_message(
        mail,
        message_id,
    )

    if not message:
        return None

    # ------------------------------------------------------
    # Headers
    # ------------------------------------------------------

    subject = decode_email_header(
        message.get(
            "Subject"
        )
    )

    sender = decode_email_header(
        message.get(
            "From"
        )
    )

    recipient = decode_email_header(
        message.get(
            "To"
        )
    )

    message_id_header = (
        message.get(
            "Message-ID"
        )
    )

    in_reply_to = (
        message.get(
            "In-Reply-To"
        )
    )

    # ------------------------------------------------------
    # Body
    # ------------------------------------------------------

    body = get_email_body(
        message
    )

    # ------------------------------------------------------
    # CrimeOS request ID
    # ------------------------------------------------------

    request_id = (
        extract_request_id(
            subject,
            body,
        )
    )

    # ------------------------------------------------------
    # Ignore unrelated email
    # ------------------------------------------------------

    if not request_id:

        return None

    # ------------------------------------------------------
    # Save attachments
    # ------------------------------------------------------

    attachments = (
        save_attachments(
            message,
            request_id,
        )
    )

    # ------------------------------------------------------
    # Mark this CrimeOS email as read
    #
    # We NEVER mark unrelated emails as read.
    # ------------------------------------------------------

    if mark_as_read:

        try:

            mail.store(
                message_id,
                "+FLAGS",
                "\\Seen",
            )

        except Exception as e:

            print(
                "WARNING: Could not mark "
                "CrimeOS email as read:",
                repr(e),
            )

    return {

        "request_id":
            request_id,

        "subject":
            subject,

        "sender":
            sender,

        "recipient":
            recipient,

        "body":
            body,

        "message_id":
            message_id_header,

        "in_reply_to":
            in_reply_to,

        "attachments":
            attachments,

    }


# ==========================================================
# SEARCH CRIMEOS EMAILS
# ==========================================================

def _search_crimeos_messages(
    mail,
) -> list[bytes]:
    """
    Search Gmail for emails containing the CrimeOS
    request identifier.

    This avoids scanning random emails such as:

    - LinkedIn
    - Unstop
    - Google
    - LeetCode
    - Naukri
    """

    status, data = mail.search(
        None,
        "OR",
        "SUBJECT",
        '"CrimeOS Request ID"',
        "BODY",
        '"CrimeOS Request ID"',
    )

    if status != "OK":

        return []

    if not data:

        return []

    if not data[0]:

        return []

    return (
        data[0]
        .split()
    )


# ==========================================================
# FETCH CRIMEOS RESPONSES
# ==========================================================

def fetch_new_responses(
    limit: int = 20,
) -> list[dict]:
    """
    Fetch recent CrimeOS-related emails.

    This function is kept compatible with your existing
    processor:

        fetch_new_responses(limit=20)

    IMPORTANT:

    It no longer reads all unread Gmail emails.

    It only searches for emails containing:

        CrimeOS Request ID
    """

    mail = connect_to_gmail()

    responses = []

    try:

        # --------------------------------------------------
        # Open Inbox
        # --------------------------------------------------

        status, _ = mail.select(
            "INBOX"
        )

        if status != "OK":

            raise GmailResponseError(
                "Could not open Gmail inbox."
            )

        # --------------------------------------------------
        # Search CrimeOS messages
        # --------------------------------------------------

        message_ids = (
            _search_crimeos_messages(
                mail
            )
        )

        # --------------------------------------------------
        # Newest first
        # --------------------------------------------------

        message_ids = message_ids[
            -limit:
        ]

        for message_id in reversed(
            message_ids
        ):

            try:

                result = (
                    _process_message(
                        mail,
                        message_id,
                        mark_as_read=True,
                    )
                )

                if result:

                    responses.append(
                        result
                    )

            except Exception as e:

                print(
                    "ERROR PROCESSING "
                    "GMAIL MESSAGE:",
                    repr(e),
                )

                continue

        return responses

    finally:

        try:

            mail.close()

        except Exception:
            pass

        try:

            mail.logout()

        except Exception:
            pass


# ==========================================================
# FETCH RESPONSES FOR SPECIFIC REQUEST IDS
# ==========================================================

def fetch_responses_for_request_ids(
    request_ids: list[str],
) -> list[dict]:
    """
    Fetch responses only for specific CrimeOS legal
    request IDs.

    This is the preferred function for the final
    database-integrated workflow.

    Example:

        fetch_responses_for_request_ids([
            "1d21da84-7aae-48ba-abcb-dae4c797fb5e"
        ])
    """

    if not request_ids:

        return []

    # ------------------------------------------------------
    # Remove duplicates / empty IDs
    # ------------------------------------------------------

    request_ids = list({
        str(request_id).strip()
        for request_id in request_ids
        if request_id
    })

    if not request_ids:

        return []

    mail = connect_to_gmail()

    responses = []

    try:

        # --------------------------------------------------
        # Open Inbox
        # --------------------------------------------------

        status, _ = mail.select(
            "INBOX"
        )

        if status != "OK":

            raise GmailResponseError(
                "Could not open Gmail inbox."
            )

        # --------------------------------------------------
        # Search each exact request ID
        # --------------------------------------------------

        for request_id in request_ids:

            # ------------------------------------------------
            # Gmail IMAP search for exact request ID
            # ------------------------------------------------

            status, data = mail.search(
                None,
                "OR",
                "SUBJECT",
                request_id,
                "BODY",
                request_id,
            )

            if status != "OK":
                continue

            if not data or not data[0]:
                continue

            message_ids = (
                data[0]
                .split()
            )

            # ------------------------------------------------
            # Newest matching email first
            # ------------------------------------------------

            for message_id in reversed(
                message_ids
            ):

                try:

                    result = (
                        _process_message(
                            mail,
                            message_id,
                            mark_as_read=True,
                        )
                    )

                    if not result:
                        continue

                    # ----------------------------------------
                    # Verify the extracted ID exactly matches
                    # the ID we searched for.
                    # ----------------------------------------

                    if (
                        result["request_id"]
                        != request_id
                    ):

                        continue

                    responses.append(
                        result
                    )

                except Exception as e:

                    print(
                        "ERROR PROCESSING "
                        f"REQUEST {request_id}:",
                        repr(e),
                    )

                    continue

        return responses

    finally:

        try:

            mail.close()

        except Exception:
            pass

        try:

            mail.logout()

        except Exception:
            pass