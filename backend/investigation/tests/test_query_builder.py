"""
Standalone test for query_builder.py — validates the query-construction
logic without needing a live DB or API keys.

Run with EITHER of:
    python test_query_builder.py                    (from this tests/ folder)
    python -m investigation.tests.test_query_builder (from backend/ folder)
"""
import os
import sys

# Make this runnable directly (python test_query_builder.py) regardless of
# current working directory, by putting the investigation/ folder on sys.path.
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from query_builder import build_query_from_complaint

mock_complaint = {
    "complaint_id": "CMP-2026-0001",
    "crime_type": "Cyber Fraud",
    "category": "Financial Fraud",
    "description": (
        "Complainant reports that an unknown caller posing as a bank official "
        "obtained OTP and made 3 unauthorized UPI transactions worth Rs. 85,000 "
        "from his account. Incident occurred in Ahmedabad. Complainant suspects "
        "an offence under Section 420 IPC and Section 66D IT Act."
    ),
    "ai_summary": None,  # simulate FR1 not having run yet
    "incident_location": "Ahmedabad",
    "suspect_data": None,
}

rq = build_query_from_complaint(mock_complaint)

print("query_text:")
print(" ", rq.query_text)
print("crime_type:", rq.crime_type)
print("category:", rq.category)
print("old_sections_mentioned:", rq.old_sections_mentioned)

assert "420" in rq.old_sections_mentioned, "Should detect Section 420 IPC mention"
assert rq.crime_type == "Cyber Fraud"
print("\nOK - query builder logic validated.")