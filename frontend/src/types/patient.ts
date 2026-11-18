export interface Patient {
  id: string;
  clinician_id: string;
  patient_code: string;
  full_name: string;
  age?: number | null;
  date_of_birth: string | null;
  gender: string | null;
  contact: string | null;
  email?: string | null;
  address: string | null;
  medical_conditions: string[];
  allergies: string[];
  medications: string[];
  medical_history: string | null;
  created_at: string;
  updated_at: string;
}

export interface PatientFormData {
  full_name: string;
  age?: number | string;
  date_of_birth?: string;
  gender?: string;
  contact?: string;
  email?: string;
  address?: string;
  medical_conditions: string[];
  allergies: string[];
  medications: string[];
  medical_history?: string;
}

/**
 * Calculates accurate chronological age from an ISO/date string
 */
export function calculateAge(dob?: string | null): number | null {
  if (!dob) return null;
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age >= 0 ? age : null;
}

/**
 * Formats a timestamp into a human relative time (e.g., '2 hours ago', 'Just now')
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) {
    const mins = Math.floor(diffInSeconds / 60);
    return `${mins} ${mins === 1 ? 'min' : 'mins'} ago`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  }
  const days = Math.floor(diffInSeconds / 86400);
  if (days < 30) {
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  }
  return date.toLocaleDateString();
}
