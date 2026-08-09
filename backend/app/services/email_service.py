import os
from pathlib import Path
from email.message import EmailMessage

import aiosmtplib

from dotenv import load_dotenv


# ==========================================================
# LOAD ENVIRONMENT VARIABLES
# ==========================================================

load_dotenv()


# ==========================================================
# SMTP CONFIGURATION
# ==========================================================

SMTP_HOST = os.getenv(
    "SMTP_HOST",
    "smtp.gmail.com"
)

SMTP_PORT = int(
    os.getenv(
        "SMTP_PORT",
        "587"
    )
)

SMTP_USERNAME = os.getenv(
    "SMTP_USERNAME"
)

SMTP_PASSWORD = os.getenv(
    "SMTP_PASSWORD"
)

SMTP_FROM = os.getenv(
    "SMTP_FROM"
) or SMTP_USERNAME


# ==========================================================
# SEND EMAIL
# ==========================================================

async def send_email(
    recipient_email: str,
    subject: str,
    body: str,
    attachment_path: str | None = None
):

    # ------------------------------------------------------
    # Validate SMTP configuration
    # ------------------------------------------------------

    if not SMTP_USERNAME:

        raise RuntimeError(
            "SMTP_USERNAME is not configured"
        )

    if not SMTP_PASSWORD:

        raise RuntimeError(
            "SMTP_PASSWORD is not configured"
        )

    if not SMTP_FROM:

        raise RuntimeError(
            "SMTP_FROM is not configured"
        )

    # ------------------------------------------------------
    # Create email
    # ------------------------------------------------------

    message = EmailMessage()

    message["From"] = SMTP_FROM

    message["To"] = recipient_email

    message["Subject"] = subject

    message.set_content(body)

    # ------------------------------------------------------
    # Attach PDF
    # ------------------------------------------------------

    if attachment_path:

        path = Path(
            attachment_path
        )

        if not path.exists():

            raise FileNotFoundError(
                f"Attachment not found: {path}"
            )

        with open(
            path,
            "rb"
        ) as file:

            file_data = file.read()

        message.add_attachment(

            file_data,

            maintype="application",

            subtype="pdf",

            filename=path.name
        )

    # ------------------------------------------------------
    # Send email
    # ------------------------------------------------------

    await aiosmtplib.send(

        message,

        hostname=SMTP_HOST,

        port=SMTP_PORT,

        start_tls=True,

        username=SMTP_USERNAME,

        password=SMTP_PASSWORD
    )

    return True