import logging
from typing import List, Dict, Any, Optional
from datetime import date
from supabase import create_client, Client
from app.config import settings

logger = logging.getLogger(__name__)

_supabase_client: Optional[Client] = None

def get_supabase_client() -> Client:
    """
    Get or create Supabase client using service role key (or fallback key).
    """
    global _supabase_client
    if _supabase_client is None:
        key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_PUBLISHABLE_KEY
        if not key:
            raise ValueError("No Supabase key configured in backend environment.")
        _supabase_client = create_client(settings.SUPABASE_URL, key)
    return _supabase_client

def retrieve_guideline_chunks(
    query_embedding: List[float],
    match_threshold: Optional[float] = None,
    match_count: Optional[int] = None,
    filter_guideline_id: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Executes pgvector similarity retrieval via match_guideline_chunks or match_document_chunks RPC.
    Returns only chunks meeting the minimum similarity threshold.
    """
    threshold = match_threshold if match_threshold is not None else settings.SIMILARITY_THRESHOLD
    count = match_count if match_count is not None else settings.TOP_K

    if not query_embedding:
        logger.warning("retrieve_guideline_chunks called with empty query_embedding; returning no evidence.")
        return []

    supabase = get_supabase_client()

    # Attempt primary RPC: match_guideline_chunks
    try:
        params = {
            "query_embedding": query_embedding,
            "match_threshold": threshold,
            "match_count": count,
            "filter_guideline_id": filter_guideline_id
        }
        res = supabase.rpc("match_guideline_chunks", params).execute()
        if res.data is not None:
            return res.data
    except Exception as e:
        logger.debug(f"Primary RPC match_guideline_chunks not found or error, trying fallback: {e}")

    # Fallback RPC: match_document_chunks
    try:
        fallback_params = {
            "query_embedding": query_embedding,
            "match_threshold": threshold,
            "match_count": count
        }
        res = supabase.rpc("match_document_chunks", fallback_params).execute()
        data = res.data or []
        if filter_guideline_id:
            data = [c for c in data if c.get("guideline_id") == filter_guideline_id]
        return data
    except Exception as e2:
        logger.error(f"Error executing vector retrieval RPCs: {e2}")
        return []

def get_patient_clinical_context(
    patient_id: str,
    clinician_id: Optional[str] = None
) -> Optional[Dict[str, Any]]:
    """
    Fetches strictly relevant patient clinical profile for RAG context.
    Combines diagnoses, medical history, clinical notes (labs/vitals), allergies,
    and active medications while excluding sensitive contact/address PII.
    Enforces clinician authorization if clinician_id is provided.
    """
    if not patient_id:
        return None

    try:
        supabase = get_supabase_client()
        res = supabase.from_("patients").select("*").eq("id", patient_id).limit(1).execute()
        patient = res.data[0] if (res and res.data) else None

        if not patient:
            # Also try matching by patient_code
            res2 = supabase.from_("patients").select("*").eq("patient_code", patient_id).limit(1).execute()
            patient = res2.data[0] if (res2 and res2.data) else None

        if not patient:
            return None

        # Clinician authorization check
        if clinician_id:
            owner_id = patient.get("clinician_id") or patient.get("created_by")
            if owner_id and str(owner_id) != str(clinician_id):
                logger.warning(
                    f"SECURITY ALERT: Clinician {clinician_id} attempted unauthorized access to patient {patient_id} owned by {owner_id}"
                )
                return None

        # Compute or retrieve age
        age = patient.get("age")
        if (age is None or age == 0) and patient.get("date_of_birth"):
            try:
                dob = date.fromisoformat(patient["date_of_birth"])
                today = date.today()
                age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
            except Exception:
                pass

        full_name = patient.get("full_name") or patient.get("name") or "Patient"
        patient_code = patient.get("patient_code") or patient.get("patient_id") or "PT"
        
        # Consolidate conditions
        conditions = patient.get("medical_conditions") or []
        if isinstance(conditions, str):
            conditions = [c.strip() for c in conditions.split(",") if c.strip()]
        if not conditions and patient.get("primary_condition"):
            conditions = [patient.get("primary_condition")]

        # Consolidate clinical history and notes (vital signs, lab observations)
        history_parts = []
        if patient.get("medical_history"):
            history_parts.append(patient["medical_history"].strip())
        if patient.get("clinical_notes") and patient["clinical_notes"].strip() != patient.get("medical_history", "").strip():
            # Avoid duplicate strings if clinical_notes equals medical_history
            history_parts.append(patient["clinical_notes"].strip())

        combined_notes = "\n".join(history_parts)

        return {
            "id": patient.get("id"),
            "patient_code": patient_code,
            "full_name": full_name,
            "age": age,
            "gender": patient.get("gender"),
            "conditions": conditions,
            "allergies": patient.get("allergies") or [],
            "medications": patient.get("medications") or [],
            "clinical_notes": combined_notes,
            "history": combined_notes
        }
    except Exception as e:
        logger.error(f"Error fetching patient clinical context for {patient_id}: {e}")
        return None
