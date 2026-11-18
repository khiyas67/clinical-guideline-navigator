import io
import os
import sys
from dotenv import load_dotenv
load_dotenv('J:/healthcare RAG/backend/.env')

from reportlab.pdfgen import canvas
from app.services.retrieval import get_supabase_client, retrieve_guideline_chunks
from app.services.guideline_qc import accept_and_index_guideline
from app.services.embeddings import embed_query
from app.services.rag import run_rag_pipeline
from app.schemas import QueryRequest

def create_clinical_test_pdf(topic: str = "Atrial Fibrillation") -> bytes:
    buf = io.BytesIO()
    c = canvas.Canvas(buf)
    c.drawString(50, 750, "American College of Cardiology (ACC) and American Heart Association (AHA)")
    c.drawString(50, 730, f"2024 Clinical Practice Guideline for the Management of {topic}")
    c.drawString(50, 710, "Executive Summary: Recommendations for Diagnosis and Prevention")
    c.drawString(50, 680, f"1. For patients with {topic}, comprehensive clinical evaluation is strongly recommended.")
    c.drawString(50, 660, "   Guideline-directed therapy should be initiated according to evidence-based protocol.")
    c.drawString(50, 640, "2. Preferred pharmacological agents and monitoring intervals for clinical management.")
    c.drawString(50, 620, "3. Renal function monitoring with creatinine and eGFR must guide dosing adjustments.")
    c.drawString(50, 600, "4. Contraindications and precautions must be verified prior to prescription.")
    c.showPage()
    c.save()
    return buf.getvalue()

