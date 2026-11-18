import React from 'react';
import { UserCheck, RefreshCw, AlertCircle, CheckCircle2, UserPlus } from 'lucide-react';
import type { Patient } from '../../types/patient';
import { calculateAge } from '../../types/patient';

interface PatientContextCardProps {
  patient: Patient | null;
  onChangePatient: () => void;
}

export const PatientContextCard: React.FC<PatientContextCardProps> = ({
  patient,
  onChangePatient,
}) => {
  if (!patient) {
    return (
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-purple-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100/70 text-[#5b21b6] flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#1b122e]">
              Select a patient to begin
            </h3>
            <p className="text-xs text-[#716588]">
              Ground clinical questions in real patient context, conditions, and allergies.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onChangePatient}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#4a189a] hover:bg-[#3b127e] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Select Patient</span>
        </button>
      </div>
    );
  }

  const age = calculateAge(patient.date_of_birth);
  const initials = patient.full_name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const hasAllergies = patient.allergies && patient.allergies.length > 0;

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-purple-100/90 shadow-sm shadow-purple-950/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all">
      {/* Left: Avatar & Patient Details */}
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#5b21b6] to-[#7c3aed] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
          {initials}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm sm:text-base font-bold text-[#1b122e] truncate">
              {patient.full_name}
            </span>
            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-purple-50 text-[#5b21b6] border border-purple-100">
              {patient.patient_code}
            </span>
          </div>

          <div className="text-xs text-[#6e6284] flex items-center gap-2 mt-0.5">
            <span>{age !== null ? `${age} years` : 'Age N/A'}</span>
            <span>•</span>
            <span>{patient.gender || 'Unspecified'}</span>
          </div>
        </div>
      </div>

      {/* Center: Conditions & Allergy Badges */}
      <div className="flex flex-wrap items-center gap-1.5 max-w-xl">
        {patient.medical_conditions && patient.medical_conditions.slice(0, 3).map((cond) => (
          <span
            key={cond}
            className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-purple-50 text-[#5b21b6] border border-purple-100"
          >
            {cond}
          </span>
        ))}

        {hasAllergies ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3 h-3 text-rose-500" />
            <span>Allergies: {patient.allergies.join(', ')}</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span>No known allergies</span>
          </span>
        )}
      </div>

      {/* Right: Change Patient Action */}
      <button
        type="button"
        onClick={onChangePatient}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-purple-200 bg-white hover:bg-purple-50 text-xs font-semibold text-[#5b21b6] shadow-2xs transition-colors cursor-pointer shrink-0"
      >
        <RefreshCw className="w-3 h-3" />
        <span>Change patient</span>
      </button>
    </div>
  );
};
