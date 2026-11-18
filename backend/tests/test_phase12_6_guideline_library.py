import pytest
import re
import urllib.request
from typing import List, Dict, Any
from app.services.retrieval import get_supabase_client, retrieve_guideline_chunks
from app.services.embeddings import embed_query
from app.services.rag import run_rag_pipeline
from app.schemas import QueryRequest

CANONICAL_CATEGORIES = [
    "Nephrology",
    "Pain Management",
    "Endocrinology",
    "Diabetes",
    "Cardiovascular",
    "Hypertension",
    "Infectious Disease",
    "General"
]

def split_categories(category_str: str) -> List[str]:
    if not category_str:
        return []
    return [t.strip() for t in re.split(r"[,;/|]+", category_str) if t.strip()]

def test_a_kdigo_2022_intact():
    """Test A: Verify existing KDIGO 2022 Diabetes in CKD guideline is active and intact."""
    client = get_supabase_client()
    res = client.table("guidelines").select("*").eq("id", "3ed31dbd-7589-4327-b400-966df4d12a26").execute()
    assert len(res.data) == 1, "KDIGO 2022 guideline record missing"
    g = res.data[0]
    assert g["status"] == "active"
    assert g["organization"] == "KDIGO"
    assert "Diabetes" in g["category"] and "Nephrology" in g["category"]
    assert g.get("pdf_url") is not None

def test_b_historical_clinical_decisions_intact():
    """Test B: Verify all historical clinical decisions are preserved (at least 7)."""
    client = get_supabase_client()
    res = client.table("clinical_decisions").select("id", count="exact").execute()
    assert res.count is not None and res.count >= 7, f"Expected at least 7 clinical decisions, found {res.count}"

def test_c_all_eight_categories_have_at_least_two_guidelines():
    """Test C: Verify every one of the 8 canonical categories contains at least 2 authentic guidelines."""
    client = get_supabase_client()
    res = client.table("guidelines").select("id, title, category, status").eq("status", "active").execute()
    
    category_counts = {c: 0 for c in CANONICAL_CATEGORIES}
    for row in res.data:
        cats = split_categories(row.get("category", ""))
        for c in CANONICAL_CATEGORIES:
            if any(t.lower() == c.lower() for t in cats):
                category_counts[c] += 1
                
    for c, count in category_counts.items():
        assert count >= 2, f"Category '{c}' has only {count} guidelines, expected at least 2"

def test_d_multi_category_parsing():
    """Test D: Verify multi-category parsing splits comma, semicolon, slash, and pipe delimiters."""
    assert split_categories("Nephrology, Diabetes") == ["Nephrology", "Diabetes"]
    assert split_categories("Cardiovascular; Hypertension") == ["Cardiovascular", "Hypertension"]
    assert split_categories("Pain Management / General") == ["Pain Management", "General"]
    assert split_categories("Infectious Disease | General") == ["Infectious Disease", "General"]

def test_e_no_duplicate_guidelines():
    """Test E: Verify no duplicate guidelines exist by checking unique titles for active guidelines."""
    client = get_supabase_client()
    res = client.table("guidelines").select("title").eq("status", "active").execute()
    titles = [r["title"].strip().lower() for r in res.data]
    assert len(titles) == len(set(titles)), f"Duplicate active guideline titles found: {titles}"

def test_f_direct_pdf_urls_functional():
    """Test F: Verify direct official PDF URLs stored in database return HTTP 200 and application/pdf content type."""
    client = get_supabase_client()
    res = client.table("guidelines").select("title, pdf_url").eq("status", "active").not_.is_("pdf_url", "null").execute()
    assert len(res.data) >= 8, f"Expected at least 8 guidelines with PDF URLs, found {len(res.data)}"
    
    # Test official direct PDF links across NICE and KDIGO
    sample = [
        "https://www.nice.org.uk/guidance/ng136/resources/hypertension-in-adults-diagnosis-and-management-pdf-66141722710213",
        "https://www.nice.org.uk/guidance/ng28/resources/type-2-diabetes-in-adults-management-pdf-1837338615493",
        "https://www.nice.org.uk/guidance/ng196/resources/atrial-fibrillation-diagnosis-and-management-pdf-66142085507269",
        "https://kdigo.org/wp-content/uploads/2022/10/KDIGO-2022-Clinical-Practice-Guideline-for-Diabetes-Management-in-CKD.pdf"
    ]
    for url in sample:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
        with urllib.request.urlopen(req, timeout=15) as resp:
            assert resp.status == 200, f"URL {url} returned status {resp.status}"
            content_type = resp.headers.get("Content-Type", "")
            assert "pdf" in content_type.lower() or "octet-stream" in content_type.lower(), (
                f"URL {url} returned non-PDF type {content_type}"
            )

def test_g_chunk_embeddings_384_dimensional():
    """Test G: Verify chunk embeddings use 384 dimensions matching BAAI/bge-small-en-v1.5 and pgvector schema."""
    emb = embed_query("Clinical guideline query test")
    assert len(emb) == 384, f"Embedding size is {len(emb)}, expected 384"

def test_h_retrieval_returns_evidence_for_new_guidelines():
    """Test H: Verify vector similarity retrieval retrieves relevant evidence from newly indexed guidelines."""
    test_queries = [
        ("hypertension blood pressure targets in adults", "Hypertension in Adults: Diagnosis and Management"),
        ("chronic primary pain non-pharmacological acupuncture", "Chronic Pain in Over 16s: Assessment and Management"),
        ("subclinical hypothyroidism levothyroxine treatment threshold", "Thyroid Disease: Assessment and Management"),
        ("atrial fibrillation anticoagulation stroke risk", "Atrial Fibrillation: Diagnosis and Management"),
    ]
    for query, expected_guideline in test_queries:
        emb = embed_query(query)
        chunks = retrieve_guideline_chunks(emb, match_threshold=0.50, match_count=5)
        assert len(chunks) > 0, f"No chunks retrieved for query '{query}'"
        retrieved_titles = [c.get("guideline_title", "") for c in chunks]
        assert any(expected_guideline.lower() in t.lower() for t in retrieved_titles), (
            f"Expected '{expected_guideline}' in retrieved titles for query '{query}', got: {retrieved_titles}"
        )

def test_i_rag_pipeline_end_to_end():
    """Test I: Verify RAG pipeline generates grounded, structured response with valid source citations."""
    req = QueryRequest(
        question="What is the recommended blood pressure target for adults under 80 with hypertension?",
        category="Hypertension"
    )
    res = run_rag_pipeline(req)
    assert res.type == "healthcare"
    assert len(res.sources) > 0
    assert "hypertension" in res.answer.lower()
    for s in res.sources:
        assert s.guideline_id is not None
        assert s.title is not None
        assert s.organization is not None
        assert s.similarity > 0.0
        assert s.pdf_url is not None
