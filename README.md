# CrimeOS — AI-Powered Investigation & Legal Assistance Platform

> **Team VectorMinds**  
> A unified platform for digitizing police complaint management, investigation workflows, evidence handling, FIR drafting, and legal intelligence.

---

## 👥 Team

| Role | Member |
|---|---|
| **Team Leader** | Harshini J |
| Team Member | Manushri Swaminathan |
| Team Member | Srinith Nangunoori |
| Team Member | Vyomini Joshi |

---

## 🚨 About CrimeOS

**CrimeOS** is an AI-assisted platform designed to streamline police investigation and case-management workflows.

It brings complaints, cases, victims, suspects, evidence, documents, FIR drafts, investigation suggestions, and legal resources into a single system.

### Key Capabilities

- Complaint registration and management
- Victim, complainant and suspect management
- Case creation and investigation tracking
- Evidence and document management
- AI-assisted complaint summarization
- FIR draft generation
- Legal section analysis
- Legal section mapping
- Investigation suggestions
- Legal research and case-law assistance
- Legal request management
- Audio, PDF and image processing
- Officer and user authentication
- Cloud-based evidence/document storage

---

# 🏗️ Architecture

```text
                     ┌─────────────────────┐
                     │   Next.js Frontend  │
                     └──────────┬──────────┘
                                │
                              REST API
                                │
                     ┌──────────▼──────────┐
                     │   FastAPI Backend   │
                     └──────────┬──────────┘
                                │
          ┌─────────────────────┼─────────────────────┐
          │                     │                     │
     PostgreSQL/Neon        AI / Legal           Cloudinary
       Database             Intelligence         File Storage
          │                     │                     │
          └─────────────────────┼─────────────────────┘
                                │
                     Investigation Workflow
