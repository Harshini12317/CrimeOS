from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.investigation import router as investigation_router
from app.routes.auth import router as auth_router
from investigation.legal_library_router import router as legal_library_router
from app.routes.fir_drafts import router as fir_drafts_router
from investigation.cases import router as cases_router
from app.routes.legal_section_intelligence import router as legal_section_intelligence_router
# Import your new ingestion routes
from app.routes import audio, pdf, image, combo  # Added combo
from app.routes import workflow
from app.routes.complaint import router as complaints_router
from fastapi import FastAPI

from app.routes.complainants import router as complainants_router
from app.routes.victims import router as victims_router
from app.routes.suspects import router as suspects_router
from app.routes.evidences import router as evidences_router


app = FastAPI(
    title="CrimeOS API"
)




app = FastAPI(title="CrimeOS Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(workflow.router)

# Investigation and legal suggestion routes
app.include_router(investigation_router)
app.include_router(auth_router)
app.include_router(legal_library_router, prefix="/api/legal-library", tags=["legal-library"])
app.include_router(cases_router, prefix="/api", tags=["cases"])
app.include_router(fir_drafts_router, tags=["fir-drafts"])
app.include_router(legal_section_intelligence_router, tags=["legal-section-intelligence"])

# Ingestion Routes
app.include_router(audio.router, prefix="/api/v1/audio", tags=["Audio"])
app.include_router(pdf.router, prefix="/api/v1/pdf", tags=["PDF"])
app.include_router(image.router, prefix="/api/v1/image", tags=["Image"])
app.include_router(combo.router, prefix="/api/v1/combo", tags=["Combo Master Agent"])


#Complaint ingestion routes
app.include_router(complaints_router)

app.include_router(complainants_router)
app.include_router(victims_router)
app.include_router(suspects_router)
app.include_router(evidences_router)