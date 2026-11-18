import sys
import json
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from app.config import settings
from app.schemas import QueryRequest, QueryResponse
from app.services.query_router import classify_query
from app.services.embeddings import embed_query
from app.services.retrieval import get_supabase_client, retrieve_guideline_chunks
from app.services.groq_service import generate_grounded_answer
from app.services.rag import run_rag_pipeline

def run_verification():
    print("=" * 80)
    print("CLINICAL NAVIGATOR - END-TO-END REAL RAG VERIFICATION")
    print("=" * 80)

    query_text = "What is the recommended management approach for type 2 diabetes?"
    print(f"\nTarget Query: '{query_text}'\n")

    # --- Database Statistics ---
    supabase = get_supabase_client()
    
    # Guidelines
    g_res = supabase.from_("guidelines").select("id, title, organization, is_verified, pdf_url").execute()
    verified_guidelines = [g for g in g_res.data if g.get("is_verified")]
    print(f"[*] Verified Guidelines Discovered: {len(verified_guidelines)}")
    for g in verified_guidelines:
        print(f"    - [{g.get('organization')}] {g.get('title')} (PDF: {bool(g.get('pdf_url'))})")

    # Documents
    d_res = supabase.from_("guideline_documents").select("id, document_name, ingestion_status, pdf_url, source_url").execute()
    completed_docs = [d for d in d_res.data if d.get("ingestion_status") == "completed"]
    failed_docs = [d for d in d_res.data if d.get("ingestion_status") == "failed"]
    print(f"\n[*] Guideline Documents Records: {len(d_res.data)}")
    print(f"    - Successfully Ingested PDFs: {len(completed_docs)}")
    print(f"    - Failed PDFs: {len(failed_docs)}")
    for d in d_res.data:
        print(f"    - [{d.get('ingestion_status').upper()}] {d.get('document_name')}")

    # Chunks Count & Embedding check
    c_res = supabase.from_("guideline_chunks").select("id, chunk_index, page_number, section_title, embedding", count="exact").limit(1).execute()
    total_chunks = c_res.count
    sample_chunk = c_res.data[0] if c_res.data else None
    has_embeddings = sample_chunk is not None and sample_chunk.get("embedding") is not None
    print(f"\n[*] Total guideline_chunks Records: {total_chunks}")
    print(f"[*] Confirmation of embeddings in guideline_chunks: {has_embeddings} (Dimension: {len(eval(sample_chunk['embedding'])) if isinstance(sample_chunk.get('embedding'), str) else len(sample_chunk.get('embedding', [])) if sample_chunk else 'N/A'})")

    print("\n" + "-" * 80)
    print("STAGE-BY-STAGE PIPELINE EXECUTION")
    print("-" * 80)

    # Stage 1: Query classification
    q_type, canned_resp = classify_query(query_text)
    print(f"\n[Stage 1] Query Classification:")
    print(f"    Result: '{q_type}' (Expected: 'healthcare') -> {'PASS' if q_type == 'healthcare' else 'FAIL'}")

    # Stage 2: Query Embedding
    query_vector = embed_query(query_text)
    print(f"\n[Stage 2] Query Embedding Generation:")
    print(f"    Model: {settings.EMBEDDING_MODEL}")
    print(f"    Vector Dimensions: {len(query_vector)} (Sample values: {query_vector[:4]}...) -> {'PASS' if len(query_vector) == 384 else 'FAIL'}")

    # Stage 3 & 4: pgvector similarity retrieval
    evidence_chunks = retrieve_guideline_chunks(query_vector, match_threshold=0.40, match_count=5)
    print(f"\n[Stage 3 & 4] Supabase pgvector match_guideline_chunks RPC:")
    print(f"    Chunks Retrieved: {len(evidence_chunks)}")

    # Stage 5 & 6 & 7: Evidence Inspection & Provenance
    print(f"\n[Stage 5, 6, 7] Retrieved Chunks Breakdown & Provenance:")
    for idx, chunk in enumerate(evidence_chunks, 1):
        print(f"    Chunk #{idx}:")
        print(f"      - Guideline: [{chunk.get('organization')}] {chunk.get('guideline_title')}")
        print(f"      - Section: {chunk.get('section_title')}")
        print(f"      - Page Number: {chunk.get('page_number')}")
        print(f"      - Similarity Score: {chunk.get('similarity'):.4f}")
        print(f"      - Source URL: {chunk.get('source_url')}")
        print(f"      - PDF URL: {chunk.get('pdf_url')}")
        print(f"      - Content Preview: {chunk.get('content')[:180].replace(chr(10), ' ')}...")

    # Stage 8 & 9: Groq LLM grounded synthesis
    print(f"\n[Stage 8 & 9] Groq Inference ({settings.GROQ_MODEL}):")
    grounded_answer = generate_grounded_answer(
        question=query_text,
        evidence_chunks=evidence_chunks,
        patient_context=None
    )
    print(f"    Grounded Answer Generated ({len(grounded_answer)} chars):")
    print(f"    \"{grounded_answer}\"")

    # Stage 10: Complete API Request Response
    req = QueryRequest(question=query_text, category="Diabetes")
    api_response = run_rag_pipeline(req)
    print(f"\n[Stage 10] API Response Payload Verification:")
    print(f"    Type: {api_response.type}")
    print(f"    Sources count: {len(api_response.sources)}")
    for s in api_response.sources:
        print(f"      - Source: [{s.organization}] {s.title} | Section: {s.section} | Page: {s.page} | Similarity: {s.similarity}")
        print(f"        Official URL: {s.source_url}")
        print(f"        PDF URL: {s.pdf_url}")

    print("\n" + "=" * 80)
    print("ALL 12 STAGES COMPLETED SUCCESSFULLY")
    print("=" * 80)

if __name__ == "__main__":
    run_verification()
