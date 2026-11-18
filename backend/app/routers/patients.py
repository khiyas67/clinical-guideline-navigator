from fastapi import APIRouter, HTTPException
from app.schemas import PatientValidationRequest, PatientValidationResponse
from app.services.patient_validator import validate_complete_patient_payload

router = APIRouter(prefix="/api/patients", tags=["patients"])

@router.post("/validate", response_model=PatientValidationResponse)
async def validate_patient(request: PatientValidationRequest):
    """
    Validates complete patient demographic, contact, and clinical fields:
    - Full name (letters, spaces, dots, hyphens; no digits or invalid symbols)
    - Indian mobile number (10 digits starting with 6,7,8,9; optional +91, normalized)
    - Email address (strict format, no leading/trailing/internal whitespace)
    - Age (integer 1-125; no negative numbers, zero, or text)
    - All other patient fields
    """
    payload = request.model_dump()
    is_valid, errors, normalized = validate_complete_patient_payload(payload)
    return PatientValidationResponse(
        is_valid=is_valid,
        errors=errors,
        normalized=normalized
    )