def verify_ingestion():
    supabase = get_supabase_client()

    # 1. Baseline Pre-condition Check
    c_g = len(supabase.from_("guidelines").select("id", count="exact").execute().data)
    c_d = len(supabase.from_("guideline_documents").select("id", count="exact").execute().data)
    c_c = len(supabase.from_("guideline_chunks").select("id", count="exact").execute().data)
    c_dec = len(supabase.from_("clinical_decisions").select("id", count="exact").execute().data)
    print(f"Baseline DB state: {c_g} guidelines, {c_d} documents, {c_c} chunks, {c_dec} decisions")
    assert (c_g, c_d, c_c, c_dec) == (5, 6, 745, 7), f"Pre-condition failed: {(c_g, c_d, c_c, c_dec)}"

    pdf_bytes = create_clinical_test_pdf()
    test_gids = []

    try:
        # TEST A: Ingestion with explicit version
        print("\n--- TEST A: Ingestion with explicit version ---")
        res_a = accept_and_index_guideline(
            file_bytes=pdf_bytes,
            filename="acc_aha_afib_2024_versioned.pdf",
            override_metadata={
                "title": "ACC/AHA 2024 Guideline for Management of Atrial Fibrillation (Versioned)",
                "organization": "ACC",
                "category": "Cardiovascular",
                "publication_year": "2024",
                "version": "2024 Executive Edition"
            }
        )
        gid_a = res_a["guideline_id"]
        did_a = res_a["document_id"]
        test_gids.append(gid_a)
        print(f"Created guideline {gid_a}, doc {did_a}, chunks {res_a['chunks_created']}")

        # Verify DB records
        doc_a = supabase.from_("guideline_documents").select("*").eq("id", did_a).single().execute().data
        print(f"Document version recorded: '{doc_a.get('document_version')}'")
        assert doc_a.get("document_version") == "2024 Executive Edition", "Version mismatch!"
        assert doc_a.get("ingestion_status") == "completed"

        chunks_a = supabase.from_("guideline_chunks").select("id, embedding, content").eq("guideline_id", gid_a).execute().data
        assert len(chunks_a) > 0, "No chunks created!"
        first_emb = chunks_a[0]["embedding"]
        # In pgvector it may be string '[0.1, ...]' or list
        emb_dim = len(first_emb) if isinstance(first_emb, list) else len(first_emb.strip("[]").split(","))
        print(f"Chunks generated: {len(chunks_a)}, embedding dimension: {emb_dim}")
        assert emb_dim == 384, f"Expected 384-dimensional embedding, got {emb_dim}"

        # Vector Retrieval Test
        query_text = "What oral anticoagulation is recommended for atrial fibrillation stroke prevention?"
        q_vec = embed_query(query_text)
        retrieved_chunks = retrieve_guideline_chunks(query_embedding=q_vec, match_count=5)
        matched_chunks = [c for c in retrieved_chunks if c.get("guideline_id") == gid_a]
        print(f"Retrieved {len(matched_chunks)} chunks from new guideline via pgvector similarity search")
        assert len(matched_chunks) > 0, "RAG vector search failed to retrieve newly ingested chunks!"

        # RAG Pipeline Grounded Answer Test
        rag_res = run_rag_pipeline(QueryRequest(question=query_text))
        print(f"RAG Response Type: {rag_res.type}, Sources: {len(rag_res.sources)}")
        has_new_guideline_cited = any(s.title and "Atrial Fibrillation" in s.title for s in rag_res.sources)
        print(f"New guideline cited in clinical answer sources: {has_new_guideline_cited}")
        assert has_new_guideline_cited, "New guideline should be cited in RAG answer sources!"

        # TEST B: Ingestion WITHOUT version (fallback to 'Not specified')
        print("\n--- TEST B: Ingestion without version (safe fallback) ---")
        pdf_bytes_b = create_clinical_test_pdf("Ventricular Tachycardia")
        res_b = accept_and_index_guideline(
            file_bytes=pdf_bytes_b,
            filename="acc_aha_vt_2024_unversioned.pdf",
            override_metadata={
                "title": "ACC/AHA 2024 Guideline (Unversioned Fallback Test)",
                "organization": "ACC",
                "category": "Cardiovascular",
                "publication_year": "2024"
            }
        )
        gid_b = res_b["guideline_id"]
        did_b = res_b["document_id"]
        test_gids.append(gid_b)

        doc_b = supabase.from_("guideline_documents").select("*").eq("id", did_b).single().execute().data
        print(f"Fallback document version: '{doc_b.get('document_version')}'")
        assert doc_b.get("document_version") == "Not specified", "Fallback version did not match 'Not specified'!"

        # TEST C: Stage-Identified Error Handling & Rollback
        print("\n--- TEST C: Stage-identified error handling & atomic rollback ---")
        pdf_bytes_c = create_clinical_test_pdf("Heart Failure")
        try:
            accept_and_index_guideline(
                file_bytes=pdf_bytes_c,
                filename="failing_guideline_test.pdf",
                override_metadata={
                    "title": "", # Blank title should trigger stage error
                    "organization": "ACC"
                }
            )
            assert False, "Should have raised ValueError on missing title!"
        except ValueError as ve:
            print(f"Caught expected validation error: {ve}")
            assert "[Metadata Validation]" in str(ve), f"Stage tag missing: {ve}"

    finally:
        print("\n--- CLEANUP: Removing isolated test records ---")
        for gid in test_gids:
            supabase.from_("guideline_chunks").delete().eq("guideline_id", gid).execute()
            supabase.from_("guideline_documents").delete().eq("guideline_id", gid).execute()
            supabase.from_("guidelines").delete().eq("id", gid).execute()
            print(f"Cleaned up test guideline {gid}")

        # Verify DB counts restored exactly
        c_g_end = len(supabase.from_("guidelines").select("id", count="exact").execute().data)
        c_d_end = len(supabase.from_("guideline_documents").select("id", count="exact").execute().data)
        c_c_end = len(supabase.from_("guideline_chunks").select("id", count="exact").execute().data)
        c_dec_end = len(supabase.from_("clinical_decisions").select("id", count="exact").execute().data)
        print(f"Post-cleanup DB state: {c_g_end} guidelines, {c_d_end} documents, {c_c_end} chunks, {c_dec_end} decisions")
        assert (c_g_end, c_d_end, c_c_end, c_dec_end) == (5, 6, 745, 7), "Post-cleanup count mismatch!"
        print("\nALL VERIFICATIONS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    verify_ingestion()

