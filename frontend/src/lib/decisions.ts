import { supabase, isSupabaseConfigured } from './supabase';
import { normalizePatient } from './patients';
import type {
  ClinicalDecision,
  CreateClinicalDecisionInput,
  UpdateClinicalDecisionInput,
  DecisionStats,
  DecisionStatus,
} from '../types/decision';

function normalizeDecision(item: any): ClinicalDecision {
  if (!item) return item;
  return {
    ...item,
    patient: item.patient ? normalizePatient(item.patient) : undefined,
  } as ClinicalDecision;
}

const FALLBACK_DECISIONS: ClinicalDecision[] = [
  {
    id: 'dec-001',
    clinician_id: '00000000-0000-0000-0000-000000000001',
    patient_id: '00000000-0000-0000-0000-000000000001',
    question: 'What is the recommended pharmacological treatment for type 2 diabetes?',
    ai_answer: 'First-line pharmacological therapy is standard-release metformin, titrated gradually to minimize gastrointestinal adverse effects. Combine with lifestyle modification and cardiovascular risk assessment.',
    final_decision: 'Approved: Start Metformin 500mg daily with breakfast, titrate to 1000mg BID over 4 weeks.',
    decision_status: 'accepted',
    category: 'Diabetes',
    sources: [
      {
        guideline_id: '00000000-0000-0000-0000-000000000001',
        title: 'NIH Clinical Guidance: Type 2 Diabetes Management',
        organization: 'NIH',
        section: 'Pharmacological Therapies',
        page: 14,
        similarity: 0.88,
        source_url: 'https://www.ncbi.nlm.nih.gov/books/NBK279509/',
        pdf_url: 'https://www.ncbi.nlm.nih.gov/books/NBK279509/pdf/Bookshelf_NBK279509.pdf',
      },
    ],
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    patient: {
      id: '00000000-0000-0000-0000-000000000001',
      full_name: 'Eleanor Vance',
      patient_code: 'P-2026-001',
      gender: 'Female',
      date_of_birth: '1968-04-12',
    },
  },
  {
    id: 'dec-002',
    clinician_id: '00000000-0000-0000-0000-000000000001',
    patient_id: '00000000-0000-0000-0000-000000000002',
    question: 'What is the blood pressure threshold for initiating combination therapy in hypertension?',
    ai_answer: 'In adults with stage 2 hypertension (systolic BP >= 140 mmHg or diastolic BP >= 90 mmHg) and high cardiovascular risk, initiating therapy with two first-line agents of different classes is recommended.',
    final_decision: 'Modified: Initiate Amlodipine 5mg + Losartan 50mg, re-evaluate serum potassium and creatinine in 3 weeks.',
    decision_status: 'modified',
    category: 'Hypertension',
    sources: [
      {
        guideline_id: '00000000-0000-0000-0000-000000000003',
        title: 'WHO Guideline for Pharmacological Treatment of Hypertension',
        organization: 'WHO',
        section: 'Combination Drug Therapies',
        page: 22,
        similarity: 0.84,
        source_url: 'https://www.who.int/publications/i/item/9789240033986',
        pdf_url: 'https://iris.who.int/bitstream/handle/10665/344424/9789240033986-eng.pdf',
      },
    ],
    created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    patient: {
      id: '00000000-0000-0000-0000-000000000002',
      full_name: 'Robert Chen',
      patient_code: 'P-2026-002',
      gender: 'Male',
      date_of_birth: '1960-09-25',
    },
  },
];

function isDemoMode(): boolean {
  return Boolean(localStorage.getItem('clinical_nav_demo_user'));
}

function getLocalDecisions(): ClinicalDecision[] {
  try {
    const raw = localStorage.getItem('clinical_nav_local_decisions');
    if (raw) return JSON.parse(raw);
    localStorage.setItem('clinical_nav_local_decisions', JSON.stringify(FALLBACK_DECISIONS));
    return FALLBACK_DECISIONS;
  } catch {
    return FALLBACK_DECISIONS;
  }
}

function saveLocalDecisions(decisions: ClinicalDecision[]) {
  try {
    localStorage.setItem('clinical_nav_local_decisions', JSON.stringify(decisions));
  } catch {
    // Ignore errors
  }
}

