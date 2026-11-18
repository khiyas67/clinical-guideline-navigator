import { supabase, isSupabaseConfigured } from './supabase';
import type { Patient, PatientFormData } from '../types/patient';
import { validateEmail, validateIndianPhoneNumber, validatePatientName, validatePatientAge } from './validation';

const FALLBACK_PATIENTS: Patient[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    clinician_id: '00000000-0000-0000-0000-000000000001',
    patient_code: 'P-2026-001',
    full_name: 'Eleanor Vance',
    date_of_birth: '1968-04-12',
    gender: 'Female',
    contact: '+1 (555) 234-5678',
    address: '142 Elm Street, Seattle, WA',
    medical_conditions: ['Type 2 Diabetes', 'Hypertension'],
    allergies: ['Penicillin'],
    medications: ['Metformin 1000mg BID', 'Lisinopril 10mg daily'],
    medical_history: 'Diagnosed with type 2 diabetes 5 years ago. Mild retinopathy noted at last review. Low sodium diet.',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    clinician_id: '00000000-0000-0000-0000-000000000001',
    patient_code: 'P-2026-002',
    full_name: 'Robert Chen',
    date_of_birth: '1960-09-25',
    gender: 'Male',
    contact: '+1 (555) 876-5432',
    address: '784 Pine Avenue, Boston, MA',
    medical_conditions: ['Hypertension Stage 2', 'Chronic Kidney Disease Stage 3a'],
    allergies: ['Sulfa drugs'],
    medications: ['Amlodipine 10mg daily', 'Losartan 50mg daily'],
    medical_history: 'Hypertension uncontrolled for 3 years prior to stabilization. eGFR 54 mL/min/1.73m2.',
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    clinician_id: '00000000-0000-0000-0000-000000000001',
    patient_code: 'P-2026-003',
    full_name: 'Maria Santos',
    date_of_birth: '1981-11-03',
    gender: 'Female',
    contact: '+1 (555) 345-6789',
    address: '512 Oak Boulevard, Austin, TX',
    medical_conditions: ['Moderate Persistent Asthma', 'Seasonal Allergic Rhinitis'],
    allergies: ['Aspirin', 'NSAIDs'],
    medications: ['Fluticasone/Salmeterol 250/50 mcg DPI', 'Albuterol HFA as needed'],
    medical_history: 'Asthma since childhood. Hospitalized once in 2021 for severe exacerbation.',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000004',
    clinician_id: '00000000-0000-0000-0000-000000000001',
    patient_code: 'P-2026-004',
    full_name: 'James Wilson',
    date_of_birth: '1955-06-18',
    gender: 'Male',
    contact: '+1 (555) 901-2345',
    address: '920 Maple Ridge, Denver, CO',
    medical_conditions: ['Coronary Artery Disease', 'Type 2 Diabetes', 'Dyslipidemia'],
    allergies: ['Latex'],
    medications: ['Atorvastatin 40mg daily', 'Metformin 850mg BID', 'Aspirin 81mg daily'],
    medical_history: 'Status post PCI with drug-eluting stent to LAD in 2023. Cardiac rehabilitation completed. HbA1c 7.2%.',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
];

function isDemoMode(): boolean {
  return Boolean(localStorage.getItem('clinical_nav_demo_user'));
}

function getLocalPatients(): Patient[] {
  try {
    const raw = localStorage.getItem('clinical_nav_local_patients');
    if (raw) return JSON.parse(raw);
    localStorage.setItem('clinical_nav_local_patients', JSON.stringify(FALLBACK_PATIENTS));
    return FALLBACK_PATIENTS;
  } catch {
    return FALLBACK_PATIENTS;
  }
}

function saveLocalPatients(patients: Patient[]) {
  try {
    localStorage.setItem('clinical_nav_local_patients', JSON.stringify(patients));
  } catch {
    // Ignore storage errors
  }
}

export function toDbGender(g?: string | null): 'M' | 'F' | 'Other' {
  if (!g) return 'Other';
  const lower = g.trim().toLowerCase();
  if (lower.startsWith('m')) return 'M';
  if (lower.startsWith('f')) return 'F';
  return 'Other';
}

