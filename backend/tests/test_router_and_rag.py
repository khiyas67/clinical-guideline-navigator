import pytest
from app.services.query_router import classify_query
from app.schemas import QueryRequest, QueryResponse, SourceItem
from app.ingestion.chunker import chunk_pages, detect_section_title

def test_greeting_routing():
    """Verify greetings are classified as 'greeting' without triggering retrieval."""
    test_greetings = ["Hi", "Hello", "Good morning", "Hey there", "How are you?"]
    for g in test_greetings:
        q_type, resp = classify_query(g)
        assert q_type == "greeting", f"Failed for greeting: {g}"
        assert "Hello!" in resp or "How can I help" in resp

def test_out_of_scope_routing():
    """Verify non-medical queries are classified as 'out_of_scope' without retrieval."""
    test_out = [
        "Who won yesterday's cricket match?",
        "Write Python code for quicksort",
        "Tell me a joke",
        "What is the capital of France?",
        "Recommend a movie"
    ]
    for q in test_out:
        q_type, resp = classify_query(q)
        assert q_type == "out_of_scope", f"Failed for out of scope query: {q}"
        assert "designed to assist with healthcare" in resp

def test_healthcare_routing():
    """Verify clinical and guideline queries are classified as 'healthcare'."""
    test_healthcare = [
        "What is hypertension?",
        "What is type 2 diabetes?",
        "What does the diabetes guideline recommend?",
        "What are the contraindications for metformin?",
        "What blood pressure target is recommended for CKD patients?",
        "What is the initial pharmacological treatment for hypertension?",
        "How should COVID-19 be managed in outpatient adults?"
    ]
    for q in test_healthcare:
        q_type, _ = classify_query(q)
        assert q_type == "healthcare", f"Failed to identify healthcare query: {q}"

def test_unclear_routing():
    """Verify very short or uninformative single non-medical words are flagged as unclear."""
    test_unclear = ["asdf", "car", "xyz"]
    for q in test_unclear:
        q_type, resp = classify_query(q)
        assert q_type == "unclear", f"Failed for unclear input: {q}"
        assert "couldn't quite understand" in resp

def test_chunker_preserves_page_numbers_and_sections():
    """Verify chunker maintains page numbers and produces meaningful text chunks."""
    pages = [
        {
            "page_number": 1,
            "text": "NICE Guideline NG28. Section 1.2 Drug Treatment. Adults with type 2 diabetes should be offered metformin as first-line therapy if estimated GFR is above 30 mL/min."
        },
        {
            "page_number": 2,
            "text": "Chapter 2 Monitoring blood pressure. Measure blood pressure annually in adults with type 2 diabetes without kidney disease. The clinic target is below 140/90 mmHg."
        }
    ]
    chunks = chunk_pages(pages, chunk_size=300, chunk_overlap=50)
    assert len(chunks) >= 2
    assert chunks[0]["page_number"] == 1
    assert chunks[1]["page_number"] == 2
    assert "Section 1.2" in chunks[0]["section_title"] or "Drug Treatment" in chunks[0]["section_title"] or "Clinical Guidance" in chunks[0]["section_title"]
    assert "metformin" in chunks[0]["content"]

def test_source_item_schema_and_traceability():
    """Verify SourceItem validates real guideline metadata fields."""
    item = SourceItem(
        guideline_id="00000000-0000-0000-0000-000000000001",
        title="Type 2 diabetes in adults: management",
        organization="NICE",
        section="1.2 Drug treatment",
        page=24,
        excerpt="Offer standard-release metformin as initial drug treatment...",
        source_url="https://www.nice.org.uk/guidance/ng28",
        pdf_url="https://www.nice.org.uk/guidance/ng28/resources/type-2-diabetes-in-adults-management-pdf-1837338615493",
        similarity=0.8842
    )
    assert item.organization == "NICE"
    assert item.page == 24
    assert item.similarity == 0.8842
    assert "nice.org.uk" in (item.source_url or "")

def test_frontend_does_not_expose_groq_key():
    """Verify that GROQ_API_KEY is not exposed to frontend source files."""
    from pathlib import Path
    
    frontend_src = Path(__file__).resolve().parent.parent.parent / "src"
    for ts_file in frontend_src.rglob("*.ts*"):
        content = ts_file.read_text(encoding="utf-8")
        assert "GROQ_API_KEY" not in content, f"Found GROQ_API_KEY in frontend file: {ts_file}"
        assert "VITE_GROQ_API_KEY" not in content, f"Found VITE_GROQ_API_KEY in frontend file: {ts_file}"
        assert "SERVICE_ROLE" not in content, f"Found SERVICE_ROLE in frontend file: {ts_file}"
        assert "SUPABASE_SERVICE_ROLE_KEY" not in content, f"Found SUPABASE_SERVICE_ROLE_KEY in frontend file: {ts_file}"
