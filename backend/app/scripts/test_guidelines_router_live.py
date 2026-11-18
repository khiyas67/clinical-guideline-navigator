import sys
import os
import io
import urllib.request
import json
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

def create_sample_guideline_pdf() -> bytes:
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=letter)
    c.setFont("Helvetica-Bold", 16)
    c.drawString(72, 750, "NICE Clinical Practice Guideline NG999")
    c.setFont("Helvetica", 12)
    c.drawString(72, 720, "Recommendations for Hypertension and Blood Pressure Management in Adults")
    c.drawString(72, 700, "Published by National Institute for Health and Care Excellence (NICE)")
    c.drawString(72, 680, "Publication Year: 2026. Official Clinical Practice Guideline.")
    c.drawString(72, 650, "1.1 Diagnosis and Investigation")
    c.drawString(72, 630, "Confirm diagnosis of stage 1 hypertension if clinic blood pressure is >= 140/90 mmHg.")
    c.drawString(72, 610, "Target clinic blood pressure for adults under 80 is below 140/90 mmHg.")
    c.drawString(72, 590, "First-line antihypertensive therapy includes ACE inhibitors or ARBs.")
    c.showPage()
    c.save()
    return buf.getvalue()

def main():
    base_url = "http://127.0.0.1:8000"
    print(f"Testing live guidelines router endpoints on {base_url}...\n")
    
    # 1. Test POST /api/guidelines/validate with valid clinical PDF
    pdf_bytes = create_sample_guideline_pdf()
    boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
    
    body = bytearray()
    body.extend(f"--{boundary}\r\n".encode())
    body.extend(b'Content-Disposition: form-data; name="file"; filename="sample_hypertension_guideline.pdf"\r\n')
    body.extend(b"Content-Type: application/pdf\r\n\r\n")
    body.extend(pdf_bytes)
    body.extend(b"\r\n")
    body.extend(f"--{boundary}--\r\n".encode())
    
    req = urllib.request.Request(
        f"{base_url}/api/guidelines/validate",
        data=bytes(body),
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
        method="POST"
    )
    
    try:
        with urllib.request.urlopen(req) as resp:
            val_data = json.loads(resp.read().decode())
            print("[PASS] POST /api/guidelines/validate returned 200 OK:")
            print(f"  - is_valid: {val_data.get('is_valid')}")
            print(f"  - checksum: {val_data.get('checksum')}")
            print(f"  - title: {val_data.get('metadata', {}).get('title')}")
            print(f"  - category: {val_data.get('metadata', {}).get('category')}")
            print(f"  - organization: {val_data.get('metadata', {}).get('organization')}")
            print(f"  - year: {val_data.get('metadata', {}).get('publication_year')}")
    except Exception as e:
        print(f"[FAIL] POST /api/guidelines/validate failed: {e}")

    # 2. Test POST /api/guidelines/fix-categories
    req_fix = urllib.request.Request(
        f"{base_url}/api/guidelines/fix-categories",
        data=b"",
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    try:
        with urllib.request.urlopen(req_fix) as resp:
            fix_data = json.loads(resp.read().decode())
            print("\n[PASS] POST /api/guidelines/fix-categories returned 200 OK:")
            print(f"  - total_scanned: {fix_data.get('total_scanned')}")
            print(f"  - total_updated: {fix_data.get('total_updated')}")
            print(f"  - updates: {fix_data.get('updates')}")
    except Exception as e:
        print(f"[FAIL] POST /api/guidelines/fix-categories failed: {e}")

if __name__ == "__main__":
    main()
