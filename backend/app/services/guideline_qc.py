"""
Clinical Navigator - Guideline Quality Control, Duplicate Prevention,
Metadata Extraction, and Clinical Category Classifier.
"""

import os
import io
import re
import hashlib
import logging
from typing import Dict, Any, Tuple, Optional, List
from pypdf import PdfReader
from app.config import settings
from app.services.retrieval import get_supabase_client
from app.ingestion.chunker import chunk_pages
from app.services.embeddings import embed_documents

logger = logging.getLogger("guideline_qc")

# Authoritative clinical organizations recognition
KNOWN_ORGS = [
    ("World Health Organization", "WHO"),
    ("Centers for Disease Control and Prevention", "CDC"),
    ("Kidney Disease: Improving Global Outcomes", "KDIGO"),
    ("National Institutes of Health", "NIH"),
    ("National Center for Biotechnology Information", "NCBI"),
    ("American Heart Association", "AHA"),
    ("American College of Cardiology", "ACC"),
    ("American Diabetes Association", "ADA"),
    ("Infectious Diseases Society of America", "IDSA"),
    ("Indian Council of Medical Research", "ICMR"),
    ("National Institute for Health and Care Excellence", "NICE"),
    ("European Society of Cardiology", "ESC"),
    ("Endocrine Society", "Endocrine Society"),
]

# Clinical guideline keywords required to verify authenticity
CLINICAL_INDICATORS = [
    "recommendation", "clinical practice", "guideline", "guidance", "treatment",
    "therapy", "diagnosis", "patient", "management", "contraindication",
    "dosage", "pharmacological", "screening", "adverse", "efficacy",
    "randomized", "evidence-based", "algorithm", "intervention", "monitoring",
    "clinical assessment", "prescribing", "prevention"
]

# Non-clinical rejection terms (novels, recipes, coding, finance, ads)
NON_CLINICAL_INDICATORS = [
    "recipe", "ingredients", "tablespoon", "cooking time", "novel", "chapter one",
    "fiction", "financial quarterly", "stock dividend", "shareholder",
    "balance sheet", "software license", "source code", "github repository",
    "travel brochure", "resort vacation", "marketing agency", "advertisement"
]

# Specialty Lexicon for Clinical Category Assignment
CATEGORY_LEXICON = {
    "Nephrology": [
        "ckd", "chronic kidney disease", "kidney", "nephrology", "egfr", "albuminuria",
        "proteinuria", "dialysis", "renal", "glomerular", "creatinine", "nephropathy",
        "kdigo", "hemodialysis", "peritoneal"
    ],
    "Pain Management": [
        "opioid", "pain", "chronic pain", "acute pain", "analgesic", "morphine",
        "fentanyl", "oxycodone", "buprenorphine", "methadone", "naloxone",
        "pain management", "cdc opioid", "tapering", "mme"
    ],
    "Diabetes": [
        "diabetes", "type 2 diabetes", "type 1 diabetes", "t2d", "t1d", "hyperglycemia",
        "hypoglycemia", "insulin", "glucose", "hba1c", "metformin", "glycemic",
        "diabetic ketoacidosis", "dka"
    ],
    "Endocrinology": [
        "endocrinology", "endocrine", "thyroid", "adrenal", "pituitary", "hormone",
        "sglt2", "sglt2i", "glp-1", "dpp-4", "cushing", "hypothyroidism", "hyperthyroidism"
    ],
    "Cardiovascular": [
        "cardiovascular", "cardiology", "heart failure", "hfref", "hfpef", "myocardial",
        "infarction", "coronary", "arrhythmia", "atrial fibrillation", "stent", "angina",
        "atherosclerosis", "stroke", "statins"
    ],
    "Hypertension": [
        "hypertension", "blood pressure", "antihypertensive", "systolic", "diastolic",
        "bp measurement", "resistant hypertension", "ace inhibitor", "arb", "amlodipine",
        "lisinopril"
    ],
    "Infectious Disease": [
        "infectious", "infection", "covid-19", "sars-cov-2", "tuberculosis", "hiv",
        "viral", "bacterial", "antimicrobial", "antibiotic", "sepsis", "vaccination",
        "pathogen", "antiviral"
    ],
    "Medications": [
        "pharmacotherapy", "drug interaction", "pharmacokinetics", "dosing adjustment",
        "adverse drug reaction", "contraindications", "polypharmacy"
    ],
}

def compute_sha256(data: bytes) -> str:
    """Computes SHA-256 hexadecimal digest of raw bytes."""
    return hashlib.sha256(data).hexdigest()

