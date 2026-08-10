from app.services.legal_requests_template import (
    REQUEST_TYPES,
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
    complaint_context: dict | None = None,
    operator_requirements: dict | None = None,
):
    """
    Generate an official information request.

    IMPORTANT:

    complaint_context contains internal CrimeOS data.

    It is NOT directly dumped into the final request.

    operator_requirements is the structured output produced
    by the AI. Only the information selected by the AI is
    included in the external request.
    """

    # ======================================================
    # 1. NORMALIZE AGENCY TYPE
    # ======================================================

    agency_type = (
        agency_type
        .upper()
        .strip()
    )

    # ======================================================
    # 2. VALIDATE AGENCY TYPE
    # ======================================================

    if agency_type not in REQUEST_TYPES:
        raise ValueError(
            f"Unsupported agency type: {agency_type}"
        )

    templates = REQUEST_TYPES[agency_type]

    # ======================================================
    # 3. VALIDATE REQUEST TYPE
    # ======================================================

    if request_type not in templates:
        raise ValueError(
            f"Unsupported request type "
            f"'{request_type}' for agency "
            f"'{agency_type}'"
        )

    template = templates[request_type]

    # ======================================================
    # 4. SUBJECT
    # ======================================================

    subject = template["subject"]

    # ======================================================
    # 5. START REQUEST
    # ======================================================

    body = f"""
OFFICIAL INFORMATION REQUEST

To,
{agency_name}

Subject: {subject}

Reference Information:

Case Number: {case_number}
""".strip()

    body += "\n"

    # ======================================================
    # 6. COMPLAINT NUMBER
    # ======================================================

    if complaint_context:

        complaint_number = (
            complaint_context.get(
                "complaint_number"
            )
        )

        complaint_id = (
            complaint_context.get(
                "complaint_id"
            )
        )

        if complaint_number:

            body += (
                f"\nComplaint Number: "
                f"{complaint_number}\n"
            )

        elif complaint_id:

            body += (
                f"\nComplaint ID: "
                f"{complaint_id}\n"
            )

    # ======================================================
    # 7. FIR DETAILS
    # ======================================================

    if fir_no:

        body += (
            f"\nFIR Number: "
            f"{fir_no}\n"
        )

    if fir_year:

        body += (
            f"FIR Year: "
            f"{fir_year}\n"
        )

    # ======================================================
    # 8. POLICE STATION
    # ======================================================

    if police_station:

        body += (
            f"Police Station: "
            f"{police_station}\n"
        )

    # ======================================================
    # 9. DISTRICT
    # ======================================================

    if district:

        body += (
            f"District: "
            f"{district}\n"
        )

    # ======================================================
    # 10. CASE TITLE
    #
    # We include only the title.
    #
    # We intentionally DO NOT include the complete
    # case description because the external operator
    # should receive only the minimum necessary data.
    # ======================================================

    if case_title:

        body += f"""
Case Title:
{case_title}
"""

    # ======================================================
    # 11. AI-DETERMINED PURPOSE
    # ======================================================

    if operator_requirements:

        purpose = operator_requirements.get(
            "purpose"
        )

        if purpose:

            body += f"""
Purpose of Request:
{purpose}
"""

    # ======================================================
    # 12. AI-DETERMINED INFORMATION
    # ======================================================

    required_information = []

    if operator_requirements:

        required_information = (
            operator_requirements.get(
                "required_information",
                []
            )
        )

    if required_information:

        body += """

Information Requested:
"""

        for index, item in enumerate(
            required_information,
            start=1,
        ):

            if not item:
                continue

            # ----------------------------------------------
            # AI normally returns strings.
            # ----------------------------------------------

            if isinstance(
                item,
                dict,
            ):

                value = (
                    item.get("field")
                    or item.get("name")
                    or item.get("description")
                )

            else:

                value = str(item)

            if value:

                body += (
                    f"{index}. "
                    f"{format_label(value)}\n"
                )

    # ======================================================
    # 13. IDENTIFIERS
    # ======================================================

    identifiers = []

    if operator_requirements:

        identifiers = (
            operator_requirements.get(
                "identifiers",
                []
            )
        )

    if identifiers:

        body += """

Relevant Identifiers:
"""

        for item in identifiers:

            if not item:
                continue

            if isinstance(
                item,
                dict,
            ):

                value = (
                    item.get("field")
                    or item.get("name")
                    or item.get("description")
                )

            else:

                value = str(item)

            if value:

                body += (
                    f"- "
                    f"{format_label(value)}\n"
                )

    # ======================================================
    # 14. TIME RANGE
    # ======================================================

    time_range = None

    if operator_requirements:

        time_range = (
            operator_requirements.get(
                "time_range"
            )
        )

    if time_range:

        body += """

Relevant Time Period:
"""

        if isinstance(
            time_range,
            str,
        ):

            body += (
                f"{time_range}\n"
            )

        elif isinstance(
            time_range,
            list,
        ):

            for item in time_range:

                if item:

                    body += (
                        f"- {item}\n"
                    )

        elif isinstance(
            time_range,
            dict,
        ):

            for key, value in (
                time_range.items()
            ):

                if value:

                    body += (
                        f"{format_label(key)}: "
                        f"{value}\n"
                    )

    # ======================================================
    # 15. ADDITIONAL REQUIREMENTS
    # ======================================================

    notes = []

    if operator_requirements:

        notes = (
            operator_requirements.get(
                "notes",
                []
            )
        )

    if notes:

        body += """

Additional Requirements:
"""

        for item in notes:

            if not item:
                continue

            if isinstance(
                item,
                dict,
            ):

                value = (
                    item.get("description")
                    or item.get("text")
                    or item.get("note")
                )

            else:

                value = str(item)

            if value:

                body += (
                    f"- {value}\n"
                )

    # ======================================================
    # 16. FALLBACK
    #
    # If AI requirements are unavailable, still generate
    # a valid request.
    # ======================================================

    if not operator_requirements:

        body += f"""

Request Type:
{template["name"]}

You are requested to provide the relevant information
required for the investigation of the above-mentioned case.

Kindly provide the relevant records available with your
organization pertaining to this investigation through
the authorized communication channel.
"""

    # ======================================================
    # 17. OFFICIAL CLOSING
    # ======================================================

    body += """

This request is being made for official investigation
purposes.

Please provide the requested information through the
appropriate authorized communication channel.

Regards,

Investigating Officer

Police Station:
"""

    body += (
        f"{police_station or 'Not specified'}\n"
    )

    body += """

District:
"""

    body += (
        f"{district or 'Not specified'}"
    )

    # ======================================================
    # 18. CLEAN EXTRA BLANK LINES
    # ======================================================

    body = clean_body(body)

    # ======================================================
    # 19. RETURN
    # ======================================================

    return {
        "subject": subject,
        "body": body,
    }


