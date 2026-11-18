import logging
from typing import List, Dict, Any, Optional
from app.schemas import QueryRequest, QueryResponse, SourceItem
from app.services.query_router import classify_query
from app.services.embeddings import embed_query, EmbeddingModelUnavailableError
from app.services.retrieval import retrieve_guideline_chunks, get_patient_clinical_context
from app.services.groq_service import generate_grounded_answer

logger = logging.getLogger(__name__)

INSUFFICIENT_EVIDENCE_ANSWER = (
    "I couldn't find sufficiently relevant evidence in the currently indexed clinical "
    "guidelines to answer that question confidently. Please consult the full official guidelines "
    "or consider selecting another clinical topic."
)

def run_rag_pipeline(request: QueryRequest) -> QueryResponse:
    """
    Executes the clinical assistant pipeline:
    1. Query Router classification
    2. Optional Patient Context enrichment
    3. Query Embedding via local bge-small-en-v1.5
    4. Supabase pgvector retrieval
    5. Evidence sufficiency evaluation
    6. Grounded Groq generation
    7. Source metadata & excerpt mapping
    """
    question = request.question.strip()

    # Step 1: Query Router
    q_type, canned_answer = classify_query(question)

    if q_type == "greeting":
        return QueryResponse(type="greeting", answer=canned_answer, sources=[])

    if q_type == "out_of_scope":
        return QueryResponse(type="out_of_scope", answer=canned_answer, sources=[])

    if q_type == "unclear":
        return QueryResponse(type="unclear", answer=canned_answer, sources=[])

    # Step 2: Retrieve Patient Context (if patient_id is present)
    patient_context = None
    if request.patient_id:
        patient_context = get_patient_clinical_context(
            patient_id=request.patient_id,
            clinician_id=request.clinician_id
        )

    # Step 3: Local Query Embedding (384 dimensions)
    # Context-enrich retrieval query if patient conditions are pertinent and not already mentioned
    retrieval_query = question
    if patient_context and patient_context.get("conditions"):
        conds = patient_context["conditions"]
        if isinstance(conds, list) and conds:
            conds_clean = [c for c in conds if c.lower() not in question.lower()]
            if conds_clean:
                retrieval_query = f"{question} ({', '.join(conds_clean[:2])})"

    try:
        query_vector = embed_query(retrieval_query)
    except EmbeddingModelUnavailableError as em_err:
        logger.warning(f"Embedding model unavailable during RAG query: {em_err}")
        return QueryResponse(
            type="healthcare",
            answer=(
                f"Clinical guideline search is currently unavailable: {em_err}. "
                "No guideline evidence could be retrieved."
            ),
            sources=[]
        )
    except Exception as e:
        logger.error(f"Embedding generation failed: {e}")
        return QueryResponse(
            type="healthcare",
            answer="A temporary error occurred while processing the clinical question embedding. Please try again.",
            sources=[]
        )

    # Step 4: Supabase pgvector Retrieval
    evidence_chunks = retrieve_guideline_chunks(query_vector)

    # Exclude archived evaluation datasets and synthetic demo chunks from clinical RAG answers
    EXCLUDED_GUIDELINE_IDS = {
        "8141c103-9bac-44b6-9c68-fd8645aa5b42",  # KDIGO 2024 Synthetic Evaluation Dataset
        "069969fa-8ec8-41c8-b1d4-82e0890d3e31",  # Synthetic Academic Demo Guideline
    }
    evidence_chunks = [
        c for c in evidence_chunks 
        if str(c.get("guideline_id", "")) not in EXCLUDED_GUIDELINE_IDS
    ]

    # Step 5: Evidence Check
    if not evidence_chunks:
        logger.info(f"No evidence chunks matched query: '{question}'")
        return QueryResponse(
            type="healthcare",
            answer=INSUFFICIENT_EVIDENCE_ANSWER,
            sources=[]
        )

    # Step 6: Groq Grounded Answer Generation
    try:
        grounded_answer = generate_grounded_answer(
            question=question,
            evidence_chunks=evidence_chunks,
            patient_context=patient_context
        )
    except ValueError as ve:
        logger.error(f"Groq configuration error: {ve}")
        return QueryResponse(
            type="healthcare",
            answer=f"The AI service is currently not configured: {ve}",
            sources=[]
        )
    except Exception as e:
        logger.error(f"Groq API error: {e}")
        return QueryResponse(
            type="healthcare",
            answer="An error occurred while synthesizing the clinical answer from retrieved guidelines. Please try again.",
            sources=[]
        )

    # Step 7: Format Source Items for Frontend EvidenceCard
    sources: List[SourceItem] = []
    seen_excerpts = set()

    # Pre-fetch guideline URLs if missing on chunks
    missing_pdf_gids = list({
        str(c.get("guideline_id"))
        for c in evidence_chunks
        if c.get("guideline_id") and not c.get("pdf_url")
    })
    g_url_map = {}
    if missing_pdf_gids:
        try:
            supabase = get_supabase_client()
            res_g = supabase.table("guidelines").select("id, pdf_url, source_url, official_url").in_("id", missing_pdf_gids).execute()
            if res_g.data:
                for row in res_g.data:
                    g_url_map[row["id"]] = {
                        "pdf_url": row.get("pdf_url") or row.get("official_url"),
                        "source_url": row.get("source_url") or row.get("official_url")
                    }
        except Exception as e_url:
            logger.debug(f"Could not load guideline fallback URLs: {e_url}")

    for chunk in evidence_chunks:
        content = chunk.get("content", "").strip()
        # Create a clean excerpt (first 250 characters)
        excerpt = content[:260] + "..." if len(content) > 260 else content
        
        excerpt_key = (chunk.get("guideline_id"), chunk.get("page_number"), chunk.get("section_title"))
        if excerpt_key in seen_excerpts:
            continue
        seen_excerpts.add(excerpt_key)

        gid_str = str(chunk.get("guideline_id", ""))
        fallback_urls = g_url_map.get(gid_str, {})
        final_pdf_url = chunk.get("pdf_url") or fallback_urls.get("pdf_url")
        final_source_url = chunk.get("source_url") or fallback_urls.get("source_url")

        sources.append(SourceItem(
            guideline_id=gid_str,
            title=chunk.get("guideline_title") or "Clinical Guideline",
            organization=chunk.get("organization") or "Health Authority",
            section=chunk.get("section_title"),
            page=chunk.get("page_number"),
            excerpt=excerpt,
            source_url=final_source_url,
            pdf_url=final_pdf_url,
            similarity=round(float(chunk.get("similarity", 0.0)), 4)
        ))

    return QueryResponse(
        type="healthcare",
        answer=grounded_answer,
        sources=sources
    )