def normalize_title(title: str) -> str:
    """Normalizes title for similarity comparison (strips years, punctuation, whitespace)."""
    cleaned = title.lower()
    cleaned = re.sub(r"20\d\d|19\d\d", "", cleaned)
    cleaned = re.sub(r"guideline|clinical|practice|management|for|in|of|the|and|united states", "", cleaned)
    cleaned = re.sub(r"[^a-z0-9]", "", cleaned)
    return cleaned.strip()

def extract_pdf_content(file_bytes: bytes) -> Tuple[bool, Optional[str], List[Dict[str, Any]], Dict[str, Any]]:
    """
    Validates PDF integrity and extracts readable pages.
    Returns (is_valid, error_msg, pages_list, metadata_dict).
    """
    if not file_bytes:
        return False, "File is completely empty (0 bytes).", [], {}

    if not file_bytes.startswith(b"%PDF"):
        return False, "Uploaded file is not a valid PDF document (missing %PDF header).", [], {}

    try:
        reader = PdfReader(io.BytesIO(file_bytes))
        total_pages = len(reader.pages)
        if total_pages == 0:
            return False, "PDF document contains 0 pages.", [], {}

        pages_data = []
        full_text = ""
        for idx, page in enumerate(reader.pages, start=1):
            try:
                page_text = page.extract_text() or ""
                clean_text = " ".join(page_text.split())
                if clean_text:
                    pages_data.append({
                        "page_number": idx,
                        "text": clean_text
                    })
                    full_text += " " + clean_text
            except Exception as pe:
                logger.warning(f"Could not extract page {idx}: {pe}")

        if not pages_data or len(full_text.strip()) < 100:
            return False, "PDF contains insufficient or unreadable text (possibly scanned image without OCR).", [], {}

        meta = {}
        if reader.metadata:
            meta = {
                "title": reader.metadata.get("/Title"),
                "author": reader.metadata.get("/Author"),
                "subject": reader.metadata.get("/Subject"),
                "creator": reader.metadata.get("/Creator"),
            }

        return True, None, pages_data, meta

    except Exception as e:
        return False, f"Failed to parse PDF document: {str(e)}", [], {}

def verify_clinical_guideline_authenticity(full_text: str) -> Tuple[bool, Optional[str]]:
    """
    Verifies that the document is genuinely an authoritative clinical guideline.
    Rejects unrelated documents, recipes, code, financial papers, ads, etc.
    """
    lower_text = full_text.lower()

    # 1. Check for disqualifying non-clinical material
    non_clinical_hits = [term for term in NON_CLINICAL_INDICATORS if term in lower_text]
    if len(non_clinical_hits) >= 2:
        return False, f"Document rejected: Content matches non-clinical indicators ({', '.join(non_clinical_hits[:2])}). Only clinical practice guidelines are accepted."

    # 2. Check for required clinical indicators
    clinical_hits = [term for term in CLINICAL_INDICATORS if term in lower_text]
    if len(clinical_hits) < 3:
        return False, "Document rejected: The uploaded file does not contain sufficient clinical practice guideline terminology or medical recommendations."

    return True, None

