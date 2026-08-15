import os

import cloudinary
import cloudinary.uploader

from dotenv import load_dotenv


load_dotenv()


# ==========================================================
# CLOUDINARY CONFIG
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


# ==========================================================
# UPLOAD PERSON PHOTO
# ==========================================================

def upload_person_photo(
    file,
    complaint_id: str,
    person_type: str,
) -> dict:

    if not complaint_id:
        raise ValueError(
            "complaint_id is required."
        )


    if person_type not in {
        "victim",
        "suspect",
    }:
        raise ValueError(
            "person_type must be victim or suspect."
        )


    if file is None:
        raise ValueError(
            "Photo file is required."
        )


    result = cloudinary.uploader.upload(
        file.file,

        folder=(
            f"crimeos/complaints/"
            f"{complaint_id}/"
            f"{person_type}_photos"
        ),

        resource_type="image",
    )


    return {
        "url":
            result.get(
                "secure_url"
            ),

        "public_id":
            result.get(
                "public_id"
            ),

        "resource_type":
            result.get(
                "resource_type"
            ),
    }