import os

import cloudinary
import cloudinary.uploader

from dotenv import load_dotenv


# ==========================================================
# LOAD ENVIRONMENT
# ==========================================================

load_dotenv()


# ==========================================================
# CLOUDINARY CONFIGURATION
# ==========================================================

cloudinary.config(

    cloud_name=os.getenv(
        "CLOUDINARY_CLOUD_NAME"
    ),

    api_key=os.getenv(
        "CLOUDINARY_API_KEY"
    ),

    api_secret=os.getenv(
        "CLOUDINARY_API_SECRET"
    ),

    secure=True,
)


def upload_legal_request_pdf(
    file_path: str,
    request_id: str,
):

    # ======================================================
    # CHECK CONFIGURATION
    # ======================================================

    cloud_name = os.getenv(
        "CLOUDINARY_CLOUD_NAME"
    )

    api_key = os.getenv(
        "CLOUDINARY_API_KEY"
    )

    api_secret = os.getenv(
        "CLOUDINARY_API_SECRET"
    )

    if not cloud_name:
        raise RuntimeError(
            "CLOUDINARY_CLOUD_NAME is not configured"
        )

    if not api_key:
        raise RuntimeError(
            "CLOUDINARY_API_KEY is not configured"
        )

    if not api_secret:
        raise RuntimeError(
            "CLOUDINARY_API_SECRET is not configured"
        )

    # ======================================================
    # UPLOAD
    # ======================================================

    result = cloudinary.uploader.upload(

        file_path,

        resource_type="raw",

        public_id=(
            f"legal_requests/"
            f"legal_request_{request_id}.pdf"
        ),

        overwrite=True,
    )

    # ======================================================
    # RETURN
    # ======================================================

    return {

        "url": result.get(
            "secure_url"
        ),

        "public_id": result.get(
            "public_id"
        ),
    }