# FR2 — AI-Powered Investigation Paths

Location: `backend/investigation/`

## What this is
A router module implementing FR2 (a, b, c):
- Suggests investigation leads based on complaint facts
- Recommends relevant BNS/BNSS/BSA legal sections (with old-act crosswalk)
- Recommends relevant landmark case law
- Generates detailed step-by-step guidance, **only when explicitly requested**

## Why this design
- **No new vector DB service.** `legal_sections` and `landmarks` already have
  pgvector embeddings + IVFFLAT indexes. Retrieval is plain SQL
  (`ORDER BY embedding <=> query_vector`).
- **No custom/fine-tuned model.** SOPs and law text are static reference
  data — retrieval + a small LLM (Claude Haiku) is faster to deploy,
  cheaper, and easier to update.
- **Shares your DB pool.** Uses `engine`/`SessionLocal`/`Base` from
  `backend/database/db.py` — no separate connection setup, same pool as
  FR1 and the rest of the backend.
- **Embedding model matches existing data**: `intfloat/multilingual-e5-large`
  (1024-dim), same as what's already stored.
- **Decoupled from FR1.** Reads whatever's already in `complaints`
  (`description`, `ai_summary`, `crime_type`, `category`, etc.) and prefers
  `ai_summary` once FR1 populates it.

## Folder structure
```
backend/
├── database/
│   └── db.py                          ← existing shared engine/session (unchanged)
├── investigation/
│   ├── migrations/
│   │   └── 001_create_investigation_suggestions.sql
│   ├── tests/
│   │   └── test_query_builder.py
│   ├── config.py
│   ├── embedding.py
│   ├── query_builder.py
│   ├── retrieval.py
│   ├── llm_synthesis.py
│   ├── models.py                      ← SQLAlchemy ORM model (uses shared Base)
│   ├── router.py                      ← APIRouter, mount into main app
│   ├── requirements.txt
│   └── README.md
└── main.py                            ← wherever your top-level FastAPI app lives
```

## Mounting into the shared app
In your top-level `backend/main.py` (or wherever the FastAPI `app` is created):
```python
from investigation.router import router as investigation_router

app.include_router(investigation_router)
```
Endpoints become available at:
- `POST /investigation/cases/{case_id}/suggest-investigation`
- `POST /investigation/suggestions/{suggestion_id}/step-by-step-guidance?officer_id=...`
- `GET /investigation/health`

## Setup
```bash
pip install -r investigation/requirements.txt
# DATABASE_URL should already be in your existing .env, picked up by
# backend/database/db.py's load_dotenv().
# Add GOOGLE_API_KEY to the same .env for the LLM synthesis step
# (get one at https://aistudio.google.com/apikey).

# apply migration (or fold into your existing Alembic setup — see note below)
psql $DATABASE_URL -f investigation/migrations/001_create_investigation_suggestions.sql
```

## Assumption to confirm: models.py
`InvestigationSuggestion.case` is defined with a `relationship("Case", ...)`,
assuming your `cases` table's ORM model class is literally named `Case`
somewhere already registered on `Base`. If your FR1/existing models use a
different class name, or you're not using ORM relationships at all (raw
Core/SQL), tell me and I'll adjust — this line is the only place that
guesses at your existing model layer instead of just the DB schema.

If you're using Alembic for migrations rather than raw `.sql` files,
say so and I'll convert `migrations/001_....sql` into a proper Alembic
revision instead, so it fits your existing migration history.

## Status
- Query builder logic — tested, passes (`tests/test_query_builder.py`)
- Full pipeline wiring (retrieval -> LLM -> persistence via ORM) — code complete
- Not yet run against your real DB/API — needs a live `case_id` to confirm
  retrieval quality and LLM output format end-to-end

## Open items for your review
1. Confirm the `Case` ORM class name (see assumption above), or confirm you'd
   rather I drop the `relationship()` and keep this table loosely coupled
   (no ORM-level relationship, just the FK).
2. Alembic or raw SQL migrations — which does this backend use?
3. Where should `officer_feedback` (accept/reject/edit) be written — a PATCH
   endpoint I add to this router, or another service/UI layer?
4. OK to proceed with Claude Haiku 4.5 as the synthesis model?