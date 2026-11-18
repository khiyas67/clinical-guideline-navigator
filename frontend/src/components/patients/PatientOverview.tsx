import React from 'react';
import { Link } from 'react-router-dom';
import {
  MessageSquare,
  Edit,
  ClipboardList,
  User,
  Pill,
  AlertTriangle,
  FileText,
  Activity
} from 'lucide-react';
import type { Patient } from '../../types/patient';
import { calculateAge } from '../../types/patient';

interface PatientOverviewProps {
  patient: Patient;
  onEdit: () => void;
  onSelectTab: (tabId: string) => void;
}

export const PatientOverview: React.FC<PatientOverviewProps> = ({
  patient,
  onEdit,
  onSelectTab,
}) => {
  const age = patient.age !== undefined && patient.age !== null ? patient.age : calculateAge(patient.date_of_birth);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Left 2 Columns: Clinical Cards */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        
        {/* Basic Information Card */}
        <div className="bg-white rounded-2xl p-6 border border-purple-100/90 shadow-sm shadow-purple-950/5">
          <div className="flex items-center gap-2 pb-4 mb-4 border-b border-purple-50">
            <User className="w-4 h-4 text-[#5b21b6]" />
            <h3 className="text-sm font-bold text-[#1b122e]">Basic Information</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-xs sm:text-sm">
            <div>
              <span className="text-xs text-[#716588] block mb-0.5">Full Name</span>
              <span className="font-semibold text-[#1b122e]">{patient.full_name}</span>
            </div>

            <div>
              <span className="text-xs text-[#716588] block mb-0.5">Date of Birth</span>
              <span className="font-semibold text-[#1b122e]">
                {patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : 'Unrecorded'}
              </span>
            </div>

            <div>
              <span className="text-xs text-[#716588] block mb-0.5">Age</span>
              <span className="font-semibold text-[#1b122e]">
                {age !== null && age !== undefined ? `${age} years` : 'Unrecorded'}
              </span>
            </div>

            <div>
              <span className="text-xs text-[#716588] block mb-0.5">Gender</span>
              <span className="font-semibold text-[#1b122e]">{patient.gender || 'Unrecorded'}</span>
            </div>

            <div>
              <span className="text-xs text-[#716588] block mb-0.5">Contact Number (India)</span>
              <span className="font-semibold text-[#1b122e]">{patient.contact || 'No contact on file'}</span>
            </div>

            <div>
              <span className="text-xs text-[#716588] block mb-0.5">Email Address</span>
              <span className="font-semibold text-[#1b122e]">{patient.email || 'No email on file'}</span>
            </div>

            <div className="sm:col-span-2">
              <span className="text-xs text-[#716588] block mb-0.5">Address</span>
              <span className="font-semibold text-[#1b122e]">{patient.address || 'No address on file'}</span>
            </div>
          </div>
        </div>

        {/* Medical Conditions & Allergies Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Medical Conditions */}
          <div className="bg-white rounded-2xl p-6 border border-purple-100/90 shadow-sm shadow-purple-950/5">
            <div className="flex items-center gap-2 pb-3 mb-3 border-b border-purple-50">
              <Activity className="w-4 h-4 text-[#5b21b6]" />
              <h3 className="text-sm font-bold text-[#1b122e]">Medical Conditions</h3>
            </div>
            <div className="flex flex-wrap gap-1.5 min-h-[40px]">
              {patient.medical_conditions && patient.medical_conditions.length > 0 ? (
                patient.medical_conditions.map((c) => (
                  <span
                    key={c}
                    className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-50 text-[#5b21b6] border border-purple-100"
                  >
                    {c}
                  </span>
                ))
              ) : (
                <span className="text-xs text-[#786b8f]">No active conditions recorded</span>
              )}
            </div>
          </div>

          {/* Allergies */}
          <div className="bg-white rounded-2xl p-6 border border-purple-100/90 shadow-sm shadow-purple-950/5">
            <div className="flex items-center gap-2 pb-3 mb-3 border-b border-purple-50">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <h3 className="text-sm font-bold text-[#1b122e]">Allergies</h3>
            </div>
            <div className="flex flex-wrap gap-1.5 min-h-[40px]">
              {patient.allergies && patient.allergies.length > 0 ? (
                patient.allergies.map((a) => (
                  <span
                    key={a}
                    className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200"
                  >
                    {a}
                  </span>
                ))
              ) : (
                <span className="text-xs text-emerald-700 font-medium">No known clinical allergies</span>
              )}
            </div>
          </div>
        </div>

        {/* Current Medications */}
        <div className="bg-white rounded-2xl p-6 border border-purple-100/90 shadow-sm shadow-purple-950/5">
          <div className="flex items-center gap-2 pb-3 mb-3 border-b border-purple-50">
            <Pill className="w-4 h-4 text-[#5b21b6]" />
            <h3 className="text-sm font-bold text-[#1b122e]">Current Medications</h3>
          </div>
          <div className="flex flex-wrap gap-1.5 min-h-[40px]">
            {patient.medications && patient.medications.length > 0 ? (
              patient.medications.map((m) => (
                <span
                  key={m}
                  className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200"
                >
                  {m}
                </span>
              ))
            ) : (
              <span className="text-xs text-[#786b8f]">No current medications documented</span>
            )}
          </div>
        </div>

        {/* Medical History */}
        <div className="bg-white rounded-2xl p-6 border border-purple-100/90 shadow-sm shadow-purple-950/5">
          <div className="flex items-center gap-2 pb-3 mb-3 border-b border-purple-50">
            <FileText className="w-4 h-4 text-[#5b21b6]" />
            <h3 className="text-sm font-bold text-[#1b122e]">Medical History & Notes</h3>
          </div>
          <p className="text-xs sm:text-sm text-[#4d4163] leading-relaxed whitespace-pre-wrap">
            {patient.medical_history || 'No prior medical history notes entered for this patient.'}
          </p>
        </div>

      </div>

      {/* Right Column: Quick Actions Card */}
      <div className="flex flex-col gap-6">
        <div className="bg-white rounded-2xl p-6 border border-purple-100/90 shadow-sm shadow-purple-950/5 flex flex-col gap-4">
          <h3 className="text-sm font-bold text-[#1b122e] pb-3 border-b border-purple-50">
            Quick Actions
          </h3>

          {/* Ask Clinical Question (Critical deep-link with patient UUID) */}
          <Link
            to={`/assistant?patient=${patient.id}`}
            className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl bg-[#4a189a] hover:bg-[#3b127e] text-white text-xs sm:text-sm font-bold shadow-md shadow-purple-950/15 transition-all text-center"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Ask Clinical Question</span>
          </Link>

          {/* View Clinical Decisions */}
          <button
            type="button"
            onClick={() => onSelectTab('decisions')}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border border-purple-200 bg-white hover:bg-purple-50 text-xs sm:text-sm font-semibold text-[#5b21b6] transition-colors cursor-pointer"
          >
            <ClipboardList className="w-4 h-4" />
            <span>View Clinical Decisions</span>
          </button>

          {/* Edit Patient */}
          <button
            type="button"
            onClick={onEdit}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border border-purple-200 bg-white hover:bg-purple-50 text-xs sm:text-sm font-semibold text-[#5b21b6] transition-colors cursor-pointer"
          >
            <Edit className="w-4 h-4" />
            <span>Edit Patient</span>
          </button>
        </div>

        {/* Patient Metadata Info Card */}
        <div className="bg-purple-50/50 rounded-2xl p-5 border border-purple-100 text-xs text-[#716588] flex flex-col gap-2">
          <div className="font-bold text-[#1b122e] mb-1">Record Information</div>
          <div className="flex justify-between">
            <span>Created:</span>
            <span className="font-medium text-[#2d2144]">
              {new Date(patient.created_at).toLocaleDateString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Last Updated:</span>
            <span className="font-medium text-[#2d2144]">
              {new Date(patient.updated_at).toLocaleDateString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Security:</span>
            <span className="text-[#5b21b6] font-semibold">Clinician Isolation (RLS)</span>
          </div>
        </div>
      </div>

    </div>
  );
};
