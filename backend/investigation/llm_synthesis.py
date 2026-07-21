"""
Synthesis layer: takes the retrieved legal sections + landmark judgments
and asks a model to reason over them and produce a structured suggestion.
The model never invents section numbers from memory — it can only
reference what was retrieved, which is the core hallucination guard
of this design.

Uses Groq (OpenAI-compatible API, native JSON mode). Reads GROQ_API_KEY
from env.

Two separate calls, matching FR2's spec:
  - generate_suggestion(): FR2a/FR2c - path + recommended sections + case law
    (always generated per case)
  - generate_step_by_step(): FR2b - detailed guidance, ONLY on officer request
"""
import json
import os
from typing import Dict, Any, List

from groq import Groq

from investigation.config import (
    LLM_MODEL_SUGGESTION,
    LLM_MODEL_GUIDANCE,
    LLM_MAX_TOKENS_SUGGESTION,
    LLM_MAX_TOKENS_GUIDANCE,
)

client = Groq(api_key=os.environ["GROQ_API_KEY"])

# --- Mock mode: set MOCK_LLM=1 in your .env to bypass real Groq calls
# and test the rest of the pipeline (DB join, retrieval, storage) while
# API issues are being sorted out separately.
MOCK_LLM = os.environ.get("MOCK_LLM", "0") == "1"

_MOCK_SUGGESTION = {
    "suggested_path": [
        "[MOCK] Verify bank/UPI transaction logs for the account",
        "[MOCK] Record complainant's detailed statement",
        "[MOCK] Trace mobile number used by the caller",
    ],
    "recommended_sections": [
        {"act_code": "MOCK", "section_number": "000", "title": "Mock section", "relevance_reason": "This is placeholder data - MOCK_LLM=1 is set"}
    ],
    "case_law_refs": [],
    "notes": "MOCK MODE ACTIVE - set MOCK_LLM=0 or remove it once your Groq setup is fixed",
}

_MOCK_GUIDANCE = {
    "steps": [
        {"step_number": 1, "action": "[MOCK] This is placeholder guidance", "legal_basis": "MOCK_LLM=1 is set"}
    ]
}


SUGGESTION_SYSTEM_PROMPT = """You are an assistant supporting police officers in India during \
the investigation of a registered case. You are given:
1. Facts of a complaint/case
2. A shortlist of legal sections retrieved from a database (BNS/BNSS/BSA and \
   their old IPC/CrPC/IEA equivalents where applicable)
3. A shortlist of landmark judgments retrieved from a database

STRICT RULES:
- Only recommend legal sections that appear in the provided retrieved list. \
Never invent a section number or act you were not given.
- Only cite case law that appears in the provided retrieved list.
- If nothing retrieved is relevant, say so explicitly rather than forcing a match.
- Keep the "suggested_path" HIGH-LEVEL (a short list of investigation leads/steps \
to pursue, e.g. "verify bank statements", "record victim statement u/s ..."). \
Do NOT produce a full detailed step-by-step procedure here.

Respond with JSON matching this schema:
{
  "suggested_path": ["<lead 1>", "<lead 2>", ...],
  "recommended_sections": [
    {"act_code": "...", "section_number": "...", "title": "...", "relevance_reason": "..."}
  ],
  "case_law_refs": [
    {"case_title": "...", "court": "...", "bail_outcome": "...", "relevance_reason": "..."}
  ],
  "notes": "<any caveat, e.g. low-confidence retrieval, or empty string>"
}
"""

GUIDANCE_SYSTEM_PROMPT = """You are assisting a police officer who has requested detailed, \
step-by-step investigative guidance for a specific case, building on a suggestion already \
generated. Produce a clear, numbered, procedurally sound set of steps grounded ONLY in the \
sections and case law already identified (do not introduce new sections/case law here).

Respond with JSON matching this schema:
{
  "steps": [
    {"step_number": 1, "action": "...", "legal_basis": "... (optional, cite from given sections)"}
  ]
}
"""


def _generate_json(model_name: str, system_prompt: str, max_tokens: int, user_content: dict) -> Dict[str, Any]:
    if MOCK_LLM:
        # Return canned output based on which system prompt is calling this,
        # so both generate_suggestion() and generate_step_by_step() are covered.
        if system_prompt is SUGGESTION_SYSTEM_PROMPT:
            return _MOCK_SUGGESTION
        return _MOCK_GUIDANCE

    response = client.chat.completions.create(
        model=model_name,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": json.dumps(user_content, indent=2)},
        ],
        max_tokens=max_tokens,
        temperature=0.2,  # low temperature - this is a factual retrieval-grounded task
        response_format={"type": "json_object"},  # Groq's native JSON mode
    )
    return json.loads(response.choices[0].message.content)


def generate_suggestion(
    complaint_facts: str,
    retrieved_sections: List[Dict[str, Any]],
    retrieved_landmarks: List[Dict[str, Any]],
    section_crosswalk: List[Dict[str, Any]],
) -> Dict[str, Any]:
    user_content = {
        "complaint_facts": complaint_facts,
        "retrieved_legal_sections": [
            {
                "act_code": s["act_code"],
                "section_number": s["section_number"],
                "title": s.get("title"),
                "section_text": s.get("section_text", "")[:800],  # keep prompt small
                "similarity": round(s.get("similarity", 0), 3),
            }
            for s in retrieved_sections
        ],
        "retrieved_landmark_judgments": [
            {
                "case_title": l.get("case_title"),
                "court": l.get("court"),
                "crime_type": l.get("crime_type"),
                "bail_outcome": l.get("bail_outcome"),
                "summary": (l.get("summary") or "")[:500],
                "similarity": round(l.get("similarity", 0), 3),
            }
            for l in retrieved_landmarks
        ],
        "old_to_new_section_crosswalk": section_crosswalk,
    }
    return _generate_json(LLM_MODEL_SUGGESTION, SUGGESTION_SYSTEM_PROMPT, LLM_MAX_TOKENS_SUGGESTION, user_content)


def generate_step_by_step(
    complaint_facts: str,
    prior_suggestion: Dict[str, Any],
) -> Dict[str, Any]:
    """Called ONLY when an officer explicitly clicks 'get step-by-step guidance'."""
    user_content = {
        "complaint_facts": complaint_facts,
        "prior_suggestion": prior_suggestion,
    }
    return _generate_json(LLM_MODEL_GUIDANCE, GUIDANCE_SYSTEM_PROMPT, LLM_MAX_TOKENS_GUIDANCE, user_content)