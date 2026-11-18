import sys
import os
import json

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.schemas import QueryRequest
from app.services.rag import run_rag_pipeline

print("="*70)
print("RAG PIPELINE END-TO-END VERIFICATION")
print("="*70)

test_queries = [
    ("Test A — CDC", "What are the CDC recommendations for opioid prescribing for acute pain?"),
    ("Test B — KDIGO", "What are the recommendations for managing diabetes in patients with chronic kidney disease?"),
    ("Test C — Supporting Reference", "What is the role of SGLT2 inhibitors in patients with type 2 diabetes and CKD?"),
    ("Test D — Unsupported Domain", "What are the first-line chemotherapy regimens for metastatic uveal melanoma?")
]

EXCLUDED_IDS = {
    "8141c103-9bac-44b6-9c68-fd8645aa5b42",  # KDIGO 2024 synthetic
    "069969fa-8ec8-41c8-b1d4-82e0890d3e31",  # Demo Guideline
}

for test_name, query in test_queries:
    print(f"\n--- {test_name} ---")
    print(f"Query: {query}")
    try:
        response = run_rag_pipeline(QueryRequest(question=query))
        print(f"Response Type: {response.type}")
        print(f"Sources Count: {len(response.sources)}")
        for i, s in enumerate(response.sources, 1):
            is_excluded = s.guideline_id in EXCLUDED_IDS
            print(f"  Source {i}: {s.title} | Org: {s.organization} | Page: {s.page} | Sim: {s.similarity} | Excluded ID: {is_excluded}")
            assert not is_excluded, f"CRITICAL LEAK: Excluded guideline ID {s.guideline_id} was retrieved!"
        print(f"Answer Preview:\n{response.answer[:300]}...\n")
    except Exception as e:
        print(f"FAILED with error: {e}")

print("RAG Pipeline tests complete.")

