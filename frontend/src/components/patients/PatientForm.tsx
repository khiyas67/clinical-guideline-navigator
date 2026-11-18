import React, { useState } from 'react';
import { X, Plus, AlertCircle, Loader2 } from 'lucide-react';
import type { PatientFormData, Patient } from '../../types/patient';
import {
  validatePatientName,
  validatePatientAge,
  validateIndianPhoneNumber,
  validateEmail,
} from '../../lib/validation';

interface PatientFormProps {
  initialData?: Patient | null;
  onSubmit: (formData: PatientFormData) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}

export const PatientForm: React.FC<PatientFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  loading,
}) => {
  const [fullName, setFullName] = useState(initialData?.full_name || '');
  const [age, setAge] = useState<string>(
    initialData?.age !== undefined && initialData?.age !== null ? String(initialData.age) : ''
  );
  const [dob, setDob] = useState(initialData?.date_of_birth || '');
  const [gender, setGender] = useState(initialData?.gender || 'Male');
  const [contact, setContact] = useState(initialData?.contact || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [address, setAddress] = useState(initialData?.address || '');
  const [medicalHistory, setMedicalHistory] = useState(initialData?.medical_history || '');

  // Tag list states
  const [conditions, setConditions] = useState<string[]>(initialData?.medical_conditions || []);
  const [newCondition, setNewCondition] = useState('');

  const [allergies, setAllergies] = useState<string[]>(initialData?.allergies || []);
  const [newAllergy, setNewAllergy] = useState('');

  const [medications, setMedications] = useState<string[]>(initialData?.medications || []);
  const [newMedication, setNewMedication] = useState('');

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearFieldError = (field: string) => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // Helper for adding tags
  const handleAddTag = (
    item: string,
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    setInput: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const trimmed = item.trim();
    if (!trimmed) return;
    if (!list.includes(trimmed)) {
      setList([...list, trimmed]);
    }
    setInput('');
  };

  const handleRemoveTag = (
    tagToRemove: string,
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setList(list.filter((t) => t !== tagToRemove));
  };

  // Synchronize DOB with Age if DOB selected
  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDob = e.target.value;
    setDob(newDob);
    clearFieldError('dob');

    if (newDob) {
      const birthDate = new Date(newDob);
      const today = new Date();
      if (!isNaN(birthDate.getTime()) && birthDate <= today) {
        let calcAge = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          calcAge--;
        }
        if (calcAge >= 1 && calcAge <= 125) {
          setAge(String(calcAge));
          clearFieldError('age');
        }
      }
    }
  };

  // Synchronize Age with approximate DOB year if DOB is empty
  const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAge = e.target.value;
    setAge(newAge);
    clearFieldError('age');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || isSubmitting) return;

    setFieldErrors({});
    setGeneralError(null);

    const errors: Record<string, string> = {};

    // 1. Full Name Validation
    const nameResult = validatePatientName(fullName);
    if (!nameResult.isValid) {
      errors.fullName = nameResult.error || 'Please enter a valid patient full name.';
    }

    // 2. Age Validation
    const ageResult = validatePatientAge(age);
    if (!ageResult.isValid) {
      errors.age = ageResult.error || 'Please enter a valid numeric age (1-125).';
    }

    // 3. Date of Birth Validation (if provided)
    if (dob) {
      const selectedDate = new Date(dob);
      const today = new Date();
      if (isNaN(selectedDate.getTime())) {
        errors.dob = 'Please select a valid date of birth.';
      } else if (selectedDate > today) {
        errors.dob = 'Date of birth cannot be in the future.';
      }
    }

    // 4. Contact Number Validation (Indian Mobile)
    const phoneResult = validateIndianPhoneNumber(contact, { required: false });
    if (!phoneResult.isValid) {
      errors.contact = phoneResult.error || 'Please enter a valid 10-digit Indian mobile number.';
    }

    // 5. Email Address Validation (Optional, but strict if provided)
    const emailResult = validateEmail(email, { required: false });
    if (!emailResult.isValid) {
      errors.email = emailResult.error || 'Please enter a valid email address.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setGeneralError('Please correct the highlighted validation errors before saving.');
      return;
    }

    const payload: PatientFormData = {
      full_name: nameResult.normalized!,
      age: ageResult.normalized!,
      date_of_birth: dob || undefined,
      gender: gender || undefined,
      contact: phoneResult.normalized || undefined,
      email: emailResult.normalized || undefined,
      address: address.trim() || undefined,
      medical_conditions: conditions,
      allergies: allergies,
      medications: medications,
      medical_history: medicalHistory.trim() || undefined,
    };

    setIsSubmitting(true);
    try {
      await onSubmit(payload);
    } catch (err: any) {
      setGeneralError(err?.message || 'Failed to save patient. Please check the information and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSaving = loading || isSubmitting;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
      {/* General Validation Error Banner */}
      {generalError && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{generalError}</span>
        </div>
      )}

      {/* Row 1: Full Name & Age */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-[#2a1e3f] mb-1">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Aarav Sharma"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              clearFieldError('fullName');
            }}
            disabled={isSaving}
            className={`w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border transition-all ${
              fieldErrors.fullName
                ? 'border-red-400 bg-red-50/20 focus:border-red-500 focus:ring-2 focus:ring-red-400/20'
                : 'border-purple-200 bg-[#fdfcff] focus:bg-white focus:border-[#6d28d9] focus:outline-none focus:ring-2 focus:ring-purple-300/30'
            }`}
          />
          {fieldErrors.fullName && (
            <span className="text-[11px] text-red-600 font-medium block mt-1 animate-in fade-in duration-150">
              {fieldErrors.fullName}
            </span>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-[#2a1e3f] mb-1">
            Age (Years) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min={1}
            max={125}
            placeholder="e.g. 54"
            value={age}
            onChange={handleAgeChange}
            disabled={isSaving}
            className={`w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border transition-all ${
              fieldErrors.age
                ? 'border-red-400 bg-red-50/20 focus:border-red-500 focus:ring-2 focus:ring-red-400/20'
                : 'border-purple-200 bg-[#fdfcff] focus:bg-white focus:border-[#6d28d9] focus:outline-none focus:ring-2 focus:ring-purple-300/30'
            }`}
          />
          {fieldErrors.age && (
            <span className="text-[11px] text-red-600 font-medium block mt-1 animate-in fade-in duration-150">
              {fieldErrors.age}
            </span>
          )}
        </div>
      </div>

      {/* Row 2: Date of Birth & Gender */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label className="block text-xs font-bold text-[#2a1e3f] mb-1">
            Date of Birth <span className="text-gray-400 font-normal">(Optional)</span>
          </label>
          <input
            type="date"
            value={dob}
            onChange={handleDobChange}
            disabled={isSaving}
            className={`w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border transition-all text-[#2a1e3f] ${
              fieldErrors.dob
                ? 'border-red-400 bg-red-50/20 focus:border-red-500 focus:ring-2 focus:ring-red-400/20'
                : 'border-purple-200 bg-[#fdfcff] focus:bg-white focus:border-[#6d28d9] focus:outline-none focus:ring-2 focus:ring-purple-300/30'
            }`}
          />
          {fieldErrors.dob && (
            <span className="text-[11px] text-red-600 font-medium block mt-1 animate-in fade-in duration-150">
              {fieldErrors.dob}
            </span>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-[#2a1e3f] mb-1">
            Gender
          </label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            disabled={isSaving}
            className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-purple-200 bg-[#fdfcff] focus:bg-white focus:border-[#6d28d9] focus:outline-none focus:ring-2 focus:ring-purple-300/30 transition-all text-[#2a1e3f]"
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
            <option value="Prefer not to say">Prefer not to say</option>
          </select>
        </div>
      </div>

      {/* Row 3: Contact Number (India) & Email Address as SEPARATE Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label className="block text-xs font-bold text-[#2a1e3f] mb-1">
            Contact Number <span className="text-gray-400 font-normal">(India Mobile)</span>
          </label>
          <input
            type="tel"
            placeholder="e.g. +91 98765 43210 or 9876543210"
            value={contact}
            onChange={(e) => {
              setContact(e.target.value);
              clearFieldError('contact');
            }}
            disabled={isSaving}
            className={`w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border transition-all ${
              fieldErrors.contact
                ? 'border-red-400 bg-red-50/20 focus:border-red-500 focus:ring-2 focus:ring-red-400/20'
                : 'border-purple-200 bg-[#fdfcff] focus:bg-white focus:border-[#6d28d9] focus:outline-none focus:ring-2 focus:ring-purple-300/30'
            }`}
          />
          {fieldErrors.contact ? (
            <span className="text-[11px] text-red-600 font-medium block mt-1 animate-in fade-in duration-150">
              {fieldErrors.contact}
            </span>
          ) : (
            <span className="text-[10px] text-[#7d7192] block mt-0.5">
              10-digit Indian mobile number (6, 7, 8, or 9 prefix)
            </span>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-[#2a1e3f] mb-1">
            Email Address <span className="text-gray-400 font-normal">(Optional)</span>
          </label>
          <input
            type="email"
            placeholder="patient@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearFieldError('email');
            }}
            disabled={isSaving}
            className={`w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border transition-all ${
              fieldErrors.email
                ? 'border-red-400 bg-red-50/20 focus:border-red-500 focus:ring-2 focus:ring-red-400/20'
                : 'border-purple-200 bg-[#fdfcff] focus:bg-white focus:border-[#6d28d9] focus:outline-none focus:ring-2 focus:ring-purple-300/30'
            }`}
          />
          {fieldErrors.email && (
            <span className="text-[11px] text-red-600 font-medium block mt-1 animate-in fade-in duration-150">
              {fieldErrors.email}
            </span>
          )}
        </div>
      </div>

      {/* Address */}
      <div>
        <label className="block text-xs font-bold text-[#2a1e3f] mb-1">
          Address / Location <span className="text-gray-400 font-normal">(Optional)</span>
        </label>
        <input
          type="text"
          placeholder="City, State / Region (e.g. Bengaluru, Karnataka)"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          disabled={isSaving}
          className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-purple-200 bg-[#fdfcff] focus:bg-white focus:border-[#6d28d9] focus:outline-none focus:ring-2 focus:ring-purple-300/30 transition-all"
        />
      </div>

      {/* Medical Conditions Tags */}
      <div>
        <label className="block text-xs font-bold text-[#2a1e3f] mb-1">
          Medical Conditions
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            placeholder="Add condition (e.g. Type 2 Diabetes, Hypertension)"
            value={newCondition}
            onChange={(e) => setNewCondition(e.target.value)}
            disabled={isSaving}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddTag(newCondition, conditions, setConditions, setNewCondition);
              }
            }}
            className="flex-1 text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-purple-200 bg-[#fdfcff] focus:bg-white focus:border-[#6d28d9] focus:outline-none focus:ring-1 focus:ring-purple-300/30"
          />
          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleAddTag(newCondition, conditions, setConditions, setNewCondition)}
            className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-[#5b21b6] rounded-xl text-xs font-bold border border-purple-200 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5 min-h-[28px]">
          {conditions.map((cond) => (
            <span
              key={cond}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-100/70 text-[#5b21b6] text-xs font-semibold"
            >
              <span>{cond}</span>
              <button
                type="button"
                onClick={() => handleRemoveTag(cond, conditions, setConditions)}
                disabled={isSaving}
                className="hover:text-red-600 transition-colors cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Allergies Tags */}
      <div>
        <label className="block text-xs font-bold text-[#2a1e3f] mb-1">
          Allergies
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            placeholder="Add allergy (e.g. Penicillin, Sulfa drugs)"
            value={newAllergy}
            onChange={(e) => setNewAllergy(e.target.value)}
            disabled={isSaving}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddTag(newAllergy, allergies, setAllergies, setNewAllergy);
              }
            }}
            className="flex-1 text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-purple-200 bg-[#fdfcff] focus:bg-white focus:border-[#6d28d9] focus:outline-none focus:ring-1 focus:ring-purple-300/30"
          />
          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleAddTag(newAllergy, allergies, setAllergies, setNewAllergy)}
            className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-[#5b21b6] rounded-xl text-xs font-bold border border-purple-200 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5 min-h-[28px]">
          {allergies.map((all) => (
            <span
              key={all}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-100/80 text-rose-800 text-xs font-semibold"
            >
              <span>{all}</span>
              <button
                type="button"
                onClick={() => handleRemoveTag(all, allergies, setAllergies)}
                disabled={isSaving}
                className="hover:text-red-900 transition-colors cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Medications Tags */}
      <div>
        <label className="block text-xs font-bold text-[#2a1e3f] mb-1">
          Current Medications
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            placeholder="Add medication (e.g. Metformin 500mg, Amlodipine 5mg)"
            value={newMedication}
            onChange={(e) => setNewMedication(e.target.value)}
            disabled={isSaving}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddTag(newMedication, medications, setMedications, setNewMedication);
              }
            }}
            className="flex-1 text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-purple-200 bg-[#fdfcff] focus:bg-white focus:border-[#6d28d9] focus:outline-none focus:ring-1 focus:ring-purple-300/30"
          />
          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleAddTag(newMedication, medications, setMedications, setNewMedication)}
            className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-[#5b21b6] rounded-xl text-xs font-bold border border-purple-200 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5 min-h-[28px]">
          {medications.map((med) => (
            <span
              key={med}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100/70 text-blue-800 text-xs font-semibold"
            >
              <span>{med}</span>
              <button
                type="button"
                onClick={() => handleRemoveTag(med, medications, setMedications)}
                disabled={isSaving}
                className="hover:text-blue-900 transition-colors cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Medical History */}
      <div>
        <label className="block text-xs font-bold text-[#2a1e3f] mb-1">
          Medical History / Clinical Notes <span className="text-gray-400 font-normal">(Optional)</span>
        </label>
        <textarea
          rows={3}
          placeholder="Prior clinical observations, vitals, baseline lab values, family history..."
          value={medicalHistory}
          onChange={(e) => setMedicalHistory(e.target.value)}
          disabled={isSaving}
          className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-purple-200 bg-[#fdfcff] focus:bg-white focus:border-[#6d28d9] focus:outline-none focus:ring-2 focus:ring-purple-300/30 transition-all resize-y"
        />
      </div>

      {/* Action Buttons */}
      <div className="pt-3 border-t border-purple-100 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="px-5 py-2.5 rounded-xl border border-purple-200 bg-white hover:bg-purple-50 text-[#4c3f63] font-bold text-xs sm:text-sm transition-colors cursor-pointer disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="px-6 py-2.5 rounded-xl bg-[#4a189a] hover:bg-[#3b127e] disabled:bg-[#4a189a]/70 text-white font-bold text-xs sm:text-sm shadow-md shadow-purple-950/15 transition-all flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
        >
          {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>{initialData ? 'Save Changes' : 'Save Patient'}</span>
        </button>
      </div>
    </form>
  );
};