export function calculateAgeFromDob(dob?: string | null): number {
  if (!dob) return 45;
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return 45;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 0 ? age : 45;
}

export function normalizePatient(p: any): Patient {
  if (!p) return p;
  const fullName = p.full_name || p.name || 'Unknown Patient';
  const patientCode = p.patient_code || p.patient_id || 'PT-000';
  const conditions = Array.isArray(p.medical_conditions) && p.medical_conditions.length
    ? p.medical_conditions
    : (p.primary_condition ? [p.primary_condition] : []);
  const history = p.medical_history || p.clinical_notes || null;
  const allergies = Array.isArray(p.allergies) ? p.allergies : [];
  const medications = Array.isArray(p.medications) ? p.medications : [];
  const gender = p.gender === 'M' ? 'Male' : p.gender === 'F' ? 'Female' : p.gender || null;
  const email = p.email || (p.clinical_notes?.match(/Email:\s*([^\n\r]+)/)?.[1]?.trim()) || null;
  const rawAge = p.age !== undefined && p.age !== null ? p.age : calculateAgeFromDob(p.date_of_birth);
  const computedAge: number | null = rawAge !== null && rawAge !== undefined
    ? (typeof rawAge === 'string' ? parseInt(rawAge, 10) || null : Number(rawAge))
    : null;

  return {
    id: p.id,
    clinician_id: p.clinician_id || p.created_by || '',
    patient_code: patientCode,
    full_name: fullName,
    age: computedAge,
    date_of_birth: p.date_of_birth || null,
    gender: gender,
    contact: p.contact || null,
    email: email,
    address: p.address || null,
    medical_conditions: conditions,
    allergies: allergies,
    medications: medications,
    medical_history: history,
    created_at: p.created_at || new Date().toISOString(),
    updated_at: p.updated_at || p.created_at || new Date().toISOString(),
  } as Patient;
}

export async function getPatients(): Promise<{ data: Patient[]; error: Error | null }> {
  if (isDemoMode()) {
    return { data: getLocalPatients().map(normalizePatient), error: null };
  }

  if (!isSupabaseConfigured) {
    return { data: getLocalPatients().map(normalizePatient), error: null };
  }

  try {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Falling back to local patients:', error.message);
      return { data: getLocalPatients().map(normalizePatient), error: null };
    }

    return { data: (data || []).map(normalizePatient), error: null };
  } catch {
    return { data: getLocalPatients().map(normalizePatient), error: null };
  }
}

export async function getPatient(id: string): Promise<{ data: Patient | null; error: Error | null }> {
  if (isDemoMode()) {
    const local = getLocalPatients().map(normalizePatient);
    return { data: local.find((p) => p.id === id) || null, error: null };
  }

  if (!isSupabaseConfigured) {
    const local = getLocalPatients().map(normalizePatient);
    return { data: local.find((p) => p.id === id) || null, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      const local = getLocalPatients().map(normalizePatient);
      return { data: local.find((p) => p.id === id) || null, error: null };
    }

    return { data: data ? normalizePatient(data) : null, error: null };
  } catch {
    const local = getLocalPatients().map(normalizePatient);
    return { data: local.find((p) => p.id === id) || null, error: null };
  }
}

