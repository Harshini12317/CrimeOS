import json
import os
from typing import Any

from dotenv import load_dotenv
from groq import Groq


# ============================================================
# LOAD ENVIRONMENT
# ============================================================

load_dotenv()


# ============================================================
# GROQ CONFIGURATION
# ============================================================

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    raise RuntimeError(
        "GROQ_API_KEY is not set in the backend .env file."
    )


GROQ_MODEL = os.getenv(
    "GROQ_MODEL",
    "openai/gpt-oss-20b",
)


# ============================================================
# GROQ CLIENT
# ============================================================

client = Groq(
    api_key=GROQ_API_KEY
)


# ============================================================
# CUSTOM ERROR
# ============================================================

class AIServiceError(Exception):
    """
    Error raised when the AI service fails.
    """
    pass


# ============================================================
# OPERATOR-SPECIFIC GUIDANCE
# ============================================================

OPERATOR_GUIDANCE = {

    "BANK": """
The organization is a bank or financial institution.

Focus on information such as:

- transaction ID
- UTR/reference number
- transaction date and time
- transaction amount
- debit account
- beneficiary account
- transaction status
- payment channel
- relevant account information
- relevant KYC information only when necessary
- relevant beneficiary information
- relevant fraud/dispute records
- relevant device/IP information if maintained by the bank

Do NOT request unrelated personal information.
""",

    "TELECOM": """
The organization is a telecom service provider.

Focus on:

- subscriber information
- mobile number
- SIM information
- IMEI
- IMSI
- call detail records
- SMS metadata
- tower/location records where legally applicable
- activation/deactivation records
- relevant IP/session information

Do NOT request unrelated victim or suspect information.
""",

    "SOCIAL_MEDIA": """
The organization is a social media or online platform.

Focus on:

- username
- account ID
- profile information necessary to identify the account
- registration information
- login timestamps
- login IP addresses
- relevant account activity
- relevant messages/content
- timestamps
- linked identifiers where legally applicable

Only request information directly relevant to the investigation.
""",

    "EMAIL": """
The organization is an email provider.

Focus on:

- email account information
- account registration information
- login IP addresses
- login timestamps
- email metadata
- sender/recipient information
- relevant message headers
- account activity

Only request information necessary for the investigation.
""",

    "ISP": """
The organization is an internet service provider.

Focus on:

- subscriber information
- IP allocation
- IP/session records
- timestamps
- connection records
- relevant account information

Only request information necessary to identify the relevant
subscriber or connection.
""",

    "PLATFORM": """
The organization is an online platform or service.

Determine what information is reasonably maintained by the
platform and is directly relevant to the selected request.

Prefer precise identifiers, timestamps, account information,
transaction information, activity records, or technical
records instead of broad requests.
""",
}


# ============================================================
# GET OPERATOR GUIDANCE
# ============================================================

def get_operator_guidance(
    agency_type: str,
) -> str:

    agency_type = (
        agency_type
        .upper()
        .strip()
    )

    return OPERATOR_GUIDANCE.get(
        agency_type,
        OPERATOR_GUIDANCE["PLATFORM"],
    )


# ============================================================
# BUILD SAFE AI CONTEXT
# ============================================================

