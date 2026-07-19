from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.investigation import router as investigation_router
from app.routes.auth import router as auth_router
from investigation.legal_library_router import router as legal_library_router

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
app.include_router(auth_router)
app.include_router(legal_library_router, prefix="/api/legal-library", tags=["legal-library"])