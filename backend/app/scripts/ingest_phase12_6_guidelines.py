import os
import sys
import logging
from typing import List, Dict, Any
from app.ingestion.pdf_loader import download_pdf
from app.services.guideline_qc import accept_and_index_guideline
from app.services.retrieval import get_supabase_client

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("phase12_6_ingestion")

OFFICIAL_GUIDELINES_TO_INGEST = [
    {
        "title": "Hypertension in Adults: Diagnosis and Management",
        "organization": "NICE",
        "publication_year": "2022",
        "version": "NG136",
        "category": "Hypertension, Cardiovascular",
        "document_type": "Official Clinical Guideline",
        "source_type": "trusted_official",
        "verification_status": "verified",
        "source_url": "https://www.nice.org.uk/guidance/ng136",
        "pdf_url": "https://www.nice.org.uk/guidance/ng136/resources/hypertension-in-adults-diagnosis-and-management-pdf-66141722710213",
        "description": "National Institute for Health and Care Excellence (NICE) clinical guideline covering identifying, assessing, and treating high blood pressure in adults, target blood pressure thresholds, and pharmacological therapy.",
        "filename": "nice_ng136_hypertension.pdf"
    },
    {
        "title": "Type 2 Diabetes in Adults: Management",
        "organization": "NICE",
        "publication_year": "2022",
        "version": "NG28",
        "category": "Diabetes, Endocrinology",
        "document_type": "Official Clinical Guideline",
        "source_type": "trusted_official",
        "verification_status": "verified",
        "source_url": "https://www.nice.org.uk/guidance/ng28",
        "pdf_url": "https://www.nice.org.uk/guidance/ng28/resources/type-2-diabetes-in-adults-management-pdf-1837338615493",
        "description": "NICE clinical guideline on dietary advice, blood glucose targets, HbA1c monitoring, first-line metformin, SGLT2 inhibitors, GLP-1 receptor agonists, and insulin therapy for type 2 diabetes.",
        "filename": "nice_ng28_type2_diabetes.pdf"
    },
    {
        "title": "Chronic Pain in Over 16s: Assessment and Management",
        "organization": "NICE",
        "publication_year": "2021",
        "version": "NG193",
        "category": "Pain Management, General",
        "document_type": "Official Clinical Guideline",
        "source_type": "trusted_official",
        "verification_status": "verified",
        "source_url": "https://www.nice.org.uk/guidance/ng193",
        "pdf_url": "https://www.nice.org.uk/guidance/ng193/resources/chronic-pain-primary-and-secondary-in-over-16s-assessment-of-all-chronic-pain-and-management-of-chronic-primary-pain-pdf-66142080468421",
        "description": "NICE evidence-based recommendations on assessing all chronic primary and secondary pain, person-centred care, non-pharmacological interventions, and pharmacological management.",
        "filename": "nice_ng193_chronic_pain.pdf"
    },
    {
        "title": "Thyroid Disease: Assessment and Management",
        "organization": "NICE",
        "publication_year": "2023",
        "version": "NG145",
        "category": "Endocrinology, General",
        "document_type": "Official Clinical Guideline",
        "source_type": "trusted_official",
        "verification_status": "verified",
        "source_url": "https://www.nice.org.uk/guidance/ng145",
        "pdf_url": "https://www.nice.org.uk/guidance/ng145/resources/thyroid-disease-assessment-and-management-pdf-66141781496773",
        "description": "NICE clinical guideline covering investigation and management of thyroid dysfunction in primary and secondary care, including primary hypothyroidism, subclinical thyroid disease, and thyrotoxicosis.",
        "filename": "nice_ng145_thyroid_disease.pdf"
    },
    {
        "title": "Antimicrobial Stewardship: Systems and Processes for Effective Antimicrobial Medicine Use",
        "organization": "NICE",
        "publication_year": "2021",
        "version": "NG15",
        "category": "Infectious Disease, General",
        "document_type": "Official Clinical Guideline",
        "source_type": "trusted_official",
        "verification_status": "verified",
        "source_url": "https://www.nice.org.uk/guidance/ng15",
        "pdf_url": "https://www.nice.org.uk/guidance/ng15/resources/antimicrobial-stewardship-systems-and-processes-for-effective-antimicrobial-medicine-use-pdf-1837273110469",
        "description": "NICE clinical guidance on prescribing antimicrobial medicines safely, reducing inappropriate prescribing, and limiting antimicrobial resistance across healthcare settings.",
        "filename": "nice_ng15_antimicrobial_stewardship.pdf"
    },
    {
        "title": "COVID-19 Rapid Guideline: Managing COVID-19",
        "organization": "NICE",
        "publication_year": "2024",
        "version": "NG191",
        "category": "Infectious Disease, General",
        "document_type": "Official Clinical Guideline",
        "source_type": "trusted_official",
        "verification_status": "verified",
        "source_url": "https://www.nice.org.uk/guidance/ng191",
        "pdf_url": "https://www.nice.org.uk/guidance/ng191/resources/covid19-rapid-guideline-managing-covid19-pdf-66142077109189",
        "description": "NICE live recommendations on managing COVID-19 in adults and children, therapeutics including antivirals (paxlovid, remdesivir), corticosteroids, IL-6 inhibitors, and oxygenation.",
        "filename": "nice_ng191_covid19.pdf"
    },
    {
        "title": "Atrial Fibrillation: Diagnosis and Management",
        "organization": "NICE",
        "publication_year": "2021",
        "version": "NG196",
        "category": "Cardiovascular, Hypertension",
        "document_type": "Official Clinical Guideline",
        "source_type": "trusted_official",
        "verification_status": "verified",
        "source_url": "https://www.nice.org.uk/guidance/ng196",
        "pdf_url": "https://www.nice.org.uk/guidance/ng196/resources/atrial-fibrillation-diagnosis-and-management-pdf-66142085507269",
        "description": "NICE clinical guideline covering diagnosis, rate and rhythm control, stroke risk assessment (CHA2DS2-VASc), bleeding risk (ORBIT), anticoagulation with DOACs, and monitoring.",
        "filename": "nice_ng196_atrial_fibrillation.pdf"
    },
    {
        "title": "Multimorbidity: Clinical Assessment and Management",
        "organization": "NICE",
        "publication_year": "2022",
        "version": "NG56",
        "category": "General",
        "document_type": "Official Clinical Guideline",
        "source_type": "trusted_official",
        "verification_status": "verified",
        "source_url": "https://www.nice.org.uk/guidance/ng56",
        "pdf_url": "https://www.nice.org.uk/guidance/ng56/resources/multimorbidity-clinical-assessment-and-management-pdf-1837516654789",
        "description": "NICE clinical practice guideline on optimizing care for adults with multiple long-term conditions, polypharmacy review, treatment burden reduction, and individualized management plans.",
        "filename": "nice_ng56_multimorbidity.pdf"
    },
    {
        "title": "KDIGO 2024 Clinical Practice Guideline for the Evaluation and Management of Chronic Kidney Disease",
        "organization": "KDIGO",
        "publication_year": "2024",
        "version": "2024 Update",
        "category": "Nephrology, Cardiovascular",
        "document_type": "Official Clinical Guideline",
        "source_type": "trusted_official",
        "verification_status": "verified",
        "source_url": "https://kdigo.org/guidelines/ckd-evaluation--and-management/",
        "pdf_url": "https://kdigo.org/wp-content/uploads/2024/03/KDIGO-2024-CKD-Guideline.pdf",
        "description": "Kidney Disease: Improving Global Outcomes (KDIGO) comprehensive 2024 clinical practice guideline for the evaluation, risk stratification (CGA staging), and management of chronic kidney disease.",
        "filename": "kdigo_2024_ckd_guideline.pdf"
    }
]

