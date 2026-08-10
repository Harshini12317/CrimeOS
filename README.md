# ⚖️ CrimeOS — AI-Powered Police Investigation & Legal Intelligence Platform

CrimeOS is an advanced, AI-driven operating system designed to modernize law enforcement workflows, simplify criminal case management, and streamline compliance with India’s new criminal laws (**Bharatiya Nyaya Sanhita - BNS**, **Bharatiya Nagarik Suraksha Sanhita - BNSS**, and **Bharatiya Sakshya Adhiniyam - BSA**), while maintaining real-time crosswalk compatibility with their historical counterparts (**IPC, CrPC, and IEA**).

The system brings together a modern web frontend client and a powerful FastAPI service to automate evidence parsing, semantic law search, case summaries, official FIR generation, and legal notice dispatch.

---

## 🛠️ System Architecture & Workflow

The diagram below outlines the full lifecycle of a complaint inside CrimeOS: from evidence uploading on the frontend, to AI processing on the backend, and automatic document distribution.

```mermaid
graph TD
    %% Frontend Interaction
    subgraph Frontend Client (React/Next.js)
        UI[CrimeOS Portal UI] -->|1. File Upload / Event| APIReq[FastAPI Request]
        UI -->|2. Search Queries| SearchReq[Semantic Search Query]
        UI -->|3. Save / Action| ExecReq[Execute Actions]
    end

    %% Ingestion Section
    subgraph Ingestion & Fusion (FastAPI Backend)
        APIReq --> AudioProc[Audio Ingestion <br> Whisper AI]
        APIReq --> DocProc[PDF / Image Ingestion <br> Pytesseract / PDFPlumber]
        
        AudioProc & DocProc --> ExtractedJSON[Extracted Evidence JSON]
        ExtractedJSON --> MasterAgent[Combo Master Agent <br> Gemini 3.1 Flash-Lite]
        
        MasterAgent -->|Merge & Resolve Entities| MergedJSON[Merged Case File JSON]
    end

    %% Database & Intelligence Section
    subgraph Storage & Legal Intelligence
        MergedJSON --> DB[(Neon PostgreSQL + pgvector)]
        
        %% Vector Search
        SearchReq -->|1024-d Embedding| QueryVec[multilingual-e5-large]
        QueryVec -->|Cosine Distance SQL| VectorMatch{pgvector Semantic Match}
        
        VectorMatch -->|Legal References| LegalSec[Legal Sections <br> BNS / BNSS / BSA]
        VectorMatch -->|Bail judgments| LandmarkCases[Landmark Cases <br> SnehaDeshmukh/IndianBailJudgments]
        
        LegalSec -->|Crosswalk Mapping| LegalMapping[BNS ↔ IPC <br> BNSS ↔ CrPC <br> BSA ↔ IEA]
    end

    %% Execution and Outputs
    subgraph Document Automation & Delivery
        ExecReq -->|FIR Draft Request| WordGen[FIR Word Compiler <br> python-docx]
        ExecReq -->|Legal Request Trigger| PDFGen[ReportLab PDF Engine]
        
        WordGen -->|.docx download| UI
        PDFGen -->|Upload| Cloudinary[Cloudinary CDN]
        Cloudinary -->|Secure URL| EmailService[aiosmtplib Email Service]
        EmailService -->|SMTP Email| Receiver[Recipient Agencies <br> Banks, ISPs, Cellular Providers]
    end
```

---

## 💻 Frontend Client (CrimeOS Portal)

The frontend client serves as the user-facing workspace for police officers and investigation leads. It is designed to interface directly with the backend API on port `8000`.

### Core Features & Portals
1. **User Authentication Dashboard**: Login and registration portal for officers. Restricts actions depending on roles (e.g. Investigation Officers (IO) vs. senior admins).
2. **Interactive Case Workspace**:
   - Lists active cases, registered complaints, and details (complainants, victims, suspects, and logged evidence).
   - Dynamic assigning engine to dispatch cases directly to available IOs.
3. **Ingestion Portal**: 
   - A drag-and-drop workspace supporting the upload of audio testimonies (`.m4a`/`.mp3`), scanned documents/images (`.png`/`.jpg`), and text PDFs.
   - Triggers Whisper transcription and Tesseract OCR backend routes and displays the parsed text.
   - Presents a "Master Fusion Review" where officers can accept or reject the Combo Master Agent's merged JSON case file results.
4. **Legal Search & Intelligence Center**:
   - **Semantic Search**: Text box allowing officers to type case descriptions and view matching criminal act sections (BNS/BNSS/BSA) and landmark case judgments instantly.
   - **Act Comparisons**: Displays side-by-side text comparisons between New Acts (e.g. BNS) and Old Acts (e.g. IPC) so officers can compare changes in section numbers and definitions.
5. **Document Studio & Action Center**:
   - **FIR Compiler**: Allows editing generated summaries and legal sections before downloading the finalized FIR document in Word `.docx` format.
   - **Legal Request Dispatcher**: A form-based tool to generate official Section 91 notices. Renders a signed PDF, uploads it to Cloudinary, and emails it to organizations with a single click.

### Frontend Installation & Setup
```bash
# Clone the frontend repository (typically co-located or mapped next to the backend)
cd frontend

# Install Node dependencies
npm install

# Start the local development server (running on port 3000)
npm run dev
```

---

## ⚙️ Backend Service (FastAPI)