# ==========================================================
# FORMAT AI FIELD NAMES
# ==========================================================

def format_label(value: str) -> str:
    """
    Convert technical field names into readable text.

    Examples:

        transaction_id
        -> Transaction ID

        utr_reference_number
        -> UTR Reference Number

        transaction_date_time
        -> Transaction Date Time

        debit_account_number
        -> Debit Account Number
    """

    value = (
        str(value)
        .replace("_", " ")
        .strip()
    )

    words = value.split()

    formatted_words = []

    # Keep common technical abbreviations uppercase.
    abbreviations = {
        "id": "ID",
        "utr": "UTR",
        "ip": "IP",
        "kyc": "KYC",
        "imei": "IMEI",
        "imsi": "IMSI",
        "url": "URL",
        "sms": "SMS",
        "otp": "OTP",
    }

    for word in words:

        lower_word = word.lower()

        if lower_word in abbreviations:

            formatted_words.append(
                abbreviations[lower_word]
            )

        else:

            formatted_words.append(
                word.capitalize()
            )

    return " ".join(
        formatted_words
    )


# ==========================================================
# CLEAN BODY
# ==========================================================

def clean_body(body: str) -> str:
    """
    Remove unnecessary excessive blank lines while
    preserving readable section spacing.
    """

    lines = body.splitlines()

    cleaned = []

    blank_count = 0

    for line in lines:

        line = line.rstrip()

        if not line:

            blank_count += 1

            if blank_count <= 2:

                cleaned.append("")

        else:

            blank_count = 0

            cleaned.append(line)

    return "\n".join(
        cleaned
    ).strip()