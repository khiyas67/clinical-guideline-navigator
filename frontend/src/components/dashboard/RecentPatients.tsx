import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronRight, Clock, UserPlus, Users } from 'lucide-react';
import type { Patient } from '../../types/patient';
import { calculateAge, formatRelativeTime } from '../../types/patient';

interface RecentPatientsProps {
  patients: Patient[];
  loading?: boolean;
}

export const RecentPatients: React.FC<RecentPatientsProps> = ({ patients, loading = false }) => {
  const navigate = useNavigate();

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

  const recentList = patients.slice(0, 4);

  return (
    <div className="bg-white rounded-2xl p-6 border border-purple-100/90 shadow-sm shadow-purple-950/5 flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-purple-50 mb-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#1b122e]">
            Recent Patients
          </h2>
          <p className="text-xs text-[#716588]">
            Clinician active case records
          </p>
        </div>
        <Link
          to="/patients"
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#5b21b6] hover:text-[#3b127e] hover:underline transition-colors"
        >
          <span>View all</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="flex flex-col divide-y divide-purple-50 py-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="py-3 flex items-center justify-between animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100/60" />
                <div className="space-y-1">
                  <div className="w-28 h-3.5 bg-purple-100/70 rounded" />
                  <div className="w-20 h-2.5 bg-purple-50 rounded" />
                </div>
              </div>
              <div className="w-16 h-5 bg-purple-50 rounded-full" />
            </div>
          ))}
        </div>
      )}

      {/* Real Patients List */}
      {!loading && recentList.length > 0 && (
        <div className="flex flex-col divide-y divide-purple-50">
          {recentList.map((patient, index) => {
            const age = calculateAge(patient.date_of_birth) ?? (patient as any).age ?? null;
            const initials = getInitials(patient.full_name || (patient as any).name);
            const avatarBg = getAvatarColor(index);
            const lastActivity = formatRelativeTime(patient.updated_at || patient.created_at);
            const primaryCondition = patient.medical_conditions?.[0] || (patient as any).primary_condition || 'No condition listed';

            return (
              <div
                key={patient.id}
                onClick={() => navigate(`/patients/${patient.id}`)}
                className="py-3 px-2 sm:px-3 -mx-2 rounded-xl hover:bg-purple-50/70 transition-colors flex items-center justify-between gap-3 cursor-pointer group"
              >
                {/* Left: Avatar & Patient Info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${avatarBg}`}
                  >
                    {initials}
                  </div>

                  <div className="min-w-0">
                    <div className="text-sm font-bold text-[#1b122e] group-hover:text-[#5b21b6] transition-colors truncate">
                      {patient.full_name}
                    </div>
                    <div className="text-xs text-[#706486] truncate">
                      {age !== null ? `${age} years` : 'Age N/A'} • {patient.gender || 'Unspecified'}
                    </div>
                  </div>
                </div>

                {/* Right: Condition Pill & Last Activity */}
                <div className="text-right shrink-0 flex items-center gap-3">
                  <div className="hidden sm:block">
                    <span className="inline-block text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-purple-50 text-[#5b21b6] border border-purple-100 max-w-[140px] truncate">
                      {primaryCondition}
                    </span>
                    <div className="text-[10px] text-[#867a9c] flex items-center justify-end gap-1 mt-1">
                      <Clock className="w-2.5 h-2.5" />
                      <span>{lastActivity}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-purple-300 group-hover:text-[#5b21b6] group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!loading && recentList.length === 0 && (
        <div className="py-8 text-center my-auto flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-[#5b21b6] flex items-center justify-center mb-3">
            <Users className="w-6 h-6" />
          </div>
          <p className="text-xs sm:text-sm font-bold text-[#1b122e] mb-1">
            No patients registered yet
          </p>
          <p className="text-[11px] text-[#74678b] max-w-xs mb-4">
            Add a patient to start exploring personalized clinical guidelines.
          </p>
          <Link
            to="/patients"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#4a189a] hover:bg-[#3b127e] text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Patient</span>
          </Link>
        </div>
      )}
    </div>
  );
};
