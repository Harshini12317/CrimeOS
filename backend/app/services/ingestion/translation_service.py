import os
from google import genai
from google.genai import types

TRANSLATION_SYSTEM_PROMPT = """You are a translation engine for a police complaint-
management system (CrimeOS). You will receive complaint narrative text that may be in
Gujarati, Hindi, English, or a mix of these. Translate it into clear, natural English.

Rules:
- Preserve all facts exactly -- do not add, omit, or soften any detail.
- Keep proper nouns (names, places) as-is, transliterated to Latin script if not
  already in English, rather than translated as words.
- Output ONLY the translated text. No preamble, no notes, no markdown.
- If the input is already entirely in English, return it unchanged.
"""


def translate_to_english(raw_text: str) -> str | None:
    """
    Translate extracted narrative text (Gujarati/Hindi/English/mixed) into
    English. Returns None on failure -- callers should fall back to storing
    only the raw text and leaving translated_text null, not crash ingestion.
    """
    if not raw_text or not raw_text.strip():
        return None

    api_key = os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return None

    try:
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model="gemini-3.1-flash-lite",
            contents=raw_text[:15000],
            config=types.GenerateContentConfig(
                system_instruction=TRANSLATION_SYSTEM_PROMPT,
                temperature=0,
            ),
        )
        return response.text.strip() or None
    except Exception:
        return None