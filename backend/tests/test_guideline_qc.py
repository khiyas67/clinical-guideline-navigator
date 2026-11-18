import io
import pytest
from pypdf import PdfWriter
from app.services.guideline_qc import (
    compute_sha256,
    extract_pdf_content,
    verify_clinical_guideline_authenticity,
    extract_document_metadata,
    check_duplicate_guideline
)

def create_sample_pdf(text: str) -> bytes:
    """Helper to generate an in-memory PDF with specified text."""
    writer = PdfWriter()
    page = writer.add_blank_page(width=612, height=792)
    # We can write text by adding annotation or text stream
    # A standard way with pypdf:
    # Or create a minimal valid PDF stream:
    from reportlab.pdfgen import canvas
    buf = io.BytesIO()
    c = canvas.Canvas(buf)
    # Write lines of text
    y = 750
    for line in text.split("\n"):
        c.drawString(50, y, line)
        y -= 20
        if y < 50:
            c.showPage()
            y = 750
    c.save()
    return buf.getvalue()

def test_checksum_computation():
    data1 = b"Sample PDF document content version A"
    data2 = b"Sample PDF document content version A"
    data3 = b"Sample PDF document content version B"

    h1 = compute_sha256(data1)
    h2 = compute_sha256(data2)
    h3 = compute_sha256(data3)

    assert h1 == h2
    assert h1 != h3

def test_invalid_and_empty_pdf_rejection():
    # 1. Empty bytes
    ok, err, _, _ = extract_pdf_content(b"")
    assert not ok and "empty" in err.lower()

    # 2. Corrupted / non-PDF
    ok, err, _, _ = extract_pdf_content(b"NOT_A_PDF_FILE_HEADER")
    assert not ok and "not a valid pdf" in err.lower()

def test_unrelated_document_rejection():
    recipe_text = """
    Grandma's Best Apple Pie Recipe
    Ingredients: 3 cups flour, 1 tablespoon sugar, 2 apples.
    Cooking time: 45 minutes at 350 degrees.
    Enjoy this delicious dessert recipe with ice cream!
    """
    is_clinical, err = verify_clinical_guideline_authenticity(recipe_text)
    assert not is_clinical
    assert "rejected" in err.lower()

    code_text = """
    Software License and Source Code Agreement
    GitHub repository clone git pull balance sheet dividend
    """
    is_clinical, err = verify_clinical_guideline_authenticity(code_text)
    assert not is_clinical

def test_valid_clinical_guideline_acceptance():
    guideline_text = """
    WHO Clinical Practice Guideline on Hypertension Diagnosis and Treatment
    Recommendations:
    1. For adult patients with confirmed hypertension (systolic blood pressure >= 140 mmHg),
       pharmacological treatment is recommended as first-line therapy.
    2. Monitoring intervals and dosing adjustments for antihypertensive therapy.
    3. Lifestyle intervention and clinical assessment of cardiovascular risk factors.
    Evidence-based clinical guidelines issued in 2024.
    """
    is_clinical, err = verify_clinical_guideline_authenticity(guideline_text)
    assert is_clinical
    assert err is None

def test_category_and_metadata_extraction():
    pages = [
        {
            "page_number": 1,
            "text": "KDIGO 2024 Clinical Practice Guideline for Diabetes Management in Chronic Kidney Disease (CKD). Recommendations for eGFR monitoring, proteinuria, and SGLT2 inhibitors."
        },
        {
            "page_number": 2,
            "text": "Kidney Disease: Improving Global Outcomes (KDIGO). Clinical practice recommendations on dialysis, creatinine, and renal outcomes in type 2 diabetes."
        }
    ]
    meta = extract_document_metadata(pages, {}, "kdigo_ckd.pdf")
    assert meta["organization"] == "KDIGO"
    assert meta["publication_year"] == "2024"
    assert meta["category"] in ["Nephrology", "Diabetes"]
    assert "Guideline" in meta["title"]

def test_edition_detection_vs_exact_duplicate():
    # If checksum matches, exact duplicate detected
    # We can test logic of check_duplicate_guideline
    dup = check_duplicate_guideline(
        checksum="f4e5098d13e9b3dc5cc27bb90137df57d3667350b2add885fd367f279402d18d", # known CDC opioid checksum in DB
        title="CDC Clinical Practice Guideline for Prescribing Opioids for Pain",
        organization="CDC",
        publication_year="2022"
    )
    assert dup["is_exact_duplicate"]
    assert "exact duplicate detected" in dup["message"].lower()

    # Different checksum but similar title with new year edition
    dup_new_edition = check_duplicate_guideline(
        checksum="1111222233334444555566667777888899990000aaaabbbbccccddddeeeeffff",
        title="KDIGO Clinical Practice Guideline for Diabetes Management in CKD",
        organization="KDIGO",
        publication_year="2026" # New future edition
    )
    assert not dup_new_edition["is_exact_duplicate"]

def test_ingestion_metadata_validation_and_version_resolution():
    from app.services.guideline_qc import accept_and_index_guideline

    # Test rejection of empty bytes
    with pytest.raises(ValueError) as excinfo:
        accept_and_index_guideline(b"", "empty.pdf")
    assert "[PDF Validation]" in str(excinfo.value)

    # Test rejection when title is empty
    sample_pdf = create_sample_pdf(
        "WHO Clinical Practice Guideline on Cardiovascular Disease Prevention\n"
        "Recommendations for statin therapy and blood pressure monitoring in adult patients.\n"
        "Guideline directed therapy recommendations."
    )
    with pytest.raises(ValueError) as excinfo_title:
        accept_and_index_guideline(
            sample_pdf,
            "test_empty_title.pdf",
            override_metadata={"title": ""}
        )
    assert "[Metadata Validation]" in str(excinfo_title.value)
    assert "title is required" in str(excinfo_title.value).lower()


