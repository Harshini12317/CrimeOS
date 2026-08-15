from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.db import get_db
from app.core.deps import require_role

from models.user import User, Role
from models.case import Case

from models.complaint import Complaint
from models.complainant import Complainant
from models.victim import Victim
from models.suspect import Suspect
from models.evidence import Evidence


router = APIRouter(
    prefix="/api/cases",
    tags=["Cases"],
)


# ============================================================
# HELPER
# ============================================================

def serialize_case(case: Case):
    return {
        "case_id": case.case_id,
        "complaint_id": case.complaint_id,

        "case_number": case.case_number,
        "title": case.title,

        "status": case.status,
        "priority": case.priority,
        "description": case.description,

        "district": case.district,
        "police_station": case.police_station,

        "incident_datetime": (
            case.incident_datetime.isoformat()
            if case.incident_datetime
            else None
        ),

        "fir_no": case.fir_no,
        "fir_year": case.fir_year,

        "fir_date": (
            case.fir_date.isoformat()
            if case.fir_date
            else None
        ),

        "original_chargesheet_no": (
            case.original_chargesheet_no
        ),

        "original_chargesheet_date": (
            case.original_chargesheet_date.isoformat()
            if case.original_chargesheet_date
            else None
        ),

        "supplementary_chargesheet_no": (
            case.supplementary_chargesheet_no
        ),

        "supplementary_reason": (
            case.supplementary_reason
        ),

        "court_name": case.court_name,
        "court_no": case.court_no,

        "current_stage": case.current_stage,

        "assigned_officer_id": case.assigned_officer_id,

        "created_at": (
            case.created_at.isoformat()
            if case.created_at
            else None
        ),

        "updated_at": (
            case.updated_at.isoformat()
            if case.updated_at
            else None
        ),

        "closed_at": (
            case.closed_at.isoformat()
            if case.closed_at
            else None
        ),
    }


# ============================================================
# HELPER - COMPLAINT DETAILS
# ============================================================

def get_complaint_details(
    db: Session,
    complaint_id: str,
):
    complaint = (
        db.query(Complaint)
        .filter(
            Complaint.complaint_id == complaint_id
        )
        .first()
    )

    if not complaint:
        return None

    # --------------------------------------------------------
    # COMPLAINANTS
    # --------------------------------------------------------

    complainants = (
        db.query(Complainant)
        .filter(
            Complainant.complaint_id == complaint_id
        )
        .all()
    )

    # --------------------------------------------------------
    # VICTIMS
    # --------------------------------------------------------

    victims = (
        db.query(Victim)
        .filter(
            Victim.complaint_id == complaint_id
        )
        .all()
    )

    # --------------------------------------------------------
    # SUSPECTS
    # --------------------------------------------------------

    suspects = (
        db.query(Suspect)
        .filter(
            Suspect.complaint_id == complaint_id
        )
        .all()
    )

    # --------------------------------------------------------
    # EVIDENCE
    # --------------------------------------------------------

    evidence = (
        db.query(Evidence)
        .filter(
            Evidence.complaint_id == complaint_id
        )
        .all()
    )

    # --------------------------------------------------------
    # RETURN
    # --------------------------------------------------------

    return {
        "complaint": {
            "complaint_id": complaint.complaint_id,

            "complaint_number": (
                complaint.complaint_number
            ),

            "complaint_type": (
                complaint.complaint_type
            ),

            "crime_category": (
                complaint.crime_category
            ),

            "crime_subcategory": (
                complaint.crime_subcategory
            ),

            "priority": complaint.priority,

            "incident_date": (
                complaint.incident_date
            ),

            "incident_time": (
                complaint.incident_time
            ),

            "location": complaint.location,

            "description": complaint.description,

            "ai_summary": complaint.ai_summary,

            "officer_notes": (
                complaint.officer_notes
            ),

            "status": complaint.status,

            "created_at": (
                complaint.created_at.isoformat()
                if complaint.created_at
                else None
            ),

            "updated_at": (
                complaint.updated_at.isoformat()
                if complaint.updated_at
                else None
            ),
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
                "cloudinary_public_id": (
                    e.cloudinary_public_id
                ),
                "extracted_text": e.extracted_text,
                "summary": e.summary,
                "extraction_data": e.extraction_data,
                "created_at": (
                    e.created_at.isoformat()
                    if e.created_at
                    else None
                ),
            }
            for e in evidence
        ],
    }


# ============================================================
# GET MY CASES
# ============================================================

