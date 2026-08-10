import os
from google import genai
from google.genai import types

SUMMARY_SYSTEM_PROMPT = """You are assisting an Indian police officer. Write a concise,
factual 2-3 sentence summary of this complaint, suitable for a non-technical officer to
read as their first look at the case. Plain English, no jargon, no legal terminology,
no invented details -- stick strictly to what's in the text and key facts provided.
Output ONLY the summary text, nothing else."""


def generate_summary_from_extraction(translated_text: str, key_facts: list[str]) -> str | None:
    """
    Build the final human-readable ai_summary from already-translated narrative
    text plus the LLM-extracted key_facts list. Returns None on failure --
    callers should fall back to leaving ai_summary null rather than crash
    complaint registration over a summary failure.
    """
    if not translated_text or not translated_text.strip():
        return None

    api_key = os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return None

    facts_block = "\n".join(f"- {f}" for f in key_facts) if key_facts else "(none extracted)"
    prompt = f"""Narrative:
{translated_text}

Key facts:
{facts_block}"""

    try:
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model="gemini-3.1-flash-lite",
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=SUMMARY_SYSTEM_PROMPT,
                temperature=0,
            ),
        )
        return response.text.strip() or None
    except Exception:
        return None