import logging
from typing import List, Dict, Any, Optional
from groq import Groq
from app.config import settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are Clinical Navigator, an evidence-grounded AI clinical decision support system for medical practitioners.

Your task is to answer the clinician's healthcare question strictly using the provided RETRIEVED CLINICAL GUIDELINE EVIDENCE and any relevant PATIENT CONTEXT.

CRITICAL CLINICAL SAFETY RULES:
1. Grounding & Zero Fabrication: Rely ONLY on the provided retrieved guideline evidence. Do NOT invent, extrapolate, or generalize recommendations, dosages, or contraindications not supported by the evidence. Never invent patient laboratory values, vital signs, or clinical diagnoses.
2. Parameter Completeness & Conditional Recommendations:
   - Never recommend a specific medication or dosage without sufficient patient information and supporting guideline evidence.
   - Do NOT make definitive treatment recommendations when required clinical parameters (e.g., eGFR, ACR, serum potassium, allergies, pregnancy status) are unavailable in the patient record.
   - When required clinical values are missing, frame recommendations as strictly CONDITIONAL (e.g., "Contingent upon verifying baseline eGFR ≥20 mL/min/1.73m² and serum potassium <5.0 mEq/L, guideline criteria would support...") and explicitly highlight the limitation.
   - Rigorously distinguish established patient facts from clinical assumptions.
3. Patient-Aware Synthesis:
   - When PATIENT CONTEXT is provided, personalize the assessment to that specific patient (considering their age, confirmed diagnoses, active medications, allergies, and clinical vitals/history).
   - If critical laboratory parameters (such as eGFR, ACR, HbA1c, serum potassium) or vitals are absent, explicitly flag them as missing under Section 6.
   - When NO patient is selected (or patient context indicates none), clearly label the answer as a general clinical guideline advisory.
4. Citations & Source Distinction:
   - Explicitly cite guideline organizations and titles (e.g., "CDC Clinical Practice Guideline (2022)", "KDIGO Clinical Practice Guideline (2022)").
   - If evidence originates from a Supporting Clinical Reference (e.g., Clinician Community Contributed SGLT2i Summary), clearly identify it as a secondary supporting reference or clinician summary, and NEVER present it as an official clinical practice guideline.