@router.get("/my-cases")
def get_my_cases(
    db: Session = Depends(get_db),
    user: User = Depends(
        require_role(Role.IO)
    ),
):
    """
    Return only cases assigned to the
    currently logged-in IO.
    """

    cases = (
        db.query(Case)
        .filter(
            Case.assigned_officer_id == user.id
        )
        .order_by(
            Case.created_at.desc()
        )
        .all()
    )

    return [
        {
            "case_id": case.case_id,

            "complaint_id": (
                case.complaint_id
            ),

            "case_number": (
                case.case_number
            ),

            "title": case.title,

            "status": case.status,

            "priority": case.priority,

            "description": (
                case.description
            ),

            "current_stage": (
                case.current_stage
            ),

            "created_at": (
                case.created_at.isoformat()
                if case.created_at
                else None
            ),

            "updated_at": (
                case.updated_at.isoformat()
                if case.updated_at
                else None
            ),
        }
        for case in cases
    ]


# ============================================================
# GET CASE DETAILS
#
# NOW RETURNS:
#
# {
#     "case": {...},
#     "complaint": {...},
#     "complainants": [],
#     "victims": [],
#     "suspects": [],
#     "evidence": []
# }
# ============================================================

@router.get("/{case_id}")
def get_case_details(
    case_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(
        require_role(Role.IO)
    ),
):
    """
    Return complete Case View data.

    Includes:
        - Case
        - Complaint
        - Complainants
        - Victims
        - Suspects
        - Evidence
    """

    # --------------------------------------------------------
    # FIND CASE
    # --------------------------------------------------------

    case = (
        db.query(Case)
        .filter(
            Case.case_id == case_id
        )
        .first()
    )

    if not case:
        raise HTTPException(
            status_code=404,
            detail="Case not found.",
        )

    # --------------------------------------------------------
    # OWNERSHIP CHECK
    # --------------------------------------------------------

    if case.assigned_officer_id != user.id:
        raise HTTPException(
            status_code=403,
            detail=(
                "You are not assigned to this case."
            ),
        )

    # --------------------------------------------------------
    # GET COMPLAINT
    # --------------------------------------------------------

    complaint_data = None

    if case.complaint_id:
        complaint_data = get_complaint_details(
            db=db,
            complaint_id=case.complaint_id,
        )

    # --------------------------------------------------------
    # RESPONSE
    # --------------------------------------------------------

    if complaint_data:
        return {
            "case": serialize_case(case),

            "complaint": (
                complaint_data["complaint"]
            ),

            "complainants": (
                complaint_data["complainants"]
            ),

            "victims": (
                complaint_data["victims"]
            ),

            "suspects": (
                complaint_data["suspects"]
            ),

            "evidence": (
                complaint_data["evidence"]
            ),
        }

    # --------------------------------------------------------
    # CASE WITHOUT COMPLAINT
    # --------------------------------------------------------

    return {
        "case": serialize_case(case),

        "complaint": None,

        "complainants": [],

        "victims": [],

        "suspects": [],

        "evidence": [],
    }


# ============================================================
# START INVESTIGATION
# ============================================================

@router.post(
    "/{case_id}/start-investigation"
)
def start_investigation(
    case_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(
        require_role(Role.IO)
    ),
):
    """
    Start investigation for a case.

    Only the IO assigned to the case
    can start it.
    """

    # --------------------------------------------------------
    # FIND CASE
    # --------------------------------------------------------

    case = (
        db.query(Case)
        .filter(
            Case.case_id == case_id
        )
        .first()
    )

    if not case:
        raise HTTPException(
            status_code=404,
            detail="Case not found.",
        )

    # --------------------------------------------------------
    # VERIFY ASSIGNED IO
    # --------------------------------------------------------

    if case.assigned_officer_id != user.id:
        raise HTTPException(
            status_code=403,
            detail=(
                "You are not assigned to this case."
            ),
        )

    # --------------------------------------------------------
    # CHECK WHETHER ALREADY STARTED
    # --------------------------------------------------------

    if (
        case.status
        and case.status.lower()
        in [
            "investigation",
            "under investigation",
        ]
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Investigation has already "
                "been started."
            ),
        )

    # --------------------------------------------------------
    # UPDATE
    # --------------------------------------------------------

    case.status = "Under Investigation"

    case.current_stage = (
        "Investigation Started"
    )

    case.updated_at = (
        datetime.now(timezone.utc)
    )

    # --------------------------------------------------------
    # SAVE
    # --------------------------------------------------------

    db.commit()

    db.refresh(case)

    # --------------------------------------------------------
    # RESPONSE
    # --------------------------------------------------------

    return {
        "message": (
            "Investigation started successfully."
        ),

        "case_id": case.case_id,

        "status": case.status,

        "current_stage": (
            case.current_stage
        ),

        "assigned_officer_id": (
            case.assigned_officer_id
        ),

        "updated_at": (
            case.updated_at.isoformat()
            if case.updated_at
            else None
        ),
    }