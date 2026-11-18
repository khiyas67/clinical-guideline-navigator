# System Architecture & Technical Specification

This document details the software architecture, data flow, component interactions, and infrastructure boundaries of the **AI-Assistant for Dynamic Clinical Guideline Navigator**.

```mermaid
flowchart TD
    subgraph Frontend["Frontend Layer (React 19 + TypeScript + Vite)"]
        UI[Clinician User Interface]
        Pages[Dashboard / Guidelines / Patients / Assistant]
        State[AuthContext / API Services]
    end

    subgraph Backend["Backend Service Layer (FastAPI)"]
        Router[Query Router & Classifier]
        QC[Guideline QC & Duplicate Ingestion Pipeline]
        Embed[BGE Sentence Transformer 384-d]
        RAG[Multi-Guideline RAG Synthesizer]
        Reports[Report Generator PDF/DOCX]
    end

    subgraph Storage["Data & Vector Layer (Supabase PostgreSQL)"]
        Auth[Supabase Auth & RLS]
        Tables[(Patients / Guidelines / Documents / Decisions)]
        VectorDB[(guideline_chunks with vector 384)]
        HNSW[(HNSW Cosine Index)]
    end

    subgraph LLM["Inference Acceleration (Groq Cloud)"]
        Groq[Groq LPU Inference qwen/qwen3.8-27b]
    end

    UI --> Pages
    Pages --> State
    State -->|JWT Authenticated REST| Backend
    State -->|Supabase Client Auth & Patient DB| Storage
    Backend -->|Local Inference| Embed
    Backend -->|Vector Retrieval RPC| VectorDB
    Backend -->|Grounded System Prompt| Groq
    Groq -->|Synthesized Clinical Response| RAG
    RAG -->|Structured Answer + Citations| State
```

---

## 1. Frontend Architecture
- **Framework & Runtime:** React 19, TypeScript 5.8+, Vite 8.3 build tool.
- **Styling & Design System:** Tailwind CSS with Lucide React icons, mobile-responsive collapsible sidebar, and accessible modal overlays.
- **State Management & Routing:** 
  - React Context (`AuthContext.tsx`) manages session state and current authenticated clinician profile.
  - React Router DOM v7 manages protected routing (`/dashboard`, `/assistant`, `/patients`, `/guidelines`, `/settings`).
- **Domain Libraries (`src/lib/`):**
  - `assistant.ts`: Dispatches queries to FastAPI backend (`/api/assistant/query`) with patient and clinician authorization.
  - `guidelines.ts`: Direct Supabase queries with joins across `guideline_documents` for versioning, status, and PDF links.
  - `patients.ts`: Manages CRUD operations and clinical condition tags under Supabase RLS.
  - `decisions.ts`: Persists structured clinician actions (`accepted`, `modified`, `rejected`) with justification notes.
  - `reports.ts`: Requests formatted PDF/DOCX clinical summaries.

---

## 2. Backend Service Architecture
- **Runtime:** Python 3.11 with FastAPI and Uvicorn ASGI server.
- **Microservice Endpoints (`app/routers/`):**
  - `assistant.py`: Serves `/api/assistant/query` handling clinical inquiries and evidence synthesis.
  - `guidelines.py`: Serves `/api/guidelines/validate`, `/upload`, and `/fix-categories` for QC ingestion and metadata management.
  - `patients.py`: Serves `/api/patients/validate` for sanitization and schema verification.
  - `reports.py`: Serves `/api/reports/export` generating clinical documentation.
- **Local Embedding Engine (`app/services/embeddings.py`):**
  - Model: `BAAI/bge-small-en-v1.5` loaded locally via `sentence-transformers`.
  - Dimensions: 384 floats, normalized for exact cosine distance calculation.
  - Fallback Protection: Raises `EmbeddingModelUnavailableError` if weights are missing; never produces fabricated zero vectors.
- **Query Router (`app/services/query_router.py`):**
  - Rule-based and keyword-driven triage classifying incoming questions into `greeting`, `healthcare`, `out_of_scope`, or `unclear`.
  - Bypasses vector database for non-clinical queries to minimize latency and database load.

---

## 3. Database Architecture & Vector Indexing
- **Engine:** PostgreSQL 15+ hosted on Supabase with the `pgvector` extension enabled.
- **Tables:**
  - `public.patients`: Clinical profiles (conditions, medications, allergies, vitals).
  - `public.guidelines`: Guideline catalog (title, issuing organization, year, category, official PDF URLs).
  - `public.guideline_documents`: Physical document metadata (checksum, version, page count, processing status).
  - `public.guideline_chunks`: Granular text chunks, page numbers, section titles, and 384-dimensional vector embeddings.
  - `public.clinical_decisions`: Immutable audit records of clinician decisions with original query, answer, and modifications.
- **Vector Index:**
  - Index Type: Hierarchical Navigable Small World (HNSW).
  - Operator: `vector_cosine_ops` (`1 - (embedding <=> query_embedding)`).
  - Retrieval RPC: `match_guideline_chunks(query_embedding, match_threshold, match_count, filter_guideline_id)`.

---

## 4. End-to-End Data Flow

```mermaid
sequenceDiagram
    autonumber
    actor Clinician
    participant UI as React Frontend
    participant API as FastAPI Backend
    participant DB as Supabase pgvector
    participant Groq as Groq LLM

    Clinician->>UI: Selects Patient & Submits Clinical Question
    UI->>API: POST /api/assistant/query (question, patient_id, clinician_id)
    API->>API: Query Router validates healthcare intent
    API->>DB: Fetch authorized patient clinical profile (conditions, labs)
    API->>API: Context-enrich retrieval query & generate 384-d embedding
    API->>DB: Execute match_guideline_chunks RPC
    DB-->>API: Return top-k matching chunks with similarity scores
    API->>Groq: Generate grounded answer with strict safety rules
    Groq-->>API: Structured response with citations
    API-->>UI: QueryResponse (type, answer, sources with page & PDF URLs)
    UI->>Clinician: Renders formatted clinical guidance & evidence cards
    Clinician->>UI: Clicks Accept / Modify / Reject Decision
    UI->>DB: Insert into clinical_decisions (audit trail)
```

---

## 5. Security & Isolation Boundaries
1. **Row Level Security (RLS):** All Supabase tables have RLS policies ensuring authenticated clinicians access only their assigned patients and decisions.
2. **Stateless Backend:** FastAPI backend maintains no in-memory session cache; user identity is passed via verified Supabase credentials.
3. **No Patient PII in Retrieval Query:** Embeddings are generated from the clinical inquiry and pertinent medical conditions; patient names, phone numbers, and addresses are never embedded or transmitted to external LLM providers.
