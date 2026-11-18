import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { AssistantHeader } from '../components/assistant/AssistantHeader';
import { PatientContextCard } from '../components/assistant/PatientContextCard';
import { CategorySelector } from '../components/assistant/CategorySelector';
import { ChatContainer } from '../components/assistant/ChatContainer';
import { PatientSelector } from '../components/assistant/PatientSelector';
import { getPatient } from '../lib/patients';
import { queryClinicalAssistant } from '../lib/assistant';
import { useAuth } from '../context/AuthContext';
import type { Patient } from '../types/patient';
import type { AssistantMessage } from '../types/assistant';

export const AssistantPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const patientIdParam = searchParams.get('patient');

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>(
    () => localStorage.getItem('clinical_nav_default_category') || 'General'
  );
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [patientSelectorOpen, setPatientSelectorOpen] = useState(false);

  // Load patient from URL parameter if present
  useEffect(() => {
    if (patientIdParam) {
      getPatient(patientIdParam).then(({ data }) => {
        if (data) {
          setSelectedPatient(data);
          // Auto-align category if patient has matching condition
          if (data.medical_conditions?.some((c) => c.toLowerCase().includes('diabet'))) {
            setSelectedCategory('Diabetes');
          } else if (data.medical_conditions?.some((c) => c.toLowerCase().includes('hypertens'))) {
            setSelectedCategory('Hypertension');
          }
        }
      });
    }
  }, [patientIdParam]);

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setMessages([]); // Clear previous patient context conversation
    setSearchParams({ patient: patient.id });
    
    // Auto-select category if matching condition exists
    if (patient.medical_conditions?.some((c) => c.toLowerCase().includes('diabet'))) {
      setSelectedCategory('Diabetes');
    } else if (patient.medical_conditions?.some((c) => c.toLowerCase().includes('hypertens'))) {
      setSelectedCategory('Hypertension');
    }
  };

  const handleClearConversation = () => {
    setMessages([]);
  };

  const handleSubmitQuestion = async () => {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || loading) return;

    const userMessage: AssistantMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmedQuestion,
      category: selectedCategory,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setQuestion('');
    setLoading(true);

    try {
      const response = await queryClinicalAssistant({
        question: trimmedQuestion,
        patient_id: selectedPatient?.id || null,
        clinician_id: user?.id || null,
        category: selectedCategory !== 'General' ? selectedCategory : null,
      });

      // Assemble patient contextual tags if patient is active
      const patientNotes: string[] = [];
      if (selectedPatient && response.type === 'healthcare') {
        if (selectedPatient.medical_conditions?.length) {
          patientNotes.push(`Grounding evaluated against diagnosed: ${selectedPatient.medical_conditions.join(', ')}`);
        }
        if (selectedPatient.medications?.length) {
          patientNotes.push(`Active medications reviewed: ${selectedPatient.medications.join(', ')}`);
        }
        if (selectedPatient.allergies?.length) {
          patientNotes.push(`Documented allergies cross-referenced: ${selectedPatient.allergies.join(', ')}`);
        }
      }

      const assistantMessage: AssistantMessage = {
        id: `assist-${Date.now()}`,
        role: 'assistant',
        type: response.type,
        question: trimmedQuestion,
        content: response.answer,
        recommendation: response.answer,
        whyThisApplies: patientNotes.length > 0 ? patientNotes : undefined,
        sources: response.sources,
        category: selectedCategory,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      const errorMessage: AssistantMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        type: 'healthcare',
        content: `Error: ${err.message || 'Unable to retrieve clinical answer from backend service.'}`,
        recommendation: `Communication with the RAG backend failed. Please ensure the FastAPI server is running on http://127.0.0.1:8000 and has valid Groq/Supabase keys configured.`,
        sources: [],
        category: selectedCategory,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleDecisionChange = (
    messageId: string,
    decision: 'accepted' | 'rejected' | 'modified',
    rationale?: string
  ) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, decision, decisionRationale: rationale } : msg
      )
    );
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        
        {/* Header */}
        <AssistantHeader
          selectedPatient={selectedPatient}
          onOpenPatientSelector={() => setPatientSelectorOpen(true)}
          onClearConversation={handleClearConversation}
          hasMessages={messages.length > 0}
        />

        {/* Patient Context Card */}
        <PatientContextCard
          patient={selectedPatient}
          onChangePatient={() => setPatientSelectorOpen(true)}
        />

        {/* Category Selector */}
        <CategorySelector
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        {/* Chat Stream & Input Container */}
        <ChatContainer
          messages={messages}
          question={question}
          onQuestionChange={setQuestion}
          onSubmitQuestion={handleSubmitQuestion}
          onSelectSuggestion={(sugg) => setQuestion(sugg)}
          loading={loading}
          selectedPatient={selectedPatient}
          selectedCategory={selectedCategory}
          onDecisionChange={handleDecisionChange}
        />

        {/* Patient Selector Modal */}
        <PatientSelector
          isOpen={patientSelectorOpen}
          onClose={() => setPatientSelectorOpen(false)}
          onSelectPatient={handleSelectPatient}
          selectedPatientId={selectedPatient?.id}
        />

      </div>
    </AppLayout>
  );
};
