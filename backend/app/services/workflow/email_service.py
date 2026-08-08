import os
import smtplib
from email.message import EmailMessage
from io import BytesIO


class EmailService:

    def __init__(self):

        self.smtp_server = os.getenv("SMTP_SERVER")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.sender_email = os.getenv("SMTP_EMAIL")
        self.sender_password = os.getenv("SMTP_PASSWORD")

    def send_request_email(
        self,
        recipient: str,
        subject: str,
        document: BytesIO,
        filename: str
    ):

        message = EmailMessage()

        message["Subject"] = subject
        message["From"] = self.sender_email
        message["To"] = recipient

        message.set_content(
            """
Dear Sir/Madam,

Please find the attached legal request issued by the Investigating Officer.

Kindly process the request at the earliest.

Regards,
CrimeOS
Ahmedabad Police
"""
        )

        document.seek(0)

        message.add_attachment(
            document.read(),
            maintype="application",
            subtype="vnd.openxmlformats-officedocument.wordprocessingml.document",
            filename=filename
        )

        with smtplib.SMTP(
            self.smtp_server,
            self.smtp_port
        ) as smtp:

            smtp.starttls()

            smtp.login(
                self.sender_email,
                self.sender_password
            )

            smtp.send_message(message)

        return True