from sqlalchemy.orm import Session

from models.case import Case
from models.complaint import Complaint


class WorkflowContextBuilder:
    """
    Builds the complete context required for
    legal request document generation.
    """

    def __init__(self, db: Session):
        self.db = db

    def build(
        self,
        case_id: str,
        complaint_id: str
    ) -> dict:

        # -------------------------------------
        # Fetch Case
        # -------------------------------------

        case = (
            self.db.query(Case)
            .filter(
                Case.case_id == case_id
            )
            .first()
        )

        if case is None:
            raise Exception("Case not found")

        # -------------------------------------
        # Fetch Complaint
        # -------------------------------------

        complaint = (
            self.db.query(Complaint)
            .filter(
                Complaint.complaint_id == complaint_id
            )
            .first()
        )

        if complaint is None:
            raise Exception("Complaint not found")

        # -------------------------------------
        # Build Context
        # -------------------------------------

        context = {

            "case": {

                "case_id": case.case_id,

                "status": case.status,

                "priority": case.priority,

                "officer_id": case.officer_id

            },

            "complaint": {

                "complaint_id": complaint.complaint_id,

                "complainant_name": complaint.complainant_name,

                "phone": complaint.phone,

                "email": complaint.email,

                "crime_type": complaint.crime_type,

                "location": complaint.location,

                "description": complaint.description,

                "status": complaint.status

            }

        }

        return context