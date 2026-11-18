export interface ClinicalSuggestionCategory {
  category: string;
  suggestions: string[];
}

export const CLINICAL_SUGGESTIONS: Record<string, string[]> = {
  General: [
    'What does the current guideline recommend?',
    'What should be considered when managing this condition?',
    'What are the recommended treatment options?',
    'Are there important contraindications to consider?',
  ],
  Diabetes: [
    'What are the recommended first-line treatment options for diabetes?',
    'What HbA1c targets should be considered?',
    'When should treatment be intensified for diabetes?',
    'What monitoring is recommended for patients with diabetes?',
  ],
  Cardiovascular: [
    'What are the recommended approaches for cardiovascular risk reduction?',
    'What medications are recommended for cardiovascular prevention?',
    'What factors should be considered when managing cardiovascular risk?',
    'What monitoring is recommended for cardiovascular conditions?',
  ],
  Hypertension: [
    'At what blood pressure threshold should treatment be started?',
    'What are the recommended first-line medications for hypertension?',
    'When should combination therapy be considered?',
    'What blood pressure target should be considered?',
  ],
  'Infectious Disease': [
    'What diagnostic approach is recommended for this infection?',
    'What are the recommended first-line treatment options?',
    'What treatment duration is recommended?',
    'When should treatment be escalated or changed?',
  ],
  Medications: [
    'What are the recommended dosing considerations?',
    'What contraindications should be considered?',
    'Are there important drug interactions to consider?',
    'What monitoring is recommended for this medication?',
  ],
  Diagnosis: [
    'What diagnostic criteria should be considered?',
    'What investigations are recommended?',
    'What findings support this diagnosis?',
    'What differential diagnoses should be considered?',
  ],
  Treatment: [
    'What are the recommended first-line treatment options?',
    'When should treatment be escalated?',
    'What alternative treatment options should be considered?',
    'What monitoring is recommended during treatment?',
  ],
  Other: [
    'What does the current guideline recommend?',
    'What are the key considerations for this condition?',
    'What treatment options are recommended?',
    'Are there important precautions or contraindications?',
  ],
};

/**
 * Get clinical question suggestions for a specific category.
 * Falls back to General suggestions if category is not recognized.
 */
export function getClinicalSuggestions(category?: string): string[] {
  if (!category) return CLINICAL_SUGGESTIONS.General;
  
  // Direct match
  if (CLINICAL_SUGGESTIONS[category]) {
    return CLINICAL_SUGGESTIONS[category];
  }

  // Case-insensitive fallback lookup
  const normalized = category.trim().toLowerCase();
  const matchedKey = Object.keys(CLINICAL_SUGGESTIONS).find(
    (key) => key.toLowerCase() === normalized
  );

  return matchedKey ? CLINICAL_SUGGESTIONS[matchedKey] : CLINICAL_SUGGESTIONS.General;
}
