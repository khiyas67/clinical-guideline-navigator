# Installation & Setup Guide

This guide provides step-by-step instructions for installing, configuring, and executing the **Clinical Guideline Navigator** locally on Windows, macOS, or Linux.

---

## 1. Prerequisites

Ensure you have the following installed on your system:
- **Node.js:** v18.0.0 or later (v20+ recommended)
- **npm:** v9.0.0 or later
- **Python:** v3.11.x (Python 3.11.9 recommended)
- **Git:** v2.30+
- **Supabase Account:** Free or Pro project with PostgreSQL 15+ and `pgvector` extension.
- **Groq Cloud API Key:** From [https://console.groq.com/keys](https://console.groq.com/keys).

---

## 2. Repository Clone & Environment Setup

### 2.1. Clone Repository
```bash
git clone https://github.com/<your-username>/clinical-guideline-navigator.git
cd clinical-guideline-navigator
```

### 2.2. Environment Configuration
The project uses two environment files: `backend/.env` and `frontend/.env.local`.

#### Backend Environment (`backend/.env`):
Create `backend/.env` using `backend/.env.example` as a template:
```env
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_secret_key
SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_anon_key

# Groq API Configuration
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=qwen/qwen3.8-27b

# Local Embeddings Configuration
EMBEDDING_MODEL=BAAI/bge-small-en-v1.5
SIMILARITY_THRESHOLD=0.45
TOP_K=5

# Server Port
HOST=127.0.0.1
PORT=8000
```

#### Frontend Environment (`frontend/.env.local`):
Create `frontend/.env.local` using `frontend/.env.example` as a template:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_anon_key
VITE_API_BASE_URL=http://127.0.0.1:8000
```

---

## 3. Database Setup & Migrations

Execute the SQL migration scripts located in `database/migrations/` sequentially in the **Supabase SQL Editor**:

1. `database/migrations/001_patients.sql`
2. `database/migrations/002_guidelines.sql`
3. `database/migrations/003_rag.sql`
4. `database/migrations/004_clinical_decisions.sql`
5. `database/migrations/005_fix_schema_compatibility.sql`
6. `database/migrations/006_patient_email_and_validation.sql`
7. `database/migrations/007_safe_guideline_cleanup.sql`

*Optional baseline seed:* Run `database/seed/verified_guidelines.sql` if starting from a fresh database instance.

---

## 4. Backend Installation & Execution

### 4.1. Setup Python Virtual Environment
```bash
# Windows
python -m venv backend\.venv
backend\.venv\Scripts\activate

# macOS / Linux
python3 -m venv backend/.venv
source backend/.venv/bin/activate
```

### 4.2. Install Python Dependencies
```bash
pip install -r backend/requirements.txt
```

### 4.3. Run Backend Server
```bash
# Windows / Linux / macOS
python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload
```
- Interactive Swagger API Documentation: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- Health Check: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

---

## 5. Frontend Installation & Execution

Open a new terminal window:

### 5.1. Install NPM Packages
```bash
cd frontend
npm install
```

### 5.2. Run Development Server
```bash
npm run dev
```
- Open your browser at [http://localhost:5173](http://localhost:5173).

### 5.3. Build for Production
```bash
npm run build
```
The compiled output is generated in `frontend/dist/`.

---

## 6. Running Automated Tests

To verify your installation:
```bash
# Backend unit & integration tests
backend\.venv\Scripts\python.exe -m pytest backend/tests/ -v

# Frontend TypeScript check
npm --prefix frontend run build
```
All 28 backend tests should pass and the frontend build should complete with 0 errors.
