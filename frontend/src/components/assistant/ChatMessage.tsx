import React from 'react';
import { Sparkles, MessageCircle, HelpCircle, AlertCircle, CheckCircle2, Edit3, User } from 'lucide-react';
import type { AssistantMessage } from '../../types/assistant';
import type { Patient } from '../../types/patient';
import type { ClinicalDecision } from '../../types/decision';
import { EvidenceCard } from './EvidenceCard';
import { DecisionActions } from './DecisionActions';
import { MarkdownRenderer } from '../common/MarkdownRenderer';

interface ChatMessageProps {
  message: AssistantMessage;
  selectedPatient?: Patient | null;
  onDecisionChange?: (messageId: string, decision: 'accepted' | 'rejected' | 'modified', rationale?: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  selectedPatient,
  onDecisionChange,
}) => {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end my-3">
        <div className="max-w-[85%] sm:max-w-xl bg-[#4a189a] text-white px-5 py-3.5 rounded-2xl rounded-tr-xs shadow-sm shadow-purple-950/10 text-left">
          <p className="text-xs sm:text-sm font-medium leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
          <div className="text-[10px] text-purple-200 mt-1 text-right">
            {message.timestamp}
          </div>
        </div>
      </div>
    );
  }

  // Greeting or Out of Scope Message
  if (message.type === 'greeting' || message.type === 'out_of_scope' || message.type === 'unclear') {
    const isGreeting = message.type === 'greeting';
    const isOutOfScope = message.type === 'out_of_scope';

    return (
      <div className="my-4 p-5 sm:p-6 rounded-3xl bg-white border border-purple-100 shadow-2xs text-left animate-in fade-in duration-200 max-w-2xl">
        <div className="flex items-center gap-2.5 mb-3">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-2xs ${
            isGreeting ? 'bg-gradient-to-tr from-[#5b21b6] to-[#8b5cf6]' : isOutOfScope ? 'bg-amber-600' : 'bg-purple-600'
          }`}>
            {isGreeting ? <MessageCircle className="w-4 h-4" /> : isOutOfScope ? <AlertCircle className="w-4 h-4" /> : <HelpCircle className="w-4 h-4" />}
          </div>
          <div>
            <div className="text-xs sm:text-sm font-bold text-[#1b122e]">
              {isGreeting ? 'Clinical Navigator Assistant' : isOutOfScope ? 'Clinical Scope Advisory' : 'Guideline Inquiry Assistant'}
            </div>
            <div className="text-[10px] text-[#786b8f]">
              {isGreeting ? 'Ready for clinical queries' : 'Evidence navigation boundary'}
            </div>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-[#2a1d3f] leading-relaxed whitespace-pre-line">
          {message.content}
        </p>

        <div className="text-[10px] text-[#9387a8] mt-3 text-right">
          {message.timestamp}
        </div>
      </div>
    );
  }

  // Clinical Recommendation Message (Grounded RAG Response)
  const isHealthcare = message.type === 'healthcare' || !message.type;

  const handleDecisionSaved = (dec: ClinicalDecision) => {
    onDecisionChange?.(message.id, dec.decision_status, dec.rejection_reason || undefined);
  };

  return (
    <div className="my-4 p-5 sm:p-7 rounded-3xl bg-[#faf8fe] border border-purple-100 shadow-sm text-left animate-in fade-in duration-200">
      
      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-3 pb-3 mb-4 border-b border-purple-100/70">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#5b21b6] to-[#8b5cf6] text-white flex items-center justify-center shadow-2xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs sm:text-sm font-bold text-[#1b122e]">
              Clinical Navigator Recommendation
            </div>
            <div className="text-[10px] text-[#786b8f]">
              {selectedPatient ? `Patient-specific guidance for ${selectedPatient.full_name}` : 'Grounded in verified clinical guideline evidence'}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {selectedPatient && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              <User className="w-3 h-3" />
              <span>{selectedPatient.full_name}</span>
            </span>
          )}

          {message.decision && (
            <span
              className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                message.decision === 'accepted'
                  ? 'bg-emerald-100/70 text-emerald-800 border-emerald-200'
                  : message.decision === 'modified'
                  ? 'bg-purple-100/70 text-[#5b21b6] border-purple-200'
                  : 'bg-rose-100/70 text-rose-800 border-rose-200'
              }`}
            >
              {message.decision.toUpperCase()}
            </span>
          )}

          {message.category && (
            <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-purple-100/70 text-[#5b21b6] border border-purple-200/60 font-mono">
              {message.category}
            </span>
          )}
        </div>
      </div>

      {/* Main Body */}
      <div className="flex flex-col gap-4 text-xs sm:text-sm text-[#2a1d3f]">
        
        {/* If modified, show modified decision box */}
        {message.finalDecision && message.decision === 'modified' && (
          <div className="p-4 rounded-2xl bg-purple-50/80 border border-purple-200">
            <h4 className="text-xs font-bold text-[#5b21b6] mb-1 flex items-center gap-1.5">
              <Edit3 className="w-3.5 h-3.5" />
              <span>Clinician-Modified Final Decision</span>
            </h4>
            <div className="text-xs sm:text-sm font-medium text-[#1b122e] leading-relaxed">
              <MarkdownRenderer content={message.finalDecision} />
            </div>
          </div>
        )}

        {/* Original AI Recommendation / Answer with Markdown Rendering */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#5b21b6] mb-2">
            {message.decision === 'modified' ? 'Original AI Guidance' : 'Recommendation & Guidance'}
          </h4>
          <div className="font-medium text-xs sm:text-sm text-[#180e2a] leading-relaxed">
            <MarkdownRenderer content={message.recommendation || message.content} />
          </div>
        </div>

        {/* Why this applies (if provided) */}
        {message.whyThisApplies && message.whyThisApplies.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-white border border-purple-100/70">
            <h4 className="text-xs font-bold text-[#443859] mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#5b21b6]" />
              <span>Patient Context Considerations</span>
            </h4>
            <ul className="space-y-1.5 pl-4 list-disc text-xs text-[#524567]">
              {message.whyThisApplies.map((item, idx) => (
                <li key={idx} className="leading-normal">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Evidence Sources Section */}
        {message.sources && message.sources.length > 0 && (
          <div className="pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#5b21b6] mb-2">
              Retrieved Guideline Evidence ({message.sources.length})
            </h4>
            <div className="flex flex-col gap-2.5">
              {message.sources.map((src, idx) => (
                <EvidenceCard key={src.id || src.guideline_id || idx} source={src} />
              ))}
            </div>
          </div>
        )}

        {/* Clinical Decision Buttons (Only for real healthcare recommendations) */}
        {isHealthcare && (
          <div className="pt-2 border-t border-purple-100/80">
            <DecisionActions
              patientId={selectedPatient?.id}
              question={message.question || ''}
              aiAnswer={message.content}
              category={message.category}
              sources={message.sources}
              initialDecision={message.decision}
              initialRationale={message.decisionRationale}
              initialDecisionId={message.decisionId}
              onDecisionSaved={handleDecisionSaved}
            />
          </div>
        )}

      </div>
    </div>
  );
};
