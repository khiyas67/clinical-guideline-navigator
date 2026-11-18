import sys
import os

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.services.retrieval import get_supabase_client

def main():
    client = get_supabase_client()
    g_res = client.table("guidelines").select("id, pdf_url, source_url").execute()
    for g in g_res.data:
        gid = g["id"]
        pdf = g.get("pdf_url")
        src = g.get("source_url")
        if pdf or src:
            upd = {}
            if pdf:
                upd["pdf_url"] = pdf
            if src:
                upd["source_url"] = src
            res = client.table("guideline_chunks").update(upd).eq("guideline_id", gid).execute()
            print(f"Updated chunks for {gid[:8]}: {len(res.data) if res.data else 0} chunks updated")

if __name__ == "__main__":
    main()
