from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.investigation import router as investigation_router

app = FastAPI(title="CrimeOS Backend")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js dev server default port
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(investigation_router)

# now these endpoints exist:
#   POST /investigation/cases/{case_id}/suggest-investigation
#   POST /investigation/suggestions/{suggestion_id}/step-by-step-guidance
#   GET  /investigation/health