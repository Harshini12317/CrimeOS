from app.services.legal_requests_template import (
    REQUEST_TYPES
)


def generate_legal_request(
    agency_type: str,
    agency_name: str,
    request_type: str,
    case_number: str,
    police_station: str | None = None,
    district: str | None = None,
    fir_no: str | None = None,
    fir_year: int | None = None,
    case_title: str | None = None,
    case_description: str | None = None,
):

    # ======================================================
    # NORMALIZE AGENCY TYPE
    # ======================================================

    agency_type = agency_type.upper().strip()

    # ======================================================
    # CHECK AGENCY TYPE
    # ======================================================

    if agency_type not in REQUEST_TYPES:

        raise ValueError(
            f"Unsupported agency type: {agency_type}"
        )

    templates = REQUEST_TYPES[agency_type]

    # ======================================================
    # CHECK REQUEST TYPE
    # ======================================================

    if request_type not in templates:

        raise ValueError(
            f"Unsupported request type "
            f"'{request_type}' for agency "
            f"'{agency_type}'"
        )

    template = templates[request_type]

    subject = template["subject"]

    # ======================================================
    # BUILD REQUEST
    # ======================================================

    body = f"""
OFFICIAL INFORMATION REQUEST

To,
{agency_name}

Subject: {subject}

Reference Information:

Case Number: {case_number}
"""

    if fir_no:
        body += f"""
FIR Number: {fir_no}
"""

    if fir_year:
        body += f"""
FIR Year: {fir_year}
"""

    if police_station:
        body += f"""
Police Station: {police_station}
"""

    if district:
        body += f"""
District: {district}
"""

    body += f"""

Case Title:
{case_title or "Not available"}

Case Description:
{case_description or "Not available"}


REQUEST

You are requested to provide the relevant information
required for the investigation of the above-mentioned case.

Request Type:
{template["name"]}

Kindly provide the relevant records available with your
organization pertaining to this investigation through
the authorized communication channel.

This request is being made for official investigation
purposes.


Regards,

Investigating Officer

Police Station:
{police_station or "Not specified"}

District:
{district or "Not specified"}
"""

    return {
        "subject": subject,
        "body": body.strip()
    }