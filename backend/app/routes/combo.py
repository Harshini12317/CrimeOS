from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any
import traceback
from app.services.ingestion.combo_service import merge_evidence

router = APIRouter()

class MergeRequest(BaseModel):
    current_master: Dict[str, Any]
    new_evidence: Dict[str, Any]

@router.post("/merge/")
async def combo_merge(request: MergeRequest):
    try:
        merged_json = merge_evidence(request.current_master, request.new_evidence)
        return merged_json
    except Exception as e:
        print("\n=== !!! MASTER AGENT EXCEPTION !!! ===")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))