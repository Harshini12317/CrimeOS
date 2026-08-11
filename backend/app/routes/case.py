from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.db import get_db
from app.core.deps import require_role

from models.user import User, Role
from models.case import Case


router = APIRouter(
    prefix="/api/cases",
    tags=["Cases"],
)


# ============================================================
# GET MY CASES
# ============================================================

@router.get("/my-cases")
def get_my_cases(
    db: Session = Depends(get_db),
    user: User = Depends(require_role(Role.IO)),
):
    """
    Return only cases assigned to the currently logged-in IO.

    The assignment is based on:

        cases.assigned_officer_id == users.id

    Example:

        users.id = 4
        users.role = IO

    Then only cases where:

        cases.assigned_officer_id = 4

    are returned.
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
            "complaint_id": case.complaint_id,
            "case_number": case.case_number,
            "title": case.title,
            "status": case.status,
            "priority": case.priority,
            "description": case.description,
            "current_stage": case.current_stage,

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
# ============================================================

@router.get("/{case_id}")
def get_case_details(
    case_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(Role.IO)),
):
    """
    Return details of a case.

    An IO can only open a case if that case is assigned
    to their users.id.
    """

    case = (
        db.query(Case)
        .filter(
            Case.case_id == case_id
        )
        .first()
    )

    # --------------------------------------------------------
    # CASE NOT FOUND
    # --------------------------------------------------------

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
            detail="You are not assigned to this case.",
        )

    # --------------------------------------------------------
    # RETURN CASE
    # --------------------------------------------------------

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

        # ----------------------------------------------------
        # FIR
        # ----------------------------------------------------

        "fir_no": case.fir_no,

        "fir_year": case.fir_year,

        "fir_date": (
            case.fir_date.isoformat()
            if case.fir_date
            else None
        ),

        # ----------------------------------------------------
        # ORIGINAL CHARGESHEET
        # ----------------------------------------------------

        "original_chargesheet_no": (
            case.original_chargesheet_no
        ),

        "original_chargesheet_date": (
            case.original_chargesheet_date.isoformat()
            if case.original_chargesheet_date
            else None
        ),

        # ----------------------------------------------------
        # SUPPLEMENTARY CHARGESHEET
        # ----------------------------------------------------

        "supplementary_chargesheet_no": (
            case.supplementary_chargesheet_no
        ),

        "supplementary_reason": (
            case.supplementary_reason
        ),

        # ----------------------------------------------------
        # COURT
        # ----------------------------------------------------

        "court_name": case.court_name,

        "court_no": case.court_no,

        # ----------------------------------------------------
        # INVESTIGATION
        # ----------------------------------------------------

        "current_stage": case.current_stage,

        # ----------------------------------------------------
        # ASSIGNED IO
        # ----------------------------------------------------

        "assigned_officer_id": case.assigned_officer_id,

        # ----------------------------------------------------
        # TIMESTAMPS
        # ----------------------------------------------------

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
# START INVESTIGATION
# ============================================================

@router.post("/{case_id}/start-investigation")
def start_investigation(
    case_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(Role.IO)),
):
    """
    Start investigation for a case.

    Only the IO assigned to the case can start it.
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
            detail="You are not assigned to this case.",
        )

    # --------------------------------------------------------
    # CHECK WHETHER INVESTIGATION ALREADY STARTED
    # --------------------------------------------------------

    if case.status and case.status.lower() in [
        "investigation",
        "under investigation",
    ]:
        raise HTTPException(
            status_code=400,
            detail="Investigation has already been started.",
        )

    # --------------------------------------------------------
    # UPDATE CASE
    # --------------------------------------------------------

    case.status = "Under Investigation"

    case.current_stage = "Investigation Started"

    case.updated_at = datetime.now(timezone.utc)

    # --------------------------------------------------------
    # SAVE
    # --------------------------------------------------------

    db.commit()

    db.refresh(case)

    # --------------------------------------------------------
    # RESPONSE
    # --------------------------------------------------------

    return {
        "message": "Investigation started successfully.",

        "case_id": case.case_id,

        "status": case.status,

        "current_stage": case.current_stage,

        "assigned_officer_id": case.assigned_officer_id,

        "updated_at": (
            case.updated_at.isoformat()
            if case.updated_at
            else None
        ),
    }