from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# ============================================================
# ENVIRONMENT
# ============================================================

load_dotenv()


# ============================================================
# CONFIG
# ============================================================

from app.config import cloudinary


# ============================================================
# ROUTE IMPORTS
# ============================================================

from app.routes.investigation import router as investigation_router
from app.routes.auth import router as auth_router

from investigation.legal_library_router import (
    router as legal_library_router
)

from investigation.cases import router as cases_router

from app.routes.fir_drafts import router as fir_drafts_router

from app.routes.legal_section_intelligence import (
    router as legal_section_intelligence_router
)

from app.routes import audio, pdf, image, combo

from app.routes.complaint import router as complaints_router

from app.routes.complainants import (
    router as complainants_router
)

from app.routes.victims import (
    router as victims_router
)

from app.routes.suspects import (
    router as suspects_router
)

from app.routes.evidences import (
    router as evidences_router
)

from app.routes import case

from app.routes.legal_requests import (
    router as legal_requests_router
)

from app.routes.email_test import (
    router as email_test_router
)


# ============================================================
# FASTAPI APP
# ============================================================

app = FastAPI(
    title="CrimeOS Backend"
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "http://localhost:3000",

        # IMPORTANT:
        # Replace this with your EXACT Render frontend URL.
        "https://crimeos-frontend.onrender.com",
    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)


# ============================================================
# GENERAL ROUTES
# ============================================================

app.include_router(case.router)

app.include_router(email_test_router)


# ============================================================
# AUTHENTICATION
# ============================================================

app.include_router(auth_router)


# ============================================================
# INVESTIGATION
# ============================================================

app.include_router(investigation_router)


# ============================================================
# LEGAL LIBRARY
# ============================================================

app.include_router(
    legal_library_router,
    prefix="/api/legal-library",
    tags=["legal-library"],
)


# ============================================================
# CASES
# ============================================================

app.include_router(
    cases_router,
    prefix="/api",
    tags=["cases"],
)


# ============================================================
# FIR DRAFTS
# ============================================================

app.include_router(
    fir_drafts_router,
    tags=["fir-drafts"],
)


# ============================================================
# LEGAL SECTION INTELLIGENCE
# ============================================================

app.include_router(
    legal_section_intelligence_router,
    tags=["legal-section-intelligence"],
)


# ============================================================
# INGESTION ROUTES
# ============================================================

app.include_router(
    audio.router,
    prefix="/api/v1/audio",
    tags=["Audio"],
)

app.include_router(
    pdf.router,
    prefix="/api/v1/pdf",
    tags=["PDF"],
)

app.include_router(
    image.router,
    prefix="/api/v1/image",
    tags=["Image"],
)

app.include_router(
    combo.router,
    prefix="/api/v1/combo",
    tags=["Combo Master Agent"],
)


# ============================================================
# COMPLAINT ROUTES
# ============================================================

app.include_router(
    complaints_router
)

app.include_router(
    complainants_router
)

app.include_router(
    victims_router
)

app.include_router(
    suspects_router
)

app.include_router(
    evidences_router
)


# ============================================================
# EMAIL / LEGAL REQUESTS
# ============================================================

app.include_router(
    legal_requests_router
)


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "CrimeOS Backend",
    }