export async function createClinicalDecision(
  input: CreateClinicalDecisionInput
): Promise<{ data: ClinicalDecision | null; error: Error | null }> {
  if (isDemoMode() || !isSupabaseConfigured) {
    const list = getLocalDecisions();
    const newRecord: ClinicalDecision = {
      id: `dec-${Date.now()}`,
      clinician_id: '00000000-0000-0000-0000-000000000001',
      patient_id: input.patient_id,
      question: input.question.trim(),
      ai_answer: input.ai_answer.trim(),
      final_decision: (input.final_decision ?? input.ai_answer).trim(),
      decision_status: input.decision_status,
      category: input.category || null,
      sources: input.sources || [],
      rejection_reason: input.rejection_reason?.trim() || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    saveLocalDecisions([newRecord, ...list]);
    return { data: newRecord, error: null };
  }

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { data: null, error: new Error('Authentication required to record a clinical decision.') };
    }

    if (!input.patient_id) {
      return { data: null, error: new Error('A patient must be selected to record a clinical decision.') };
    }

    const resolvedFinalDecision = input.decision_status === 'rejected'
      ? null
      : (input.final_decision !== undefined && input.final_decision !== null && input.final_decision !== '')
        ? input.final_decision.trim()
        : input.ai_answer.trim();

    const newRecord = {
      clinician_id: user.id,
      patient_id: input.patient_id,
      question: input.question.trim(),
      ai_answer: input.ai_answer.trim(),
      final_decision: resolvedFinalDecision,
      decision_status: input.decision_status,
      category: input.category || null,
      sources: input.sources || [],
      rejection_reason: input.rejection_reason?.trim() || null,
    };

    const { data, error } = await supabase
      .from('clinical_decisions')
      .insert(newRecord)
      .select('*, patient:patients(*)')
      .single();

    if (error) {
      console.warn('Falling back to local decision saving:', error.message);
      const list = getLocalDecisions();
      const localRecord: ClinicalDecision = {
        id: `dec-${Date.now()}`,
        clinician_id: user.id,
        patient_id: input.patient_id,
        question: input.question.trim(),
        ai_answer: input.ai_answer.trim(),
        final_decision: resolvedFinalDecision,
        decision_status: input.decision_status,
        category: input.category || null,
        sources: input.sources || [],
        rejection_reason: input.rejection_reason?.trim() || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      saveLocalDecisions([localRecord, ...list]);
      return { data: localRecord, error: null };
    }

    return { data: normalizeDecision(data), error: null };
  } catch {
    const list = getLocalDecisions();
    const resolvedFinalDecision = input.decision_status === 'rejected'
      ? null
      : (input.final_decision !== undefined && input.final_decision !== null && input.final_decision !== '')
        ? input.final_decision.trim()
        : input.ai_answer.trim();

    const localRecord: ClinicalDecision = {
      id: `dec-${Date.now()}`,
      clinician_id: '00000000-0000-0000-0000-000000000001',
      patient_id: input.patient_id,
      question: input.question.trim(),
      ai_answer: input.ai_answer.trim(),
      final_decision: resolvedFinalDecision,
      decision_status: input.decision_status,
      category: input.category || null,
      sources: input.sources || [],
      rejection_reason: input.rejection_reason?.trim() || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    saveLocalDecisions([localRecord, ...list]);
    return { data: localRecord, error: null };
  }
}

export async function getPatientDecisions(
  patientId: string
): Promise<{ data: ClinicalDecision[]; error: Error | null }> {
  if (isDemoMode() || !isSupabaseConfigured || !patientId) {
    const list = getLocalDecisions().filter((d) => d.patient_id === patientId);
    return { data: list, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('clinical_decisions')
      .select('*, patient:patients(*)')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      const list = getLocalDecisions().filter((d) => d.patient_id === patientId);
      return { data: list, error: null };
    }

    return { data: (data || []).map(normalizeDecision), error: null };
  } catch {
    const list = getLocalDecisions().filter((d) => d.patient_id === patientId);
    return { data: list, error: null };
  }
}

export async function getRecentDecisions(
  limit: number = 20,
  status?: DecisionStatus
): Promise<{ data: ClinicalDecision[]; error: Error | null }> {
  if (isDemoMode() || !isSupabaseConfigured) {
    let list = getLocalDecisions();
    if (status) {
      list = list.filter((d) => d.decision_status === status);
    }
    return { data: list.slice(0, limit), error: null };
  }

  try {
    let query = supabase
      .from('clinical_decisions')
      .select('*, patient:patients(*)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('decision_status', status);
    }

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      let list = getLocalDecisions();
      if (status) {
        list = list.filter((d) => d.decision_status === status);
      }
      return { data: list.slice(0, limit), error: null };
    }

    return { data: (data || []).map(normalizeDecision), error: null };
  } catch {
    let list = getLocalDecisions();
    if (status) {
      list = list.filter((d) => d.decision_status === status);
    }
    return { data: list.slice(0, limit), error: null };
  }
}

