from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from pydantic import BaseModel
from uuid import uuid4

from models.case import Case
from typing import Optional, Any, Dict
from pydantic import BaseModel

from database.db import get_db
from models.complainant import Complainant
from models.victim import Victim
from models.suspect import Suspect
from models.evidence import Evidence
from models.user import User, Role

from app.schemas.complaint import (
    ComplaintCreate,
    ComplaintResponse,
)

from app.services.complaint.complaint_service import create_complaint
from app.services.ingestion.translation_service import translate_to_english
from app.services.complaint.summary_from_extraction import generate_summary_from_extraction
from app.services.complaint.complaint_categories import (
    CRIME_CATEGORIES,
)
from models.complaint import Complaint


router = APIRouter(
    prefix="/api/complaints",
    tags=["Complaints"],
)
class AssignCaseRequest(BaseModel):
    officer_id: str


# ============================================================
# GET ALL CRIME CATEGORIES
# ============================================================

@router.get("/categories")
def get_crime_categories():
    return CRIME_CATEGORIES


# ============================================================
# REGISTER NEW COMPLAINT
# ============================================================

@router.post(
    "",
    response_model=ComplaintResponse,
    status_code=201,
)
def register_complaint(
    data: ComplaintCreate,
    db: Session = Depends(get_db),
):

    # --------------------------------------------------------
    # Validate crime category
    # --------------------------------------------------------

    valid_subcategories = CRIME_CATEGORIES.get(
        data.crime_category
    )

    if valid_subcategories is None:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Invalid crime category: "
                f"'{data.crime_category}'."
            ),
        )

    # --------------------------------------------------------
    # Validate subcategory belongs to selected category
    # --------------------------------------------------------

    if data.crime_subcategory not in valid_subcategories:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Invalid subcategory "
                f"'{data.crime_subcategory}' "
                f"for category "
                f"'{data.crime_category}'."
            ),
        )

    # --------------------------------------------------------
    # Create complaint
    # --------------------------------------------------------

    try:
        complaint = create_complaint(
            db=db,
            data=data,
        )

        return complaint

    except HTTPException:
        raise

    except Exception as e:
        db.rollback()

        print(
            "ERROR WHILE REGISTERING COMPLAINT:",
            repr(e),
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to register complaint.",
        )

@router.get("")
def get_all_complaints(
    db: Session = Depends(get_db),
):
    complaints = (
        db.query(Complaint)
        .order_by(
            Complaint.created_at.desc()
        )
        .all()
    )

    return [
        {
            "complaint_id": c.complaint_id,
            "complaint_number": c.complaint_number,
            "complaint_type": c.complaint_type,
            "crime_category": c.crime_category,
            "crime_subcategory": c.crime_subcategory,
            "priority": c.priority,
            "incident_date": c.incident_date,
            "incident_time": c.incident_time,
            "location": c.location,
            "description": c.description,
            "status": c.status,
            "created_at": c.created_at,
        }
        for c in complaints
    ]

# ============================================================
# GET ACTIVE INVESTIGATION OFFICERS
# ============================================================

@router.get("/io")
def get_investigation_officers(
    db: Session = Depends(get_db),
):
    officers = (
        db.query(User)
        .filter(
            User.role == Role.IO,
            User.is_active == True,
        )
        .order_by(User.name.asc())
        .all()
    )

    return [
        {
            "id": officer.id,
            "name": officer.name,
            "email": officer.email,
            "role": officer.role.value,
        }
        for officer in officers
    ]

# ============================================================
# ASSIGN COMPLAINT AS CASE
# ============================================================

