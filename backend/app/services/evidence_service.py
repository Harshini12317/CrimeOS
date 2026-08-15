import os

import cloudinary
import cloudinary.uploader

from dotenv import load_dotenv


load_dotenv()


# ==========================================================
# CLOUDINARY CONFIGURATION
# ==========================================================

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True,
)


# ==========================================================
# UPLOAD EVIDENCE TO CLOUDINARY
# ==========================================================

def upload_evidence(file, complaint_id: str) -> dict:
    """
    Upload an evidence file to Cloudinary.

    Files are stored under:

        crimeos/complaints/{complaint_id}/evidence

    Returns Cloudinary metadata required by the Evidence DB record.
    """

    if not complaint_id:
        raise ValueError("complaint_id is required.")

    if file is None:
        raise ValueError("Evidence file is required.")

    result = cloudinary.uploader.upload(
        file.file,
        folder=f"crimeos/complaints/{complaint_id}/evidence",
        resource_type="auto",
    )

    return {
        "url": result.get("secure_url"),
        "public_id": result.get("public_id"),
        "resource_type": result.get("resource_type"),
    }