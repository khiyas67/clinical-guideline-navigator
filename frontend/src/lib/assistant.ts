import type { Source } from '../types/assistant';

export interface AssistantQueryRequest {
  patient_id?: string | null;
  clinician_id?: string | null;
  question: string;
  category?: string | null;
}

export interface AssistantQueryResponse {
  type: 'greeting' | 'healthcare' | 'out_of_scope' | 'unclear';
  answer: string;
  sources: Source[];
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';

export async function queryClinicalAssistant(
  payload: AssistantQueryRequest
): Promise<AssistantQueryResponse> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/assistant/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        patient_id: payload.patient_id || null,
        clinician_id: payload.clinician_id || null,
        question: payload.question.trim(),
        category: payload.category || null,
      }),
    });

    if (!response.ok) {
      const errorJson = await response.json().catch(() => null);
      const detail = errorJson?.detail || `Backend returned status ${response.status}`;
      throw new Error(detail);
    }

    const data: AssistantQueryResponse = await response.json();
    return data;
  } catch (err: any) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error(
        'Unable to connect to the FastAPI clinical backend (http://127.0.0.1:8000). Please ensure the backend server is running.'
      );
    }
    throw err;
  }
}
