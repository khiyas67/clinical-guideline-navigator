from fastapi import APIRouter, HTTPException, Response
from typing import Dict, Any
from app.services.report_generator import generate_pdf_report, generate_docx_report
from app.services.retrieval import get_supabase_client

router = APIRouter(prefix="/api/reports", tags=["reports"])

@router.post("/pdf")
async def create_pdf_report_from_payload(payload: Dict[str, Any]):
    """
    Generates a professional multi-page Clinical Guideline Assessment PDF Report from payload.
    """
    try:
        pdf_bytes = generate_pdf_report(payload)
        filename = f"Clinical_Report_{payload.get('patient', {}).get('patient_code', 'PT')}.pdf"
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF report: {str(e)}")

@router.post("/docx")
async def create_docx_report_from_payload(payload: Dict[str, Any]):
    """
    Generates a professional editable Microsoft Word (.docx) Clinical Report from payload.
    """
    try:
        docx_bytes = generate_docx_report(payload)
        filename = f"Clinical_Report_{payload.get('patient', {}).get('patient_code', 'PT')}.docx"
        return Response(
            content=docx_bytes,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate DOCX report: {str(e)}")

@router.get("/decision/{decision_id}/pdf")
async def get_decision_pdf_report(decision_id: str):
    """
    Retrieves saved decision from database and streams PDF report.
    Guarantees reports are only generated for saved clinical decisions.
    """
    supabase = get_supabase_client()
    dec_res = supabase.from_("clinical_decisions").select("*, patients(*)").eq("id", decision_id).limit(1).execute()

    if not dec_res.data:
        raise HTTPException(status_code=404, detail="Clinical decision record not found.")

    dec = dec_res.data[0]
    patient_data = dec.get("patients") or {}

    report_payload = {
        "generated_at": dec.get("created_at"),
        "clinician_name": dec.get("clinician_id"),
        "decision_status": dec.get("decision_status"),
        "question": dec.get("question"),
        "ai_answer": dec.get("ai_answer"),
        "final_decision": dec.get("final_decision"),
        "rejection_reason": dec.get("rejection_reason"),
        "sources": dec.get("sources") or [],
        "patient": patient_data
    }

    pdf_bytes = generate_pdf_report(report_payload)
    code = patient_data.get("patient_code") or "PATIENT"
    filename = f"Clinical_Report_{code}_{decision_id[:8]}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.get("/decision/{decision_id}/docx")
async def get_decision_docx_report(decision_id: str):
    """
    Retrieves saved decision from database and streams DOCX report.
    Guarantees reports are only generated for saved clinical decisions.
    """
    supabase = get_supabase_client()
    dec_res = supabase.from_("clinical_decisions").select("*, patients(*)").eq("id", decision_id).limit(1).execute()

    if not dec_res.data:
        raise HTTPException(status_code=404, detail="Clinical decision record not found.")

    dec = dec_res.data[0]
    patient_data = dec.get("patients") or {}

    report_payload = {
        "generated_at": dec.get("created_at"),
        "clinician_name": dec.get("clinician_id"),
        "decision_status": dec.get("decision_status"),
        "question": dec.get("question"),
        "ai_answer": dec.get("ai_answer"),
        "final_decision": dec.get("final_decision"),
        "rejection_reason": dec.get("rejection_reason"),
        "sources": dec.get("sources") or [],
        "patient": patient_data
    }

    docx_bytes = generate_docx_report(report_payload)
    code = patient_data.get("patient_code") or "PATIENT"
    filename = f"Clinical_Report_{code}_{decision_id[:8]}.docx"

    return Response(
        content=docx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

