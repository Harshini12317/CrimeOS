import cloudinary
import cloudinary.uploader

from dotenv import load_dotenv
import os

load_dotenv()


cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)


def upload_evidence(file, complaint_id: str):

    result = cloudinary.uploader.upload(
        file.file,
        folder=f"crimeos/complaints/{complaint_id}/evidence",
        resource_type="auto"
    )

    return {
        "url": result.get("secure_url"),
        "public_id": result.get("public_id"),
        "resource_type": result.get("resource_type")
    }