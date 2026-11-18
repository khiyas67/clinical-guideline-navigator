import sys
import os

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.services.retrieval import get_supabase_client

client = get_supabase_client()
res = client.table("clinical_decisions").select("id", count="exact").execute()
print("Exact clinical decisions count in DB:", res.count)
