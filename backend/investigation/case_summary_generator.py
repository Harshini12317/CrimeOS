import os
import requests

from models.complaint import Complaint

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "openai/gpt-oss-20b"
GROQ_API_KEY = os.getenv("GROQ_API_KEY")


def generate_case_summary(complaint: Complaint) -> str | None:
    """
    Produce a concise, factual case summary from a Complaint row, suitable
    for feeding into the legal-section embedding/retrieval pipeline.
    Returns None if the LLM call fails or returns nothing usable — callers
    should fall back to complaint.description in that case, not crash.
    """
    incident_when = " ".join(
        filter(None, [
            str(complaint.incident_date) if complaint.incident_date else None,
            str(complaint.incident_time) if complaint.incident_time else None,
        ])
    )

    prompt = f"""You are assisting an Indian police officer. Summarize the following
complaint into a concise, factual 3-5 sentence case summary suitable for legal
section and case-law retrieval. Stick to facts present in the complaint —
do not invent details, do not add opinions, do not suggest legal sections.

Complaint type: {complaint.complaint_type}
Crime category: {complaint.crime_category} / {complaint.crime_subcategory}
Location: {complaint.location or "Not specified"}
Incident date/time: {incident_when or "Not specified"}

Complaint description:
{complaint.description}

Respond with ONLY the summary text, no preamble, no headers."""

    try:
        response = requests.post(
            GROQ_URL,
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": GROQ_MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0,
            },
            timeout=30,
        )
        response.raise_for_status()
        text = response.json()["choices"][0]["message"]["content"].strip()
        return text or None
    except Exception:
        # Caller decides the fallback (e.g. raw description). Don't let a
        # flaky LLM call take down the whole analyze endpoint.
        return None