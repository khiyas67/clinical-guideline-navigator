import type { Source } from './assistant';
import type { Patient } from './patient';

export type DecisionStatus = 'accepted' | 'rejected' | 'modified';

export interface ClinicalDecision {
  id: string;
  clinician_id: string;
  patient_id: string;
  question: string;
  ai_answer: string;
  final_decision: string | null;
  decision_status: DecisionStatus;
  category: string | null;
  sources: Source[];
  rejection_reason?: string | null;
  created_at: string;
  updated_at: string;
  // Joined patient metadata (if fetched via relation)
  patient?: Pick<Patient, 'id' | 'full_name' | 'patient_code' | 'gender' | 'date_of_birth'>;
}

export interface CreateClinicalDecisionInput {
  patient_id: string;
  question: string;
  ai_answer: string;
  final_decision?: string | null;
  decision_status: DecisionStatus;
  category?: string | null;
  sources?: Source[];
  rejection_reason?: string | null;
}

export interface UpdateClinicalDecisionInput {
  final_decision?: string | null;
  decision_status?: DecisionStatus;
  rejection_reason?: string | null;
  category?: string | null;
}

export interface DecisionStats {
  total: number;
  accepted: number;
  modified: number;
  rejected: number;
}
