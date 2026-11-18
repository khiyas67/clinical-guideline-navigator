import React, { useState } from 'react';
import { Check, X, Edit3, AlertCircle, CheckCircle2, ShieldAlert, FileDown, FileText } from 'lucide-react';
import type { Source } from '../../types/assistant';
import type { ClinicalDecision, DecisionStatus } from '../../types/decision';
import { createClinicalDecision } from '../../lib/decisions';
import { downloadDecisionPDF, downloadDecisionDOCX } from '../../lib/reports';
import { ModifyDecisionModal } from './ModifyDecisionModal';
import { RejectDecisionModal } from './RejectDecisionModal';

interface DecisionActionsProps {
  patientId?: string | null;
  question: string;
  aiAnswer: string;
  category?: string | null;
  sources?: Source[];
  initialDecision?: DecisionStatus;
  initialRationale?: string;
  initialDecisionId?: string;
  onDecisionSaved?: (decision: ClinicalDecision) => void;
}

export const DecisionActions: React.FC<DecisionActionsProps> = ({
  patientId,
  question,
  aiAnswer,
  category,
  sources = [],
  initialDecision,
  initialRationale = '',
  initialDecisionId,
  onDecisionSaved,
}) => {
  const [decision, setDecision] = useState<DecisionStatus | undefined>(initialDecision);
  const [decisionId, setDecisionId] = useState<string | undefined>(initialDecisionId);
  const [rationale, setRationale] = useState(initialRationale);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Report download state
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [downloadingDOCX, setDownloadingDOCX] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // Modals state
  const [modifyModalOpen, setModifyModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1. Accept Action (Instant Persistence)
  const handleAccept = async () => {
    if (saving || decision === 'accepted') return;
    if (!patientId) {
      setErrorMessage('Please select a patient before recording a clinical decision.');
      return;
    }

    setSaving(true);
    setErrorMessage(null);

    const { data, error } = await createClinicalDecision({
      patient_id: patientId,
      question,
      ai_answer: aiAnswer,
      final_decision: aiAnswer,
      decision_status: 'accepted',
      category: category || null,
      sources,
    });

    setSaving(false);

    if (error || !data) {
      setErrorMessage(error?.message || 'Failed to save clinical decision.');
    } else {
      setDecision('accepted');
      setDecisionId(data.id);
      showToast('Recommendation accepted and recorded in patient audit trail.');
      onDecisionSaved?.(data);
    }
  };

  // 2. Modify Action (Modal Submission)
  const handleSaveModified = async (modifiedText: string) => {
    if (!patientId) {
      throw new Error('Please select a patient before recording a clinical decision.');
    }

    setSaving(true);
    setErrorMessage(null);

    const { data, error } = await createClinicalDecision({
      patient_id: patientId,
      question,
      ai_answer: aiAnswer,
      final_decision: modifiedText,
      decision_status: 'modified',
      category: category || null,
      sources,
    });

    setSaving(false);

    if (error || !data) {
      throw new Error(error?.message || 'Failed to save modified decision.');
    } else {
      setDecision('modified');
      setDecisionId(data.id);
      showToast('Modified clinical recommendation recorded in patient audit trail.');
      onDecisionSaved?.(data);
    }
  };

  // 3. Reject Action (Modal Submission)
  const handleConfirmReject = async (rejectionReason: string) => {
    if (!patientId) {
      throw new Error('Please select a patient before recording a clinical decision.');
    }

    setSaving(true);
    setErrorMessage(null);

    const { data, error } = await createClinicalDecision({
      patient_id: patientId,
      question,
      ai_answer: aiAnswer,
      final_decision: null,
      decision_status: 'rejected',
      category: category || null,
      sources,
      rejection_reason: rejectionReason || null,
    });

    setSaving(false);

    if (error || !data) {
      throw new Error(error?.message || 'Failed to reject decision.');
    } else {
      setDecision('rejected');
      setDecisionId(data.id);
      setRationale(rejectionReason);
      showToast('Clinical recommendation rejected and logged.');
      onDecisionSaved?.(data);
    }
  };

  // Report download handlers — only callable after decision is saved
  const handleDownloadPDF = async () => {
    if (!decisionId || downloadingPDF) return;
    setDownloadingPDF(true);
    setDownloadError(null);
    try {
      await downloadDecisionPDF(decisionId);
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'Failed to download PDF report.');
    } finally {
      setDownloadingPDF(false);
    }
  };

  const handleDownloadDOCX = async () => {
    if (!decisionId || downloadingDOCX) return;
    setDownloadingDOCX(true);
    setDownloadError(null);
    try {
      await downloadDecisionDOCX(decisionId);
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'Failed to download Word report.');
    } finally {
      setDownloadingDOCX(false);
    }
  };

  const isLocked = Boolean(decision);

  return (
    <div className="mt-5 pt-4 border-t border-purple-100 flex flex-col gap-3 text-left">
      {/* Header / Instructions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <span className="text-xs font-bold text-[#1b122e]">Clinician Decision</span>
          <span className="text-[11px] text-[#786b8f] block sm:inline sm:ml-2">
            {isLocked
              ? 'Decision recorded in patient audit trail'
              : 'Review and evaluate guideline recommendation'}
          </span>
        </div>

        {/* Feedback toast banner */}
        {toastMessage && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200 animate-in fade-in duration-150">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{toastMessage}</span>
          </span>
        )}
      </div>

      {/* Patient Not Selected Warning */}
      {!patientId && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-medium text-amber-800">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Select an active patient to enable permanent clinical decision recording.</span>
        </div>
      )}

      {/* Error alert */}
      {errorMessage && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Button Row */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Accept Button */}
        <button
          type="button"
          disabled={!patientId || saving || (isLocked && decision !== 'accepted')}
          onClick={handleAccept}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
            decision === 'accepted'
              ? 'bg-emerald-600 text-white shadow-xs cursor-default'
              : 'bg-emerald-50 hover:bg-emerald-100/80 text-emerald-700 border border-emerald-200'
          }`}
        >
          <Check className="w-3.5 h-3.5 stroke-[3]" />
          <span>
            {saving && !isLocked
              ? 'Saving...'
              : decision === 'accepted'
              ? 'Accepted ✓'
              : 'Accept'}
          </span>
        </button>

        {/* Reject Button */}
        <button
          type="button"
          disabled={!patientId || saving || isLocked}
          onClick={() => setRejectModalOpen(true)}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
            decision === 'rejected'
              ? 'bg-rose-600 text-white shadow-xs cursor-default'
              : 'bg-rose-50 hover:bg-rose-100/80 text-rose-700 border border-rose-200'
          }`}
        >
          <X className="w-3.5 h-3.5 stroke-[3]" />
          <span>{decision === 'rejected' ? 'Rejected ✗' : 'Reject'}</span>
        </button>

        {/* Modify Button */}
        <button
          type="button"
          disabled={!patientId || saving || isLocked}
          onClick={() => setModifyModalOpen(true)}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
            decision === 'modified'
              ? 'bg-[#5b21b6] text-white shadow-xs cursor-default'
              : 'bg-purple-50 hover:bg-purple-100 text-[#5b21b6] border border-purple-200'
          }`}
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>{decision === 'modified' ? 'Modified ✎' : 'Modify'}</span>
        </button>

        {/* Audit link if saved */}
        {decisionId && patientId && (
          <a
            href={`/patients/${patientId}`}
            className="text-[11px] font-semibold text-[#6d28d9] hover:underline ml-auto"
          >
            View in Patient Decisions →
          </a>
        )}
      </div>

      {/* Display Rejection Reason if Rejected */}
      {decision === 'rejected' && rationale && (
        <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-100 text-xs text-rose-800">
          <span className="font-bold block mb-0.5">Recorded Rejection Rationale:</span>
          <p className="italic">"{rationale}"</p>
        </div>
      )}

      {/* ── Report Downloads (only visible after decision is saved) ── */}
      {decisionId && (
        <div className="mt-1 pt-3 border-t border-purple-100/60">
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-bold text-[#786b8f] uppercase tracking-wide">
              Download Clinical Report
            </span>

            <div className="flex flex-wrap gap-2">
              {/* PDF Download */}
              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={downloadingPDF || downloadingDOCX}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold
                           bg-[#5b21b6] hover:bg-[#4a189a] text-white
                           transition-all duration-150 cursor-pointer
                           disabled:opacity-50 disabled:cursor-not-allowed
                           shadow-sm"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>{downloadingPDF ? 'Generating PDF…' : 'Download PDF'}</span>
              </button>

              {/* DOCX Download */}
              <button
                type="button"
                onClick={handleDownloadDOCX}
                disabled={downloadingPDF || downloadingDOCX}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold
                           bg-purple-50 hover:bg-purple-100 text-[#5b21b6] border border-purple-200
                           transition-all duration-150 cursor-pointer
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{downloadingDOCX ? 'Generating Word…' : 'Download Word (.docx)'}</span>
              </button>
            </div>

            {/* Download error */}
            {downloadError && (
              <div className="flex items-center gap-1.5 p-2 rounded-lg bg-rose-50 border border-rose-200 text-[11px] font-semibold text-rose-700">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{downloadError}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modify Modal */}
      <ModifyDecisionModal
        isOpen={modifyModalOpen}
        onClose={() => setModifyModalOpen(false)}
        onSave={handleSaveModified}
        question={question}
        originalAnswer={aiAnswer}
        loading={saving}
      />

      {/* Reject Modal */}
      <RejectDecisionModal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        onConfirm={handleConfirmReject}
        question={question}
        loading={saving}
      />
    </div>
  );
};
