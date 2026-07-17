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

# --- LLM for synthesis (small, cheap, fast - no fine-tuning needed) ---
# Using Google Gemini for now (GOOGLE_API_KEY). Swap-friendly: only
# llm_synthesis.py needs to change if this moves to a different provider
# later, since router.py just calls generate_suggestion()/generate_step_by_step().
LLM_MODEL_SUGGESTION = "gemini-2.0-flash"   # FR2a: path + sections + case law
LLM_MODEL_GUIDANCE = "gemini-2.0-flash"     # FR2c: on-demand step-by-step guidance
LLM_MAX_TOKENS_SUGGESTION = 1200
LLM_MAX_TOKENS_GUIDANCE = 1500

# --- Retrieval tuning ---
TOP_K_LEGAL_SECTIONS = 6
TOP_K_LANDMARKS = 4