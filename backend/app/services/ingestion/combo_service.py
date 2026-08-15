import os
import json
from google import genai
from google.genai import types

COMBO_SYSTEM_PROMPT = """You are the Lead Detective AI for CrimeOS. 
You will receive the 'Current Case File' (a JSON of everything we know so far) and 'New Evidence' (a JSON from a newly uploaded document, image, or audio).
Your job is to carefully merge the New Evidence into the Current Case File.

CRITICAL RULES FOR ENTITY RESOLUTION & FORMATTING:
1. DO NOT hallucinate. Only use facts provided in the JSONs.
2. DATE FORMAT: Always convert incident dates to strict YYYY-MM-DD format (e.g., '2026-08-10').
3. TIME FORMAT: Always convert incident times to strict 24-hour HH:MM format (e.g., '19:30').
4. NEVER assume a person in an image or audio is the victim unless explicitly identified as such.
5. DEEP EXTRACTION: Extract all phone numbers, emails, and addresses into their respective fields.
6. SPLIT PLURAL GROUPS INTO INDIVIDUAL CARDS: If the text mentions a group of multiple unknown suspects (e.g. 'two unidentified men' or 'three suspects'), DO NOT create a single entry with plural text like 'Two men'. You MUST split them into individual entries in the array (e.g. 'Unidentified Suspect 1' and 'Unidentified Suspect 2') so each person gets their own distinct card!

Required JSON shape:
{
  "sections": {
    "complainant_details": {"name": "", "address": "", "phone": "", "id_proof": ""},
    "incident_details": {"date": "YYYY-MM-DD", "time": "HH:MM", "location": "", "description": ""},
    "accused_details": [{"name": "", "description": "", "address": ""}]
  },
  "entities": {
    "people": [], "locations": [], "dates": [], "phone_numbers": [], "organizations": []
  },
  "key_facts": []
}
"""

def merge_evidence(current_master_json: dict, new_evidence_json: dict) -> dict:
    api_key = os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY")
    client = genai.Client(api_key=api_key)
    
    prompt = f"""
    CURRENT CASE FILE:
    {json.dumps(current_master_json)}
    
    NEW EVIDENCE TO INTEGRATE:
    {json.dumps(new_evidence_json)}
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-3.1-flash-lite',
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=COMBO_SYSTEM_PROMPT,
                response_mime_type="application/json",
                temperature=0.1, # Low temp for analytical accuracy
            ),
        )
        
        # Parse the output
        text_to_parse = response.text.strip()
        parsed_json, _ = json.JSONDecoder().raw_decode(text_to_parse)
        return parsed_json
        
    except Exception as e:
        raise RuntimeError(f"Master Agent failed to merge JSONs: {str(e)}")