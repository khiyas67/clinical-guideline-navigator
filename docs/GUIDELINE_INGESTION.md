# Guideline Quality Control & Ingestion Pipeline

This document details the document authentication, duplicate detection, chunking, and embedding pipeline implemented in `backend/app/services/guideline_qc.py` and `backend/app/ingestion/chunker.py`.

---

## 1. Quality Control & Authenticity Analysis

To prevent ingestion of non-medical documents (e.g., invoices, recipes, source code, advertisements), the system subjects every uploaded document to strict validation before database entry:

1. **Format & Structural Validation:**
   - Checks PDF magic bytes (`%PDF-`).
   - Ensures the document contains readable text layers (scanned image-only PDFs lacking OCR are rejected).
   - Rejects empty documents and corrupt binary streams.
2. **Clinical Lexicon Scoring:**
   - Evaluates the document against clinical practice vocabulary (e.g., *recommendation, consensus, randomized controlled trial, clinical practice guideline, pharmacotherapy, contraindication*).
   - Non-clinical documents fail the authenticity score and are rejected with informative error messages.
3. **SHA-256 Checksum Computation:**
   - Computes a cryptographic SHA-256 hash of the entire file byte stream.
   - Compares the checksum against all existing records in `public.guideline_documents` to block exact duplicate uploads.
4. **Edition & Version Detection:**
   - If an uploaded guideline matches an existing title but possesses a distinct SHA-256 checksum and publication year, it is flagged as a new revision or edition rather than an exact duplicate.

---

## 2. Text Extraction & Section-Aware Chunking

Once verified, the document is processed into granular, indexed chunks:
- **Page-Level Extraction:** Extracts plain text while tracking individual physical page numbers (1-indexed).
- **Heading Detection:** Uses regular expression heuristics to capture clinical section headers:
  - Examples: `Section 1.1 First-Line Pharmacotherapy`, `Chapter 3 Glycemic Targets`, `Table 4 Renal Dosing Thresholds`.
- **Sliding Window Chunking:**
  - Chunk Size: 400–600 tokens (approx. 1,500–2,200 characters).
  - Overlap: 50 tokens (approx. 200 characters) to ensure clinical sentences spanning boundaries remain coherent.
  - Metadata Binding: Every chunk retains its `page_number`, `section_title`, and reference to both the parent `guideline_id` and physical `document_id`.

---

## 3. Dense Embedding Generation

- **Model:** `BAAI/bge-small-en-v1.5` running locally.
- **Dimensionality:** 384 floating-point numbers.
- **Normalization:** Vectors are L2-normalized so that cosine similarity is computed directly via the inner product or PostgreSQL's `<=>` cosine distance operator:
  $$\text{Cosine Similarity} = 1 - (\mathbf{u} \cdot \mathbf{v})$$
- **Database Persistence:** Inserted in batches into `public.guideline_chunks` using parameterized SQL queries.

---

## 4. Current Indexed Guidelines Library (Phase 12.6)

All 8 clinical categories contain authentic, verified guidelines:

| Category | Guideline Title | Organization | Year | Direct PDF Link |
|---|---|---|:---:|---|
| **Hypertension** | Hypertension in Adults: Diagnosis and Management (NG136) | NICE | 2022 | [Open PDF](https://www.nice.org.uk/guidance/ng136/resources/hypertension-in-adults-diagnosis-and-management-pdf-66141722710213) |
| **Diabetes** | Type 2 Diabetes in Adults: Management (NG28) | NICE | 2022 | [Open PDF](https://www.nice.org.uk/guidance/ng28/resources/type-2-diabetes-in-adults-management-pdf-1837338615493) |
| **Pain Management** | Chronic Pain in Over 16s: Assessment and Management (NG193) | NICE | 2021 | [Open PDF](https://www.nice.org.uk/guidance/ng193/resources/chronic-pain-primary-and-secondary-in-over-16s-assessment-of-all-chronic-pain-and-management-of-chronic-primary-pain-pdf-66142080468421) |
| **Endocrinology** | Thyroid Disease: Assessment and Management (NG145) | NICE | 2023 | [Open PDF](https://www.nice.org.uk/guidance/ng145/resources/thyroid-disease-assessment-and-management-pdf-66141781496773) |
| **Infectious Disease** | Antimicrobial Stewardship (NG15) | NICE | 2021 | [Open PDF](https://www.nice.org.uk/guidance/ng15/resources/antimicrobial-stewardship-systems-and-processes-for-effective-antimicrobial-medicine-use-pdf-1837273110469) |
| **Infectious Disease** | COVID-19 Rapid Guideline: Managing COVID-19 (NG191) | NICE | 2024 | [Open PDF](https://www.nice.org.uk/guidance/ng191/resources/covid19-rapid-guideline-managing-covid19-pdf-66142077109189) |
| **Cardiovascular** | Atrial Fibrillation: Diagnosis and Management (NG196) | NICE | 2021 | [Open PDF](https://www.nice.org.uk/guidance/ng196/resources/atrial-fibrillation-diagnosis-and-management-pdf-66142085507269) |
| **General** | Multimorbidity: Clinical Assessment and Management (NG56) | NICE | 2022 | [Open PDF](https://www.nice.org.uk/guidance/ng56/resources/multimorbidity-clinical-assessment-and-management-pdf-1837516654789) |
| **Nephrology** | KDIGO 2022 Diabetes Management in CKD | KDIGO | 2022 | [Open PDF](https://kdigo.org/wp-content/uploads/2022/10/KDIGO-2022-Clinical-Practice-Guideline-for-Diabetes-Management-in-CKD.pdf) |
| **Cardiovascular** | AHA/ACC/HFSA 2022 Guideline for Management of Heart Failure | AHA/ACC/HFSA | 2022 | [Open PDF](https://www.ahajournals.org/doi/pdf/10.1161/CIR.0000000000001062) |
| **Pain Management** | CDC Clinical Practice Guideline for Prescribing Opioids | CDC | 2022 | [Open PDF](https://www.cdc.gov/mmwr/volumes/71/rr/pdfs/rr7103a1-H.pdf) |
