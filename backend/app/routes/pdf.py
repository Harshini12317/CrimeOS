from fastapi import APIRouter, UploadFile, File, HTTPException
import shutil
import os
import traceback
from app.services.ingestion.pdf_service import process_pdf

router = APIRouter()
TEMP_DIR = "temp_pdf"
os.makedirs(TEMP_DIR, exist_ok=True)

@router.post("/upload/")
async def upload_pdf(file: UploadFile = File(...)):
    if not file.content_type == "application/pdf":
        raise HTTPException(status_code=400, detail="File must be PDF.")
    temp_file_path = os.path.join(TEMP_DIR, file.filename)
    try:
        with open(temp_file_path, "wb") as buffer: shutil.copyfileobj(file.file, buffer)
        return process_pdf(temp_file_path)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_file_path): os.remove(temp_file_path)