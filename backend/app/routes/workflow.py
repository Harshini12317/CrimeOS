from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from database.db import SessionLocal

from app.schemas.workflow import (
    GenerateWorkflowRequest,
    SendWorkflowRequest,
    WorkflowResponse,
    WorkflowStatusResponse,
    WorkflowListResponse,
)

from app.services.workflow.workflow_service import WorkflowService


router = APIRouter(
    prefix="/workflow",
    tags=["Workflow"],
)


def get_db():

    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


# ---------------------------------------------------------
# Generate Workflow Document
# ---------------------------------------------------------

@router.post(
    "/generate",
    response_model=WorkflowResponse
)
def generate_workflow(
    payload: GenerateWorkflowRequest,
    db: Session = Depends(get_db),
):

    service = WorkflowService(db)

    try:

        result = service.generate_request(

            case_id=payload.case_id,

            complaint_id=payload.complaint_id,

            agency_type=payload.agency_type,

            agency_name=payload.agency_name,

            recipient_email=payload.recipient_email,

            subject=payload.subject,

        )

        return WorkflowResponse(

    success=True,

    message="Request generated successfully.",

    request_id=result["request_id"],

    download_url=f"/workflow/download/{result['request_id']}"
)

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ---------------------------------------------------------
# Send Email
# ---------------------------------------------------------

@router.post(
    "/send",
    response_model=WorkflowResponse
)
def send_workflow(
    payload: SendWorkflowRequest,
    db: Session = Depends(get_db),
):

    service = WorkflowService(db)

    try:

        result = service.send_request(
            payload.request_id
        )

        return WorkflowResponse(

            success=True,

            message=result["message"],

            request_id=payload.request_id,

        )

    except Exception as e:

        raise HTTPException(

            status_code=500,

            detail=str(e)

        )


# ---------------------------------------------------------
# Get Workflow Status
# ---------------------------------------------------------

@router.get(
    "/status/{request_id}",
    response_model=WorkflowStatusResponse
)
def workflow_status(
    request_id: str,
    db: Session = Depends(get_db),
):

    service = WorkflowService(db)

    try:

        result = service.get_status(
            request_id
        )

        return WorkflowStatusResponse(**result)

    except Exception as e:

        raise HTTPException(

            status_code=404,

            detail=str(e)

        )


# ---------------------------------------------------------
# List All Requests
# ---------------------------------------------------------

@router.get(
    "/list",
    response_model=WorkflowListResponse
)
def list_workflows(
    db: Session = Depends(get_db),
):

    service = WorkflowService(db)

    try:

        requests = service.list_requests()

        return WorkflowListResponse(
            requests=requests
        )

    except Exception as e:

        raise HTTPException(

            status_code=500,

            detail=str(e)

        )


@router.get("/download/{request_id}")
def download_document(
    request_id: str,
    db: Session = Depends(get_db)
):

    service = WorkflowService(db)

    document, filename = service.download_document(
        request_id
    )

    return StreamingResponse(

        document,

        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",

        headers={
            "Content-Disposition":
            f'attachment; filename="{filename}"'
        }

    )