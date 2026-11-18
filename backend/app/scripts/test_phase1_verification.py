import sys
import os
import json

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.schemas import QueryRequest
from app.services.rag import run_rag_pipeline
from app.services.retrieval import get_supabase_client, get_patient_clinical_context
from app.services.report_generator import generate_pdf_report, generate_docx_report

sb = get_supabase_client()

print("="*75)
print("PHASE 1: PATIENT-SPECIFIC AI RESPONSE & READABILITY VERIFICATION")
print("="*75)

# 1. Fetch live patients for testing
patients = sb.from_("patients").select("*").execute().data
print(f"Total live patients available: {len(patients)}")

# Find patient with conditions (e.g. Priya Nair, Aarav Sharma, Rahul Verma)
p_diabetes = next((p for p in patients if "diabetes" in str(p.get("medical_conditions", [])).lower()), patients[0])
p_hypertension = next((p for p in patients if "hypertension" in str(p.get("medical_conditions", [])).lower()), patients[1])

print(f"Test Patient A (Diabetes/CKD): {p_diabetes['id']} | {p_diabetes.get('full_name')} | Conditions: {p_diabetes.get('medical_conditions')}")
print(f"Test Patient B (Hypertension): {p_hypertension['id']} | {p_hypertension.get('full_name')} | Conditions: {p_hypertension.get('medical_conditions')}")

# Test 1: General question without patient selection
print("\n" + "="*50)
print("TEST 1: General Question Without Patient Selection")
print("="*50)
q1 = "What are the first-line pharmacotherapies for type 2 diabetes with CKD according to KDIGO?"
res1 = run_rag_pipeline(QueryRequest(question=q1, patient_id=None))
print(f"Sources returned: {len(res1.sources)}")
print(f"Answer Preview:\n{res1.answer[:350]}...\n")
assert "general" in res1.answer.lower() or "no patient" in res1.answer.lower() or "clinical summary" in res1.answer.lower(), "Answer should clearly indicate general guidance"

# Test 2: Clinical question with selected patient (Diabetes / CKD)
print("\n" + "="*50)
print("TEST 2: Patient-Specific Question (Priya Nair - T2D/CKD)")
print("="*50)
q2 = "Should an SGLT2 inhibitor be initiated for this patient, and what monitoring is required?"
res2 = run_rag_pipeline(QueryRequest(question=q2, patient_id=p_diabetes["id"]))
print(f"Sources returned: {len(res2.sources)}")
print(f"Answer Preview:\n{res2.answer[:450]}...\n")
assert "### 1. Clinical Summary" in res2.answer or "Clinical Summary" in res2.answer, "Structured clinical summary section missing"
assert "Patient Context" in res2.answer or "Relevant Patient" in res2.answer, "Patient context section missing"

# Test 3: Patient authorization & nonexistent patient ID
print("\n" + "="*50)
print("TEST 3: Nonexistent / Invalid Patient ID Isolation")
print("="*50)
ctx_fake = get_patient_clinical_context("00000000-0000-0000-0000-000000000000")
print(f"Context for nonexistent patient: {ctx_fake}")
assert ctx_fake is None, "Nonexistent patient should return None context"

# Test 4: Unsupported out-of-domain question with patient
print("\n" + "="*50)
print("TEST 4: Unsupported Domain Question (Negative Test)")
print("="*50)
q4 = "What is the surgical resection protocol for pediatric Wilms tumor stage 3?"
res4 = run_rag_pipeline(QueryRequest(question=q4, patient_id=p_diabetes["id"]))
print(f"Answer Preview:\n{res4.answer[:300]}...\n")
assert "insufficient" in res4.answer.lower() or "couldn't find" in res4.answer.lower(), "Should communicate insufficient evidence"

# Test 5: Report generation with new structured clinical response
print("\n" + "="*50)
print("TEST 5: PDF and DOCX Report Compatibility")
print("="*50)
report_payload = {
    "generated_at": "2026-11-05 22:00:00",
    "clinician_name": "Dr. Sarah Jenkins",
    "decision_status": "ACCEPTED",
    "question": q2,
    "ai_answer": res2.answer,
    "final_decision": res2.answer,
    "sources": [s.model_dump() for s in res2.sources],
    "patient": p_diabetes
}
pdf_data = generate_pdf_report(report_payload)
assert pdf_data.startswith(b"%PDF"), "Generated PDF invalid"
docx_data = generate_docx_report(report_payload)
assert docx_data.startswith(b"PK"), "Generated DOCX invalid"
print(f"PDF Size: {len(pdf_data)} bytes | DOCX Size: {len(docx_data)} bytes. Both generated successfully!")

print("\n" + "="*50)
print("ALL PHASE 1 TESTS PASSED!")
print("="*50)

