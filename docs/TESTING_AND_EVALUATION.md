# Testing, Quality Assurance & Evaluation Framework

This document documents the automated test suites, regression benchmarks, retrieval evaluation metrics, and frontend build verification across all development phases of the **Clinical Guideline Navigator**.

---

## 1. Automated Test Suite Architecture

The backend test suite is orchestrated using `pytest` inside the Python virtual environment (`backend/.venv`):

```
backend/tests/
├── test_guideline_qc.py                  # Document QC, duplicate detection, and version parsing
├── test_patient_validation.py            # Patient clinical validation & data integrity
├── test_phase12_6_guideline_library.py   # Multi-category library & RAG hybrid retrieval
└── test_router_and_rag.py                # Query router classification & chunker validation
```

### Execution Command:
```bash
backend\.venv\Scripts\python.exe -m pytest backend/tests/ -v
```

---

## 2. Test Execution Results (Full Suite: 28 Passed)

```
============================= test session starts =============================
platform win32 -- Python 3.11.9, pytest-9.1.1, pluggy-1.6.0
rootdir: J:\healthcare RAG
collected 28 items

backend/tests/test_guideline_qc.py::test_checksum_computation PASSED            [  3%]
backend/tests/test_guideline_qc.py::test_invalid_and_empty_pdf_rejection PASSED [  7%]
backend/tests/test_guideline_qc.py::test_unrelated_document_rejection PASSED    [ 10%]
backend/tests/test_guideline_qc.py::test_valid_clinical_guideline_acceptance PASSED [ 14%]
backend/tests/test_guideline_qc.py::test_category_and_metadata_extraction PASSED   [ 17%]
backend/tests/test_guideline_qc.py::test_edition_detection_vs_exact_duplicate PASSED [ 21%]
backend/tests/test_guideline_qc.py::test_ingestion_metadata_validation_and_version_resolution PASSED [ 25%]

backend/tests/test_patient_validation.py::test_valid_patient_payload PASSED     [ 28%]
backend/tests/test_patient_validation.py::test_invalid_email_format PASSED      [ 32%]
backend/tests/test_patient_validation.py::test_future_birth_date_rejection PASSED [ 35%]
backend/tests/test_patient_validation.py::test_clinical_condition_normalization PASSED [ 39%]
backend/tests/test_patient_validation.py::test_empty_name_rejection PASSED      [ 42%]

backend/tests/test_phase12_6_guideline_library.py::test_a_kdigo_2022_intact PASSED [ 46%]
backend/tests/test_phase12_6_guideline_library.py::test_b_historical_clinical_decisions_intact PASSED [ 50%]
backend/tests/test_phase12_6_guideline_library.py::test_c_all_eight_categories_have_at_least_two_guidelines PASSED [ 53%]
backend/tests/test_phase12_6_guideline_library.py::test_d_multi_category_parsing PASSED [ 57%]
backend/tests/test_phase12_6_guideline_library.py::test_e_no_duplicate_guidelines PASSED [ 60%]
backend/tests/test_phase12_6_guideline_library.py::test_f_direct_pdf_urls_functional PASSED [ 64%]
backend/tests/test_phase12_6_guideline_library.py::test_g_chunk_embeddings_384_dimensional PASSED [ 67%]
backend/tests/test_phase12_6_guideline_library.py::test_h_retrieval_returns_evidence_for_new_guidelines PASSED [ 71%]
backend/tests/test_phase12_6_guideline_library.py::test_i_rag_pipeline_end_to_end PASSED [ 75%]

backend/tests/test_router_and_rag.py::test_greeting_routing PASSED               [ 78%]
backend/tests/test_router_and_rag.py::test_out_of_scope_routing PASSED           [ 82%]
backend/tests/test_router_and_rag.py::test_healthcare_routing PASSED             [ 85%]
backend/tests/test_router_and_rag.py::test_unclear_routing PASSED                [ 89%]
backend/tests/test_router_and_rag.py::test_chunker_preserves_page_numbers_and_sections PASSED [ 92%]
backend/tests/test_router_and_rag.py::test_chunk_text_clean_and_bounded PASSED   [ 96%]
backend/tests/test_router_and_rag.py::test_section_detection_heuristics PASSED   [100%]

======================= 28 passed, 2 warnings in 39.82s =======================
```

---

## 3. Detailed Phase Breakdown & Validation Targets

### Phase 7 & 8: Embedding Migration & Schema Compatibility
- **Objective:** Upgrade from legacy 768-dim embeddings to 384-dimensional `BAAI/bge-small-en-v1.5` without disrupting existing historical records.
- **Verification:** Tested that `guideline_chunks` table strictly enforces `VECTOR(384)` and that `match_guideline_chunks` RPC returns valid cosine similarity.

### Phase 9: QC Ingestion & Quality Control
- **Objective:** Block corrupted, empty, duplicate, or non-medical PDF uploads.
- **Verification:** Evaluated with corrupted byte streams, recipe PDFs, and exact duplicate SHA-256 hashes. All rejected with descriptive `400 Bad Request` messages.

### Phase 10: Decision Governance & Audit Logging
- **Objective:** Capture clinician actions (Accept / Modify / Reject) and persist immutable audit records.
- **Verification:** Preserved all historical decisions in `public.clinical_decisions` without schema regressions.

### Phase 11: Quantitative Retrieval Evaluation
- **Benchmark Evaluation Cases:** Assessed across clinical inquiries (hypertension thresholds, CKD SGLT2i recommendations, opioid dosing, thyroid levothyroxine therapy, COVID-19 management).
- **Retrieval Precision:** Cosine similarity scores exceed `0.75` for exact topic matches and `0.80` for diagnostic guideline queries.

### Phase 12.6: Multi-Category Library Expansion
- **Objective:** Eliminate empty category views and ensure every category has >= 2 authentic guidelines.
- **Verification:** Added 8 official NICE guidelines, indexed 866 new chunks, verified direct PDF links, and confirmed category counts match rendered cards.

---

## 4. Frontend Production Build Verification

The frontend compiles cleanly using TypeScript and Vite:
```bash
npm --prefix frontend run build
```
- **Output:**
  ```
  vite v8.3.0 building client environment for production...
  ✓ 2004 modules transformed.
  dist/index.html                            1.37 kB │ gzip:   0.72 kB
  dist/assets/hero-clinician-BVXXmiDb.jpg  599.95 kB
  dist/assets/index-CZtbpqS-.css            88.22 kB │ gzip:  13.88 kB
  dist/assets/index-BbT2-5GV.js            777.31 kB │ gzip: 199.29 kB
  ✓ built in 2.15s (0 errors)
  ```
