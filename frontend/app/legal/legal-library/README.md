# Legal Library — How It Works

Legal Library is a semantic search over `legal_sections` (BNS/BNSS/BSA) and
`landmarks` (case law), plus a lookup table that maps each new-act section
back to its old-act (IPC/CrPC/IEA) equivalent. It's split across two
services: a Next.js frontend and a Python/FastAPI backend that owns the
embedding model.

## Why two services, not one

The search is **semantic**, not keyword matching — "phishing bank fraud"
should surface BNS §318 (cheating) even though the word "phishing" never
appears in the section text. That requires turning your search text into a
1024-dimension vector using the same model that embedded the rows in the
database (`intfloat/multilingual-e5-large`), then asking Postgres/pgvector
"which rows are closest to this vector."

That model only runs in Python (via `sentence-transformers`). Node/Next.js
has no equivalent, so it can't generate the query vector itself — it has to
ask the Python backend to do it.

## Request flow

```
Browser
  │  types a search, clicks Search
  ▼
Next.js Server Component  (app/legal/legal-library/page.tsx)
  │  reads ?q= and ?act= from the URL
  │  GET {NEXT_PUBLIC_API_URL}/api/legal-library/search?q=...&act_code=...
  ▼
FastAPI  (backend/investigation/legal_library_router.py)
  │
  ├─ 1. embed_query(q)              — turns your text into a 1024-dim vector
  │                                    (loads multilingual-e5-large on first
  │                                    call, cached in memory after that)
  │
  ├─ 2. _search_sections(...)       — pgvector cosine search:
  │        SELECT ... FROM legal_sections
  │        ORDER BY embedding <=> query_vector
  │        LIMIT top_k
  │
  ├─ 3. _get_crosswalk_for_sections — for each matched section, look up its
  │        old-act equivalent in legal_section_mappings
  │        (one query per section — see "why it's slow" below)
  │
  ├─ 4. _search_landmarks_by_old_section — for each crosswalked old section,
  │        find landmark judgments that mention it (ILIKE on ipc_sections)
  │
  └─ 5. _search_landmarks_by_similarity — separately, top-k landmarks that
           are semantically closest to your query text directly
  ▼
JSON response: { sections: [...], semantic_landmarks: [...] }
  ▼
Next.js Client Component  (components/legal/LegalLibraryClient.tsx)
     renders section cards, crosswalk badges, related case law
```

## Why it's slow right now

A few things stack up on every request:

1. **Model load (first request only, but slow when it happens).**
   `multilingual-e5-large` is a large model. `embedding.py` caches it with
   `@lru_cache`, so it only loads once *per running process* — but if your
   FastAPI server restarts, or you're running multiple worker processes
   (`uvicorn --workers 4`), each worker loads its own copy from disk the
   first time it handles a request. That first request can take several
   seconds; subsequent ones on the same worker are fast (~50–150ms for
   embedding alone).

2. **CPU inference.** Even after the model is loaded, encoding a query
   string on CPU (no GPU) adds real latency, just smaller than the cold
   load. This is expected and fine for search-box usage, not free for
   ~4-second-turnaround requirements.

3. **N+1 queries for crosswalk and related landmarks.** Right now,
   `_get_crosswalk_for_sections` runs one query *per matched section*
   (up to `top_k` queries), and for every crosswalk row found,
   `_search_landmarks_by_old_section` runs another query. With `top_k=6`
   this can mean 6–12+ sequential round trips to Postgres on top of the
   vector search, each paying network latency if the DB isn't co-located
   with the backend (e.g. Neon over the public internet).

4. **No caching.** Every identical search re-embeds the text and re-runs
   every query from scratch — repeated searches for the same term get no
   speedup.

5. **`force-dynamic` on the Next.js page.** The Server Component
   deliberately opts out of caching (`export const dynamic =
   "force-dynamic"`) so results are always fresh, which means every page
   load/filter click pays the full round trip above — nothing is ever
   served from a Next.js cache.

## Practical ways to speed it up (in rough order of effort)

- **Batch the crosswalk lookup.** Replace the per-section loop in
  `_get_crosswalk_for_sections` with a single query using
  `WHERE (new_act, new_section) IN (...)` (SQLAlchemy's `tuple_().in_()`),
  and similarly batch `_search_landmarks_by_old_section` with one `ILIKE`
  query using `OR` / `ANY` across all crosswalked old sections instead of
  one query per section. This alone should cut the query count from
  ~10+ down to ~3.
- **Keep the backend warm.** Make sure whatever process manager you use
  (systemd, Docker healthcheck, etc.) sends a warm-up request after
  deploy/restart so the first real user isn't the one paying the model
  load cost.
- **Lower `top_k`** for the default search (fewer sections → fewer
  crosswalk/landmark lookups) and let the user explicitly ask for more.
- **Add a short-lived cache** (in-memory dict or Redis) keyed by
  `(q, act_code, category)` for a minute or two — search-as-you-type
  tends to repeat the same queries.
- **Co-locate backend and DB** (same region as your Neon project) if
  they aren't already, to cut per-query network latency.
- **GPU or a smaller embedding model**, only worth it if query volume
  grows enough that CPU inference itself becomes the bottleneck rather
  than the network/query overhead above.

## Files involved

| File | Role |
|---|---|
| `lib/db.ts` | Next.js → Postgres direct queries (Legal Review only, not Legal Library) |
| `app/legal/legal-library/page.tsx` | Server Component — reads URL params, calls FastAPI |
| `components/legal/LegalLibraryClient.tsx` | Search box, act filter, expandable result cards |
| `backend/investigation/legal_library_router.py` | FastAPI endpoint — orchestrates the search |
| `backend/investigation/embedding.py` | Loads the model, turns text into a vector |
| `backend/investigation/config.py` | Model name, dimension, default `top_k` values |