import React, { useRef, useEffect } from 'react';
import type { AssistantMessage } from '../../types/assistant';
import type { Patient } from '../../types/patient';
import { ChatMessage } from './ChatMessage';
import { QuestionSuggestions } from './QuestionSuggestions';
import { QuestionInput } from './QuestionInput';

interface ChatContainerProps {
  messages: AssistantMessage[];
  question: string;
  onQuestionChange: (val: string) => void;
  onSubmitQuestion: () => void;
  onSelectSuggestion: (sugg: string) => void;
  loading: boolean;
  selectedPatient: Patient | null;
  selectedCategory?: string;
  onDecisionChange?: (messageId: string, decision: 'accepted' | 'rejected' | 'modified', rationale?: string) => void;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({
  messages,
  question,
  onQuestionChange,
  onSubmitQuestion,
  onSelectSuggestion,
  loading,
  selectedPatient,
  selectedCategory,
  onDecisionChange,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const patientPrimaryCondition = selectedPatient?.medical_conditions?.[0];

  return (
    <div className="bg-white rounded-3xl border border-purple-100/90 shadow-sm shadow-purple-950/5 flex flex-col h-[650px] p-5 sm:p-7 overflow-hidden">
      
      {/* Scrollable Conversation Stream */}
      <div className="flex-1 overflow-y-auto pr-1">
        {messages.length === 0 ? (
          <QuestionSuggestions
            onSelectSuggestion={onSelectSuggestion}
            category={selectedCategory}
            patientCondition={patientPrimaryCondition}
          />
        ) : (
          <div className="flex flex-col">
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                selectedPatient={selectedPatient}
                onDecisionChange={onDecisionChange}
              />
            ))}
            {loading && (
              <div className="my-4 p-5 rounded-2xl bg-purple-50/50 border border-purple-100 flex items-center gap-3 text-xs text-[#5b21b6] animate-pulse">
                <span className="w-2.5 h-2.5 rounded-full bg-[#5b21b6] animate-ping" />
                <span>Searching guideline evidence and formulating recommendation...</span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input Field Area */}
      <QuestionInput
        value={question}
        onChange={onQuestionChange}
        onSubmit={onSubmitQuestion}
        loading={loading}
        disabled={!selectedPatient}
      />
    </div>
  );
};