def extract_document_metadata(
    pages: List[Dict[str, Any]],
    pdf_meta: Dict[str, Any],
    fallback_filename: str
) -> Dict[str, Any]:
    """
    Extracts actual document title, issuing organization, publication year,
    guideline identifier, and determines clinical category.
    """
    sample_text = " ".join([p["text"] for p in pages[:4]])
    lower_sample = sample_text.lower()

    # 1. Issuing Organization
    detected_org = "Independent Clinical Authority"
    for full_org, short_org in KNOWN_ORGS:
        if short_org.lower() in lower_sample or full_org.lower() in lower_sample:
            detected_org = short_org
            break

    # 2. Publication Year
    year_match = re.search(r"\b(20[12]\d)\b", sample_text)
    detected_year = year_match.group(1) if year_match else None

    # 3. Document Title
    extracted_title = None
    if pdf_meta.get("title") and len(str(pdf_meta["title"]).strip()) > 10:
        extracted_title = str(pdf_meta["title"]).strip()

    if not extracted_title or "untitled" in extracted_title.lower() or extracted_title.endswith(".pdf"):
        first_page = pages[0]["text"] if pages else ""
        title_candidates = [
            r"([A-Z][A-Za-z0-9\s—–:-]{15,120}(?:Guideline|Guidance|Recommendations|Management)[A-Za-z0-9\s—–:-]{0,60})",
            r"(CDC Clinical Practice Guideline[^\n\.\,]+)",
            r"(KDIGO [^\n\.\,]+ Clinical Practice Guideline[^\n\.\,]+)",
            r"(WHO [^\n\.\,]+ Guideline[^\n\.\,]+)",
        ]
        for pattern in title_candidates:
            match = re.search(pattern, first_page, re.IGNORECASE)
            if match:
                extracted_title = match.group(1).strip()
                break

    if not extracted_title:
        base = os.path.splitext(os.path.basename(fallback_filename))[0]
        extracted_title = base.replace("_", " ").replace("-", " ").title()

    # 4. Guideline Identifier (ISBN, NBK, MMWR, DOI)
    identifier = None
    isbn_match = re.search(r"ISBN\s*[:\-]?\s*([0-9\-]{10,17})", sample_text, re.IGNORECASE)
    nbk_match = re.search(r"\b(NBK\d+)\b", sample_text)
    mmwr_match = re.search(r"MMWR[^\.\,\;]{5,30}", sample_text, re.IGNORECASE)
    doi_match = re.search(r"10\.\d{4,9}/[-._;()/:A-Z0-9]+", sample_text, re.IGNORECASE)

    if isbn_match:
        identifier = f"ISBN {isbn_match.group(1).strip()}"
    elif nbk_match:
        identifier = nbk_match.group(1).strip()
    elif mmwr_match:
        identifier = mmwr_match.group(0).strip()
    elif doi_match:
        identifier = doi_match.group(0).strip()

    # 5. Determine Clinical Category
    category_scores: Dict[str, int] = {}
    for cat, keywords in CATEGORY_LEXICON.items():
        score = sum(1 for kw in keywords if kw in lower_sample)
        # Give extra weight if keyword is in title
        if extracted_title:
            lower_title = extracted_title.lower()
            score += sum(3 for kw in keywords if kw in lower_title)
        category_scores[cat] = score

    best_cat, best_score = max(category_scores.items(), key=lambda x: x[1])
    assigned_category = best_cat if best_score >= 3 else "Unclassified"

    return {
        "title": extracted_title,
        "organization": detected_org,
        "publication_year": detected_year,
        "identifier": identifier,
        "category": assigned_category,
        "category_confidence": best_score,
    }

def check_duplicate_guideline(
    checksum: str,
    title: str,
    organization: str,
    publication_year: Optional[str]
) -> Dict[str, Any]:
    """
    Checks whether the guideline is an exact duplicate or a distinct new edition.
    Returns {
        "is_exact_duplicate": bool,
        "is_similar_edition": bool,
        "existing_guideline": dict,
        "message": str
    }
    """
    supabase = get_supabase_client()

    # 1. Exact SHA-256 Checksum Match
    try:
        exact_doc = supabase.from_("guideline_documents").select(
            "id, guideline_id, document_name, checksum, guidelines(id, title, organization, year, publication_date)"
        ).eq("checksum", checksum).limit(1).execute()

        if exact_doc.data:
            doc = exact_doc.data[0]
            g_info = doc.get("guidelines") or {}
            existing_title = g_info.get("title") or doc.get("document_name") or "Existing Guideline"
            existing_org = g_info.get("organization") or "Clinical Authority"
            return {
                "is_exact_duplicate": True,
                "is_similar_edition": False,
                "existing_guideline": g_info,
                "message": f"Exact duplicate detected: This PDF document has already been indexed as '{existing_title}' ({existing_org}) with SHA-256 checksum {checksum[:12]}... Duplicate upload blocked."
            }
    except Exception as e:
        logger.warning(f"Checksum check query encountered: {e}")

    # 2. Similar Guideline / Revised Edition Check
    try:
        existing_guidelines = supabase.from_("guidelines").select("id, title, organization, year, publication_date, category").execute()
        norm_incoming = normalize_title(title)

        for ex in (existing_guidelines.data or []):
            ex_title = ex.get("title") or ""
            ex_org = ex.get("organization") or ""
            norm_existing = normalize_title(ex_title)

            if ex_org.lower() == organization.lower() and norm_incoming and norm_incoming == norm_existing:
                # Same organization & matching core subject title
                ex_date = str(ex.get("year") or ex.get("publication_date") or "")
                # If years or editions differ (e.g. 2022 vs 2024), allow as new edition
                if publication_year and ex_date and publication_year not in ex_date:
                    return {
                        "is_exact_duplicate": False,
                        "is_similar_edition": True,
                        "existing_guideline": ex,
                        "message": f"Detected revised edition: An existing {ex_date[:4] if len(ex_date)>=4 else ''} edition of '{ex_title}' exists. This upload is accepted as a distinct new edition ({publication_year})."
                    }
                else:
                    return {
                        "is_exact_duplicate": False,
                        "is_similar_edition": False,
                        "existing_guideline": ex,
                        "message": f"Similar guideline title found: '{ex_title}' ({ex_org}). Allowed as distinct upload."
                    }
    except Exception as e:
        logger.warning(f"Similar title check query encountered: {e}")

    return {
        "is_exact_duplicate": False,
        "is_similar_edition": False,
        "existing_guideline": None,
        "message": "Guideline is unique and eligible for indexing."
    }

