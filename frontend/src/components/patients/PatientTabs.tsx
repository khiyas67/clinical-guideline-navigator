import React from 'react';
import { FileText, Pill, AlertTriangle, CheckSquare, LayoutGrid } from 'lucide-react';
import type { Patient } from '../../types/patient';
import { PatientOverview } from './PatientOverview';

import { PatientDecisionsTab } from './PatientDecisionsTab';

interface PatientTabsProps {
  patient: Patient;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  onEdit: () => void;
}

export const PatientTabs: React.FC<PatientTabsProps> = ({
  patient,
  activeTab,
  onTabChange,
  onEdit,
}) => {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutGrid },
    { id: 'history', label: 'Medical History', icon: FileText },
    { id: 'medications', label: 'Medications', icon: Pill },
    { id: 'allergies', label: 'Allergies', icon: AlertTriangle },
    { id: 'decisions', label: 'Clinical Decisions', icon: CheckSquare },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Tab Navigation Pill Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-purple-100">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-[#4a189a] text-white shadow-xs'
                  : 'text-[#645778] hover:text-[#1b122e] hover:bg-purple-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Display */}
      {activeTab === 'overview' && (
        <PatientOverview
          patient={patient}
          onEdit={onEdit}
          onSelectTab={onTabChange}
        />
      )}

      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-purple-100/90 shadow-sm">
          <h3 className="text-base font-bold text-[#1b122e] mb-4">
            Comprehensive Medical History
          </h3>
          <p className="text-sm text-[#4d4163] leading-relaxed whitespace-pre-wrap">
            {patient.medical_history || 'No prior medical history notes entered for this patient.'}
          </p>
        </div>
      )}

      {activeTab === 'medications' && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-purple-100/90 shadow-sm">
          <h3 className="text-base font-bold text-[#1b122e] mb-4">
            Active Pharmacotherapy & Prescriptions
          </h3>
          {patient.medications && patient.medications.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {patient.medications.map((med, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl border border-purple-100 bg-purple-50/30 flex items-center gap-2.5"
                >
                  <Pill className="w-4 h-4 text-[#5b21b6]" />
                  <span className="text-xs sm:text-sm font-bold text-[#1b122e]">{med}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs sm:text-sm text-[#6f6385]">
              No current medications documented for this patient.
            </p>
          )}
        </div>
      )}

      {activeTab === 'allergies' && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-purple-100/90 shadow-sm">
          <h3 className="text-base font-bold text-[#1b122e] mb-4">
            Known Adverse Drug Reactions & Allergies
          </h3>
          {patient.allergies && patient.allergies.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {patient.allergies.map((all, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/50 flex items-center gap-2.5 text-rose-800"
                >
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span className="text-xs sm:text-sm font-bold">{all}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs sm:text-sm text-emerald-700 font-medium">
              No known clinical allergies on file.
            </p>
          )}
        </div>
      )}

      {activeTab === 'decisions' && (
        <PatientDecisionsTab patient={patient} />
      )}
    </div>
  );
};