def build_ai_context(
    complaint_context: dict[str, Any],
) -> dict[str, Any]:

    """
    Build a reduced complaint context for the AI.

    The purpose is to give the AI enough information to
    determine what the operator needs, without blindly
    sending every field from the database.
    """

    context = {

        # ----------------------------------------------------
        # COMPLAINT IDENTIFIERS
        # ----------------------------------------------------

        "complaint_id":
            complaint_context.get(
                "complaint_id"
            ),

        "complaint_number":
            complaint_context.get(
                "complaint_number"
            ),

        # ----------------------------------------------------
        # CRIME INFORMATION
        # ----------------------------------------------------

        "complaint_type":
            complaint_context.get(
                "complaint_type"
            ),

        "crime_category":
            complaint_context.get(
                "crime_category"
            ),

        "crime_subcategory":
            complaint_context.get(
                "crime_subcategory"
            ),

        "priority":
            complaint_context.get(
                "priority"
            ),

        # ----------------------------------------------------
        # INCIDENT
        # ----------------------------------------------------

        "incident_date":
            complaint_context.get(
                "incident_date"
            ),

        "incident_time":
            complaint_context.get(
                "incident_time"
            ),

        "location":
            complaint_context.get(
                "location"
            ),

        # ----------------------------------------------------
        # DESCRIPTION
        # ----------------------------------------------------

        "description":
            complaint_context.get(
                "description"
            ),

        "ai_summary":
            complaint_context.get(
                "ai_summary"
            ),

        # ----------------------------------------------------
        # VICTIMS
        #
        # Only include information that can help determine
        # which identifier is relevant.
        # ----------------------------------------------------

        "victims": [],

        # ----------------------------------------------------
        # SUSPECTS
        # ----------------------------------------------------

        "suspects": [],

        # ----------------------------------------------------
        # EVIDENCE
        # ----------------------------------------------------

        "evidence": [],
    }

    # ========================================================
    # VICTIMS
    # ========================================================

    for victim in complaint_context.get(
        "victims",
        [],
    ):

        if not isinstance(
            victim,
            dict,
        ):
            continue

        context["victims"].append({

            "name":
                victim.get("name"),

            "type":
                victim.get("type"),

            "relationship":
                victim.get("relationship"),

            "description":
                victim.get("description"),

            # Statement can be useful for determining
            # the nature of the request, but limit size.
            "statement": (
                victim.get(
                    "statement"
                )[:3000]
                if victim.get(
                    "statement"
                )
                else None
            ),

        })

    # ========================================================
    # SUSPECTS
    # ========================================================

    for suspect in complaint_context.get(
        "suspects",
        [],
    ):

        if not isinstance(
            suspect,
            dict,
        ):
            continue

        context["suspects"].append({

            "name":
                suspect.get("name"),

            "type":
                suspect.get("type"),

            "status":
                suspect.get("status"),

            "description":
                suspect.get("description"),

        })

    # ========================================================
    # EVIDENCE
    # ========================================================

    for evidence in complaint_context.get(
        "evidence",
        [],
    ):

        if not isinstance(
            evidence,
            dict,
        ):
            continue

        context["evidence"].append({

            "evidence_type":
                evidence.get(
                    "evidence_type"
                ),

            "file_name":
                evidence.get(
                    "file_name"
                ),

            "file_type":
                evidence.get(
                    "file_type"
                ),

            "summary":
                evidence.get(
                    "summary"
                ),

            # ------------------------------------------------
            # Limit extracted text.
            # Do NOT send the Cloudinary URL.
            # ------------------------------------------------

            "extracted_text": (
                evidence.get(
                    "extracted_text"
                )[:3000]
                if evidence.get(
                    "extracted_text"
                )
                else None
            ),

        })

    return context


# ============================================================
# ANALYZE OPERATOR REQUEST
# ============================================================

