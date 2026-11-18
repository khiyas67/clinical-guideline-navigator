import logging
from fastapi import APIRouter, HTTPException
from app.schemas import QueryRequest, QueryResponse
from app.services.rag import run_rag_pipeline
from app.services.retrieval import get_supabase_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/assistant", tags=["assistant"])

@router.post("/query", response_model=QueryResponse)
async def query_clinical_assistant(request: QueryRequest) -> QueryResponse:
    """
    Main endpoint for AI Clinical Assistant.
    Routes queries through:
    Query Router -> Patient Context -> pgvector retrieval -> Groq Grounded generation.
    Enforces cross-clinician patient authorization boundaries.
    """
    if not request.question or not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    # Clinician-Patient Authorization Boundary Check
    if request.patient_id and request.clinician_id:
        supabase = get_supabase_client()
        check_res = supabase.from_("patients").select("id, clinician_id, created_by").eq("id", request.patient_id).limit(1).execute()
        if check_res.data:
            p_rec = check_res.data[0]
            owner = p_rec.get("clinician_id") or p_rec.get("created_by")
            if owner and str(owner) != str(request.clinician_id):
                logger.warning(
                    f"SECURITY ALERT: Blocked unauthorized query by Clinician {request.clinician_id} for Patient {request.patient_id} (Owned by {owner})"
                )
                raise HTTPException(
                    status_code=403,
                    detail="Access denied: Authenticated clinician is not authorized to access this patient record."
                )

    try:
        response = run_rag_pipeline(request)
        return response
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing clinical query: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while processing your clinical request."
        )