The backend is built in Python, using Uvicorn to handle asynchronous requests. It communicates with Neon PostgreSQL database utilizing SQLAlchemy ORM.

### Tech Stack
- **Framework**: FastAPI (Python)
- **Database**: Serverless Neon PostgreSQL (utilizing the `pgvector` extension for cosine distance queries).
- **Core AI Integrations**:
  - **Gemini 3.1 Flash-Lite**: Evidence merging and entity sorting.
  - **Groq API**: SOP compilation and case summaries text synthesis.
  - **Hugging Face API**: Remote inference for E5 multilingual large text embeddings.
  - **OpenAI Whisper**: Local/API audio transcribing.
- **Compilers**: ReportLab (PDF), python-docx (Microsoft Word).

### Backend Project Directory Structure
```
backend/
├── app/
│   ├── config/              # Configuration (Cloudinary API client)
│   ├── core/                # Core helper functions (auth utilities, security)
│   ├── routes/              # FastAPI Router Controllers (audio, combo, complaints, legal intelligence)
│   ├── schemas/             # Pydantic Schemas for validation
│   ├── services/            # Main logic services (complaint, ingestion, email, legal requests)
│   └── main.py              # Main API entry point
├── database/
│   ├── db.py                # Database pool connection and session provider
│   └── init_db.py           # DB connection tester
├── investigation/
│   ├── tests/               # Pytest testing scripts (query builder logic checks)
│   ├── embedding.py         # Embedding utilities via Hugging Face Inference API
│   ├── legal_library_router.py # Legal search endpoints
│   ├── llm_synthesis.py     # LLM synthesis logic (Groq / Claude)
│   ├── query_builder.py     # Cosine similarity SQL builders
│   ├── retrieval.py         # DB vector retrieval routines
│   └── README.md            # Investigation module documentation
├── models/                  # SQLAlchemy ORM Model definitions (User, Case, Suspect, etc.)
├── scripts/                 # Seeding scripts for db initialization
├── .env                     # App configuration and API keys
└── requirements.txt         # Core dependencies
```

---

## 📡 API Routing Reference Table

| Category | Endpoint | Method | Description |
| :--- | :--- | :---: | :--- |
| **Authentication** | `/auth/register` | `POST` | Create a new officer account |
| | `/auth/login` | `POST` | Authenticate and obtain JWT token |
| **Complaints** | `/api/complaints` | `POST` | Register a new complaint |
| | `/api/complaints` | `GET` | Retrieve list of registered complaints |
| | `/api/complaints/io` | `GET` | Get active Investigation Officers |
| | `/api/complaints/categories` | `GET` | List available crime categories & subcategories |
| | `/api/complaints/{id}/assign` | `POST` | Assign a complaint to an officer (creating a Case) |
| **Evidence Ingestion** | `/api/v1/audio/upload` | `POST` | Upload and transcribe audio file |
| | `/api/v1/pdf/upload` | `POST` | Extract text from PDF document |
| | `/api/v1/image/upload` | `POST` | OCR scan image text |
| | `/api/v1/combo/merge/` | `POST` | Merge evidence JSON into the master case record |
| **Legal Intelligence**| `/investigation/cases/{case_id}/suggest-investigation` | `POST` | Synthesize matched sections, SOPs, and judgments |
| | `/api/legal-library/search` | `GET` | Search legal sections and landmarks semantically |
| **FIR Drafts** | `/api/fir-drafts` | `POST` | Save current FIR draft |
| | `/api/fir-drafts` | `GET` | Get draft selection history |
| | `/api/fir-drafts/{id}/download` | `GET` | Download FIR draft as editable Word `.docx` file |
| **Legal Requests** | `/api/legal-requests` | `POST` | Create a notice/summons draft |
| | `/api/legal-requests/{id}/generate` | `POST` | Generate PDF and upload to Cloudinary CDN |
| | `/api/legal-requests/{id}/send` | `POST` | Send generated PDF notice via email |

---

## 🚀 Step-by-Step Installation & Bootstrapping

### 1. Setup Environment Configuration
Create a `.env` file inside `backend/.env` containing the following secrets:
```ini
DATABASE_URL=postgresql://<user>:<password>@<host>/<database>?sslmode=require
JWT_SECRET_KEY=your_jwt_signing_secret_key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

GEMINI_API_KEY=your_gemini_api_key
GOOGLE_API_KEY=your_google_api_key
GROQ_API_KEY=your_groq_api_key
HF_API_TOKEN=your_huggingface_token

CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_gmail_app_password
SMTP_FROM=your_email@gmail.com
```

### 2. Initialize Backend Dependencies
```bash
cd backend
python -m venv venv
venv\Scripts\activate   # Windows
source venv/bin/activate # Unix/macOS
pip install -r requirements.txt
```

### 3. Load Datasets & Seed Vector DB
Run the seed scripts in order to download official legal chapters, landmark cases, and old-to-new act mappings from Hugging Face/CSV files:
```bash
# Ingest criminal sections
python scripts/seed_db.py

# Ingest bail landmarks
python scripts/seed_landmarks.py

# Map BNS to IPC/CrPC/IEA
python scripts/seed_mappings.py --csv-dir ./scripts
```

### 4. Boot Up Servers
Run the backend server:
```bash
# From backend directory
uvicorn app.main:app --reload --port 8000
```
Run the frontend server:
```bash
# From frontend directory
npm run dev
```

### 5. Running Tests
Verify backend query compiler logic using pytest:
```bash
pytest investigation/tests/
```
