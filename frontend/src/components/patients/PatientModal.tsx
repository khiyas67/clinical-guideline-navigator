import React from 'react';
import { X, UserPlus, UserCog } from 'lucide-react';
import { PatientForm } from './PatientForm';
import type { PatientFormData, Patient } from '../../types/patient';

interface PatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: PatientFormData) => Promise<void>;
  initialData?: Patient | null;
  loading: boolean;
}

export const PatientModal: React.FC<PatientModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  loading,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={!loading ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Modal Dialog Container */}
      <div className="relative bg-white rounded-3xl w-full max-w-xl p-6 sm:p-8 shadow-2xl border border-purple-100 z-10 my-auto max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-purple-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-100/70 text-[#5b21b6] flex items-center justify-center">
              {initialData ? <UserCog className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#1b122e]">
                {initialData ? 'Edit Patient Profile' : 'Add New Patient'}
              </h2>
              <p className="text-xs text-[#6e6284]">
                {initialData
                  ? `Updating record for ${initialData.full_name} (${initialData.patient_code})`
                  : 'Enter patient information and clinical parameters'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-xl text-[#786c8f] hover:text-[#4a189a] hover:bg-purple-50 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <PatientForm
          initialData={initialData}
          onSubmit={onSubmit}
          onCancel={onClose}
          loading={loading}
        />
      </div>
    </div>
  );
};
