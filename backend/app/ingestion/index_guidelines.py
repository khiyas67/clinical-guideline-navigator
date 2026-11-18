import os
import sys
import logging
from typing import List, Dict, Any
from app.config import settings
from app.services.retrieval import get_supabase_client
from app.services.embeddings import embed_documents
from app.ingestion.pdf_loader import download_pdf, extract_pages_from_pdf
from app.ingestion.chunker import chunk_pages

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("ingestion")

def ingest_verified_guidelines() -> Dict[str, Any]:
    """
    Main ingestion pipeline:
    1. Discovers verified guidelines from Supabase where is_verified = true and pdf_url is not null.
    2. Downloads each official PDF.
    3. Extracts pages and preserves page numbers.
    4. Chunks text into structured segments.
    5. Computes real 384-dimensional embeddings via BAAI/bge-small-en-v1.5.
    6. Stores documents and chunks in Supabase pgvector tables.
    """
    supabase = get_supabase_client()
    
    logger.info("Querying Supabase for verified guidelines with PDF URLs...")
    res = supabase.from_("guidelines").select("*").eq("is_verified", True).not_.is_("pdf_url", "null").execute()
    guidelines = res.data or []
    
    stats = {
        "verified_found": len(guidelines),
        "pdfs_downloaded": 0,
        "pdfs_failed": 0,
        "documents_indexed": 0,
        "total_chunks": 0,
        "total_embeddings": 0,
        "errors": []
    }

    if not guidelines:
        logger.warning("No verified guidelines with pdf_url found in Supabase.")
        return stats

    logger.info(f"Discovered {len(guidelines)} verified guidelines eligible for PDF ingestion:")
    for g in guidelines:
        logger.info(f"  - [{g.get('organization')}] {g.get('title')} ({g.get('pdf_url')})")

    for guideline in guidelines:
        g_id = guideline["id"]
        title = guideline["title"]
        org = guideline["organization"]
        pdf_url = guideline["pdf_url"]
        source_url = guideline.get("source_url")
        version = guideline.get("version") or "1.0"

        logger.info(f"\n--- Processing Guideline: [{org}] {title} ---")

        # 1. Download PDF
        try:
            pdf_bytes, checksum = download_pdf(pdf_url)
            stats["pdfs_downloaded"] += 1
        except Exception as e:
            err_msg = f"Failed to download PDF for [{org}] {title} from {pdf_url}: {e}"
            logger.error(err_msg)
            stats["pdfs_failed"] += 1
            stats["errors"].append(err_msg)
            continue

        # 2. Check if already indexed with matching checksum
        existing_doc = supabase.from_("guideline_documents").select("*").eq("guideline_id", g_id).eq("checksum", checksum).eq("ingestion_status", "completed").execute()
        if existing_doc and existing_doc.data:
            logger.info(f"Document already fully indexed with matching checksum ({checksum[:10]}...). Skipping re-indexing.")
            stats["documents_indexed"] += 1
            continue

        # 3. Create or update document record in guideline_documents
        doc_filename = os.path.basename(pdf_url.split("?")[0]) if pdf_url else f"{title[:30]}.pdf"
        doc_record = {
            "guideline_id": g_id,
            "file_name": doc_filename,
            "document_name": title,
            "source_url": source_url,
            "pdf_url": pdf_url,
            "document_version": version,
            "checksum": checksum,
            "file_size": len(pdf_bytes),
            "mime_type": "application/pdf",
            "processing_status": "completed",
            "ingestion_status": "processing"
        }
        d_fetch = supabase.from_("guideline_documents").select("id").eq("guideline_id", g_id).eq("checksum", checksum).execute()
        if d_fetch.data:
            doc_id = d_fetch.data[0]["id"]
            supabase.from_("guideline_documents").update(doc_record).eq("id", doc_id).execute()
        else:
            doc_res = supabase.from_("guideline_documents").insert(doc_record).execute()
            doc_id = doc_res.data[0]["id"]

        # 4. Extract pages
        try:
            pages = extract_pages_from_pdf(pdf_bytes)
            if not pages:
                raise ValueError("No text could be extracted from PDF.")
        except Exception as e:
            err_msg = f"Failed to extract pages for [{org}] {title}: {e}"
            logger.error(err_msg)
            supabase.from_("guideline_documents").update({"ingestion_status": "failed"}).eq("id", doc_id).execute()
            stats["errors"].append(err_msg)
            continue

        # 5. Chunk text
        chunks = chunk_pages(pages, chunk_size=1000, chunk_overlap=150)
        if not chunks:
            err_msg = f"No chunks generated for [{org}] {title}"
            logger.error(err_msg)
            supabase.from_("guideline_documents").update({"ingestion_status": "failed"}).eq("id", doc_id).execute()
            stats["errors"].append(err_msg)
            continue

        # 6. Generate real embeddings
        logger.info(f"Generating embeddings for {len(chunks)} chunks with {settings.EMBEDDING_MODEL}...")
        texts_to_embed = [c["content"] for c in chunks]
        embeddings = embed_documents(texts_to_embed, batch_size=32)
        stats["total_embeddings"] += len(embeddings)

        # 7. Delete any previous chunks for this document before re-inserting
        supabase.from_("guideline_chunks").delete().eq("document_id", doc_id).execute()

        # 8. Batch insert chunks
        chunk_records = []
        for i, (chunk, emb) in enumerate(zip(chunks, embeddings)):
            chunk_records.append({
                "document_id": doc_id,
                "guideline_id": g_id,
                "chunk_index": i,
                "content": chunk["content"],
                "page_number": chunk["page_number"],
                "section_title": chunk["section_title"],
                "source_url": source_url,
                "pdf_url": pdf_url,
                "embedding": emb
            })

        # Insert in batches of 50
        batch_size = 50
        for b_start in range(0, len(chunk_records), batch_size):
            batch = chunk_records[b_start:b_start + batch_size]
            supabase.from_("guideline_chunks").insert(batch).execute()

        stats["total_chunks"] += len(chunk_records)
        stats["documents_indexed"] += 1

        # 9. Mark document completed
        supabase.from_("guideline_documents").update({"ingestion_status": "completed"}).eq("id", doc_id).execute()
        logger.info(f"Successfully indexed [{org}] {title}: {len(chunk_records)} chunks created and embedded.")

    logger.info("\n=== INGESTION SUMMARY ===")
    logger.info(f"Verified guidelines found:    {stats['verified_found']}")
    logger.info(f"PDFs successfully downloaded: {stats['pdfs_downloaded']}")
    logger.info(f"PDFs failed:                  {stats['pdfs_failed']}")
    logger.info(f"Documents indexed:            {stats['documents_indexed']}")
    logger.info(f"Total chunks created:         {stats['total_chunks']}")
    logger.info(f"Total embeddings created:     {stats['total_embeddings']}")
    if stats["errors"]:
        logger.warning(f"Encountered {len(stats['errors'])} errors:")
        for err in stats["errors"]:
            logger.warning(f"  - {err}")

    return stats

if __name__ == "__main__":
    ingest_verified_guidelines()
