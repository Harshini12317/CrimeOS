from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.investigation import router as investigation_router
from app.routes.auth import router as auth_router
from investigation.legal_library_router import router as legal_library_router

# Import your new ingestion routes
from app.routes import audio, pdf, image, combo  # Added combo



app = FastAPI(title="CrimeOS Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Harshini's Routes
app.include_router(investigation_router)
app.include_router(auth_router)
app.include_router(legal_library_router, prefix="/api/legal-library", tags=["legal-library"])

# Your Ingestion Routes!
app.include_router(audio.router, prefix="/api/v1/audio", tags=["Audio"])
app.include_router(pdf.router, prefix="/api/v1/pdf", tags=["PDF"])
app.include_router(image.router, prefix="/api/v1/image", tags=["Image"])
app.include_router(combo.router, prefix="/api/v1/combo", tags=["Combo Master Agent"])