import React, { useState, useEffect } from 'react';
import { Search, Users, X, Check, Loader2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Patient } from '../../types/patient';
import { calculateAge } from '../../types/patient';
import { getPatients } from '../../lib/patients';

interface PatientSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPatient: (patient: Patient) => void;
  selectedPatientId?: string;
}

export const PatientSelector: React.FC<PatientSelectorProps> = ({
  isOpen,
  onClose,
  onSelectPatient,
  selectedPatientId,
}) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getPatients().then(({ data }) => {
        setPatients(data);
        setLoading(false);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredPatients = patients.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const name = (p.full_name || (p as any).name || '').toLowerCase();
    const code = (p.patient_code || (p as any).patient_id || '').toLowerCase();
    const conds = p.medical_conditions || [];
    return (
      name.includes(q) ||
      code.includes(q) ||
      conds.some((c) => (c || '').toLowerCase().includes(q))
    );
  });

  const getInitials = (name?: string | null) => {
    if (!name || typeof name !== 'string') return 'PT';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2 && parts[0] && parts[1]) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.trim().slice(0, 2).toUpperCase() || 'PT';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity" 
        onClick={onClose} 
      />

      {/* Modal Card */}
      <div className="relative bg-white rounded-3xl w-full max-w-lg p-6 sm:p-7 shadow-2xl border border-purple-100 z-10 max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-purple-50 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-100/70 text-[#5b21b6] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1b122e]">
                Select Patient Context
              </h3>
              <p className="text-xs text-[#716588]">
                Ground clinical queries in a specific patient case
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-purple-50 text-[#7c7094] hover:text-[#4a189a] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="w-4 h-4 text-[#8a7d9f] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, code or condition..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 rounded-xl border border-purple-100 bg-[#fdfcff] hover:bg-white focus:bg-white focus:border-[#6d28d9] focus:outline-none focus:ring-2 focus:ring-purple-300/30 transition-all shadow-2xs"
          />
        </div>

        {/* Patient List */}
        <div className="flex-1 overflow-y-auto divide-y divide-purple-50 pr-1">
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center text-xs text-[#7c7094] gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#5b21b6]" />
              <span>Loading patient directory...</span>
            </div>
          )}

          {!loading && patients.length === 0 && (
            <div className="py-12 text-center">
              <Users className="w-10 h-10 text-purple-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-[#1b122e] mb-1">No patients available</p>
              <p className="text-xs text-[#716588] mb-4">Add a patient before asking a clinical question.</p>
              <Link
                to="/patients"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#4a189a] hover:bg-[#3b127e] text-white text-xs font-semibold shadow-xs"
              >
                <span>Add Patient</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {!loading && patients.length > 0 && filteredPatients.length === 0 && (
            <div className="py-10 text-center text-xs text-[#716588]">
              No patients match "{searchQuery}"
            </div>
          )}

          {!loading && filteredPatients.map((patient) => {
            const age = calculateAge(patient.date_of_birth);
            const isSelected = patient.id === selectedPatientId;

            return (
              <div
                key={patient.id}
                onClick={() => {
                  onSelectPatient(patient);
                  onClose();
                }}
                className={`py-3 px-3 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-purple-100/70 border border-purple-200'
                    : 'hover:bg-purple-50/70'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#5b21b6] to-[#7c3aed] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                    {getInitials(patient.full_name)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-[#1b122e] truncate flex items-center gap-2">
                      <span>{patient.full_name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white text-[#5b21b6] border border-purple-100">
                        {patient.patient_code}
                      </span>
                    </div>
                    <div className="text-xs text-[#6e6284] truncate">
                      {age !== null ? `${age} yrs` : 'Age N/A'} • {patient.gender || 'Unspecified'}
                      {patient.medical_conditions?.length > 0 && (
                        <span> • {patient.medical_conditions[0]}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="shrink-0">
                  {isSelected ? (
                    <span className="w-6 h-6 rounded-full bg-[#5b21b6] text-white flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-[#5b21b6] hover:underline">
                      Select
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
