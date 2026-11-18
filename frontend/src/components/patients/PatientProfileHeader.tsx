import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Edit, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { Patient } from '../../types/patient';
import { calculateAge } from '../../types/patient';

interface PatientProfileHeaderProps {
  patient: Patient;
  onEdit: () => void;
}

export const PatientProfileHeader: React.FC<PatientProfileHeaderProps> = ({
  patient,
  onEdit,
}) => {
  const age = patient.age !== undefined && patient.age !== null ? patient.age : calculateAge(patient.date_of_birth);

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase() || 'PT';
  };

  const hasAllergies = patient.allergies && patient.allergies.length > 0;

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100/90 shadow-sm shadow-purple-950/5 mb-6">
      {/* Top row: Back to patients + Edit button */}
      <div className="flex items-center justify-between mb-6">
        <Link
          to="/patients"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#665a7c] hover:text-[#5b21b6] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Patients</span>
        </Link>

        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-purple-200 bg-white hover:bg-purple-50 text-xs font-semibold text-[#5b21b6] shadow-2xs transition-colors cursor-pointer"
        >
          <Edit className="w-3.5 h-3.5" />
          <span>Edit Profile</span>
        </button>
      </div>

      {/* Profile info row */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-6">
        {/* Large Initials Avatar */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-[#5b21b6] to-[#8b5cf6] text-white flex items-center justify-center font-extrabold text-xl sm:text-2xl shadow-md shadow-purple-950/15 shrink-0">
          {getInitials(patient.full_name)}
        </div>

        {/* Identity Details */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1a102f] tracking-tight">
              {patient.full_name}
            </h1>
            <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-lg bg-purple-50 text-[#5b21b6] border border-purple-100">
              {patient.patient_code}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-[#665a7d] mt-1.5">
            <span>{age !== null ? `${age} years` : 'Age unrecorded'}</span>
            <span>•</span>
            <span>{patient.gender || 'Gender unrecorded'}</span>
            <span>•</span>
            <span className="text-[#887b9e] font-mono text-xs">ID: {patient.id.slice(0, 8)}...</span>
          </div>

          {/* Condition Pills & Allergy Alert */}
          <div className="flex flex-wrap items-center gap-2 mt-4">
            {patient.medical_conditions && patient.medical_conditions.map((cond) => (
              <span
                key={cond}
                className="inline-block text-xs font-semibold px-3 py-1 rounded-full bg-purple-100/70 text-[#5b21b6]"
              >
                {cond}
              </span>
            ))}

            {hasAllergies ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-rose-100/80 text-rose-800">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>Allergies: {patient.allergies.join(', ')}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-100/70 text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>No known allergies</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
