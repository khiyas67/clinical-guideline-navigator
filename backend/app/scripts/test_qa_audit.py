import sys
import os
import json
from collections import Counter

# Add backend directory to path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.services.retrieval import get_supabase_client

sb = get_supabase_client()

print("="*60)
print("1. DATABASE INTEGRITY AUDIT")
print("="*60)

# Guidelines
g = sb.from_('guidelines').select('*').execute().data
print(f"Total Guidelines: {len(g)}")
g_active = [x for x in g if x.get('status') == 'active']
g_archived = [x for x in g if x.get('status') == 'archived']
print(f"Active Guidelines: {len(g_active)}, Archived: {len(g_archived)}")

titles = [x['title'].strip() for x in g_active]
dupes = [item for item, count in Counter(titles).items() if count > 1]
print(f"Duplicate active titles: {dupes if dupes else 'NONE'}")

for x in g:
    print(f"  ID: {x['id']} | Status: {x.get('status')} | Type: {x.get('document_type')} | Cat: {x.get('category')} | Title: {x.get('title')[:45]}")

# Documents
docs = sb.from_('guideline_documents').select('*').execute().data
print(f"\nTotal Documents: {len(docs)}")
g_ids = {x['id'] for x in g}
doc_orphans = [d for d in docs if d['guideline_id'] not in g_ids]
print(f"Orphaned Documents: {len(doc_orphans)}")
for d in docs:
    print(f"  Doc ID: {d['id']} | G_ID: {d['guideline_id']} | Pages: {d.get('page_count')} | Status: {d.get('processing_status')} | Checksum: {d.get('checksum')}")

# Chunks
chunks = sb.from_('guideline_chunks').select('id, guideline_id, document_id, embedding').execute().data
print(f"\nTotal Chunks: {len(chunks)}")
chunk_orphans_g = [c for c in chunks if c['guideline_id'] not in g_ids]
doc_ids = {d['id'] for d in docs}
chunk_orphans_d = [c for c in chunks if c.get('document_id') and c['document_id'] not in doc_ids]
print(f"Orphaned Chunks (by guideline): {len(chunk_orphans_g)}, (by doc): {len(chunk_orphans_d)}")

# Embedding dimension check
invalid_embeddings = []
for c in chunks:
    emb = c.get('embedding')
    if isinstance(emb, str):
        try:
            emb = json.loads(emb)
        except Exception:
            emb = None
    if not isinstance(emb, list) or len(emb) != 384:
        invalid_embeddings.append(c['id'])
print(f"Chunks with invalid embeddings (!= 384 dims): {len(invalid_embeddings)}")

# Clinical Decisions
decs = sb.from_('clinical_decisions').select('*').execute().data
print(f"\nTotal Clinical Decisions: {len(decs)}")
for d in decs:
    print(f"  Decision ID: {d['id']} | Patient: {d.get('patient_id')} | Status: {d.get('decision_status')} | Cat: {d.get('category')} | Created: {d.get('created_at')}")

print("\nIntegrity check complete.")

