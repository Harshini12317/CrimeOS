from fastapi import (
    APIRouter,
    HTTPException
)

from pydantic import BaseModel

from app.services.email_service import (
    send_email
)


router = APIRouter(
    prefix="/api/email-test",
    tags=["Email Test"]
)


# ==========================================================
# REQUEST SCHEMA
# ==========================================================

class EmailTestRequest(BaseModel):

    recipient_email: str


# ==========================================================
# SEND TEST EMAIL
# ==========================================================

@router.post("/send")
async def send_test_email(
    data: EmailTestRequest
):

    try:

        await send_email(

            recipient_email=
                data.recipient_email,

            subject=
                "CrimeOS Email Test",

            body=
                """
Hello,

This is a test email from the CrimeOS backend.

The SMTP email service is working correctly.

Regards,
CrimeOS
""".strip()
        )

        return {

            "success": True,

            "message":
                "Test email sent successfully",

            "recipient":
                data.recipient_email
        }

    except Exception as e:

        raise HTTPException(

            status_code=500,

            detail=(
                f"Email sending failed: {str(e)}"
            )
        )