def analyze_operator_request(
    *,
    agency_type: str,
    agency_name: str,
    request_type: str,
    case_number: str | None,
    complaint_context: dict[str, Any],
) -> dict[str, Any]:

    """
    Determine the minimum information that should be requested
    from a specific external operator.

    The AI DOES NOT generate the final legal letter.

    It only returns structured information requirements.

    The final letter is generated separately by
    legal_request_generator.py.
    """

    # ========================================================
    # NORMALIZE INPUT
    # ========================================================

    agency_type = (
        agency_type
        .upper()
        .strip()
    )

    agency_name = (
        agency_name
        .strip()
    )

    request_type = (
        request_type
        .strip()
    )

    # ========================================================
    # OPERATOR GUIDANCE
    # ========================================================

    operator_guidance = (
        get_operator_guidance(
            agency_type
        )
    )

    # ========================================================
    # REDUCED COMPLAINT CONTEXT
    # ========================================================

    safe_context = build_ai_context(
        complaint_context
    )

    # ========================================================
    # SYSTEM PROMPT
    # ========================================================

    system_prompt = """
You are an information-request planning assistant
inside a police case-management system.

Your task is to determine the MINIMUM information
that should be requested from an external organization
for a specific police investigation.

You are NOT writing the final legal letter.

The final letter will be generated by another component.

IMPORTANT RULES:

1. Request only information relevant to the selected
   organization and request type.

2. Follow the principle of data minimization.

3. Do not request unrelated personal information.

4. Do not include unnecessary victim information.

5. Do not include unnecessary suspect information.

6. Do not request entire evidence files.

7. Do not invent facts.

8. Do not invent transaction IDs, phone numbers,
   account numbers, usernames, IP addresses, or dates.

9. If a specific identifier is needed but is not available,
   say that the identifier should be requested only if
   available in the complaint.

10. Prefer precise fields over broad phrases.

11. The requested information must be reasonably
    associated with the selected operator.

12. Do not assume that an operator possesses information
    that it would not normally maintain.

13. The output MUST follow the supplied JSON schema.

14. Keep the request investigation-focused.

15. Do not generate legal conclusions.

16. Do not claim that a particular record legally exists.

17. Do not provide legal advice.

Your output will be used to generate an official
information-request document.
"""

    # ========================================================
    # USER PROMPT
    # ========================================================

    user_prompt = f"""
Analyze this information request.

============================================================
OPERATOR
============================================================

Agency type:
{agency_type}

Agency name:
{agency_name}

Request type:
{request_type}

Case number:
{case_number or "Not available"}

============================================================
OPERATOR-SPECIFIC GUIDANCE
============================================================

{operator_guidance}

============================================================
COMPLAINT CONTEXT
============================================================

{json.dumps(
    safe_context,
    ensure_ascii=False,
    default=str,
    indent=2,
)}

============================================================
TASK
============================================================

Determine the minimum information that should be requested
from this operator.

The result should contain:

- purpose
- required_information
- identifiers
- time_range
- notes

Do NOT write an email or legal letter.

Do NOT include information that is not necessary.
"""

    # ========================================================
    # STRUCTURED OUTPUT SCHEMA
    #
    # GPT-OSS 20B supports strict structured outputs on Groq.
    # ========================================================

    response_schema = {

        "type": "json_schema",

        "json_schema": {

            "name":
                "operator_information_requirements",

            "strict":
                True,

            "schema": {

                "type":
                    "object",

                "properties": {

                    "purpose": {
                        "type":
                            "string"
                    },

                    "required_information": {

                        "type":
                            "array",

                        "items": {
                            "type":
                                "string"
                        },
                    },

                    "identifiers": {

                        "type":
                            "array",

                        "items": {
                            "type":
                                "string"
                        },
                    },

                    "time_range": {

                        "type": [
                            "string",
                            "null",
                        ],
                    },

                    "notes": {

                        "type":
                            "array",

                        "items": {
                            "type":
                                "string"
                        },
                    },
                },

                "required": [
                    "purpose",
                    "required_information",
                    "identifiers",
                    "time_range",
                    "notes",
                ],

                "additionalProperties":
                    False,
            },
        },
    }

    # ========================================================
    # CALL GROQ
    # ========================================================

    try:

        response = (
            client.chat.completions.create(

                model=GROQ_MODEL,

                messages=[

                    {
                        "role":
                            "system",

                        "content":
                            system_prompt,
                    },

                    {
                        "role":
                            "user",

                        "content":
                            user_prompt,
                    },

                ],

                response_format=
                    response_schema,

                temperature=0,

                max_tokens=1200,
            )
        )

    except Exception as e:

        error_message = str(e)

        print(
            "GROQ API ERROR:",
            error_message,
        )

        raise AIServiceError(
            "Groq request failed: "
            f"{error_message}"
        )

    # ========================================================
    # GET RESPONSE CONTENT
    # ========================================================

    try:

        content = (
            response
            .choices[0]
            .message
            .content
        )

    except Exception as e:

        raise AIServiceError(
            "Could not read Groq response: "
            f"{str(e)}"
        )

    if not content:

        raise AIServiceError(
            "Groq returned an empty response."
        )

    # ========================================================
    # PARSE JSON
    # ========================================================

    try:

        result = json.loads(
            content
        )

    except json.JSONDecodeError as e:

        print(
            "INVALID GROQ JSON:",
            content,
        )

        raise AIServiceError(
            "Groq returned invalid JSON: "
            f"{str(e)}"
        )

    # ========================================================
    # FINAL VALIDATION
    # ========================================================

    if not isinstance(
        result,
        dict,
    ):

        raise AIServiceError(
            "Groq response is not a JSON object."
        )

    # ========================================================
    # REQUIRED FIELDS
    # ========================================================

    required_fields = [
        "purpose",
        "required_information",
        "identifiers",
        "time_range",
        "notes",
    ]

    for field in required_fields:

        if field not in result:

            raise AIServiceError(
                "Groq response is missing "
                f"required field: {field}"
            )

    # ========================================================
    # TYPE SAFETY
    # ========================================================

    if not isinstance(
        result["purpose"],
        str,
    ):

        result["purpose"] = str(
            result["purpose"]
        )

    if not isinstance(
        result["required_information"],
        list,
    ):

        result["required_information"] = []

    if not isinstance(
        result["identifiers"],
        list,
    ):

        result["identifiers"] = []

    if not isinstance(
        result["notes"],
        list,
    ):

        result["notes"] = []

    # ========================================================
    # REMOVE EMPTY VALUES
    # ========================================================

    result["required_information"] = [
        str(item).strip()
        for item in result[
            "required_information"
        ]
        if item
    ]

    result["identifiers"] = [
        str(item).strip()
        for item in result[
            "identifiers"
        ]
        if item
    ]

    result["notes"] = [
        str(item).strip()
        for item in result[
            "notes"
        ]
        if item
    ]

    # ========================================================
    # RETURN
    # ========================================================

    return result