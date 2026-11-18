# Security, Privacy & Compliance Architecture

This document describes the security controls, patient privacy safeguards, identity management, secrets management, and regulatory boundaries implemented across the **Clinical Guideline Navigator**.

---

## 1. Authentication & Session Management
- **Identity Provider:** Supabase Auth with JSON Web Tokens (JWT).
- **Password Security:** Salted and hashed using `bcrypt` at the identity provider level.
- **Client Session Isolation:** Session tokens are stored in secure browser local storage and attached to outgoing requests.
- **Protected Routing:** React Router enforces client-side session guards (`ProtectedRoute.tsx`), redirecting unauthenticated traffic to `/login`.

---

## 2. Authorization & Row Level Security (RLS)
The platform enforces database-level authorization via PostgreSQL Row Level Security:
- **Clinician Boundary:** Every patient record and clinical decision is bound to the creating clinician's user UUID (`auth.uid()`).
- **Zero Cross-Clinician Leaks:** Clinician A cannot read, query, update, or delete patients or clinical decisions belonging to Clinician B.
- **Service Role Segregation:** Administrative tasks (such as automated guideline cleanup or indexing) utilize the backend `service_role` key strictly within server-side execution. The public anon key (`VITE_SUPABASE_PUBLISHABLE_KEY`) has read-only access to published guidelines and scoped access to owned patients.

---

## 3. Patient Data Protection & PHI Minimization
To prevent leaks of Protected Health Information (PHI) under HIPAA / GDPR:
1. **PII Stripping from Embeddings:**
   - Patient names, contact telephone numbers, home addresses, and emails are **never** included in vector queries or sent to the vector database.
   - Vector queries only incorporate anonymized clinical parameters (e.g., active diagnoses and relevant renal stages).
2. **LLM Context Minimization:**
   - Groq LLM prompts only receive the patient's medical condition list, active medications, and pertinent laboratory vitals required to evaluate the clinical inquiry.
3. **No LLM Training on Patient Queries:**
   - API calls to Groq utilize enterprise API endpoints with zero-retention parameters, ensuring patient queries are not used for model training.

---

## 4. Secrets Management & Environment Hygiene
- **Zero Committed Secrets:** All credentials (`GROQ_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `VITE_SUPABASE_PUBLISHABLE_KEY`) are stored in `.env` or `.env.local` files excluded from version control.
- **Placeholder Templates:** `.env.example` contains only non-sensitive template strings (`your_groq_api_key_here`).
- **Git Ignore Invariants:** Comprehensive `.gitignore` rules prevent accidental commits of `.env`, `.venv`, `dist`, local database backups, and PDF binary assets.

---

## 5. Audit Trail Immutability
- **Clinical Governance:** Clinicians must explicitly **Accept**, **Modify** (with required clinical rationale), or **Reject** generated recommendations.
- **Append-Only Decision Log:** The `public.clinical_decisions` table contains no `UPDATE` or `DELETE` RLS policies for authenticated users. Once recorded, clinical decisions cannot be altered or removed, providing complete medical-legal defensibility.

---

## 6. Responsible Use & Disclaimers
1. **Decision Support, Not Autonomy:** The Clinical Guideline Navigator is an assistive clinical decision support system designed exclusively for licensed medical practitioners. It does not automate prescribing or dispense medical therapies.
2. **Mandatory Human Verification:** Final medical decisions, prescriptions, and therapeutic regimens remain the sole professional responsibility of the treating clinician.
3. **Emergency Disclaimers:** The system is not engineered for real-time emergency triage where life-critical delays cannot be tolerated.
