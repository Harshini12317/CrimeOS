"""
Embeds incoming query text using the SAME model that produced the
stored embeddings in legal_sections and landmarks (multilingual-e5-large,
1024-dim) — but via Hugging Face's hosted Inference API instead of
loading the model locally.

Why: sentence-transformers + torch + the ~2.2GB model weights are too
heavy to deploy on this host (RAM/disk constraints). Calling HF's
feature-extraction endpoint for the same model keeps the vector space
identical to what's already stored, so no re-embedding of existing
legal_sections/landmarks rows is needed — only the *how* of computing
a query embedding changes, not the *what*.

Requires HF_API_TOKEN in the environment (a Hugging Face access token
with Inference API permissions - https://huggingface.co/settings/tokens).
"""
import time
from typing import List

import numpy as np
import requests

from investigation.config import (
    EMBEDDING_DIM,
    E5_QUERY_PREFIX,
    HF_API_URL,
    HF_API_TOKEN,
    HF_API_TIMEOUT_SECONDS,
    HF_API_MAX_RETRIES,
    HF_API_RETRY_BACKOFF_SECONDS,
)


class EmbeddingServiceError(RuntimeError):
    """Raised when the HF Inference API can't produce an embedding after retries."""


def _headers() -> dict:
    if not HF_API_TOKEN:
        raise EmbeddingServiceError(
            "HF_API_TOKEN is not set. Get a token at "
            "https://huggingface.co/settings/tokens and set it in your .env."
        )
    return {"Authorization": f"Bearer {HF_API_TOKEN}"}


def _mean_pool_and_normalize(raw: list) -> np.ndarray:
    """
    HF's feature-extraction pipeline for a sentence-transformers model
    is EXPECTED to return an already pooled+normalized embedding, i.e.
    a flat list of floats matching EMBEDDING_DIM. But depending on the
    endpoint/model revision it can instead return raw token-level
    embeddings (a [seq_len, hidden_dim] matrix). We defensively handle
    both shapes so a silent API-shape change doesn't produce garbage
    vectors: if we get a matrix, we mean-pool over tokens ourselves and
    L2-normalize, matching what sentence-transformers did locally.
    """
    arr = np.asarray(raw, dtype=np.float32)

    if arr.ndim == 1:
        vec = arr
    elif arr.ndim == 2:
        # [seq_len, hidden_dim] -> mean pool over tokens
        vec = arr.mean(axis=0)
    else:
        raise EmbeddingServiceError(
            f"Unexpected embedding response shape {arr.shape} from HF API."
        )

    norm = np.linalg.norm(vec)
    if norm > 0:
        vec = vec / norm
    return vec


def _call_hf_api(text: str) -> np.ndarray:
    payload = {"inputs": text}
    last_error = None

    for attempt in range(1, HF_API_MAX_RETRIES + 1):
        try:
            resp = requests.post(
                HF_API_URL,
                headers=_headers(),
                json=payload,
                timeout=HF_API_TIMEOUT_SECONDS,
            )
        except requests.RequestException as exc:
            last_error = exc
            time.sleep(HF_API_RETRY_BACKOFF_SECONDS * attempt)
            continue

        if resp.status_code == 200:
            return _mean_pool_and_normalize(resp.json())

        if resp.status_code == 503:
            # Model is loading (cold start on HF's serverless infra).
            # Back off and retry rather than failing the search.
            time.sleep(HF_API_RETRY_BACKOFF_SECONDS * attempt)
            last_error = RuntimeError(f"HF API 503 (model loading): {resp.text[:300]}")
            continue

        # Any other status is not retryable (bad token, bad payload, etc.)
        raise EmbeddingServiceError(
            f"HF API error {resp.status_code}: {resp.text[:300]}"
        )

    raise EmbeddingServiceError(
        f"HF API did not return a usable response after {HF_API_MAX_RETRIES} attempts. "
        f"Last error: {last_error}"
    )


def embed_query(text: str) -> List[float]:
    """
    Embed a single query string for similarity search against
    legal_sections.embedding / landmarks.embedding.

    e5 models expect a "query: " prefix on search text (the stored rows
    were embedded with a "passage: " prefix at indexing time).
    """
    prefixed = f"{E5_QUERY_PREFIX}{text.strip()}"
    vec = _call_hf_api(prefixed)

    if vec.shape[0] != EMBEDDING_DIM:
        raise EmbeddingServiceError(
            f"Embedding dim mismatch: got {vec.shape[0]}, expected {EMBEDDING_DIM}. "
            "The HF endpoint may be serving a different model/revision than the "
            "one used to build the existing legal_sections/landmarks embeddings."
        )
    return vec.tolist()


def embed_queries_batch(texts: List[str]) -> List[List[float]]:
    """
    Batch variant - useful for offline re-indexing jobs, not the live path.
    HF's feature-extraction endpoint is called once per text; there's no
    batch endpoint on the free-tier router, so this is sequential. Fine
    for offline jobs; the live query path only ever calls embed_query().
    """
    return [embed_query(t) for t in texts]