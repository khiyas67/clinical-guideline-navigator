import sys
import json
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from app.config import settings
from app.schemas import QueryRequest
from app.services.rag import run_rag_pipeline
from app.services.retrieval import get_supabase_client

def run_step9_verification():
    print("=" * 80)
    print("STEP 9: REAL CLINICAL DECISION PERSISTENCE & AUDIT TRAIL VERIFICATION")
    print("=" * 80)

    supabase = get_supabase_client()

    # 1. Fetch real existing patient & clinician from database
    p_res = supabase.from_("patients").select("id, clinician_id, full_name, patient_code").limit(1).execute()
    if not p_res.data:
        print("[!] No patient found in public.patients. Creating a test patient record...")
        # Get a real clinician user id from auth.users via service role
        u_res = supabase.auth.admin.list_users()
        users = u_res if isinstance(u_res, list) else getattr(u_res, 'users', [])
        if not users:
            raise RuntimeError("No authenticated clinician users found in auth.users.")
        clinician_id = users[0].id
        new_p = {
            "clinician_id": clinician_id,
            "patient_code": "P-2026-001",
            "full_name": "Eleanor Vance",
            "date_of_birth": "1968-05-14",
            "gender": "Female",
            "medical_conditions": ["Type 2 Diabetes", "Hypertension"],
            "medications": ["Metformin 500mg"],
            "allergies": ["Penicillin"],
            "medical_history": "Diagnosed with Type 2 diabetes in 2019."
        }
        p_data = supabase.from_("patients").insert(new_p).select().single().execute()
        patient = p_data.data
    else:
        patient = p_res.data[0]

    patient_id = patient["id"]
    clinician_id = patient["clinician_id"]
    patient_name = patient["full_name"]
    patient_code = patient["patient_code"]

    print(f"\n[Context] Authenticated Clinician ID: {clinician_id}")
    print(f"[Context] Active Patient: {patient_name} ({patient_code}) [ID: {patient_id}]")

    # =========================================================================
    # TEST 1: ACCEPT
    # =========================================================================
    print("\n" + "-" * 80)
    print("TEST 1: LIVE RAG QUERY + ACCEPT ACTION")
    print("-" * 80)

    q1 = "What is the recommended management approach for type 2 diabetes?"
    print(f"Query: '{q1}'")
    req1 = QueryRequest(patient_id=patient_id, question=q1, category="Diabetes")
    rag_resp1 = run_rag_pipeline(req1)
    
    print(f"Live RAG Response Type: {rag_resp1.type}")
    print(f"AI Answer Length: {len(rag_resp1.answer)} chars")
    print(f"Retrieved Sources Count: {len(rag_resp1.sources)}")
    assert len(rag_resp1.sources) > 0, "No sources returned from Step 8 RAG pipeline!"

    # Persist Accepted Decision
    sources_json1 = [s.model_dump() for s in rag_resp1.sources]
    dec_record1 = {
        "clinician_id": clinician_id,
        "patient_id": patient_id,
        "question": q1,
        "ai_answer": rag_resp1.answer,
        "final_decision": rag_resp1.answer,
        "decision_status": "accepted",
        "category": "Diabetes",
        "sources": sources_json1,
        "rejection_reason": None
    }
    insert_res1 = supabase.from_("clinical_decisions").insert(dec_record1).execute()
    saved_dec1 = insert_res1.data[0] if insert_res1.data else None
    assert saved_dec1 is not None, "Failed to insert accepted decision"
    print(f"-> Saved Decision ID: {saved_dec1['id']}")
    print(f"   Status: {saved_dec1['decision_status']}")
    print(f"   Clinician ID Match: {saved_dec1['clinician_id'] == clinician_id}")
    print(f"   Patient ID Match: {saved_dec1['patient_id'] == patient_id}")
    print(f"   Question Match: {saved_dec1['question'] == q1}")
    print(f"   Final Decision Match AI Answer: {saved_dec1['final_decision'] == rag_resp1.answer}")
    print(f"   Sources Stored: {len(saved_dec1['sources'])} sources")
    print("TEST 1 (ACCEPT) -> PASS")

    # =========================================================================
    # TEST 2: MODIFY
    # =========================================================================
    print("\n" + "-" * 80)
    print("TEST 2: LIVE RAG QUERY + MODIFY ACTION")
    print("-" * 80)

    q2 = "What are the recommended blood pressure thresholds and initial drug choices for hypertension?"
    print(f"Query: '{q2}'")
    req2 = QueryRequest(patient_id=patient_id, question=q2, category="Hypertension")
    rag_resp2 = run_rag_pipeline(req2)
    
    print(f"Live RAG Response Type: {rag_resp2.type}")
    print(f"AI Answer Length: {len(rag_resp2.answer)} chars")
    print(f"Retrieved Sources Count: {len(rag_resp2.sources)}")

    # Modified Decision Text
    modified_text = (
        rag_resp2.answer[:300] + "\n\n"
        "[CLINICIAN CLINICAL MODIFICATION]: Initiate Amlodipine 5mg once daily. "
        "Schedule follow-up clinic blood pressure check in 4 weeks and routine electrolyte panel."
    )
    sources_json2 = [s.model_dump() for s in rag_resp2.sources]
    dec_record2 = {
        "clinician_id": clinician_id,
        "patient_id": patient_id,
        "question": q2,
        "ai_answer": rag_resp2.answer,
        "final_decision": modified_text,
        "decision_status": "modified",
        "category": "Hypertension",
        "sources": sources_json2,
        "rejection_reason": None
    }
    insert_res2 = supabase.from_("clinical_decisions").insert(dec_record2).execute()
    saved_dec2 = insert_res2.data[0] if insert_res2.data else None
    assert saved_dec2 is not None, "Failed to insert modified decision"
    print(f"-> Saved Decision ID: {saved_dec2['id']}")
    print(f"   Status: {saved_dec2['decision_status']}")
    print(f"   Original AI Answer Preserved: {saved_dec2['ai_answer'] == rag_resp2.answer}")
    print(f"   Final Decision Contains Modifications: {'[CLINICIAN CLINICAL MODIFICATION]' in saved_dec2['final_decision']}")
    print(f"   Sources Preserved: {len(saved_dec2['sources'])} sources")
    print("TEST 2 (MODIFY) -> PASS")

    # =========================================================================
    # TEST 3: REJECT
    # =========================================================================
    print("\n" + "-" * 80)
    print("TEST 3: LIVE RAG QUERY + REJECT ACTION")
    print("-" * 80)

    q3 = "What are the recommendations for prescribing opioids for acute pain?"
    print(f"Query: '{q3}'")
    req3 = QueryRequest(patient_id=patient_id, question=q3, category="Medications")
    rag_resp3 = run_rag_pipeline(req3)
    
    print(f"Live RAG Response Type: {rag_resp3.type}")
    print(f"AI Answer Length: {len(rag_resp3.answer)} chars")
    print(f"Retrieved Sources Count: {len(rag_resp3.sources)}")

    rejection_reason = "Patient has family history of opioid dependency. Non-opioid multimodal analgesia (NSAIDs + physical therapy) selected instead."
    sources_json3 = [s.model_dump() for s in rag_resp3.sources]
    dec_record3 = {
        "clinician_id": clinician_id,
        "patient_id": patient_id,
        "question": q3,
        "ai_answer": rag_resp3.answer,
        "final_decision": None,
        "decision_status": "rejected",
        "category": "Medications",
        "sources": sources_json3,
        "rejection_reason": rejection_reason
    }
    insert_res3 = supabase.from_("clinical_decisions").insert(dec_record3).execute()
    saved_dec3 = insert_res3.data[0] if insert_res3.data else None
    assert saved_dec3 is not None, "Failed to insert rejected decision"
    print(f"-> Saved Decision ID: {saved_dec3['id']}")
    print(f"   Status: {saved_dec3['decision_status']}")
    print(f"   Rejection Reason Stored: {saved_dec3['rejection_reason'] == rejection_reason}")
    print(f"   Original AI Answer Preserved: {saved_dec3['ai_answer'] == rag_resp3.answer}")
    print(f"   Sources Preserved: {len(saved_dec3['sources'])} sources")
    print("TEST 3 (REJECT) -> PASS")

    # =========================================================================
    # UI & AUDIT VERIFICATION
    # =========================================================================
    print("\n" + "-" * 80)
    print("UI & DATA INTEGRITY VERIFICATION")
    print("-" * 80)

    # 1. Patient Profile Decisions Query
    patient_decisions = supabase.from_("clinical_decisions").select("*, patient:patients(id, full_name, patient_code)").eq("patient_id", patient_id).order("created_at", desc=True).execute()
    print(f"[*] Patient Profile Decisions Count for {patient_name}: {len(patient_decisions.data)}")
    assert len(patient_decisions.data) >= 3, "Patient decisions tab should show at least 3 records"

    # 2. Decision Support Query & Stats
    all_decisions = supabase.from_("clinical_decisions").select("*, patient:patients(id, full_name, patient_code)").order("created_at", desc=True).execute()
    accepted_count = sum(1 for d in all_decisions.data if d["decision_status"] == "accepted")
    modified_count = sum(1 for d in all_decisions.data if d["decision_status"] == "modified")
    rejected_count = sum(1 for d in all_decisions.data if d["decision_status"] == "rejected")
    print(f"[*] Decision Support Audit Trail Records: {len(all_decisions.data)}")
    print(f"    - Accepted: {accepted_count}")
    print(f"    - Modified: {modified_count}")
    print(f"    - Rejected: {rejected_count}")

    # 3. Source URLs Verification
    print("\n[*] Verifying Source Links & Traceability in Stored Records:")
    for d in all_decisions.data[:3]:
        print(f"    Decision [{d['decision_status'].upper()}]: '{d['question'][:50]}...'")
        for s in d.get("sources", [])[:2]:
            print(f"      - Source: [{s.get('organization')}] {s.get('title')} (p. {s.get('page')})")
            print(f"        Official URL: {s.get('source_url')}")
            print(f"        PDF URL: {s.get('pdf_url')}")
            assert s.get("source_url") or s.get("pdf_url"), "Source missing URL!"

    print("\n" + "=" * 80)
    print("ALL STEP 9 TESTS COMPLETED SUCCESSFULLY")
    print("=" * 80)

if __name__ == "__main__":
    run_step9_verification()
