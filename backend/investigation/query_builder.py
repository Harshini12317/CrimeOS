"""
Turns a complaint/case record (whatever FR1 has extracted so far, plus
raw complaint fields already in the DB) into:
  1. a natural-language query string for semantic (vector) retrieval
  2. a set of structured filters usable in SQL WHERE clauses

This is intentionally decoupled from FR1's exact output schema — it
reads from whatever fields are populated on the `complaints` row today
(crime_type, description, category, ai_summary, etc.) and will
automatically pick up FR1's richer structured extraction once that
lands, since FR1 is expected to enrich these same columns
(ai_summary, category, complainant_data/victim_data/suspect_data)
rather than introduce a new table.
"""
from dataclasses import dataclass, field
from typing import Optional, Dict, Any, List


@dataclass
class RetrievalQuery:
    query_text: str                     # for embedding / vector search
    crime_type: Optional[str] = None    # for filtering legal_sections/landmarks
    category: Optional[str] = None
    old_sections_mentioned: List[str] = field(default_factory=list)  # for legal_section_mappings crosswalk


def build_query_from_complaint(complaint: Dict[str, Any]) -> RetrievalQuery:
    """
    complaint: a dict-like row from `complaints` (optionally joined with
    `cases`), e.g.:
        {
          "complaint_id": "CMP-2026-0001",
          "crime_type": "Cyber Fraud",
          "category": "Financial Fraud",
          "description": "Complainant reports unauthorized UPI transactions...",
          "ai_summary": "Victim's UPI account was used for 3 unauthorized debits...",
          "incident_location": "Ahmedabad",
          ...
        }
    """
    parts: List[str] = []

    # Prefer ai_summary (FR1's cleaned output) once available; fall back to
    # raw description so this works even before FR1 finishes.
    if complaint.get("ai_summary"):
        parts.append(complaint["ai_summary"])
    elif complaint.get("description"):
        parts.append(complaint["description"])

    if complaint.get("crime_type"):
        parts.append(f"Crime type: {complaint['crime_type']}")
    if complaint.get("category"):
        parts.append(f"Category: {complaint['category']}")
    if complaint.get("incident_location") or complaint.get("location"):
        loc = complaint.get("incident_location") or complaint.get("location")
        parts.append(f"Location: {loc}")

    # suspect_data / victim_data are TEXT columns (likely JSON strings from
    # FR1's entity extraction) - include if present, they often carry
    # modus operandi details relevant to legal section matching.
    if complaint.get("suspect_data"):
        parts.append(str(complaint["suspect_data"]))

    query_text = " | ".join(p for p in parts if p)

    # naive scan for explicit old-act section mentions (e.g. "Section 420 IPC")
    # so we can crosswalk them via legal_section_mappings. This is a cheap
    # regex pass; FR1 may later supply this directly as structured data.
    old_sections_mentioned = _extract_old_sections(query_text)

    return RetrievalQuery(
        query_text=query_text,
        crime_type=complaint.get("crime_type"),
        category=complaint.get("category"),
        old_sections_mentioned=old_sections_mentioned,
    )


def _extract_old_sections(text: str) -> List[str]:
    import re
    # Matches patterns like "Section 420 IPC", "sec 302 IPC", "376 IPC"
    pattern = re.compile(r"(?:section|sec\.?|u/s)?\s*(\d{1,3}[A-Za-z]?)\s*(?:IPC|CrPC|IEA)", re.IGNORECASE)
    return list(dict.fromkeys(m.group(1) for m in pattern.finditer(text)))