@router.post("/{complaint_id}/assign")
def assign_complaint(
    complaint_id: str,
    request: AssignCaseRequest,
    db: Session = Depends(get_db),
):

    # --------------------------------------------------------
    # 1. Find complaint
    # --------------------------------------------------------

    complaint = (
        db.query(Complaint)
        .filter(
            Complaint.complaint_id == complaint_id
        )
        .first()
    )

    if complaint is None:
        raise HTTPException(
            status_code=404,
            detail="Complaint not found.",
        )

    # --------------------------------------------------------
    # 2. Check whether this complaint is already a case
    # --------------------------------------------------------

    existing_case = (
        db.query(Case)
        .filter(
            Case.complaint_id == complaint_id
        )
        .first()
    )

    if existing_case is not None:
        raise HTTPException(
            status_code=409,
            detail="This complaint has already been assigned as a case.",
        )

    # --------------------------------------------------------
    # 3. Find selected IO
    # --------------------------------------------------------

    officer = (
        db.query(User)
        .filter(
            User.id == request.officer_id,
            User.role == Role.IO,
            User.is_active == True,
        )
        .first()
    )

    if officer is None:
        raise HTTPException(
            status_code=400,
            detail="Selected Investigation Officer is invalid or inactive.",
        )

    # --------------------------------------------------------
    # 4. Create Case
    # --------------------------------------------------------

    case = Case(
        case_id=str(uuid4()),

        complaint_id=complaint.complaint_id,

        assigned_officer_id=(officer.id),

        case_number=complaint.complaint_number,

        title=(
            f"{complaint.crime_category}"
            if complaint.crime_category
            else "New Investigation Case"
        ),

        status="Open",

        priority=complaint.priority,

        description=complaint.description,

        # incident_datetime=complaint.incident_datetime,

        current_stage="Assigned",
    )

    db.add(case)

    # --------------------------------------------------------
    # 5. Update complaint status
    # --------------------------------------------------------

    complaint.status = "Assigned"

    # --------------------------------------------------------
    # 6. Save both changes
    # --------------------------------------------------------

    try:

        db.commit()

        db.refresh(case)

    except Exception as e:

        db.rollback()

        print(
            "CASE ASSIGNMENT ERROR:",
            repr(e),
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to assign complaint as case.",
        )

    # --------------------------------------------------------
    # 7. Return response
    # --------------------------------------------------------

    return {
        "message": "Case assigned successfully.",

        "case": {
            "case_id": case.case_id,
            "case_number": case.case_number,
            "complaint_id": case.complaint_id,
            "assigned_officer_id": case.assigned_officer_id,
            "status": case.status,
            "priority": case.priority,
            "current_stage": case.current_stage,
        },

        "officer": {
            "id": officer.id,
            "name": officer.name,
            "email": officer.email,
        },
    }

@router.get("/{complaint_id}")
def get_complaint(
    complaint_id: str,
    db: Session = Depends(get_db),
):
    # ---------------------------------------------------------
    # Get complaint
    # ---------------------------------------------------------

    complaint = (
        db.query(Complaint)
        .filter(
            Complaint.complaint_id == complaint_id
        )
        .first()
    )

    if complaint is None:
        raise HTTPException(
            status_code=404,
            detail="Complaint not found.",
        )

    # ---------------------------------------------------------
    # Get complainants
    # ---------------------------------------------------------

    complainants = (
        db.query(Complainant)
        .filter(
            Complainant.complaint_id == complaint_id
        )
        .all()
    )

    # ---------------------------------------------------------
    # Get victims
    # ---------------------------------------------------------

    victims = (
        db.query(Victim)
        .filter(
            Victim.complaint_id == complaint_id
        )
        .all()
    )

    # ---------------------------------------------------------
    # Get suspects
    # ---------------------------------------------------------

    suspects = (
        db.query(Suspect)
        .filter(
            Suspect.complaint_id == complaint_id
        )
        .all()
    )

    # ---------------------------------------------------------
    # Get evidence
    # ---------------------------------------------------------

    evidence = (
        db.query(Evidence)
        .filter(
            Evidence.complaint_id == complaint_id
        )
        .all()
    )

    # ---------------------------------------------------------
    # Convert ORM objects to dictionaries
    # ---------------------------------------------------------

    return {
        "complaint": {
            "complaint_id": complaint.complaint_id,
            "complaint_number": complaint.complaint_number,
            "complaint_type": complaint.complaint_type,
            "crime_category": complaint.crime_category,
            "crime_subcategory": complaint.crime_subcategory,
            "priority": complaint.priority,
            "incident_date": complaint.incident_date,
            "incident_time": complaint.incident_time,
            "location": complaint.location,
            "description": complaint.description,
            "ai_summary": complaint.ai_summary,
            "officer_notes": complaint.officer_notes,
            "status": complaint.status,
            "created_at": complaint.created_at,
            "updated_at": complaint.updated_at,
        },

        "complainants": [
            {
                "complainant_id": c.complainant_id,
                "name": c.name,
                "contact": c.contact,
                "relationship": c.relationship,
                "statement": c.statement,
                "type": c.type,
                "address": c.address,
            }
            for c in complainants
        ],

        "victims": [
            {
                "victim_id": v.victim_id,
                "name": v.name,
                "contact": v.contact,
                "relationship": v.relationship,
                "statement": v.statement,
                "type": v.type,
                "description": v.description,
                "address": v.address,
                "photo_url": v.photo_url,
            }
            for v in victims
        ],

        "suspects": [
            {
                "suspect_id": s.suspect_id,
                "name": s.name,
                "contact": s.contact,
                "description": s.description,
                "status": s.status,
                "type": s.type,
                "address": s.address,
                "photo_url": s.photo_url,
            }
            for s in suspects
        ],

        "evidence": [
            {
                "evidence_id": e.evidence_id,
                "evidence_type": e.evidence_type,
                "file_name": e.file_name,
                "file_type": e.file_type,
                "cloudinary_url": e.cloudinary_url,
                "cloudinary_public_id": e.cloudinary_public_id,
                "extracted_text": e.extracted_text,
                "summary": e.summary,
                "extraction_data": e.extraction_data,
                "created_at": e.created_at,
            }
            for e in evidence
        ],
    }

    return complaint

