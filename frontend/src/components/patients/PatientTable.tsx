import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Edit2, Trash2, MoreVertical, Clock } from 'lucide-react';
import type { Patient } from '../../types/patient';
import { calculateAge, formatRelativeTime } from '../../types/patient';

interface PatientTableProps {
  patients: Patient[];
  onEditPatient: (patient: Patient) => void;
  onDeletePatient: (patient: Patient) => void;
}

export const PatientTable: React.FC<PatientTableProps> = ({
  patients,
  onEditPatient,
  onDeletePatient,
}) => {
  const navigate = useNavigate();
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const getInitials = (name?: string | null) => {
    if (!name || typeof name !== 'string') return 'PT';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.trim().slice(0, 2).toUpperCase() || 'PT';
  };

  const getAvatarColor = (index: number) => {
    const colors = [
      'bg-indigo-100 text-indigo-700',
      'bg-purple-100 text-[#5b21b6]',
      'bg-emerald-100 text-emerald-700',
      'bg-rose-100 text-rose-700',
      'bg-blue-100 text-blue-700',
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="bg-white rounded-2xl border border-purple-100/90 shadow-sm shadow-purple-950/5 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-purple-50 text-[11px] font-bold text-[#716588] uppercase tracking-wider bg-purple-50/30">
              <th className="py-3.5 px-4 sm:px-6">Name</th>
              <th className="py-3.5 px-4">Age</th>
              <th className="py-3.5 px-4">Gender</th>
              <th className="py-3.5 px-4">Conditions</th>
              <th className="py-3.5 px-4">Last Activity</th>
              <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-purple-50 text-xs sm:text-sm">
            {patients.map((patient, index) => {
              const age = patient.age !== undefined && patient.age !== null ? patient.age : (calculateAge(patient.date_of_birth) ?? (patient as any).age ?? null);
              const initials = getInitials(patient.full_name || (patient as any).name);
              const avatarBg = getAvatarColor(index);
              const lastActivity = formatRelativeTime(patient.updated_at || patient.created_at);

              return (
                <tr
                  key={patient.id}
                  className="hover:bg-purple-50/50 transition-colors group cursor-pointer"
                  onClick={() => navigate(`/patients/${patient.id}`)}
                >
                  {/* Name + Code */}
                  <td className="py-3.5 px-4 sm:px-6">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${avatarBg}`}
                      >
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-[#1b122e] group-hover:text-[#5b21b6] transition-colors truncate">
                          {patient.full_name}
                        </div>
                        <div className="text-[11px] text-[#7a6e90] font-mono">
                          {patient.patient_code}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Age */}
                  <td className="py-3.5 px-4 text-[#35284b] font-medium whitespace-nowrap">
                    {age !== null ? `${age} yrs` : '—'}
                  </td>

                  {/* Gender */}
                  <td className="py-3.5 px-4 text-[#35284b] whitespace-nowrap">
                    {patient.gender || '—'}
                  </td>

                  {/* Conditions */}
                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {patient.medical_conditions && patient.medical_conditions.length > 0 ? (
                        patient.medical_conditions.slice(0, 2).map((c) => (
                          <span
                            key={c}
                            className="inline-block text-[11px] font-medium px-2 py-0.5 rounded-full bg-purple-50 text-[#5b21b6] border border-purple-100"
                          >
                            {c}
                          </span>
                        ))
                      ) : (
                        <span className="text-[#8e82a4] text-xs">None listed</span>
                      )}
                      {patient.medical_conditions && patient.medical_conditions.length > 2 && (
                        <span className="text-[10px] text-[#716588] self-center">
                          +{patient.medical_conditions.length - 2} more
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Last Activity */}
                  <td className="py-3.5 px-4 text-xs text-[#6e6284] whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-[#9589ac]" />
                      <span>{lastActivity}</span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                    <div
                      className="inline-flex items-center gap-1.5 relative"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => navigate(`/patients/${patient.id}`)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-purple-200 bg-white hover:bg-purple-50 text-xs font-semibold text-[#5b21b6] transition-colors cursor-pointer shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>

                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setActiveMenuId(activeMenuId === patient.id ? null : patient.id)
                          }
                          className="p-1.5 rounded-xl text-[#7a6e92] hover:text-[#5b21b6] hover:bg-purple-100/60 transition-colors cursor-pointer"
                          aria-label="Options"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* Action Menu Dropdown */}
                        {activeMenuId === patient.id && (
                          <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-xl shadow-lg border border-purple-100 p-1 z-30 animate-in fade-in zoom-in-95 duration-100">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                onEditPatient(patient);
                              }}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-[#2a1e3f] hover:bg-purple-50 hover:text-[#5b21b6] rounded-lg transition-colors cursor-pointer text-left font-medium"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                onDeletePatient(patient);
                              }}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer text-left font-semibold"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="p-4 border-t border-purple-50 flex items-center justify-between text-xs text-[#716588] bg-white">
        <span>Showing {patients.length} {patients.length === 1 ? 'patient' : 'patients'}</span>
        <span className="font-medium text-[#5b21b6]">Supabase RLS Protected</span>
      </div>
    </div>
  );
};