export async function createPatient(
  formData: PatientFormData
): Promise<{ data: Patient | null; error: Error | null }> {
  // 1. Strict Validation
  const nameCheck = validatePatientName(formData.full_name);
  if (!nameCheck.isValid) {
    return { data: null, error: new Error(nameCheck.error) };
  }

  const ageInput = formData.age !== undefined && formData.age !== ''
    ? formData.age
    : calculateAgeFromDob(formData.date_of_birth);
  const ageCheck = validatePatientAge(ageInput);
  if (!ageCheck.isValid) {
    return { data: null, error: new Error(ageCheck.error) };
  }

  const phoneCheck = validateIndianPhoneNumber(formData.contact, { required: false });
  if (!phoneCheck.isValid) {
    return { data: null, error: new Error(phoneCheck.error) };
  }

  const emailCheck = validateEmail(formData.email, { required: false });
  if (!emailCheck.isValid) {
    return { data: null, error: new Error(emailCheck.error) };
  }

  const normName = nameCheck.normalized!;
  const normAge = ageCheck.normalized!;
  const normPhone = phoneCheck.normalized || null;
  const normEmail = emailCheck.normalized || null;

  if (isDemoMode() || !isSupabaseConfigured) {
    const list = getLocalPatients();
    const currentYear = new Date().getFullYear();
    const newRecord: Patient = {
      id: `p-demo-${Date.now()}`,
      clinician_id: '00000000-0000-0000-0000-000000000001',
      patient_code: `P-${currentYear}-${String(list.length + 1).padStart(3, '0')}`,
      full_name: normName,
      age: normAge,
      date_of_birth: formData.date_of_birth || null,
      gender: formData.gender || null,
      contact: normPhone,
      email: normEmail,
      address: formData.address?.trim() || null,
      medical_conditions: formData.medical_conditions || [],
      allergies: formData.allergies || [],
      medications: formData.medications || [],
      medical_history: formData.medical_history?.trim() || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    saveLocalPatients([newRecord, ...list]);
    return { data: newRecord, error: null };
  }

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: null, error: new Error('Authentication required to create a patient.') };
    }

    const currentYear = new Date().getFullYear();
    const { count } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true });
    
    const fallbackCode = `P-${currentYear}-${String((count || 0) + 1).padStart(3, '0')}`;

    const clinicalNotesList = [
      formData.medical_history?.trim(),
      formData.allergies?.length ? `Allergies: ${formData.allergies.join(', ')}` : '',
      formData.medications?.length ? `Medications: ${formData.medications.join(', ')}` : '',
      normPhone ? `Contact: ${normPhone}` : '',
      normEmail ? `Email: ${normEmail}` : '',
      formData.address?.trim() ? `Address: ${formData.address.trim()}` : '',
    ].filter(Boolean).join('\n') || 'None recorded';

    // Payload matching both legacy and modern table columns for seamless compatibility
    const dbRecord: Record<string, any> = {
      // Legacy columns
      patient_id: fallbackCode,
      name: normName,
      age: normAge,
      gender: toDbGender(formData.gender),
      primary_condition: formData.medical_conditions?.[0] || 'General Health',
      status: 'Active',
      clinical_notes: clinicalNotesList,
      created_by: user.id,

      // Modern columns
      clinician_id: user.id,
      patient_code: fallbackCode,
      full_name: normName,
      date_of_birth: formData.date_of_birth || null,
      contact: normPhone,
      address: formData.address?.trim() || null,
      medical_conditions: formData.medical_conditions || [],
      allergies: formData.allergies || [],
      medications: formData.medications || [],
      medical_history: formData.medical_history?.trim() || null,
    };

    // email column confirmed present (migration 006 applied)
    dbRecord.email = normEmail || null;

    let { data, error } = await supabase
      .from('patients')
      .insert(dbRecord)
      .select()
      .single();

    if (error && error.message?.includes('column')) {
      // Fallback: try legacy-only schema in case modern columns were omitted
      const legacyRecord = {
        patient_id: fallbackCode,
        name: normName,
        age: normAge,
        gender: toDbGender(formData.gender),
        primary_condition: formData.medical_conditions?.[0] || 'General Health',
        status: 'Active',
        clinical_notes: clinicalNotesList,
        created_by: user.id,
      };

      const res2 = await supabase
        .from('patients')
        .insert(legacyRecord)
        .select()
        .single();
      data = res2.data;
      error = res2.error;
    }

    if (error) {
      console.error('Error creating patient:', error);
      return { data: null, error: new Error(error.message || 'Failed to save patient.') };
    }

    const normalized = normalizePatient(data);
    if (!normalized.email && normEmail) {
      normalized.email = normEmail;
    }
    return { data: normalized, error: null };
  } catch (err) {
    console.error('Unexpected error in createPatient:', err);
    return { data: null, error: new Error('An unexpected error occurred while saving patient.') };
  }
}

