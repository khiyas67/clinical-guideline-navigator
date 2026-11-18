import sys
import os
import time

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.schemas import QueryRequest
from app.services.rag import run_rag_pipeline

print("Running single RAG pipeline test for Hypertension...", flush=True)
t0 = time.time()
req = QueryRequest(
    question="What is the blood pressure threshold for diagnosing and treating stage 1 hypertension?",
    category="Hypertension"
)
res = run_rag_pipeline(req)
print(f"RAG Pipeline finished in {time.time()-t0:.2f}s", flush=True)
print(f"Type: {res.type}", flush=True)
print(f"Number of sources: {len(res.sources)}", flush=True)
for i, s in enumerate(res.sources):
    print(f"  Source {i+1}: [{s.title}] Org: {s.organization} | Sec: {s.section} | Sim: {s.similarity:.3f} | PDF: {s.pdf_url}")
print("\n--- Answer ---")
print(res.answer)
