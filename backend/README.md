# Clinical Navigator — Multi-Guideline RAG Backend

Production-grade clinical retrieval-augmented generation (RAG) backend powered by **FastAPI**, **Supabase PostgreSQL with pgvector**, local embeddings (**BAAI/bge-small-en-v1.5**), and **Groq** LLM inference.

---

## 1. Architecture Overview

```
React Frontend (/assistant)
      ↓  (POST /api/assistant/query)
FastAPI Backend (port 8000)
      ↓
Query Router
      ├── Greeting          → Immediate polite response (No RAG)
      ├── Out of scope      → Healthcare boundary guidance (No RAG)
      ├── Unclear           → Clarification request (No RAG)
      └── Healthcare        → Local Embedding (bge-small-en-v1.5)
                                  ↓ (384-dim vector)
                             Supabase pgvector (match_guideline_chunks)
                                  ↓ (Top-k similarity >= threshold)
                             Retrieved Evidence Chunks
                                  ↓
                             Groq API (Grounded prompt: Patient context + Evidence)
                                  ↓
                             Evidence-Grounded Clinical Answer + Source Citations
```

## 2. Prerequisites & Python Environment
- **Python**: 3.11.x
- **Operating System**: Windows / Linux / macOS
- **Supabase Project**: with PostgreSQL database and `vector` extension enabled.
### Virtual Environment Setup

From the `backend/` directory:

```bash
# Create Python 3.11 virtual environment
python -m venv .venv

# Activate on Windows (PowerShell)
.\.venv\Scripts\Activate.ps1

# Or on Windows (Command Prompt)
.\.venv\Scripts\activate.bat

# Install dependencies
pip install -r requirements.txt
```

---

## 3. Environment Variables Configuration

Copy `.env.example` to `.env` in the `backend/` folder:

```ini
# Supabase Configuration
SUPABASE_URL=https://czdsbjljysoictubzdep.supabase.co
# Obtained from Supabase Dashboard -> Project Settings -> API -> service_role (secret)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Groq API Configuration
# Obtained from https://console.groq.com/keys
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile

# RAG & Embedding Settings
EMBEDDING_MODEL=BAAI/bge-small-en-v1.5
SIMILARITY_THRESHOLD=0.40
TOP_K=5

# Server
PORT=8000
HOST=127.0.0.1
```

> **Security Note:** `GROQ_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are strictly server-side credentials and must never be exposed to the React frontend.

---

## 4. Database Setup & Supabase pgvector Migration

In your Supabase project's **SQL Editor**:

1. Run [`supabase/migrations/001_patients.sql`](../supabase/migrations/001_patients.sql)
2. Run [`supabase/migrations/002_guidelines.sql`](../supabase/migrations/002_guidelines.sql)
3. Run [`supabase/seed/verified_guidelines.sql`](../supabase/seed/verified_guidelines.sql)
4. Run [`supabase/migrations/003_rag.sql`](../supabase/migrations/003_rag.sql)
   - Enables `vector` extension
   - Creates `guideline_documents` and `guideline_chunks`
   - Creates HNSW index on `embedding vector(384)`
   - Creates `match_guideline_chunks` RPC function

---

## 5. Ingestion of Verified Guidelines

To download all verified guideline PDFs, extract pages, chunk sections, compute 384-dimensional embeddings, and index into Supabase pgvector:

```bash
python -m app.ingestion.index_guidelines
```

The script dynamically discovers all records in `public.guidelines` where `is_verified = true AND pdf_url IS NOT NULL`, computes checksums to prevent duplicate ingestion, and logs comprehensive progress.

---

## 6. Running the FastAPI Server

Start the local development server:

```bash
# From the backend/ directory with .venv active
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Interactive API documentation will be available at:
- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`

---

## 7. Running Automated Tests

Run the test suite:

```bash
pytest tests/
```

---

## 8. API Specification

### `POST /api/assistant/query`

#### Request Payload:
```json
{
  "patient_id": "00000000-0000-0000-0000-000000000000",
  "question": "What is the recommended pharmacological treatment for type 2 diabetes?",
  "category": "Diabetes"
}
```

#### Healthcare Response (Evidence Grounded):
```json
{
  "type": "healthcare",
  "answer": "According to NICE NG28 (Type 2 diabetes in adults: management), first-line pharmacological treatment is standard-release metformin, titrated gradually to minimize gastrointestinal adverse effects...",
  "sources": [
    {
      "guideline_id": "00000000-0000-0000-0000-000000000001",
      "title": "Type 2 diabetes in adults: management",
      "organization": "NICE",
      "section": "1.2 Drug treatment",
      "page": 24,
      "excerpt": "Offer standard-release metformin as the initial drug treatment for adults with type 2 diabetes...",
      "source_url": "https://www.nice.org.uk/guidance/ng28",
      "pdf_url": "https://www.nice.org.uk/guidance/ng28/resources/type-2-diabetes-in-adults-management-pdf-1837338615493",
      "similarity": 0.8421
    }
  ]
}
```

#### Greeting Response:
```json
{
  "type": "greeting",
  "answer": "Hello! 👋 How can I help you with a healthcare or clinical guideline question today?",
  "sources": []
}
```

#### Out-of-Scope Response:
```json
{
  "type": "out_of_scope",
  "answer": "I'm designed to assist with healthcare and clinical guideline-related questions. Please ask me something related to a patient's condition, diagnosis, treatment, medication, or clinical guidelines.",
  "sources": []
}
```