def run_ingestion():
    supabase = get_supabase_client()
    results = []

    for item in OFFICIAL_GUIDELINES_TO_INGEST:
        title = item["title"]
        org = item["organization"]
        pdf_url = item["pdf_url"]
        filename = item["filename"]

        logger.info(f"\n========================================================")
        logger.info(f"Processing: [{org}] {title}")
        logger.info(f"URL: {pdf_url}")
        logger.info(f"========================================================")

        # Check if guideline title already exists in DB
        existing = supabase.from_("guidelines").select("id, title, organization").ilike("title", f"%{title[:30]}%").execute().data
        if existing:
            logger.info(f"Guideline already exists in database (ID: {existing[0]['id']}). Skipping duplicate.")
            results.append({"title": title, "status": "already_exists", "id": existing[0]["id"]})
            continue

        # 1. Download official PDF
        try:
            pdf_bytes, checksum = download_pdf(pdf_url)
            logger.info(f"Downloaded {len(pdf_bytes)} bytes. Checksum: {checksum[:16]}...")
        except Exception as e:
            logger.error(f"Download failed for {title}: {e}")
            results.append({"title": title, "status": "download_failed", "error": str(e)})
            continue

        # 2. Ingest through official pipeline
        override_meta = {
            "title": title,
            "organization": org,
            "category": item["category"],
            "publication_year": item["publication_year"],
            "version": item["version"],
            "document_version": item["version"],
            "document_type": item["document_type"],
            "source_type": item["source_type"],
            "verification_status": item["verification_status"],
            "description": item["description"],
            "source_url": item["source_url"],
            "official_url": item["source_url"],
            "pdf_url": item["pdf_url"],
            "official_document_url": item["pdf_url"],
            "status": "active"
        }

        try:
            res = accept_and_index_guideline(
                file_bytes=pdf_bytes,
                filename=filename,
                override_metadata=override_meta
            )
            logger.info(f"SUCCESS: Ingested [{org}] {title} -> Guideline ID: {res['guideline_id']}, Chunks: {res['chunks_created']}")
            results.append({
                "title": title,
                "status": "success",
                "guideline_id": res["guideline_id"],
                "document_id": res["document_id"],
                "chunks_created": res["chunks_created"],
                "checksum": res["checksum"]
            })
        except Exception as e:
            logger.error(f"Ingestion failed for {title}: {e}", exc_info=True)
            results.append({"title": title, "status": "ingestion_failed", "error": str(e)})

    logger.info("\n================ INGESTION SUMMARY ================")
    for r in results:
        logger.info(f"{r['title']}: {r['status']}")

if __name__ == "__main__":
    run_ingestion()
