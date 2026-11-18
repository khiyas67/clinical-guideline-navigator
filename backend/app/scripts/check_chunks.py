import sys
import os

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.services.retrieval import get_supabase_client

def main():
    client = get_supabase_client()
    docs = client.table("guideline_documents").select("id, guideline_id, document_version, pdf_url, ingestion_status").execute()
    print(f"Total documents: {len(docs.data)}")
    
    chunks = client.table("guideline_chunks").select("id, guideline_id").execute()
    print(f"Total chunks: {len(chunks.data)}")
    
    # count per guideline
    g_chunks = {}
    for c in chunks.data:
        gid = c.get("guideline_id")
        g_chunks[gid] = g_chunks.get(gid, 0) + 1
        
    g_map = {}
    g_res = client.table("guidelines").select("id, title, organization").execute()
    for g in g_res.data:
        g_map[g["id"]] = f"{g['organization']} - {g['title'][:35]}"
        
    print("\n--- Chunks per Guideline ---")
    for gid, cnt in g_chunks.items():
        print(f"{gid[:8]} | {cnt:4} chunks | {g_map.get(gid, 'Unknown')}")

if __name__ == "__main__":
    main()
