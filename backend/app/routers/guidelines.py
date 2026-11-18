import logging
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from typing import Optional, Dict, Any
from app.services.guideline_qc import (
    validate_guideline_upload,
    accept_and_index_guideline,
    CATEGORY_LEXICON
)
from app.services.retrieval import get_supabase_client

logger = logging.getLogger("guidelines_router")

router = APIRouter(prefix="/api/guidelines", tags=["guidelines"])

@router.post("/validate")
async def validate_guideline(file: UploadFile = File(...)):
    """
    Validates uploaded clinical guideline file:
    1. Verifies valid & readable PDF
    2. Checks clinical authenticity (rejects unrelated docs, recipes, code, ads)
    3. Extracts document title, organization, publication year, identifier
    4. Automatically determines clinical category (or marks Unclassified)
    5. Detects exact SHA-256 duplicate or similar editions
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF documents are supported for clinical guidelines."
        )

    file_bytes = await file.read()
    result = validate_guideline_upload(file_bytes, file.filename)
    return result

@router.post("/upload")
async def upload_and_index_guideline(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    organization: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    publication_year: Optional[str] = Form(None),
    version: Optional[str] = Form(None),
    document_version: Optional[str] = Form(None),
):
    """
    Accepts, stores, chunks, embeds, and indexes a verified clinical guideline.
    Blocks duplicate uploads and verifies clinical authenticity before indexing.
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF documents are supported."
        )

    file_bytes = await file.read()

    override_meta = {}
    if title and title.strip(): override_meta["title"] = title.strip()
    if organization and organization.strip(): override_meta["organization"] = organization.strip()
    if category and category.strip(): override_meta["category"] = category.strip()
    if publication_year and publication_year.strip(): override_meta["publication_year"] = publication_year.strip()
    if version and version.strip():
        override_meta["version"] = version.strip()
    elif document_version and document_version.strip():
        override_meta["version"] = document_version.strip()

    try:
        res = accept_and_index_guideline(
            file_bytes=file_bytes,
            filename=file.filename,
            override_metadata=override_meta if override_meta else None
        )
        return res
    except ValueError as ve:
        logger.warning(f"Guideline validation/ingestion rejected: {ve}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        logger.error(f"Guideline ingestion failed: {e}", exc_info=True)
        # Detail provides the exact failure stage
        err_str = str(e)
        if not err_str.startswith("["):
            err_str = f"Ingestion failed: {err_str}"
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=err_str)

@router.post("/fix-categories")
async def fix_missing_categories():
    """
    Safe correction process for existing guidelines with missing or ambiguous categories.
    Preserves all existing guidelines and chunks while updating category metadata accurately.
    """
    supabase = get_supabase_client()
    res = supabase.from_("guidelines").select("id, title, category, description, organization").execute()
    guidelines = res.data or []

    updated = []
    for g in guidelines:
        current_cat = g.get("category")
        title = g.get("title") or ""
        desc = g.get("description") or ""
        text = f"{title} {desc}".lower()

        # Check if category is missing or unclassified
        if not current_cat or current_cat.lower() == "unclassified" or current_cat.lower() == "general":
            # Classify using lexicon
            best_cat = None
            best_score = 0
            for cat, keywords in CATEGORY_LEXICON.items():
                score = sum(2 if kw in title.lower() else 1 for kw in keywords if kw in text)
                if score > best_score:
                    best_score = score
                    best_cat = cat

            assigned = best_cat if best_score >= 2 else (current_cat or "Unclassified")
            if assigned != current_cat:
                supabase.from_("guidelines").update({"category": assigned}).eq("id", g["id"]).execute()
                updated.append({"id": g["id"], "title": title, "old": current_cat, "new": assigned})

    return {
        "total_scanned": len(guidelines),
        "total_updated": len(updated),
        "updates": updated
    }

