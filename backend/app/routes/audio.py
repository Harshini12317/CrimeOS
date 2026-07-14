from fastapi import APIRouter, UploadFile, File, HTTPException
import shutil
import os
from app.services.ingestion.audio_service import process_audio_complaint

router = APIRouter()

TEMP_DIR = "temp_audio"
os.makedirs(TEMP_DIR, exist_ok=True)

@router.post("/upload/")
async def upload_audio(file: UploadFile = File(...)):
    if not file.content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an audio format.")

    temp_file_path = os.path.join(TEMP_DIR, file.filename)
    try:
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        final_json_output = process_audio_complaint(temp_file_path, file.filename)
        return final_json_output

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    finally:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)