def validate_guideline_upload(
    file_bytes: bytes,
    filename: str
) -> Dict[str, Any]:
    """
    Performs all 10 acceptance and quality control checks without indexing:
    1. Valid file format
    2. Readable PDF
    3. Document title extraction
    4. Organization identification
    5. Publication year
    6. Identifier
    7. Clinical category
    8. Duplicate check
    9. Clinical guideline relevance
    10. Approval status
    """
    checksum = compute_sha256(file_bytes)

    # Check 1 & 2: Valid & Readable PDF
    is_valid_pdf, pdf_err, pages, meta = extract_pdf_content(file_bytes)
    if not is_valid_pdf:
        return {
            "is_approved": False,
            "rejection_reason": pdf_err or "Invalid PDF document",
            "checksum": checksum,
            "filename": filename
        }

    full_text = " ".join([p["text"] for p in pages])

    # Check 9: Clinical Authenticity
    is_clinical, clinical_err = verify_clinical_guideline_authenticity(full_text)
    if not is_clinical:
        return {
            "is_approved": False,
            "rejection_reason": clinical_err,
            "checksum": checksum,
            "filename": filename,
            "total_pages": len(pages)
        }

    # Checks 3, 4, 5, 6, 7: Metadata & Category Extraction
    extracted = extract_document_metadata(pages, meta, filename)

    # Check 8: Duplicate Detection
    dup_info = check_duplicate_guideline(
        checksum=checksum,
        title=extracted["title"],
        organization=extracted["organization"],
        publication_year=extracted["publication_year"]
    )

    if dup_info["is_exact_duplicate"]:
        return {
            "is_approved": False,
            "rejection_reason": dup_info["message"],
            "is_exact_duplicate": True,
            "checksum": checksum,
            "filename": filename,
            "metadata": extracted
        }

    return {
        "is_approved": True,
        "checksum": checksum,
        "filename": filename,
        "total_pages": len(pages),
        "metadata": extracted,
        "duplicate_info": dup_info
    }