4. Response Structure:
   When Patient Context is Available, use the following standardized clinical structure:
   ### 1. Clinical Summary
   (A concise 2-3 sentence overview directly addressing the clinical inquiry for this patient.)
   
   ### 2. Relevant Patient Context
   (Bullet points summarizing the specific patient parameters, diagnoses, medications, or vitals pertinent to this question.)
   
   ### 3. Clinical Assessment
   (Synthesize how the patient's individual clinical profile aligns with or warrants guideline-directed therapy.)
   
   ### 4. Evidence-Based Recommendations
   (Numbered, conditional or definitive clinical steps supported by evidence, including specific drug classes and prerequisite threshold criteria.)
   
   ### 5. Safety Considerations & Monitoring
   (Key cautions, contraindications, drug-drug interactions, renal adjustments, or clinical monitoring intervals.)
   
   ### 6. Missing Clinical Information & Recommended Tests
   (Explicitly state any diagnostic data, baseline lab values, or vitals needed before finalizing therapy.)
   
   ### 7. Clinical Sources
   (Bulleted list of cited official guidelines and supporting references with specific page or section references.)

   When No Patient is Selected, use:
   ### General Clinical Guideline Advisory (No Patient Context Selected)
   ### 1. Clinical Summary
   ### 2. Evidence-Based Guidance
   ### 3. Safety & Monitoring Considerations
   ### 4. Clinical Sources

5. Readability & Formatting:
   - Use clear markdown headers (`###`), bold phrases, numbered lists, and bullet points.
   - Do NOT emit raw JSON, escaped newlines (\\n), or debug metadata.
   - Preserve all standard clinical units, thresholds, and dosages (e.g., mg, mL/min/1.73m², mmHg, %, MME/day).
6. Insufficient Evidence: If retrieved guidelines do not cover the inquiry, respond: "I couldn't find sufficiently relevant evidence in the currently indexed clinical guidelines to answer that question confidently. Please consult the full official guidelines or consider selecting another clinical topic."
"""

def generate_grounded_answer(
    question: str,
    evidence_chunks: List[Dict[str, Any]],
    patient_context: Optional[Dict[str, Any]] = None
) -> str:
    """
    Sends the user question, patient context, and retrieved guideline evidence to Groq
    to generate an evidence-grounded clinical response.
    """
    if not settings.GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY is not configured in backend environment.")

    client = Groq(api_key=settings.GROQ_API_KEY)

    # Format Evidence Section
    evidence_blocks = []
    for i, chunk in enumerate(evidence_chunks, 1):
        org = chunk.get("organization") or "Official Guideline"
        title = chunk.get("guideline_title") or "Clinical Guideline"
        page = chunk.get("page_number")
        section = chunk.get("section_title") or "General Guidance"
        content = chunk.get("content", "").strip()

        header = f"[EVIDENCE {i}] Organization: {org} | Guideline: {title} | Section: {section}"
        if page:
            header += f" | Page: {page}"
        
        evidence_blocks.append(f"{header}\nContent:\n{content}")

    evidence_text = "\n\n".join(evidence_blocks)

    # Format Patient Context Section
    patient_text = "No specific patient context selected for this query."
    if patient_context:
        lines = []
        if patient_context.get("full_name"):
            code = f" [{patient_context.get('patient_code')}]" if patient_context.get("patient_code") else ""
            lines.append(f"Patient: {patient_context['full_name']}{code}")
        if patient_context.get("age"):
            lines.append(f"Age: {patient_context['age']} years old")
        if patient_context.get("gender"):
            lines.append(f"Gender: {patient_context['gender']}")
        if patient_context.get("conditions"):
            conds = patient_context["conditions"]
            lines.append(f"Diagnosed Medical Conditions: {', '.join(conds) if isinstance(conds, list) else conds}")
        if patient_context.get("allergies"):
            alls = patient_context["allergies"]
            lines.append(f"Documented Allergies: {', '.join(alls) if isinstance(alls, list) else alls}")
        else:
            lines.append("Documented Allergies: None recorded")
        if patient_context.get("medications"):
            meds = patient_context["medications"]
            lines.append(f"Current Medications: {', '.join(meds) if isinstance(meds, list) else meds}")
        else:
            lines.append("Current Medications: None recorded")
        notes = patient_context.get("clinical_notes") or patient_context.get("history")
        if notes:
            lines.append(f"Clinical Notes, Labs & Vitals:\n{notes}")
        if lines:
            patient_text = "\n".join(lines)

    user_prompt = f"""### PATIENT CONTEXT:
{patient_text}

### RETRIEVED CLINICAL GUIDELINE EVIDENCE:
{evidence_text}

### CLINICAL QUESTION:
{question}

Please provide an evidence-grounded clinical response adhering to the instructions above:"""

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_prompt}
    ]

    models_to_try = [
        "openai/gpt-oss-120b",
        "openai/gpt-oss-20b",
        settings.GROQ_MODEL,
        "qwen/qwen3.8-27b"
    ]
    seen = set()
    models = [m for m in models_to_try if m and not (m in seen or seen.add(m))]

    last_error = None
    for model_name in models:
        try:
            logger.info(f"Calling Groq API with model: {model_name}")
            completion = client.chat.completions.create(
                model=model_name,
                messages=messages,
                temperature=0.1,
                max_tokens=1500
            )
            return completion.choices[0].message.content.strip()
        except Exception as e:
            logger.warning(f"Groq generation failed with model {model_name}: {e}")
            last_error = e

    raise RuntimeError(f"All Groq model attempts failed. Last error: {last_error}")
