import os
import logging
from pathlib import Path
from email.message import EmailMessage

import aiosmtplib
from dotenv import load_dotenv


# ==========================================================
# LOAD ENVIRONMENT VARIABLES
# ==========================================================

load_dotenv()


# ==========================================================
# LOGGER
# ==========================================================

logger = logging.getLogger(__name__)


# ==========================================================
# SMTP CONFIGURATION
# ==========================================================

SMTP_HOST = os.getenv(
    "SMTP_HOST",
    "smtp.gmail.com",
)

SMTP_PORT = int(
    os.getenv(
        "SMTP_PORT",
        "587",
    )
)

SMTP_USERNAME = os.getenv(
    "SMTP_USERNAME",
)

SMTP_PASSWORD = os.getenv(
    "SMTP_PASSWORD",
)

SMTP_FROM = (
    os.getenv("SMTP_FROM")
    or SMTP_USERNAME
)


# ==========================================================
# SEND EMAIL
# ==========================================================

async def send_email(
    recipient_email: str,
    subject: str,
    body: str,
    attachment_path: str | None = None,
):
    """
    Send an email using Gmail SMTP.

    Gmail:
        smtp.gmail.com
        port 587
        STARTTLS
        Gmail App Password
    """

    # ------------------------------------------------------
    # VALIDATE RECIPIENT
    # ------------------------------------------------------

    if not recipient_email:
        raise ValueError(
            "Recipient email is empty."
        )

    # ------------------------------------------------------
    # VALIDATE SMTP CONFIGURATION
    # ------------------------------------------------------

    if not SMTP_HOST:
        raise RuntimeError(
            "SMTP_HOST is not configured."
        )

    if not SMTP_USERNAME:
        raise RuntimeError(
            "SMTP_USERNAME is not configured."
        )

    if not SMTP_PASSWORD:
        raise RuntimeError(
            "SMTP_PASSWORD is not configured."
        )

    if not SMTP_FROM:
        raise RuntimeError(
            "SMTP_FROM is not configured."
        )

    # ------------------------------------------------------
    # DEBUG CONFIGURATION
    #
    # NEVER print SMTP_PASSWORD.
    # ------------------------------------------------------

    logger.info(
        "Preparing email: from=%s to=%s subject=%s",
        SMTP_FROM,
        recipient_email,
        subject,
    )

    logger.info(
        "SMTP server: %s:%s",
        SMTP_HOST,
        SMTP_PORT,
    )

    # ------------------------------------------------------
    # CREATE EMAIL
    # ------------------------------------------------------

    message = EmailMessage()

    message["From"] = SMTP_FROM
    message["To"] = recipient_email
    message["Subject"] = subject

    message.set_content(body)

    # ------------------------------------------------------
    # ATTACH PDF
    # ------------------------------------------------------

    if attachment_path:

        path = Path(
            attachment_path
        )

        logger.info(
            "Attaching PDF: %s",
            path,
        )

        if not path.exists():
            raise FileNotFoundError(
                f"Attachment not found: {path}"
            )

        if not path.is_file():
            raise FileNotFoundError(
                f"Attachment is not a file: {path}"
            )

        with path.open(
            "rb"
        ) as file:

            file_data = file.read()

        if not file_data:
            raise ValueError(
                f"Attachment is empty: {path}"
            )

        message.add_attachment(
            file_data,
            maintype="application",
            subtype="pdf",
            filename=path.name,
        )

        logger.info(
            "PDF attached successfully: %s bytes",
            len(file_data),
        )

    # ------------------------------------------------------
    # SEND EMAIL
    # ------------------------------------------------------

    try:

        logger.info(
            "Connecting to Gmail SMTP..."
        )

        result = await aiosmtplib.send(
            message,
            hostname=SMTP_HOST,
            port=SMTP_PORT,
            username=SMTP_USERNAME,
            password=SMTP_PASSWORD,
            start_tls=True,
            timeout=30,
        )

        # --------------------------------------------------
        # IMPORTANT
        #
        # Only return success after aiosmtplib.send()
        # completes without an exception.
        # --------------------------------------------------

        logger.info(
            "Email accepted by SMTP server. "
            "Recipient=%s",
            recipient_email,
        )

        logger.debug(
            "SMTP result: %s",
            result,
        )

        return True

    except Exception as e:

        logger.exception(
            "EMAIL SEND FAILED: %s",
            str(e),
        )

        raise RuntimeError(
            f"SMTP email sending failed: {str(e)}"
        ) from e