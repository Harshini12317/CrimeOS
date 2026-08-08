from datetime import datetime
from sqlalchemy.orm import Session

from models.legal_request import LegalRequest

from app.services.workflow.context_builder import WorkflowContextBuilder
from app.services.workflow.document_generator import DocumentGenerator
from app.services.workflow.email_service import EmailService


class WorkflowService:

    def __init__(self, db: Session):

        self.db = db

        self.context_builder = WorkflowContextBuilder(db)

        self.document_generator = DocumentGenerator()

        self.email_service = EmailService()

    # ---------------------------------------------------------
    # Generate Request
    # ---------------------------------------------------------

    def generate_request(
        self,
        case_id: str,
        complaint_id: str,
        agency_type: str,
        agency_name: str,
        recipient_email: str,
        subject: str
    ):

        # Build context
        context = self.context_builder.build(
            case_id=case_id,
            complaint_id=complaint_id
        )

        # Extra template variables
        context["agency_name"] = agency_name
        context["subject"] = subject

        # Generate document
        document = self.document_generator.generate(
            agency_type=agency_type,
            context=context
        )

        # Save request metadata
        request = LegalRequest(

            case_id=case_id,

            complaint_id=complaint_id,

            agency_type=agency_type,

            agency_name=agency_name,

            recipient_email=recipient_email,

            subject=subject,

            status="Generated"
        )

        self.db.add(request)
        self.db.commit()
        self.db.refresh(request)

        return {

            "request_id": request.request_id,

            

        }

    # ---------------------------------------------------------
    # Send Request
    # ---------------------------------------------------------

    def send_request(
        self,
        request_id: str
    ):

        request = (

            self.db.query(LegalRequest)

            .filter(
                LegalRequest.request_id == request_id
            )

            .first()

        )

        if request is None:

            raise Exception("Workflow request not found.")

        # Build latest context
        context = self.context_builder.build(

            case_id=request.case_id,

            complaint_id=request.complaint_id

        )

        context["agency_name"] = request.agency_name
        context["subject"] = request.subject

        # Generate document
        document = self.document_generator.generate(

            agency_type=request.agency_type,

            context=context

        )

        # Send Email
        self.email_service.send_request_email(

            recipient=request.recipient_email,

            subject=request.subject,

            document=document,

            filename=f"{request.agency_type}_Request.docx"

        )

        request.status = "Sent"

        request.sent_at = datetime.utcnow()

        self.db.commit()

        return {

            "success": True,

            "message": "Email sent successfully."

        }

    # ---------------------------------------------------------
    # Get Status
    # ---------------------------------------------------------

    def get_status(
        self,
        request_id: str
    ):

        request = (

            self.db.query(LegalRequest)

            .filter(
                LegalRequest.request_id == request_id
            )

            .first()

        )

        if request is None:

            raise Exception("Workflow request not found.")

        return {

            "request_id": request.request_id,

            "case_id": request.case_id,

            "complaint_id": request.complaint_id,

            "agency_type": request.agency_type,

            "agency_name": request.agency_name,

            "recipient_email": request.recipient_email,

            "subject": request.subject,

            "status": request.status,

            "sent_at": request.sent_at,

            "responded_at": request.responded_at,

            "created_at": request.created_at,

            "updated_at": request.updated_at

        }

    # ---------------------------------------------------------
    # List Requests
    # ---------------------------------------------------------

    def list_requests(self):

        requests = (

            self.db.query(LegalRequest)

            .order_by(
                LegalRequest.created_at.desc()
            )

            .all()

        )

        response = []

        for request in requests:

            response.append({

                "request_id": request.request_id,

                "case_id": request.case_id,

                "complaint_id": request.complaint_id,

                "agency_name": request.agency_name,

                "agency_type": request.agency_type,

                "recipient_email": request.recipient_email,

                "status": request.status

            })

        return response

    def download_document(
        self,
        request_id: str
    ):

        request = (
            self.db.query(LegalRequest)
            .filter(
                LegalRequest.request_id == request_id
            )
            .first()
        )

        if request is None:
            raise Exception("Request not found")

        context = self.context_builder.build(

            case_id=request.case_id,

            complaint_id=request.complaint_id

        )

        context["agency_name"] = request.agency_name
        context["subject"] = request.subject

        document = self.document_generator.generate(

            agency_type=request.agency_type,

            context=context

        )

        filename = f"{request.agency_type}_Request.docx"

        return document, filename