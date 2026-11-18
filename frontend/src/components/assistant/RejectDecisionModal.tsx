import React, { useState } from 'react';
import { X, AlertCircle, Trash2 } from 'lucide-react';

interface RejectDecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  question: string;
  loading?: boolean;
}

export const RejectDecisionModal: React.FC<RejectDecisionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  question,
  loading = false,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await onConfirm(reason.trim());
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to reject decision.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={() => !loading && onClose()}
      />

      {/* Modal Card */}
      <div className="relative bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-purple-100 z-10 animate-in fade-in zoom-in-95 duration-150 flex flex-col text-left">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-purple-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#1b122e]">
                Reject AI Recommendation
              </h3>
              <p className="text-xs text-[#6e6183]">
                Record a rejected clinical decision in the audit trail.
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="p-2 rounded-xl text-[#786b8f] hover:text-[#1b122e] hover:bg-purple-50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Question context */}
          <div className="p-3 rounded-xl bg-purple-50/40 border border-purple-100/60 text-xs">
            <span className="font-bold text-[#443859] block mb-0.5">Clinical Question:</span>
            <p className="text-[#201533] italic">"{question}"</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#1b122e]">
              Rejection Clinical Rationale (optional):
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="E.g., Inconsistent with recent lab results, patient contraindication, etc."
              className="w-full text-xs sm:text-sm p-3.5 rounded-xl border border-purple-200 bg-[#fdfcff] focus:bg-white focus:border-[#6d28d9] focus:outline-none focus:ring-2 focus:ring-purple-300/30 transition-all resize-y font-medium text-[#180e2a]"
              disabled={loading}
            />
          </div>

          <p className="text-[11px] text-[#716589] bg-gray-50 p-3 rounded-xl border border-gray-100">
            Note: Rejecting will not delete the AI response from your current chat screen. It logs the rejection reason and evidence in the patient's permanent audit trail.
          </p>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-purple-200 bg-white hover:bg-purple-50 text-[#3b2f51] text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-950/15 transition-all cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>{loading ? 'Rejecting...' : 'Confirm Rejection'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
