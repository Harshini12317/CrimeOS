import os
import json
from pathlib import Path

import requests
import pdfplumber
from dotenv import load_dotenv

load_dotenv()


# ==========================================================
# GROQ CONFIGURATION
# ==========================================================

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

GROQ_MODEL = os.getenv(
    "GROQ_MODEL",
    "llama-3.3-70b-versatile",
)

GROQ_URL = (
    "https://api.groq.com/openai/v1/chat/completions"
)


# ==========================================================
# CUSTOM ERROR
# ==========================================================

class LegalResponseAnalysisError(Exception):
    pass


# ==========================================================
# EXTRACT PDF TEXT
# ==========================================================

def extract_pdf_text(
    file_path: str,
) -> str:

    path = Path(file_path)

    if not path.exists():

        raise LegalResponseAnalysisError(
            f"Response document not found: {path}"
        )

    if path.suffix.lower() != ".pdf":

        raise LegalResponseAnalysisError(
            "Only PDF files are currently supported."
        )

    extracted_pages = []

    try:

        with pdfplumber.open(path) as pdf:

            for page in pdf.pages:

                text = page.extract_text()

                if text:

                    extracted_pages.append(
                        text
                    )

    except Exception as e:

        raise LegalResponseAnalysisError(
            f"Failed to extract PDF text: {str(e)}"
        )

    text = "\n\n".join(
        extracted_pages
    ).strip()

    if not text:

        raise LegalResponseAnalysisError(
            "No readable text found in the PDF."
        )

    return text


# ==========================================================
# ANALYZE RESPONSE WITH GROQ
# ==========================================================

def analyze_operator_response(
    response_text: str,
    request_context: dict | None = None,
) -> dict:

    if not GROQ_API_KEY:

        raise LegalResponseAnalysisError(
            "GROQ_API_KEY is not configured."
        )

    # ------------------------------------------------------
    # Request context
    # ------------------------------------------------------

    request_context = (
        request_context or {}
    )

    agency_type = (
        request_context.get(
            "agency_type"
        )
        or "UNKNOWN"
    )

    agency_name = (
        request_context.get(
            "agency_name"
        )
        or "UNKNOWN"
    )

    request_type = (
        request_context.get(
            "request_type"
        )
        or "UNKNOWN"
    )

    required_information = (
        request_context.get(
            "required_information"
        )
        or []
    )

    # ------------------------------------------------------
    # Convert required fields to text
    # ------------------------------------------------------

    if required_information:

        required_fields_text = "\n".join(
            f"- {item}"
            for item in required_information
        )

    else:

        required_fields_text = (
            "Not specified"
        )

    # ------------------------------------------------------
    # Prompt
    # ------------------------------------------------------

    system_prompt = """
You are an investigation-response analysis assistant
for CrimeOS.

You analyze responses received from external agencies
such as banks, telecom operators, social-media platforms,
ISPs and other organizations.

Your job is to extract ONLY information actually present
in the supplied response.

Do NOT invent, infer or fabricate values.

If information was requested but is missing, put it in
missing_information.

If the response contains contradictory or unclear
information, mention it in issues.

Return ONLY valid JSON.

Use this exact structure:

{
  "summary": "short factual summary",
  "information_provided": {},
  "missing_information": [],
  "issues": [],
  "relevant_dates": [],
  "relevant_identifiers": []
}

Rules:

1. Never invent values.
2. Preserve identifiers exactly when possible.
3. Preserve monetary amounts accurately.
4. Preserve dates and times accurately.
5. If a requested field is not present, mark it missing.
6. Do not expose unnecessary personal information.
7. Do not make legal conclusions.
8. Do not decide whether the information proves a crime.
9. Only summarize and structure the supplied response.
"""

    user_prompt = f"""
Analyze this external-agency response.

AGENCY TYPE:
{agency_type}

AGENCY NAME:
{agency_name}

REQUEST TYPE:
{request_type}

INFORMATION ORIGINALLY REQUESTED:
{required_fields_text}

RESPONSE DOCUMENT:

{response_text}
"""

    payload = {

        "model": GROQ_MODEL,

        "messages": [

            {
                "role": "system",
                "content": system_prompt,
            },

            {
                "role": "user",
                "content": user_prompt,
            },

        ],

        "temperature": 0,

        "response_format": {
            "type": "json_object"
        },

    }

    headers = {

        "Authorization":
            f"Bearer {GROQ_API_KEY}",

        "Content-Type":
            "application/json",

    }

    try:

        response = requests.post(
            GROQ_URL,
            headers=headers,
            json=payload,
            timeout=90,
        )

    except requests.RequestException as e:

        raise LegalResponseAnalysisError(
            f"Groq request failed: {str(e)}"
        )

    # ------------------------------------------------------
    # HTTP error
    # ------------------------------------------------------

    if response.status_code != 200:

        try:

            error_data = (
                response.json()
            )

        except Exception:

            error_data = (
                response.text
            )

        raise LegalResponseAnalysisError(
            "Groq API error: "
            f"{response.status_code} - "
            f"{error_data}"
        )

    # ------------------------------------------------------
    # Parse response
    # ------------------------------------------------------

    try:

        data = response.json()

        content = (
            data["choices"][0]
            ["message"]
            ["content"]
        )

    except Exception as e:

        raise LegalResponseAnalysisError(
            "Invalid response received from Groq: "
            f"{str(e)}"
        )

    # ------------------------------------------------------
    # Parse JSON generated by AI
    # ------------------------------------------------------

    try:

        result = json.loads(
            content
        )

    except json.JSONDecodeError as e:

        raise LegalResponseAnalysisError(
            "Groq returned invalid JSON: "
            f"{str(e)}"
        )

    # ------------------------------------------------------
    # Ensure expected fields exist
    # ------------------------------------------------------

    result.setdefault(
        "summary",
        "",
    )

    result.setdefault(
        "information_provided",
        {},
    )

    result.setdefault(
        "missing_information",
        [],
    )

    result.setdefault(
        "issues",
        [],
    )

    result.setdefault(
        "relevant_dates",
        [],
    )

    result.setdefault(
        "relevant_identifiers",
        [],
    )

    return result