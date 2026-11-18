import sys
import os

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.services.retrieval import get_supabase_client
import re

def main():
    client = get_supabase_client()
    res = client.table("guidelines").select("id, title, category, status, year, organization, pdf_url, official_url").execute()
    print(f"Total guidelines in DB: {len(res.data)}")
    
    categories = [
        "Nephrology",
        "Pain Management",
        "Endocrinology",
        "Diabetes",
        "Cardiovascular",
        "Hypertension",
        "Infectious Disease",
        "General"
    ]
    
    cat_counts = {c: 0 for c in categories}
    active_count = 0
    
    for r in res.data:
        gid = r.get("id")
        status = r.get("status")
        cat = r.get("category") or ""
        title = r.get("title")
        org = r.get("organization") or ""
        year = r.get("year")
        pdf = r.get("pdf_url") or r.get("official_url") or "NO_URL"
        if status == "active":
            active_count += 1
        print(f"[{status:8}] {gid[:8]} | {org:15} | {str(year):4} | {cat:35} | {title[:40]} | {pdf[:45]}")
        
        # Split categories
        tokens = [t.strip() for t in re.split(r"[,;/|]+", cat) if t.strip()]
        for c in categories:
            if any(t.lower() == c.lower() for t in tokens):
                cat_counts[c] += 1
                
    print(f"\nActive Guidelines: {active_count}")
    print("\n--- Category Guideline Counts ---")
    for c, count in cat_counts.items():
        print(f"{c:20}: {count} guidelines")

if __name__ == "__main__":
    main()
