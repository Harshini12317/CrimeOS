"""
Retrieval layer. Uses the shared SQLAlchemy engine (backend/database/db.py)
so we go through the same connection pool as the rest of the backend,
rather than opening our own psycopg2 connections.

Postgres + pgvector serves as the retrieval layer directly — no separate
vector DB needed, since legal_sections and landmarks already have
IVFFLAT indexes on their embedding columns.
"""
from typing import List, Dict, Any

from sqlalchemy import text

from database.db import engine
from investigation.config import TOP_K_LEGAL_SECTIONS, TOP_K_LANDMARKS
from investigation.embedding import embed_query
from investigation.query_builder import RetrievalQuery


def search_legal_sections(rq: RetrievalQuery, top_k: int = TOP_K_LEGAL_SECTIONS) -> List[Dict[str, Any]]:
    """
    Cosine-similarity search over legal_sections.embedding.
    pgvector's `<=>` operator returns cosine distance (lower = more similar).
    """
    query_vec = embed_query(rq.query_text)

    sql = text("""
        SELECT id, act_code, section_number, title, section_text, category,
               1 - (embedding <=> (:qvec)::vector) AS similarity
        FROM legal_sections
        ORDER BY embedding <=> (:qvec)::vector
        LIMIT :top_k;
    """)
    with engine.connect() as conn:
        rows = conn.execute(sql, {"qvec": query_vec, "top_k": top_k}).mappings().all()
        return [dict(r) for r in rows]


def search_landmarks(rq: RetrievalQuery, top_k: int = TOP_K_LANDMARKS) -> List[Dict[str, Any]]:
    """
    Cosine-similarity search over landmarks.embedding.
    Optionally narrows by crime_type first if we have one — cheap
    pre-filter before vector search to improve relevance.
    """
    query_vec = embed_query(rq.query_text)

    if rq.crime_type:
        sql = text("""
            SELECT id, case_id, case_title, court, case_date, crime_type,
                   bail_outcome, bail_outcome_detailed, summary,
                   legal_principles_discussed, ipc_sections,
                   1 - (embedding <=> (:qvec)::vector) AS similarity
            FROM landmarks
            WHERE crime_type ILIKE :crime_type
            ORDER BY embedding <=> (:qvec)::vector
            LIMIT :top_k;
        """)
        params = {"qvec": query_vec, "crime_type": f"%{rq.crime_type}%", "top_k": top_k}
    else:
        sql = text("""
            SELECT id, case_id, case_title, court, case_date, crime_type,
                   bail_outcome, bail_outcome_detailed, summary,
                   legal_principles_discussed, ipc_sections,
                   1 - (embedding <=> (:qvec)::vector) AS similarity
            FROM landmarks
            ORDER BY embedding <=> (:qvec)::vector
            LIMIT :top_k;
        """)
        params = {"qvec": query_vec, "top_k": top_k}

    with engine.connect() as conn:
        rows = conn.execute(sql, params).mappings().all()
        return [dict(r) for r in rows]


def crosswalk_old_sections(rq: RetrievalQuery) -> List[Dict[str, Any]]:
    """
    If the complaint text mentions old-act sections (IPC/CrPC/IEA),
    look up their new BNS/BNSS/BSA equivalents via legal_section_mappings.
    Plain equality lookup - no embedding needed, this table is small
    and structured.
    """
    if not rq.old_sections_mentioned:
        return []

    sql = text("""
        SELECT act_pair, new_act, old_act, new_section, old_section,
               subject, summary_of_comparison
        FROM legal_section_mappings
        WHERE old_section = ANY(:old_sections);
    """)
    with engine.connect() as conn:
        rows = conn.execute(sql, {"old_sections": rq.old_sections_mentioned}).mappings().all()
        return [dict(r) for r in rows]


def retrieve_all(rq: RetrievalQuery) -> Dict[str, Any]:
    """Single entry point the router calls."""
    return {
        "legal_sections": search_legal_sections(rq),
        "landmarks": search_landmarks(rq),
        "section_crosswalk": crosswalk_old_sections(rq),
    }