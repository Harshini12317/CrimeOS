import tempfile
from pathlib import Path

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import (
    getSampleStyleSheet,
    ParagraphStyle,
)
from reportlab.lib.enums import TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
)
from reportlab.lib.units import inch


def generate_legal_request_pdf(
    request_id: str,
    subject: str,
    body: str,
) -> str:

    # ======================================================
    # TEMPORARY PDF FILE
    # ======================================================
    #
    # The PDF is NOT stored inside the project.
    #
    # It is created in the operating system's temporary
    # directory and will be deleted after Cloudinary upload
    # / email processing is complete.
    #
    # ======================================================

    temp_file = tempfile.NamedTemporaryFile(
        prefix=f"legal_request_{request_id}_",
        suffix=".pdf",
        delete=False,
    )

    pdf_path = Path(temp_file.name)

    # Close the file so ReportLab can write to it.
    temp_file.close()

    # ======================================================
    # DOCUMENT
    # ======================================================

    document = SimpleDocTemplate(
        str(pdf_path),
        pagesize=A4,
        rightMargin=50,
        leftMargin=50,
        topMargin=50,
        bottomMargin=50,
    )

    # ======================================================
    # STYLES
    # ======================================================

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "LegalRequestTitle",
        parent=styles["Title"],
        alignment=TA_CENTER,
        fontSize=16,
        leading=20,
        spaceAfter=20,
    )

    body_style = ParagraphStyle(
        "LegalRequestBody",
        parent=styles["BodyText"],
        fontSize=10.5,
        leading=16,
        spaceAfter=8,
    )

    subject_style = ParagraphStyle(
        "LegalRequestSubject",
        parent=styles["BodyText"],
        fontSize=11,
        leading=16,
        spaceAfter=12,
    )

    # ======================================================
    # STORY
    # ======================================================

    story = []

    # ------------------------------------------------------
    # TITLE
    # ------------------------------------------------------

    story.append(
        Paragraph(
            "OFFICIAL INFORMATION REQUEST",
            title_style,
        )
    )

    # ------------------------------------------------------
    # SUBJECT
    # ------------------------------------------------------

    safe_subject = (
        subject
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )

    story.append(
        Paragraph(
            f"<b>Subject:</b> {safe_subject}",
            subject_style,
        )
    )

    # ------------------------------------------------------
    # BODY
    # ------------------------------------------------------

    paragraphs = body.split("\n")

    for paragraph in paragraphs:

        paragraph = paragraph.strip()

        if not paragraph:

            story.append(
                Spacer(
                    1,
                    0.10 * inch,
                )
            )

            continue

        safe_paragraph = (
            paragraph
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
        )

        story.append(
            Paragraph(
                safe_paragraph,
                body_style,
            )
        )

    # ======================================================
    # BUILD PDF
    # ======================================================

    try:

        document.build(story)

    except Exception:

        # If PDF generation itself fails, remove the
        # temporary file immediately.

        if pdf_path.exists():

            pdf_path.unlink()

        raise

    # ======================================================
    # RETURN TEMPORARY PATH
    # ======================================================

    return str(pdf_path)