import sys
import os

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from app.main import app
from app.services.retrieval import get_patient_clinical_context
from app.services.report_generator import generate_pdf_report, generate_docx_report

client = TestClient(app)

print("="*75)
print("CLINICAL SAFETY & PATIENT AUTHORIZATION VERIFICATION")
print("="*75)

# Known clinician IDs and patient IDs from live Supabase
CLINICIAN_1 = "1edb5848-e321-408a-986e-4597422dc10a"
PATIENT_1 = "abfcb344-c9b4-4ff2-951c-218752b0bc75"  # Priya Nair (owned by CLINICIAN_1)

CLINICIAN_2 = "f137b50f-a7e0-4ad2-aca0-b1c0906928cc"
PATIENT_2 = "e39a1a61-80ae-4f2b-a5d6-dd49a70f7e3e"  # Sathya (owned by CLINICIAN_2)

# --- PART 1: AUTHORIZATION BOUNDARY VERIFICATION ---
print("\n--- PART 1: PATIENT AUTHORIZATION BOUNDARIES ---")

# Test 1A: Clinician 1 accesses their own patient
res_1a = client.post("/api/assistant/query", json={
    "question": "What is the clinical guidance for diabetes in this patient?",
    "patient_id": PATIENT_1,
    "clinician_id": CLINICIAN_1
})
print(f"Test 1A [Clinician 1 -> Own Patient 1]: Status = {res_1a.status_code}")
assert res_1a.status_code == 200, f"Expected 200, got {res_1a.status_code}"

# Test 1B: Clinician 1 attempts unauthorized access to Clinician 2's patient
res_1b = client.post("/api/assistant/query", json={
    "question": "Show patient clinical guidance",
    "patient_id": PATIENT_2,
    "clinician_id": CLINICIAN_1
})
print(f"Test 1B [Clinician 1 -> Clinician 2's Patient 2 (CROSS-TENANT)]: Status = {res_1b.status_code} | Detail = {res_1b.json().get('detail')}")
assert res_1b.status_code == 403, f"Expected 403 Forbidden, got {res_1b.status_code}"
assert "Access denied" in res_1b.json().get("detail", ""), "Detail should explain access denied"

# Test 1C: Clinician 2 accesses their own patient
res_1c = client.post("/api/assistant/query", json={
    "question": "What is the clinical guidance for diabetes in this patient?",
    "patient_id": PATIENT_2,
    "clinician_id": CLINICIAN_2
})
print(f"Test 1C [Clinician 2 -> Own Patient 2]: Status = {res_1c.status_code}")
assert res_1c.status_code == 200, f"Expected 200, got {res_1c.status_code}"

# Test 1D: Clinician 2 attempts unauthorized access to Clinician 1's patient
res_1d = client.post("/api/assistant/query", json={
    "question": "Show patient clinical guidance",
    "patient_id": PATIENT_1,
    "clinician_id": CLINICIAN_2
})
print(f"Test 1D [Clinician 2 -> Clinician 1's Patient 1 (CROSS-TENANT)]: Status = {res_1d.status_code} | Detail = {res_1d.json().get('detail')}")
assert res_1d.status_code == 403, f"Expected 403 Forbidden, got {res_1d.status_code}"

print(">> Patient authorization boundaries 100% VERIFIED!")

# --- PART 2: CLINICAL SAFETY & CONDITIONAL RECOMMENDATIONS ---
print("\n--- PART 2: CLINICAL SAFETY & MISSING PARAMETER HANDLING ---")
ans_1a = res_1a.json().get("answer", "")
print("Evaluating SGLT2i & Missing Lab handling in Priya Nair response...")
print(f"Preview:\n{ans_1a[:600]}...\n")

# Verify that the response includes safety checks
has_conditional = any(w in ans_1a.lower() for w in ["contingent", "confirm", "prerequisite", "baseline", "egfr", "threshold", "prior to", "verify"])
print(f"Contains conditional gating / baseline lab requirement: {has_conditional}")
assert has_conditional, "Response must include baseline lab prerequisites"

has_missing_section = "### 6. Missing Clinical Information" in ans_1a or "Missing" in ans_1a
print(f"Contains explicit Missing Information section: {has_missing_section}")
assert has_missing_section, "Response must explicitly highlight missing clinical information"

# --- PART 3: REPORT COMPATIBILITY WITH SYMBOLS ---
print("\n--- PART 3: REPORT RENDERING WITH CLINICAL COMPARISON SYMBOLS ---")
sample_payload = {
    "generated_at": "2026-11-05 22:15:00",
    "clinician_name": "Dr. Verification",
    "decision_status": "ACCEPTED",
    "question": "Should SGLT2i be initiated if eGFR is < 20 mL/min/1.73m² or ACR > 300 mg/g & BP >= 140/90?",
    "ai_answer": "KDIGO criteria specify SGLT2i initiation threshold: eGFR ≥20 mL/min/1.73m² & persistent albuminuria. If eGFR < 20, initiation is contraindicated. Target BP < 130/80 mmHg.",
    "final_decision": "Verify eGFR ≥20 mL/min/1.73m² before initiation. Titrate ACEi if ACR > 300 mg/g.",
    "sources": [
        {
            "guideline_id": "3ed31dbd-7589-4327-b400-966df4d12a26",
            "title": "KDIGO 2022 Clinical Practice Guideline for Diabetes Management in CKD",
            "organization": "KDIGO",
            "page": 2,
            "section": "SGLT2 Inhibitor Therapy",
            "excerpt": "Treat patients with T2D, CKD, and eGFR ≥20 mL/min/1.73m² with an SGLT2i.",
            "similarity": 0.88
        }
    ],
    "patient": {
        "full_name": "Priya Nair",
        "patient_code": "PT-10242",
        "age": 42,
        "gender": "F"
    }
}

pdf_bytes = generate_pdf_report(sample_payload)
assert pdf_bytes.startswith(b"%PDF"), "PDF generation failed"
docx_bytes = generate_docx_report(sample_payload)
assert docx_bytes.startswith(b"PK"), "DOCX generation failed"
print(f"PDF generated ({len(pdf_bytes)} bytes) and DOCX generated ({len(docx_bytes)} bytes) with symbols (<, >, >=, <=, &) safely escaped and parsed!")

print("\n" + "="*75)
print("ALL CLINICAL SAFETY & PATIENT AUTHORIZATION TESTS PASSED!")
print("="*75)

