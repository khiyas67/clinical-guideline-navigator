import React from 'react';
import { Sparkles, HelpCircle } from 'lucide-react';
import { getClinicalSuggestions } from '../../data/clinicalSuggestions';

interface QuestionSuggestionsProps {
  onSelectSuggestion: (question: string) => void;
  category?: string;
  patientCondition?: string;
}

export const QuestionSuggestions: React.FC<QuestionSuggestionsProps> = ({
  onSelectSuggestion,
  category = 'General',
}) => {
  const suggestions = getClinicalSuggestions(category);

  return (
    <div className="py-12 px-4 sm:px-8 text-center max-w-2xl mx-auto flex flex-col items-center justify-center my-auto">
      {/* Icon */}
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#5b21b6] to-[#8b5cf6] text-white flex items-center justify-center mb-4 shadow-md shadow-purple-950/15">
        <Sparkles className="w-7 h-7" />
      </div>

      {/* Heading & Subtitle */}
      <h3 className="text-xl sm:text-2xl font-extrabold text-[#1a102f] tracking-tight mb-2">
        How can I help with this patient?
      </h3>
      <p className="text-xs sm:text-sm text-[#6c6082] leading-relaxed mb-8 max-w-md">
        Ask a clinical question and Clinical Navigator will retrieve relevant guideline evidence grounded in patient factors.
      </p>

      {/* Suggestions List */}
      <div
        key={category}
        className="w-full flex flex-col sm:flex-row flex-wrap justify-center gap-2.5 transition-all duration-200 ease-in-out"
      >
        {suggestions.map((sugg) => (
          <button
            key={sugg}
            type="button"
            onClick={() => onSelectSuggestion(sugg)}
            className="flex items-center gap-2 text-left px-4 py-2.5 rounded-2xl bg-[#faf8fe] hover:bg-purple-100/60 border border-purple-100 hover:border-purple-200 text-xs sm:text-sm font-medium text-[#3b2d52] hover:text-[#5b21b6] transition-all duration-150 cursor-pointer shadow-2xs group"
          >
            <HelpCircle className="w-4 h-4 text-purple-400 group-hover:text-[#5b21b6] shrink-0" />
            <span>{sugg}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