def accept_and_index_guideline(
    file_bytes: bytes,
    filename: str,
    override_metadata: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Full atomic acceptance, cataloging, chunking, and embedding pipeline.
    Validates PDF, checks clinical authenticity and duplicate status,
    inserts guideline and document records, generates chunks and embeddings,
    and indexes them with rollback cleanup on any failure.
    """
    stage = "PDF Validation"
    validation = validate_guideline_upload(file_bytes, filename)
    if not validation.get("is_approved"):
        rejection = validation.get("rejection_reason") or "Guideline validation failed."
        raise ValueError(f"[{stage}] {rejection}")

    stage = "Metadata Validation"
    meta = dict(validation.get("metadata") or {})
    if override_metadata:
        for k, v in override_metadata.items():
            if v is not None:
                meta[k] = str(v).strip()

    title = (meta.get("title") or "").strip()
    organization = (meta.get("organization") or "").strip()
    category = (meta.get("category") or "General").strip()

    if not title:
        raise ValueError(f"[{stage}] Guideline title is required.")
    if not organization:
        raise ValueError(f"[{stage}] Guideline issuing organization is required.")

    # Resolve version/edition backward-compatibly without inventing data
    raw_version = (
        (override_metadata.get("version") if override_metadata else None)
        or (override_metadata.get("document_version") if override_metadata else None)
        or meta.get("version")
        or meta.get("identifier")
    )
    resolved_version = str(raw_version).strip() if raw_version and str(raw_version).strip() else "Not specified"

    publication_date = None
    pub_year = None
    if meta.get("publication_year") and str(meta["publication_year"]).strip().isdigit():
        pub_year = int(str(meta["publication_year"]).strip())
        publication_date = f"{pub_year}-01-01"

    supabase = get_supabase_client()
    checksum = validation["checksum"]
    total_pages = validation.get("total_pages")

    guideline_id = None
    document_id = None

    try:
        # 1. Insert into guidelines catalog table
        stage = "Catalog Registration"
        pdf_url = (override_metadata.get("pdf_url") or override_metadata.get("official_document_url")) if override_metadata else None
        source_url = (override_metadata.get("source_url") or override_metadata.get("official_url")) if override_metadata else None
        desc = (override_metadata.get("description") if override_metadata and override_metadata.get("description")
                else f"Authoritative clinical practice guideline on {title} issued by {organization}.")

        guideline_record = {
            "title": title,
            "organization": organization,
            "category": category,
            "year": pub_year,
            "publication_date": publication_date,
            "document_type": (override_metadata.get("document_type") if override_metadata else None) or "Official Clinical Guideline",
            "source_type": (override_metadata.get("source_type") if override_metadata else None) or "trusted_official",
            "verification_status": (override_metadata.get("verification_status") if override_metadata else None) or "verified",
            "status": (override_metadata.get("status") if override_metadata else None) or "active",
            "description": desc,
            "source_url": source_url,
            "pdf_url": pdf_url,
            "official_url": source_url,
            "official_document_url": pdf_url,
            "is_verified": True
        }

        g_insert = supabase.from_("guidelines").insert(guideline_record).execute()
        if not g_insert.data:
            raise RuntimeError("Failed to insert guideline catalog record into database.")

        guideline_id = g_insert.data[0]["id"]

        # 2. Insert into guideline_documents tracking table
        stage = "Document Registration"
        doc_record = {
            "guideline_id": guideline_id,
            "document_name": title,
            "file_name": filename,
            "checksum": checksum,
            "document_version": resolved_version,
            "file_size": len(file_bytes),
            "mime_type": "application/pdf",
            "page_count": total_pages,
            "pdf_url": pdf_url,
            "source_url": source_url,
            "ingestion_status": "processing"
        }

        doc_insert = supabase.from_("guideline_documents").insert(doc_record).execute()
        if not doc_insert.data:
            raise RuntimeError("Failed to insert guideline document tracking record into database.")

        document_id = doc_insert.data[0]["id"]

        # 3. Chunk Document
        stage = "Extraction & Chunking"
        _, _, pages, _ = extract_pdf_content(file_bytes)
        chunks = chunk_pages(pages, chunk_size=1000, chunk_overlap=150)
        if not chunks:
            raise ValueError("No readable text chunks could be extracted from the document.")

        # 4. Generate Embeddings
        stage = "Vector Embedding"
        texts_to_embed = [c["content"] for c in chunks]
        embeddings = embed_documents(texts_to_embed, batch_size=32)
        if len(embeddings) != len(chunks):
            raise RuntimeError(f"Embedding count mismatch: generated {len(embeddings)} for {len(chunks)} chunks.")

        # 5. Batch Insert Vector Chunks
        stage = "Vector Indexing"
        chunk_records = []
        for i, (chunk, emb) in enumerate(zip(chunks, embeddings)):
            chunk_records.append({
                "document_id": document_id,
                "guideline_id": guideline_id,
                "chunk_index": i,
                "content": chunk["content"],
                "page_number": chunk["page_number"],
                "section_title": chunk.get("section_title") or "General",
                "embedding": emb
            })

        batch_size = 50
        for b_start in range(0, len(chunk_records), batch_size):
            batch = chunk_records[b_start:b_start + batch_size]
            supabase.from_("guideline_chunks").insert(batch).execute()

        # Mark document completed
        supabase.from_("guideline_documents").update({"ingestion_status": "completed"}).eq("id", document_id).execute()

        logger.info(f"Successfully indexed '{title}' ({len(chunk_records)} chunks, version='{resolved_version}').")

        return {
            "success": True,
            "guideline_id": guideline_id,
            "document_id": document_id,
            "title": title,
            "organization": organization,
            "category": category,
            "document_version": resolved_version,
            "chunks_created": len(chunk_records),
            "checksum": checksum,
            "message": f"Successfully indexed '{title}' ({len(chunk_records)} chunks, version: {resolved_version})."
        }

    except Exception as e:
        logger.error(f"[{stage}] Ingestion failed for {filename}: {e}", exc_info=True)
        # Rollback partial records to prevent ghost/orphaned records
        try:
            if document_id:
                supabase.from_("guideline_chunks").delete().eq("document_id", document_id).execute()
                supabase.from_("guideline_documents").delete().eq("id", document_id).execute()
            if guideline_id:
                supabase.from_("guidelines").delete().eq("id", guideline_id).execute()
        except Exception as rb_err:
            logger.error(f"Rollback failed during cleanup of failed ingestion: {rb_err}")

        # Re-raise with stage tag
        err_msg = str(e)
        if not err_msg.startswith("["):
            err_msg = f"[{stage}] Ingestion failed: {err_msg}"
        if isinstance(e, ValueError):
            raise ValueError(err_msg)
        else:
            raise RuntimeError(err_msg)
