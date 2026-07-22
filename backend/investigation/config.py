"""
Configuration for FR2: AI-Powered Investigation Paths pipeline.
Values are read from environment variables so this is deploy-anywhere
(no secrets hardcoded).

NOTE: DB connection is NOT configured here — this module reuses the
shared engine/session from backend/database/db.py so FR1, FR2, and
everything else in the backend hit the same pool.
"""
import os

# --- Embedding model ---
# MUST match the model used to generate embeddings already stored in
# legal_sections.embedding and landmarks.embedding, or cosine similarity
# is meaningless.
EMBEDDING_MODEL_NAME = "intfloat/multilingual-e5-large"
EMBEDDING_DIM = 1024

# e5 models require a "query: " / "passage: " prefix convention.
# Our stored rows were embedded as passages; incoming search text
# must be prefixed with "query: ".
E5_QUERY_PREFIX = "query: "

# --- Embedding inference (Hugging Face Inference API) ---
# We no longer load the model locally (sentence-transformers + torch is
# too heavy to deploy on this host). Instead we call HF's hosted
# feature-extraction endpoint for the SAME model, so the vector space
# is unchanged and no re-embedding of existing legal_sections/landmarks
# rows is required.
HF_API_URL = (
    "https://router.huggingface.co/hf-inference/models/"
    "intfloat/multilingual-e5-large/pipeline/feature-extraction"
)
HF_API_TOKEN = os.environ.get("HF_API_TOKEN")

# Network tuning for the HF call. Serverless HF endpoints can take
# 10-20s to "wake up" on first request after idling and return 503
# while the model loads, so we retry a few times with backoff rather
# than failing the officer's search outright.
HF_API_TIMEOUT_SECONDS = 30
HF_API_MAX_RETRIES = 4
HF_API_RETRY_BACKOFF_SECONDS = 3  # multiplied by attempt number

# --- LLM for synthesis (small, cheap, fast - no fine-tuning needed) ---
# Using Google Gemini for now (GOOGLE_API_KEY). Swap-friendly: only
# llm_synthesis.py needs to change if this moves to a different provider
# later, since router.py just calls generate_suggestion()/generate_step_by_step().
LLM_MODEL_SUGGESTION = "llama-3.3-70b-versatile"
LLM_MODEL_GUIDANCE = "llama-3.3-70b-versatile"     
LLM_MAX_TOKENS_SUGGESTION = 1200
LLM_MAX_TOKENS_GUIDANCE = 1500

# --- Retrieval tuning ---
TOP_K_LEGAL_SECTIONS = 6
TOP_K_LANDMARKS = 4