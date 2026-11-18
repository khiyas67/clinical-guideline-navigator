# Clinician & User Operating Guide

This guide walks healthcare professionals through using the **Clinical Guideline Navigator** in daily clinical practice.

---

## 1. Clinician Authentication & Sign In

1. Open the application at `http://localhost:5173`.
2. Click **Sign In** on the top navigation bar.
3. Enter your verified clinician credentials (email and password) or create a new account via the **Sign Up** tab.
4. Upon successful authentication, you will be redirected to the **Clinician Dashboard**.

---

## 2. Navigating the Dashboard

The Dashboard provides high-level clinical metrics and quick navigation:
- **Active Patients Count:** Total number of registered patients assigned to your care.
- **Indexed Clinical Guidelines:** Total active guidelines indexed across all 8 specialties.
- **Clinical Decisions Logged:** Total number of clinical decisions reviewed and recorded in the audit log.
- **Quick Actions:** One-click shortcuts to *New Clinical Inquiry*, *Add Patient*, or *Browse Guidelines*.

---

## 3. Patient Management (`/patients`)

### Adding a New Patient:
1. Click **Patients** in the sidebar navigation.
2. Click **+ Add Patient**.
3. Complete the clinical profile:
   - **Full Name**, **Date of Birth**, **Gender**
   - **Active Medical Conditions** (e.g., *Type 2 Diabetes, Stage 3 Chronic Kidney Disease, Hypertension*)
   - **Current Medications** (e.g., *Metformin 1000mg BID, Lisinopril 10mg QD*)
   - **Known Drug Allergies** (e.g., *Penicillin, ACE Inhibitors*)
   - **Medical History & Recent Labs** (e.g., *Baseline eGFR 48 mL/min/1.73m², Urine ACR 180 mg/g*)
4. Click **Save Patient**. The record is saved under your secure clinician profile with Row Level Security.

---

## 4. Browsing the Clinical Guidelines Library (`/guidelines`)

1. Click **Clinical Guidelines** in the sidebar.
2. Filter guidelines using the top category tabs:
   - **Nephrology**, **Pain Management**, **Endocrinology**, **Diabetes**, **Cardiovascular**, **Hypertension**, **Infectious Disease**, **General**.
3. Every card displays:
   - Official Guideline Title
   - Issuing Health Authority (e.g., *NICE*, *KDIGO*, *AHA/ACC/HFSA*, *CDC*)
   - Publication Year and Category Badges
   - **`[Open PDF ↗]`**: Click to open the official, original guideline PDF in a new tab.
   - **`[View Details]`**: Inspect detailed metadata, document version, and chunk counts.

### Adding a New Guideline (QC Pipeline):
1. Click **+ Add Guideline**.
2. Upload the official PDF document.
3. The system automatically computes the cryptographic SHA-256 hash, validates clinical authenticity, detects duplicates, and auto-detects the specialty category.
4. Review extracted metadata and click **Accept & Index Guideline** to chunk and embed the document.

---

## 5. Asking Clinical Inquiries (The Assistant Workflow)

1. Click **Assistant** in the sidebar.
2. **Step 1: Select Patient Context (Optional but Recommended):**
   - Choose a patient from the dropdown. Their active conditions, medications, and allergies will appear in the Patient Context card.
   - If querying for general guideline guidance, leave patient selection as *"General Query (No Patient Context)"*.
3. **Step 2: Enter Clinical Question:**
   - Type your question in the prompt box (or select one of the suggested clinical queries).
   - Example: *"What is the recommended SGLT2 inhibitor treatment threshold for this patient based on their renal function?"*
4. Click **Send** (or press `Enter`).

---

## 6. Reviewing Evidence & Clinical Guidance

Within seconds, the assistant renders:
- **Evidence Cards:** Displays the top retrieved excerpts with exact issuing authority, guideline title, section title, page number, and similarity score.
- **Structured Response:**
  1. **Clinical Summary:** Concise overview addressing your inquiry.
  2. **Relevant Patient Context:** Summary of patient parameters pertinent to the guidance.
  3. **Clinical Assessment:** How the patient profile aligns with guideline criteria.
  4. **Evidence-Based Recommendations:** Numbered, conditional recommendations with drug classes and threshold criteria.
  5. **Safety Considerations & Monitoring:** Adverse effects, contraindications, and laboratory monitoring intervals.
  6. **Missing Clinical Information & Recommended Tests:** Highlights any unrecorded labs (e.g., eGFR, ACR, potassium) required before finalizing therapy.
  7. **Clinical Sources:** Explicit citations to the official guidelines.

---

## 7. Human-in-the-Loop Decision Governance

Directly beneath the generated response, three governance actions are provided:
- **`[Accept Decision]`:** Records that you agree with the guideline recommendations and will implement them as stated.
- **`[Modify Decision]`:** Opens a modal allowing you to input clinician adjustments along with a required clinical justification (e.g., *"Dosage adjusted to 10mg due to mild dehydration history"*).
- **`[Reject Decision]`:** Records that the guidance was rejected, prompting you for a clinical reason.

All actions are permanently recorded in the immutable **Clinical Decisions** audit log viewable on the patient's profile under the **Decisions** tab.

---

## 8. Exporting Clinical Consultation Reports

To generate documentation for institutional electronic health records (EHR):
1. On the Assistant response, click **Export Report**.
2. Select your preferred format: **PDF** or **DOCX**.
3. The system generates a clean, formatted consultation note including patient clinical parameters, query, recommendations, and source citations.
