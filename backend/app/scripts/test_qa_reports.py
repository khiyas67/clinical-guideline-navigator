import sys
import os

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.services.retrieval import get_supabase_client
from app.services.report_generator import generate_pdf_report, generate_docx_report

sb = get_supabase_client()
dec_list = sb.from_('clinical_decisions').select('*, patients(*)').limit(1).execute().data
assert len(dec_list) > 0, "No clinical decisions found"
dec = dec_list[0]
print("Testing decision:", dec['id'], "status:", dec.get('decision_status'))

patient_data = dec.get('patients') or {}
payload = {
    'generated_at': dec.get('created_at'),
    'clinician_name': 'Dr. Test Clinician',
    'decision_status': dec.get('decision_status'),
    'question': dec.get('question'),
    'ai_answer': dec.get('ai_answer'),
    'final_decision': dec.get('final_decision'),
    'rejection_reason': dec.get('rejection_reason'),
    'sources': dec.get('sources') or [],
    'patient': patient_data
}

pdf_bytes = generate_pdf_report(payload)
is_pdf = pdf_bytes.startswith(b"%PDF")
print(f"PDF generated: {len(pdf_bytes)} bytes | Valid PDF header: {is_pdf}")
assert is_pdf, "Invalid PDF header"

docx_bytes = generate_docx_report(payload)
is_docx = docx_bytes.startswith(b"PK")
print(f"DOCX generated: {len(docx_bytes)} bytes | Valid DOCX/ZIP header: {is_docx}")
assert is_docx, "Invalid DOCX header"

print("Report generation test PASSED.")

