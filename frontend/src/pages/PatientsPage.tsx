import React, { useState, useEffect } from 'react';
import { Search, Plus, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { AppLayout } from '../layouts/AppLayout';
import { PatientTable } from '../components/patients/PatientTable';
import { PatientModal } from '../components/patients/PatientModal';
import { EmptyPatientsState } from '../components/patients/EmptyPatientsState';
import { getPatients, createPatient, updatePatient, deletePatient } from '../lib/patients';
import type { Patient, PatientFormData } from '../types/patient';

export const PatientsPage: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Delete confirmation
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Notification message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadPatients = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await getPatients();
    if (error) {
      setError(error.message);
    } else {
      setPatients(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const handleOpenAddModal = () => {
    setEditingPatient(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (patient: Patient) => {
    setEditingPatient(patient);
    setModalOpen(true);
  };

  const handleSavePatient = async (formData: PatientFormData) => {
    setModalLoading(true);
    if (editingPatient) {
      const { error } = await updatePatient(editingPatient.id, formData);
      if (error) {
        alert(error.message);
      } else {
        showToast('Patient record updated successfully.');
        setModalOpen(false);
        setEditingPatient(null);
        await loadPatients();
      }
    } else {
      const { error } = await createPatient(formData);
      if (error) {
        alert(error.message);
      } else {
        showToast('New patient added successfully.');
        setModalOpen(false);
        await loadPatients();
      }
    }
    setModalLoading(false);
  };

  const handleConfirmDelete = async () => {
    if (!patientToDelete) return;
    setDeleteLoading(true);
    const { error } = await deletePatient(patientToDelete.id);
    if (error) {
      alert(error.message);
    } else {
      showToast(`Patient ${patientToDelete.full_name} deleted.`);
      setPatientToDelete(null);
      await loadPatients();
    }
    setDeleteLoading(false);
  };

  // Client-side search filtering
  const filteredPatients = patients.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      p.full_name.toLowerCase().includes(q) ||
      p.patient_code.toLowerCase().includes(q) ||
      (p.medical_conditions && p.medical_conditions.some((c) => c.toLowerCase().includes(q)))
    );
  });

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

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1a102f] tracking-tight">
              Patients
            </h1>
            <p className="text-xs sm:text-sm text-[#675b7e] mt-1">
              Manage your patients and clinical information.
            </p>
          </div>

          {/* Right: Search & Add Patient Button */}
          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-[#8d80a3] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search patients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 rounded-xl border border-purple-100 bg-white hover:border-purple-200 focus:border-[#6d28d9] focus:outline-none focus:ring-2 focus:ring-purple-300/30 transition-all shadow-2xs"
              />
            </div>

            <button
              type="button"
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#4a189a] hover:bg-[#3b127e] text-white text-xs sm:text-sm font-bold shadow-md shadow-purple-950/15 transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Patient</span>
            </button>
          </div>
        </div>

        {/* Loading State: Skeletons */}
        {loading && (
          <div className="bg-white rounded-2xl p-6 border border-purple-100 divide-y divide-purple-50">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="py-4 flex items-center justify-between gap-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100/60" />
                  <div className="space-y-1.5">
                    <div className="w-32 h-4 bg-purple-100/70 rounded" />
                    <div className="w-20 h-3 bg-purple-50 rounded" />
                  </div>
                </div>
                <div className="w-16 h-4 bg-purple-100/40 rounded hidden sm:block" />
                <div className="w-24 h-6 bg-purple-100/50 rounded-full hidden md:block" />
                <div className="w-16 h-8 bg-purple-100/60 rounded-xl" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="bg-white rounded-2xl p-8 border border-red-200 text-center shadow-xs">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-[#1b122e] mb-1">
              Unable to load patients
            </h3>
            <p className="text-xs text-[#6e6284] max-w-sm mx-auto mb-4">
              {error}
            </p>
            <button
              onClick={loadPatients}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#5b21b6] text-xs font-bold transition-colors cursor-pointer border border-purple-200"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Try again</span>
            </button>
          </div>
        )}

        {/* Loaded State */}
        {!loading && !error && (
          <>
            {patients.length === 0 ? (
              <EmptyPatientsState onAddPatient={handleOpenAddModal} />
            ) : filteredPatients.length === 0 ? (
              <EmptyPatientsState onAddPatient={handleOpenAddModal} isSearchEmpty />
            ) : (
              <PatientTable
                patients={filteredPatients}
                onEditPatient={handleOpenEditModal}
                onDeletePatient={(patient) => setPatientToDelete(patient)}
              />
            )}
          </>
        )}

        {/* Add / Edit Patient Modal */}
        <PatientModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSavePatient}
          initialData={editingPatient}
          loading={modalLoading}
        />

        {/* Delete Confirmation Modal */}
        {patientToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
              onClick={() => !deleteLoading && setPatientToDelete(null)}
            />
            <div className="relative bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-purple-100 z-10 animate-in fade-in zoom-in-95 duration-150 text-center">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#1b122e] mb-2">
                Delete this patient?
              </h3>
              <p className="text-xs sm:text-sm text-[#665a7d] mb-2">
                Are you sure you want to remove <span className="font-bold text-[#1b122e]">{patientToDelete.full_name}</span> ({patientToDelete.patient_code})?
              </p>
              <p className="text-[11px] text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-100 mb-6">
                All patient-specific clinical records associated with this patient may also be affected.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  disabled={deleteLoading}
                  onClick={() => setPatientToDelete(null)}
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

      </div>
    </AppLayout>
  );
};
