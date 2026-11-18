from typing import List, Optional, Literal, Any
from pydantic import BaseModel, Field

class QueryRequest(BaseModel):
    patient_id: Optional[str] = Field(None, description="UUID of the selected patient in context")
    clinician_id: Optional[str] = Field(None, description="UUID of the authenticated clinician")
    question: str = Field(..., min_length=1, description="Clinical or healthcare question")
    category: Optional[str] = Field(None, description="Clinical category filter (e.g. Diabetes, Hypertension)")

class SourceItem(BaseModel):
    guideline_id: str
    title: str
    organization: str
    section: Optional[str] = None
    page: Optional[int] = None
    excerpt: str
    source_url: Optional[str] = None
    pdf_url: Optional[str] = None
    similarity: float = Field(..., ge=0.0, le=1.0)

ResponseType = Literal["greeting", "healthcare", "out_of_scope", "unclear"]

class QueryResponse(BaseModel):
    type: ResponseType
    answer: str
    sources: List[SourceItem] = Field(default_factory=list)

class HealthResponse(BaseModel):
    status: str
    supabase_connected: bool
    groq_configured: bool
    embedding_model: str

class PatientValidationRequest(BaseModel):
    full_name: str
    age: Optional[Any] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    contact: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    medical_conditions: List[str] = Field(default_factory=list)
    allergies: List[str] = Field(default_factory=list)
    medications: List[str] = Field(default_factory=list)
    medical_history: Optional[str] = None

class PatientValidationResponse(BaseModel):
    is_valid: bool
    errors: dict = Field(default_factory=dict)
    normalized: dict = Field(default_factory=dict)
