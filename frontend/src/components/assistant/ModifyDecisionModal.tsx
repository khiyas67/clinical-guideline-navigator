import React, { useState, useEffect } from 'react';
import { X, Edit3, Sparkles, Check, AlertCircle } from 'lucide-react';

interface ModifyDecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (modifiedText: string) => Promise<void>;
  question: string;
  originalAnswer: string;
  loading?: boolean;
}

export const ModifyDecisionModal: React.FC<ModifyDecisionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  question,
  originalAnswer,
  loading = false,
}) => {
  const [modifiedText, setModifiedText] = useState(originalAnswer);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setModifiedText(originalAnswer);
      setError(null);
    }
  }, [isOpen, originalAnswer]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modifiedText.trim()) {
      setError('Clinical recommendation text cannot be empty.');
      return;
    }
    setError(null);
    try {
      await onSave(modifiedText.trim());
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save modified decision.');
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
      <div className="relative bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-purple-100 z-10 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh] text-left">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-purple-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-[#5b21b6] flex items-center justify-center">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#1b122e]">
                Modify Clinical Decision
              </h3>
              <p className="text-xs text-[#6e6183]">
                Edit the AI recommendation before saving it to the patient's audit trail.
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

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 overflow-y-auto py-4 flex-1">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Original Question Context */}
          <div className="p-3.5 rounded-2xl bg-purple-50/50 border border-purple-100/70 text-xs">
            <span className="font-bold text-[#443859] block mb-1">Clinical Question:</span>
            <p className="text-[#201533] italic">"{question}"</p>
          </div>

          {/* Original AI Answer Preview */}
          <div className="p-3.5 rounded-2xl bg-[#faf8fe] border border-purple-100/80 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-[#5b21b6] mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Original AI Recommendation (Preserved in Audit Log):</span>
            </div>
            <p className="text-[#5b4d75] line-clamp-3 leading-relaxed">
              {originalAnswer}
            </p>
          </div>

          {/* Editable Textarea */}
          <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-xs font-bold text-[#1b122e]">
              Clinician-Modified Final Decision:
            </label>
            <textarea
              rows={7}
              value={modifiedText}
              onChange={(e) => setModifiedText(e.target.value)}
              className="w-full text-xs sm:text-sm p-4 rounded-2xl border border-purple-200 bg-[#fdfcff] focus:bg-white focus:border-[#6d28d9] focus:outline-none focus:ring-2 focus:ring-purple-300/30 transition-all resize-y font-medium text-[#180e2a] leading-relaxed"
              placeholder="Enter your modified clinical recommendation..."
              disabled={loading}
              required
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-purple-100 mt-2">
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
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#4a189a] hover:bg-[#3b127e] text-white text-xs font-bold shadow-md shadow-purple-950/15 transition-all cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>{loading ? 'Saving Decision...' : 'Save Modified Decision'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