export async function updatePatient(
  id: string,
  formData: Partial<PatientFormData>
): Promise<{ data: Patient | null; error: Error | null }> {
  if (isDemoMode() || !isSupabaseConfigured) {
    const list = getLocalPatients();
    const idx = list.findIndex((p) => p.id === id);
    if (idx === -1) return { data: null, error: new Error('Patient not found.') };
    const updated: Patient = {
      ...list[idx],
      ...formData,
      age: formData.age !== undefined && formData.age !== null
        ? (typeof formData.age === 'string' ? parseInt(formData.age, 10) || null : formData.age)
        : list[idx].age,
      updated_at: new Date().toISOString(),
    };
    list[idx] = updated;
    saveLocalPatients(list);
    return { data: updated, error: null };
  }

  try {
    const dbUpdatePayload: Record<string, any> = {};
    if (formData.full_name !== undefined) {
      dbUpdatePayload.name = formData.full_name.trim();
      dbUpdatePayload.full_name = formData.full_name.trim();
    }
    if (formData.date_of_birth !== undefined) {
      dbUpdatePayload.age = calculateAgeFromDob(formData.date_of_birth);
      dbUpdatePayload.date_of_birth = formData.date_of_birth || null;
    }
    if (formData.gender !== undefined) {
      dbUpdatePayload.gender = toDbGender(formData.gender);
    }
    if (formData.medical_conditions !== undefined) {
      dbUpdatePayload.primary_condition = formData.medical_conditions[0] || 'General Health';
      dbUpdatePayload.medical_conditions = formData.medical_conditions;
    }
    if (formData.medical_history !== undefined) {
      dbUpdatePayload.clinical_notes = formData.medical_history.trim();
      dbUpdatePayload.medical_history = formData.medical_history.trim();
    }
    if (formData.contact !== undefined) {
      dbUpdatePayload.contact = formData.contact?.trim() || null;
    }
    if (formData.address !== undefined) {
      dbUpdatePayload.address = formData.address?.trim() || null;
    }
    if (formData.allergies !== undefined) {
      dbUpdatePayload.allergies = formData.allergies;
    }
    if (formData.medications !== undefined) {
      dbUpdatePayload.medications = formData.medications;
    }

    let { data, error } = await supabase
      .from('patients')
      .update(dbUpdatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error && error.message?.includes('column')) {
      // Fallback: try legacy-only update payload
      const legacyPayload: Record<string, any> = {};
      if (formData.full_name !== undefined) legacyPayload.name = formData.full_name.trim();
      if (formData.date_of_birth !== undefined) legacyPayload.age = calculateAgeFromDob(formData.date_of_birth);
      if (formData.gender !== undefined) legacyPayload.gender = toDbGender(formData.gender);
      if (formData.medical_conditions !== undefined) legacyPayload.primary_condition = formData.medical_conditions[0] || 'General Health';
      if (formData.medical_history !== undefined) legacyPayload.clinical_notes = formData.medical_history.trim();

      const res2 = await supabase
        .from('patients')
        .update(legacyPayload)
        .eq('id', id)
        .select()
        .single();
      data = res2.data;
      error = res2.error;
    }

    if (error) {
      console.error('Error updating patient:', error);
      return { data: null, error: new Error(error.message || 'Failed to update patient.') };
    }

    return { data: normalizePatient(data), error: null };
  } catch (err) {
    console.error('Unexpected error in updatePatient:', err);
    return { data: null, error: new Error('An unexpected error occurred while updating patient.') };
  }
}

export async function deletePatient(id: string): Promise<{ success: boolean; error: Error | null }> {
  if (isDemoMode() || !isSupabaseConfigured) {
    const list = getLocalPatients().filter((p) => p.id !== id);
    saveLocalPatients(list);
    return { success: true, error: null };
  }

  try {
    const { error } = await supabase
      .from('patients')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting patient:', error);
      return { success: false, error: new Error(error.message || 'Failed to delete patient.') };
    }

    return { success: true, error: null };
  } catch (err) {
    console.error('Unexpected error in deletePatient:', err);
    return { success: false, error: new Error('An unexpected error occurred while deleting patient.') };
  }
}

export async function getPatientCount(): Promise<number> {
  if (isDemoMode() || !isSupabaseConfigured) {
    return getLocalPatients().length;
  }

  try {
    const { count, error } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true });

    if (error) return getLocalPatients().length;
    return count || getLocalPatients().length;
  } catch {
    return getLocalPatients().length;
  }
}
