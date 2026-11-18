import React, { useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface QuestionInputProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
  loading: boolean;
  disabled?: boolean;
}

export const QuestionInput: React.FC<QuestionInputProps> = ({
  value,
  onChange,
  onSubmit,
  loading,
  disabled = false,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea height up to 160px
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!loading && value.trim() && !disabled) {
        onSubmit();
      }
    }
  };

  return (
    <div className="pt-3 border-t border-purple-100/80 bg-white">
      <div className="relative flex items-end gap-2 bg-[#fdfcff] border border-purple-200/90 rounded-2xl p-2.5 focus-within:border-[#6d28d9] focus-within:ring-2 focus-within:ring-purple-300/30 transition-all shadow-2xs">
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          disabled={loading}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? 'Select a patient to submit query, or customize question...' : 'Ask a clinical question (e.g. recommended first-line treatments)...'}
          className="w-full text-xs sm:text-sm text-[#1a102f] placeholder-[#8f83a5] bg-transparent focus:outline-none resize-none py-1.5 px-2 max-h-40 leading-relaxed"
        />

        <button
          type="button"
          disabled={disabled || loading || !value.trim()}
          onClick={onSubmit}
          className="p-2.5 rounded-xl bg-[#4a189a] hover:bg-[#3b127e] disabled:bg-[#4a189a]/40 text-white transition-all duration-150 cursor-pointer disabled:cursor-not-allowed shadow-xs shrink-0 self-end mb-0.5"
          aria-label="Send clinical query"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>

      <div className="text-[11px] text-[#8e81a3] mt-2 flex items-center justify-between px-2">
        <span>Press <kbd className="font-mono bg-purple-50 px-1 py-0.5 rounded border border-purple-100">Enter</kbd> to send, <kbd className="font-mono bg-purple-50 px-1 py-0.5 rounded border border-purple-100">Shift + Enter</kbd> for new line</span>
        <span className="hidden sm:inline">Clinical Guideline Retrieval Active</span>
      </div>
    </div>
  );
};
