import React from 'react';
import { User, ChevronDown, Trash2 } from 'lucide-react';
import type { Patient } from '../../types/patient';
import { calculateAge } from '../../types/patient';

interface AssistantHeaderProps {
  selectedPatient: Patient | null;
  onOpenPatientSelector: () => void;
  onClearConversation: () => void;
  hasMessages: boolean;
}

export const AssistantHeader: React.FC<AssistantHeaderProps> = ({
  selectedPatient,
  onOpenPatientSelector,
  onClearConversation,
  hasMessages,
}) => {
  const age = selectedPatient ? calculateAge(selectedPatient.date_of_birth) : null;
  const genderCode = selectedPatient?.gender ? selectedPatient.gender[0].toUpperCase() : '';

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-purple-100/70">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1a102f] tracking-tight">
          AI Clinical Assistant
        </h1>
        <p className="text-xs sm:text-sm text-[#665a7d] mt-1">
          Ask questions and get evidence-based answers from clinical guidelines.
        </p>
      </div>

      {/* Right: Selected Patient Pill Selector & Clear Conversation */}
      <div className="flex items-center gap-2.5 self-start sm:self-auto">
        {hasMessages && (
          <button
            type="button"
            onClick={onClearConversation}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-purple-100 bg-white hover:bg-rose-50 text-xs font-semibold text-[#6d6185] hover:text-rose-600 transition-colors shadow-2xs cursor-pointer"
            title="Clear current session messages"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Clear</span>
          </button>
        )}

        <button
          type="button"
          onClick={onOpenPatientSelector}
          className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl border border-purple-200/90 bg-white hover:bg-purple-50/70 shadow-2xs hover:shadow-xs transition-all text-xs font-semibold text-[#1b122e] cursor-pointer"
        >
          <div className="w-6 h-6 rounded-lg bg-purple-100 text-[#5b21b6] flex items-center justify-center">
            <User className="w-3.5 h-3.5" />
          </div>

          <div className="text-left">
            <div className="text-[10px] text-[#7a6e92] font-normal leading-tight">Patient Context</div>
            <div className="text-xs font-bold text-[#1b122e] truncate max-w-[150px]">
              {selectedPatient
                ? `${selectedPatient.full_name}${age !== null ? ` • ${age}${genderCode}` : ''}`
                : 'Select Patient'}
            </div>
          </div>

          <ChevronDown className="w-4 h-4 text-purple-400 ml-1" />
        </button>
      </div>
    </div>
  );
};
