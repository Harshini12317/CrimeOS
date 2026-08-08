from io import BytesIO
from pathlib import Path

from docxtpl import DocxTemplate


class DocumentGenerator:
    """
    Generates legal request documents using DOCX templates.
    """

    TEMPLATE_DIRECTORY = Path("data/templates")

    TEMPLATE_MAP = {

        "Bank": "bank_request.docx",

        "Telecom": "telecom_request.docx",

        "Hospital": "hospital_request.docx",

        "Social Media": "social_media_request.docx",

        "Wallet": "wallet_request.docx",

        "CCTV": "cctv_request.docx"

    }

    def _get_template(self, agency_type: str):

        if agency_type not in self.TEMPLATE_MAP:
            raise Exception(
                f"No template available for {agency_type}"
            )

        template_path = (
            self.TEMPLATE_DIRECTORY /
            self.TEMPLATE_MAP[agency_type]
        )

        if not template_path.exists():
            raise FileNotFoundError(
                f"Template not found : {template_path}"
            )

        return template_path

    def generate(
        self,
        agency_type: str,
        context: dict
    ) -> BytesIO:

        template_path = self._get_template(
            agency_type
        )

        document = DocxTemplate(
            template_path
        )

        document.render(
            context
        )

        output = BytesIO()

        document.save(
            output
        )

        output.seek(0)

        return output