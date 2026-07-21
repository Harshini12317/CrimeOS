import os
import json
from google import genai
from google.genai import types

COMBO_SYSTEM_PROMPT = """You are the Lead Detective AI for CrimeOS. 
You will receive the 'Current Case File' (a JSON of everything we know so far) and 'New Evidence' (a JSON from a newly uploaded document, image, or audio).
Your job is to carefully merge the New Evidence into the Current Case File.

CRITICAL RULES FOR ENTITY RESOLUTION (SUSPECTS VS VICTIMS):
1. DO NOT hallucinate. Only use facts provided in the JSONs.
2. NEVER assume a person in an image or audio is the victim unless they are explicitly identified as such.
3. If you are not 100% absolutely certain that a person in the evidence is the victim or an innocent bystander, you MUST categorize them under 'accused_details' as a potential suspect/person-of-interest. It is safer for police to investigate an unknown person than to ignore them.
4. Do not merge two suspect descriptions into one person unless the evidence makes it 100% clear they are the same individual. If unsure, list them as two separate entries.

Required JSON shape:
{
  "sections": {
    "complainant_details": {"name": "", "address": "", "phone": "", "id_proof": ""},
    "incident_details": {"date": "", "location": "", "description": ""},
    "accused_details": [{"name": "", "description": ""}],
    "narrative_text": ""
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