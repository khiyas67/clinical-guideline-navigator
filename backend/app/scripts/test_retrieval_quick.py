import sys
import os
import time

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.services.embeddings import embed_query
from app.services.retrieval import retrieve_guideline_chunks

print("1. Embedding query...", flush=True)
t0 = time.time()
emb = embed_query("What is the blood pressure threshold for hypertension?")
print(f"Embedding generated: length {len(emb)} in {time.time()-t0:.2f}s", flush=True)

print("2. Retrieving chunks via Supabase RPC...", flush=True)
t1 = time.time()
chunks = retrieve_guideline_chunks(emb, match_threshold=0.3, match_count=5)
print(f"Retrieved {len(chunks)} chunks in {time.time()-t1:.2f}s:", flush=True)
for i, c in enumerate(chunks):
    g_title = c.get("guideline_title", c.get("document_title", "Unknown"))
    sim = c.get("similarity", 0)
    print(f"  [{i+1}] {g_title} (sim: {sim:.3f}) - {c.get('content', '')[:80]}...", flush=True)
