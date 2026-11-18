# Application Screenshots & UI Documentation

This directory contains visual captures of the active **AI-Assistant for Dynamic Clinical Guideline Navigator** application running across authenticated clinical workflows.

## Screenshot Inventory & View Mapping

| Screenshot View | Route / Component | Description | Filename |
|---|---|---|---|
| **Add Guideline QC Pipeline** | `/guidelines` -> `AddGuidelineModal.tsx` | Automated SHA-256 analysis, document verification, authority metadata extraction, and duplicate detection. | `add_guideline_qc_modal.jpg` |
| **Clinician Dashboard** | `/dashboard` | System overview with active clinical metrics, recent patient interactions, and quick clinical actions. | `dashboard_overview.png` *(Capture from live)* |
| **Patient Directory** | `/patients` | Authorized patient records with clinical condition tags, allergy flags, and last visit timestamps. | `patients_directory.png` *(Capture from live)* |
| **Clinical Guidelines Library** | `/guidelines` | Multi-category tabs (8 specialties), verified authority badges, and direct `[Open PDF ↗]` action buttons. | `guidelines_library.png` *(Capture from live)* |
| **Clinical Query - Step 1** | `/assistant` | Clinician patient selection, patient context loading, and structured inquiry input. | `query_step1_context.png` *(Capture from live)* |
| **Clinical Query - Step 2** | `/assistant` | RAG query dispatch, dynamic category tagging, and evidence similarity retrieval. | `query_step2_dispatch.png` *(Capture from live)* |
| **Evidence Retrieval Cards** | `EvidenceCard.tsx` | Grounded source excerpts, similarity scores, issuing organization, section, and page number citations. | `evidence_cards.png` *(Capture from live)* |
| **Clinical Guidance Answer** | `ChatMessage.tsx` | Standardized clinical response (Summary, Context, Assessment, Evidence-Based Recommendations, Safety/Monitoring). | `clinical_guidance.png` *(Capture from live)* |
| **Decision Navigation Workflow** | `DecisionActions.tsx` | Human-in-the-loop decision governance with Accept, Modify (with rationale), and Reject options. | `decision_actions.png` *(Capture from live)* |
| **Audit Logs & History** | `/patients/:id` (Decisions Tab) | Immutable medical-legal audit log capturing decision status, clinician ID, timestamp, and modifications. | `audit_trail.png` *(Capture from live)* |
| **Evaluation Dashboard** | `/settings` / Evaluation | Quantitative metrics on retrieval precision, groundedness, and system health status. | `evaluation_dashboard.png` *(Capture from live)* |

## Capturing Updated Live Screenshots

To capture updated screenshots from the live application:
1. Start the backend: `python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000`
2. Start the frontend: `npm --prefix frontend run dev`
3. Navigate to `http://localhost:5173`
4. Use standard browser screen capture tools (e.g., Chrome DevTools device mode or `Cmd+Shift+4` / `Win+Shift+S`) and place png files in this directory.
