from datetime import datetime

from sqlalchemy import text
from sqlalchemy.orm import Session

from models.complaint import Complaint
from app.schemas.complaint import ComplaintCreate


def generate_complaint_number(db: Session) -> str:
    """
    Generate a human-readable complaint number.

    Format:
        CMP-2026-000001
        CMP-2026-000002
        CMP-2026-000003

    A PostgreSQL transaction-level advisory lock is used so that
    two simultaneous complaint registrations cannot generate
    the same complaint number.
    """

    year = datetime.now().year

    # ---------------------------------------------------------
    # Lock complaint-number generation for this transaction.
    #
    # This lock exists only for the current database transaction.
    # ---------------------------------------------------------

    db.execute(
        text("SELECT pg_advisory_xact_lock(:lock_key)"),
        {"lock_key": 82463721},
    )

    # ---------------------------------------------------------
    # Find the latest complaint number for this year.
    # ---------------------------------------------------------

    last_complaint = (
        db.query(Complaint)
        .filter(
            Complaint.complaint_number.like(
                f"CMP-{year}-%"
            )
        )
        .order_by(
            Complaint.complaint_number.desc()
        )
        .first()
    )

    # ---------------------------------------------------------
    # Calculate next number.
    # ---------------------------------------------------------

    if last_complaint is None:
        next_number = 1

    else:
        try:
            last_number = int(
                last_complaint.complaint_number.split("-")[-1]
            )

            next_number = last_number + 1

        except (ValueError, AttributeError):
            raise ValueError(
                "Invalid complaint number format found in database."
            )

    return f"CMP-{year}-{next_number:06d}"


def create_complaint(
    db: Session,
    data: ComplaintCreate,
) -> Complaint:

    complaint = Complaint(
        complaint_number=generate_complaint_number(db),
        complaint_type=data.complaint_type,
        crime_category=data.crime_category,
        crime_subcategory=data.crime_subcategory,
        priority=data.priority,
        incident_date=data.incident_date,
        incident_time=data.incident_time,
        location=data.location,
        description=data.description,
        ai_summary=data.ai_summary,
        officer_notes=data.officer_notes,
        status="Registered",
    )

    # Add object to current transaction
    db.add(complaint)

    # Write to PostgreSQL
    db.commit()

    # Load generated values such as complaint_id and created_at
    db.refresh(complaint)

    return complaint