# --- New request schema (can live in app/schemas/complaint.py instead if preferred) ---
 
class ComplaintFromExtraction(BaseModel):
    # Fields the officer still needs to confirm/select — extraction can't
    # infer these (crime categorization is a legal judgment call, not a
    # text-extraction task).
    complaint_type: str
    crime_category: str
    crime_subcategory: str
    priority: str = "Medium"
    officer_notes: Optional[str] = None
 
    # Raw output from /upload/ on audio.py, pdf.py, or image.py, or the
    # merged result from combo.py if multiple pieces of evidence were combined.
    extraction: Dict[str, Any]
 
    # Which ingestion route produced `extraction`
    source_type: str  # 'audio' | 'pdf' | 'image'
 
 
# --- New route ---
 
@router.post(
    "/from-extraction",
    response_model=ComplaintResponse,
    status_code=201,
)
def register_complaint_from_extraction(
    data: ComplaintFromExtraction,
    db: Session = Depends(get_db),
):
    valid_subcategories = CRIME_CATEGORIES.get(data.crime_category)
    if valid_subcategories is None:
        raise HTTPException(status_code=400, detail=f"Invalid crime category: '{data.crime_category}'.")
    if data.crime_subcategory not in valid_subcategories:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid subcategory '{data.crime_subcategory}' for category '{data.crime_category}'.",
        )
 
    sections = data.extraction.get("sections", {})
    raw_text = sections.get("narrative_text", "") or ""
    key_facts = data.extraction.get("key_facts", [])
    doc_meta = data.extraction.get("document_meta", {})
    confidence = data.extraction.get("confidence_flags", {})
 
    if not raw_text.strip():
        raise HTTPException(
            status_code=422,
            detail="Extraction contains no narrative text to register a complaint from.",
        )
 
    # Translate, then summarize the translation (not the raw text) so the
    # summary is always in consistent English regardless of source language.
    translated_text = translate_to_english(raw_text)
    ai_summary = generate_summary_from_extraction(
        translated_text or raw_text, key_facts
    )
 
    complaint_data = ComplaintCreate(
        complaint_type=data.complaint_type,
        crime_category=data.crime_category,
        crime_subcategory=data.crime_subcategory,
        priority=data.priority,
        # Prefer translated text as the working description so downstream
        # features (legal-section analysis, etc.) always see clean English,
        # while raw_extracted_text preserves the original for the officer.
        description=translated_text or raw_text,
        ai_summary=ai_summary,
        officer_notes=data.officer_notes,
        source_type=data.source_type,
        detected_languages=",".join(doc_meta.get("languages_detected", [])) or None,
        raw_extracted_text=raw_text,
        translated_text=translated_text,
        needs_human_review=bool(confidence.get("needs_human_review", False)),
    )
 
    try:
        return create_complaint(db=db, data=complaint_data)
    except Exception as e:
        db.rollback()
        print("ERROR WHILE REGISTERING COMPLAINT FROM EXTRACTION:", repr(e))
        raise HTTPException(status_code=500, detail="Failed to register complaint.")
 
