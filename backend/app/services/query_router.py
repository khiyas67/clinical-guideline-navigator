import re
from typing import Tuple, Literal
from app.schemas import ResponseType

# Standard Responses
GREETING_RESPONSE = "Hello! 👋 How can I help you with a healthcare or clinical guideline question today?"
OUT_OF_SCOPE_RESPONSE = "I'm designed to assist with healthcare and clinical guideline-related questions. Please ask me something related to a patient's condition, diagnosis, treatment, medication, or clinical guidelines."
UNCLEAR_RESPONSE = "I couldn't quite understand your clinical question. Could you please provide more detail about the patient's condition, symptom, or the guideline topic you'd like to consult?"

# Regex patterns for greetings
GREETING_PATTERNS = [
    r"^(hi|hello|hey|greetings|howdy|good\s+(morning|afternoon|evening|day))(\s*[\!\?\.\,]*)*$",
    r"^(hi|hello|hey)\s+(there|assistant|doctor|doc|clinical\s+navigator)(\s*[\!\?\.\,]*)*$",
    r"^how\s+(are\s+you|is\s+it\s+going|are\s+things)(\s*[\!\?\.\,]*)*$",
    r"^what('s|\s+is)\s+up(\s*[\!\?\.\,]*)*$",
    r"^(who\s+are\s+you|what\s+can\s+you\s+do)(\s*[\!\?\.\,]*)*$"
]

# Patterns clearly identifying out-of-scope tasks (coding, sports, jokes, trivia, etc.)
OUT_OF_SCOPE_PATTERNS = [
    r"\b(write|create|generate|fix|debug|show)(\s+\w+){0,3}\s+(python|javascript|typescript|java|c\+\+|rust|html|css|sql|code|script|program|app|function)\b",
    r"\b(python\s+(code|script|program)|write\s+code|coding|programming)\b",
    r"\b(who\s+won|score\s+of|match\s+result|cricket|football|soccer|basketball|nba|nfl|ipl|world\s+cup|fifa)\b",
    r"\b(tell\s+me\s+a\s+joke|make\s+me\s+laugh|funny\s+joke|riddle|joke)\b",
    r"\b(capital\s+of|who\s+is\s+president\s+of|prime\s+minister\s+of|currency\s+of)\b",
    r"\b(movie|movies|film|films|cinema|song|songs|lyrics|weather\s+(today|tomorrow|in))\b",
    r"\b(recommend|suggest)\s+(a\s+)?(movie|film|song|book|restaurant|hotel)\b",
    r"\b(stock\s+price|bitcoin|crypto|forex|real\s+estate\s+market)\b",
]

# Medical & Healthcare keywords across symptoms, drugs, guidelines, physiology
HEALTHCARE_KEYWORDS = {
    # Conditions & diseases
    "diabetes", "diabetic", "hypertension", "hypertensive", "blood pressure", "bp", 
    "cardiovascular", "cvd", "heart failure", "infarction", "stroke", "angina", "arrhythmia",
    "covid", "covid-19", "coronavirus", "sars-cov-2", "infection", "infectious", "pneumonia",
    "asthma", "copd", "kidney", "renal", "ckd", "liver", "hepatic", "neuropathy", "retinopathy",
    "hyperglycemia", "hypoglycemia", "dyslipidemia", "hyperlipidemia", "cholesterol", "pain",
    "opioid", "analgesic", "fever", "cough", "dyspnea", "shortness of breath", "edema",
    "sepsis", "shock", "cancer", "tumor", "ulcer", "arthritis", "depression", "anxiety",
    
    # Guidelines & authorities
    "guideline", "guidelines", "nice", "who", "cdc", "ng28", "ng136", "ng238", "ng191", "ng5",
    "recommendation", "recommended", "protocol", "evidence", "clinical guidance",
    
    # Treatments & pharmacotherapy
    "treatment", "therapy", "medication", "medicine", "drug", "prescription", "prescribing",
    "dosage", "dose", "titration", "contraindication", "contraindications", "adverse", "side effect",
    "interaction", "metformin", "statin", "atorvastatin", "amlodipine", "ramipril", "losartan",
    "lisinopril", "sglt2", "glp-1", "dpp-4", "insulin", "sulfonylurea", "ace inhibitor", "arb",
    "beta blocker", "calcium channel blocker", "diuretic", "aspirin", "anticoagulant", "antibiotic",
    "antiviral", "paxlovid", "nirmatrelvir", "ritonavir", "paracetamol", "ibuprofen", "nsaid",
    "morphine", "oxycodone", "fentanyl", "buprenorphine", "methadone", "naloxone",
    
    # Clinical metrics & diagnostics
    "diagnosis", "diagnostic", "screening", "hba1c", "blood glucose", "systolic", "diastolic",
    "egfr", "creatinine", "alt", "ast", "ldl", "hdl", "triglycerides", "bmi", "microalbuminuria",
    "laboratory", "test", "monitoring", "target", "threshold",
    
    # Patient contexts
    "patient", "clinician", "doctor", "history", "allergy", "allergies", "symptom", "symptoms",
    "management", "first-line", "second-line", "dual therapy", "monotherapy", "escalation"
}

def classify_query(query: str) -> Tuple[ResponseType, str]:
    """
    Classifies an incoming user query into one of:
    - greeting: Simple salutation -> return canned greeting (no RAG)
    - out_of_scope: Clearly non-medical query -> return boundary message (no RAG)
    - healthcare: Legitimate clinical question -> proceed to vector retrieval & Groq
    - unclear: Extremely brief or incomprehensible text -> ask for clarification
    """
    cleaned = query.strip()
    if not cleaned:
        return "unclear", UNCLEAR_RESPONSE

    lower_query = cleaned.lower()

    # 1. Check for Greetings
    for pattern in GREETING_PATTERNS:
        if re.search(pattern, lower_query):
            return "greeting", GREETING_RESPONSE

    # 2. Check for Out-of-Scope (Coding, sports, jokes, trivia, etc.)
    for pattern in OUT_OF_SCOPE_PATTERNS:
        if re.search(pattern, lower_query):
            return "out_of_scope", OUT_OF_SCOPE_RESPONSE

    # 3. Check for Healthcare & Clinical terminology
    words = re.findall(r"\b[a-z0-9\-]+\b", lower_query)
    for word in words:
        if word in HEALTHCARE_KEYWORDS:
            return "healthcare", ""

    # Check multi-word keywords
    for multi in ["blood pressure", "type 2 diabetes", "heart failure", "side effect", "covid-19", "clinical guideline"]:
        if multi in lower_query:
            return "healthcare", ""

    # 4. Check for typical question patterns referring to clinical care or patient
    clinical_question_patterns = [
        r"\b(how\s+to\s+treat|how\s+to\s+manage|what\s+to\s+give|should\s+i\s+prescribe)\b",
        r"\b(what\s+is\s+the\s+target|what\s+does\s+the\s+guideline|recommended\s+approach)\b",
        r"\b(for\s+this\s+patient|patient\s+with|diagnosed\s+with)\b",
        r"\b(is\s+it\s+safe|can\s+we\s+combine|when\s+to\s+start)\b",
    ]
    for pattern in clinical_question_patterns:
        if re.search(pattern, lower_query):
            return "healthcare", ""

    # 5. If query is extremely short (e.g. "car", "xyz", "asdf") with zero medical terms
    if len(words) <= 2:
        return "unclear", UNCLEAR_RESPONSE

    # 6. Default to healthcare to allow vector similarity scoring to assess relevance
    return "healthcare", ""
