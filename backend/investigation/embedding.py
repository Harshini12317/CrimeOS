"""
Embeds incoming query text using the SAME model that produced the
stored embeddings in legal_sections and landmarks (multilingual-e5-large,
1024-dim). This model is small enough to run on CPU with low latency
(~50-150ms per query on a modest instance) — no GPU needed for this
use case since we only embed short query strings, not bulk corpora.
"""
from functools import lru_cache
from typing import List

import numpy as np

from investigation.config import EMBEDDING_MODEL_NAME, EMBEDDING_DIM, E5_QUERY_PREFIX


@lru_cache(maxsize=1)
def _get_model():
    """
    Lazily load the model once per process and cache it.
    Using sentence-transformers because multilingual-e5-large is
    published with sentence-transformers-compatible weights, and it
    handles the mean-pooling + normalization e5 requires.
    """
    from sentence_transformers import SentenceTransformer
    return SentenceTransformer(EMBEDDING_MODEL_NAME)


def embed_query(text: str) -> List[float]:
    """
    Embed a single query string for similarity search against
    legal_sections.embedding / landmarks.embedding.

    e5 models expect a "query: " prefix on search text (the stored rows
    were embedded with a "passage: " prefix at indexing time).
    """
    model = _get_model()
    prefixed = f"{E5_QUERY_PREFIX}{text.strip()}"
    vec = model.encode(prefixed, normalize_embeddings=True)
    vec = np.asarray(vec, dtype=np.float32)

    if vec.shape[0] != EMBEDDING_DIM:
        raise ValueError(
            f"Embedding dim mismatch: got {vec.shape[0]}, expected {EMBEDDING_DIM}. "
            "Check EMBEDDING_MODEL_NAME matches what was used to build the "
            "existing legal_sections/landmarks embeddings."
        )
    return vec.tolist()


def embed_queries_batch(texts: List[str]) -> List[List[float]]:
    """Batch variant - useful for offline re-indexing jobs, not the live path."""
    model = _get_model()
    prefixed = [f"{E5_QUERY_PREFIX}{t.strip()}" for t in texts]
    vecs = model.encode(prefixed, normalize_embeddings=True)
    return [np.asarray(v, dtype=np.float32).tolist() for v in vecs]