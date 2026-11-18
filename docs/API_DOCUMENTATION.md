# REST API Documentation

This document describes the REST API endpoints provided by the FastAPI backend on `http://127.0.0.1:8000`.

---

## 1. System Health

### `GET /api/health`
Checks the operational status of the Supabase PostgreSQL connection, Groq API configuration, and local embedding model.

- **Request:** None
- **Response `200 OK`:**
```json
{
  "status": "healthy",
  "supabase_connected": true,
  "groq_configured": true,
  "embedding_model": "BAAI/bge-small-en-v1.5"
}
```

---

## 2. Clinical Assistant (RAG Pipeline)

### `POST /api/assistant/query`
Executes query triage, patient context enrichment, pgvector semantic retrieval, and Groq grounded synthesis.

- **Headers:** `Content-Type: application/json`
- **Request Body:**
```json
{
  "question": "What is the recommended blood pressure target for adults under 80 with hypertension?",
  "patient_id": "optional-patient-uuid",
  "clinician_id": "optional-clinician-uuid",
  "category": "Hypertension"
}
```

- **Response `200 OK`:**
```json
{
  "type": "healthcare",
  "answer": "### General Clinical Guideline Advisory (No Patient Context Selected)\n\n#### 1. Clinical Summary\nStage 1 hypertension...",
  "sources": [
    {
      "guideline_id": "3b34c0a5-bff4-4b62-b797-112e77df5d67",
      "title": "Hypertension in Adults: Diagnosis and Management",
      "organization": "NICE",
      "section": "Clinical Guidance",
      "page": 47,
      "excerpt": "Stage 1 hypertension Clinic blood pressure ranging from 140/90 mmHg to 159/99 mmHg...",
      "source_url": "https://www.nice.org.uk/guidance/ng136",
      "pdf_url": "https://www.nice.org.uk/guidance/ng136/resources/hypertension-in-adults-diagnosis-and-management-pdf-66141722710213",
      "similarity": 0.7902
    }
  ]
}
```

- **Special Response Types:**
  - `greeting`: Direct greeting text, empty `sources`.
  - `out_of_scope`: Advisory that the query is non-clinical, empty `sources`.
  - `unclear`: Clarification prompt, empty `sources`.

---

## 3. Clinical Guidelines & QC Ingestion

### `POST /api/guidelines/validate`
Uploads a clinical PDF file to verify structural integrity, extract metadata, compute SHA-256 checksums, and check for duplicates without modifying the database.

- **Headers:** `Content-Type: multipart/form-data`
- **Form Data:**
  - `file`: PDF binary file
- **Response `200 OK`:**
```json
{
  "is_valid": true,
  "checksum": "5daa56e2dcb9c4226f95df3d0a273ff7a36db5bc7ee80ef9bfa9c33ba3577d34",
  "duplicate_status": "unique",
  "metadata": {
    "title": "2022 AHA/ACC/HFSA Guideline for the Management of Heart Failure",
    "organization": "AHA/ACC/HFSA",
    "publication_year": 2022,
    "category": "Cardiovascular"
  },
  "extracted_pages": 128
}
```

### `POST /api/guidelines/upload`
Accepts a verified clinical guideline, chunks the text, computes 384-dimensional embeddings, and indexes the document into Supabase.

- **Headers:** `Content-Type: multipart/form-data`
- **Form Data:**
  - `file`: PDF file
  - `title`: Guideline title
  - `organization`: Issuing health authority
  - `category`: Specialty category (e.g., "Cardiovascular, Hypertension")
  - `publication_year`: Integer year
  - `version`: Document version string
- **Response `200 OK`:**
```json
{
  "status": "success",
  "guideline_id": "1783c41a-fe61-4f6e-abbd-937c46927309",
  "document_id": "e2f1a8c4-...",
  "chunks_created": 127
}
```

### `POST /api/guidelines/fix-categories`
Scans all existing guideline records and updates ambiguous or unclassified categories based on the clinical category lexicon.

- **Response `200 OK`:**
```json
{
  "total_scanned": 14,
  "total_updated": 0,
  "updates": []
}
```

---

## 4. Patient Validation

### `POST /api/patients/validate`
Validates and normalizes patient data prior to Supabase insertion.

- **Request Body:**
```json
{
  "full_name": "Jane Doe",
  "date_of_birth": "1965-04-12",
  "gender": "Female",
  "email": "jane.doe@example.com",
  "medical_conditions": ["Type 2 Diabetes", "Hypertension"],
  "medications": ["Metformin 1000mg", "Lisinopril 10mg"],
  "allergies": ["Penicillin"]
}
```
- **Response `200 OK`:**
```json
{
  "is_valid": true,
  "errors": {},
  "normalized": {
    "full_name": "Jane Doe",
    "medical_conditions": ["Type 2 Diabetes", "Hypertension"]
  }
}
```

---

## 5. Report Generation

### `POST /api/reports/export`
Generates a downloadable clinical consultation report in PDF or DOCX format.

- **Request Body:**
```json
{
  "format": "pdf",
  "patient_name": "Jane Doe",
  "query": "What is the recommended blood pressure target?",
  "answer": "...",
  "sources": [...]
}
```
- **Response `200 OK`:** File stream (`application/pdf` or `application/vnd.openxmlformats-officedocument.wordprocessingml.document`).
