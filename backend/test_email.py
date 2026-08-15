import asyncio

from app.services.email_service import send_email


async def main():

    print("================================")
    print("TESTING CRIMEOS EMAIL")
    print("================================")

    try:

        result = await send_email(
            recipient_email="harshini12318@gmail.com",
            subject="CrimeOS SMTP Test",
            body="""
This is a test email from CrimeOS.

If you received this email, Gmail SMTP
is configured correctly.

CrimeOS
""",
        )

        print()
        print("================================")
        print("EMAIL SENT SUCCESSFULLY")
        print("================================")
        print(result)

    except Exception as e:

        print()
        print("================================")
        print("EMAIL FAILED")
        print("================================")
        print(repr(e))


if __name__ == "__main__":
    asyncio.run(main())