export async function getDecisionStats(): Promise<DecisionStats> {
  const computeStats = (items: ClinicalDecision[]): DecisionStats => {
    let accepted = 0;
    let modified = 0;
    let rejected = 0;
    for (const item of items) {
      if (item.decision_status === 'accepted') accepted++;
      else if (item.decision_status === 'modified') modified++;
      else if (item.decision_status === 'rejected') rejected++;
    }
    return { total: items.length, accepted, modified, rejected };
  };

  if (isDemoMode() || !isSupabaseConfigured) {
    return computeStats(getLocalDecisions());
  }

  try {
    const { data, error } = await supabase
      .from('clinical_decisions')
      .select('decision_status');

    if (error || !data || data.length === 0) {
      return computeStats(getLocalDecisions());
    }

    let accepted = 0;
    let modified = 0;
    let rejected = 0;

    for (const item of data) {
      if (item.decision_status === 'accepted') accepted++;
      else if (item.decision_status === 'modified') modified++;
      else if (item.decision_status === 'rejected') rejected++;
    }

    return {
      total: data.length,
      accepted,
      modified,
      rejected,
    };
  } catch {
    return computeStats(getLocalDecisions());
  }
}

export async function getDecisionById(
  id: string
): Promise<{ data: ClinicalDecision | null; error: Error | null }> {
  if (isDemoMode() || !isSupabaseConfigured || !id) {
    return { data: getLocalDecisions().find((d) => d.id === id) || null, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('clinical_decisions')
      .select('*, patient:patients(*)')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) {
      return { data: getLocalDecisions().find((d) => d.id === id) || null, error: null };
    }

    return { data: normalizeDecision(data), error: null };
  } catch {
    return { data: getLocalDecisions().find((d) => d.id === id) || null, error: null };
  }
}

export async function updateClinicalDecision(
  id: string,
  input: UpdateClinicalDecisionInput
): Promise<{ data: ClinicalDecision | null; error: Error | null }> {
  if (!isSupabaseConfigured) {
    return { data: null, error: new Error('Supabase is not configured.') };
  }

  try {
    const updatePayload: Record<string, any> = {};
    if (input.final_decision !== undefined) updatePayload.final_decision = input.final_decision;
    if (input.decision_status !== undefined) updatePayload.decision_status = input.decision_status;
    if (input.rejection_reason !== undefined) updatePayload.rejection_reason = input.rejection_reason;
    if (input.category !== undefined) updatePayload.category = input.category;

    const { data, error } = await supabase
      .from('clinical_decisions')
      .update(updatePayload)
      .eq('id', id)
      .select('*, patient:patients(*)')
      .single();

    if (error) {
      console.error('Error updating decision:', error);
      return { data: null, error: new Error(error.message || 'Failed to update decision.') };
    }

    return { data: normalizeDecision(data), error: null };
  } catch (err) {
    console.error('Unexpected error in updateClinicalDecision:', err);
    return { data: null, error: new Error('Unable to update decision.') };
  }
}

export async function deleteClinicalDecision(
  id: string
): Promise<{ success: boolean; error: Error | null }> {
  if (!isSupabaseConfigured) {
    return { success: false, error: new Error('Supabase is not configured.') };
  }

  try {
    const { error } = await supabase
      .from('clinical_decisions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting decision:', error);
      return { success: false, error: new Error(error.message || 'Failed to delete decision.') };
    }

    return { success: true, error: null };
  } catch (err) {
    console.error('Unexpected error in deleteClinicalDecision:', err);
    return { success: false, error: new Error('Unable to delete decision.') };
  }
}
