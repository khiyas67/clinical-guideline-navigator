import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle, RefreshCw, CheckCircle2, Trash2 } from 'lucide-react';
import { AppLayout } from '../layouts/AppLayout';
import { PatientProfileHeader } from '../components/patients/PatientProfileHeader';
import { PatientTabs } from '../components/patients/PatientTabs';
import { PatientModal } from '../components/patients/PatientModal';
import { getPatient, updatePatient, deletePatient } from '../lib/patients';
import type { Patient, PatientFormData } from '../types/patient';

export const PatientProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active tab state
  const [activeTab, setActiveTab] = useState('overview');

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadPatient = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    const { data, error } = await getPatient(id);
    if (error || !data) {
      setError(error ? error.message : 'Patient record not found or access denied by RLS policy.');
    } else {
      setPatient(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPatient();
  }, [id]);

  const handleSaveEdit = async (formData: PatientFormData) => {
    if (!patient) return;
    setModalLoading(true);
    const { data, error } = await updatePatient(patient.id, formData);
    if (error || !data) {
      alert(error?.message || 'Failed to update patient');
    } else {
      setPatient(data);
      setEditModalOpen(false);
      showToast('Patient profile updated successfully.');
    }
    setModalLoading(false);
  };

  const handleConfirmDelete = async () => {
    if (!patient) return;
    setDeleteLoading(true);
    const { error } = await deletePatient(patient.id);
    if (error) {
      alert(error.message);
      setDeleteLoading(false);
    } else {
      navigate('/patients', { replace: true });
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        
        {/* Toast Alert */}
        {toastMessage && (
          <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs sm:text-sm font-semibold text-emerald-800 shadow-sm animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-3xl p-8 border border-purple-100 animate-pulse">
            <div className="flex items-center gap-6 mb-8">
              <div className="w-20 h-20 rounded-2xl bg-purple-100/70" />
              <div className="space-y-2 flex-1">
                <div className="w-48 h-6 bg-purple-100/80 rounded" />
                <div className="w-32 h-4 bg-purple-100/50 rounded" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-40 bg-purple-50 rounded-2xl" />
              <div className="h-40 bg-purple-50 rounded-2xl" />
            </div>
          </div>
        )}

        {/* Error / Not Found State */}
        {!loading && (error || !patient) && (
          <div className="bg-white rounded-3xl p-12 border border-purple-100 text-center shadow-xs">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-[#1b122e] mb-2">
              Patient Record Unavailable
            </h2>
            <p className="text-xs sm:text-sm text-[#665a7d] max-w-md mx-auto mb-6">
              {error || 'The requested patient does not exist or you do not have permission to view it.'}
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link
                to="/patients"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#4a189a] hover:bg-[#3b127e] text-white text-xs font-bold transition-all shadow-xs"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Patients</span>
              </Link>
              <button
                type="button"
                onClick={loadPatient}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-purple-200 bg-white hover:bg-purple-50 text-[#5b21b6] text-xs font-bold transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Try again</span>
              </button>
            </div>
          </div>
        )}

        {/* Loaded Patient Profile */}
        {!loading && patient && (
          <>
            {/* Header Profile Section */}
            <PatientProfileHeader
              patient={patient}
              onEdit={() => setEditModalOpen(true)}
            />

            {/* Profile Tab Navigation & Content */}
            <PatientTabs
              patient={patient}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onEdit={() => setEditModalOpen(true)}
            />

            {/* Danger Zone: Delete Option */}
            <div className="mt-8 pt-6 border-t border-purple-100 flex items-center justify-between text-xs text-[#807498]">
              <span>Patient Management Options</span>
              <button
                type="button"
                onClick={() => setDeleteModalOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-800 font-semibold transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Patient Record</span>
              </button>
            </div>

            {/* Edit Patient Modal */}
            <PatientModal
              isOpen={editModalOpen}
              onClose={() => setEditModalOpen(false)}
              onSubmit={handleSaveEdit}
              initialData={patient}
              loading={modalLoading}
            />

            {/* Delete Confirmation Modal */}
            {deleteModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div
                  className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
                  onClick={() => !deleteLoading && setDeleteModalOpen(false)}
                />
                <div className="relative bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-purple-100 z-10 animate-in fade-in zoom-in-95 duration-150 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-[#1b122e] mb-2">
                    Delete this patient?
                  </h3>
                  <p className="text-xs sm:text-sm text-[#665a7d] mb-2">
                    Are you sure you want to permanently delete <span className="font-bold text-[#1b122e]">{patient.full_name}</span> ({patient.patient_code})?
                  </p>
                  <p className="text-[11px] text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-100 mb-6">
                    All patient-specific clinical records associated with this patient may also be affected.
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      type="button"
                      disabled={deleteLoading}
                      onClick={() => setDeleteModalOpen(false)}
                      className="px-5 py-2.5 rounded-xl border border-purple-200 bg-white hover:bg-purple-50 text-[#3b2f51] text-xs font-bold transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={deleteLoading}
                      onClick={handleConfirmDelete}
                      className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-950/15 transition-colors cursor-pointer"
                    >
                      {deleteLoading ? 'Deleting...' : 'Confirm Delete'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

      </div>
    </AppLayout>
  );
};
