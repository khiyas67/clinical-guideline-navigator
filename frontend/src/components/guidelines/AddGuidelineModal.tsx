import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertCircle, Loader2, ShieldCheck, Tag } from 'lucide-react';

interface AddGuidelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddGuidelineModal: React.FC<AddGuidelineModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [validating, setValidating] = useState(false);
  const [indexing, setIndexing] = useState(false);
  const [validationResult, setValidationResult] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Editable metadata state
  const [title, setTitle] = useState('');
  const [organization, setOrganization] = useState('');
  const [category, setCategory] = useState('');
  const [year, setYear] = useState('');
  const [version, setVersion] = useState('');

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.name.toLowerCase().endsWith('.pdf')) {
      setErrorMessage('Please select a valid PDF file.');
      return;
    }

    setFile(selected);
    setValidationResult(null);
    setErrorMessage(null);
    setSuccessMessage(null);
    setValidating(true);

    try {
      const formData = new FormData();
      formData.append('file', selected);

      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';
      const res = await fetch(`${backendUrl}/api/guidelines/validate`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.detail || 'Validation failed. Please ensure backend is running.');
        setValidationResult(null);
        return;
      }

      setValidationResult(data);

      if (!data.is_approved) {
        setErrorMessage(data.rejection_reason || 'Document does not qualify as an authoritative clinical guideline.');
      } else {
        const meta = data.metadata || {};
        setTitle(meta.title || selected.name.replace(/\.pdf$/i, ''));
        setOrganization(meta.organization || 'Clinical Authority');
        setCategory(meta.category || 'General');
        setYear(meta.publication_year || String(new Date().getFullYear()));
        setVersion(meta.identifier || meta.version || '');
      }
    } catch (err: any) {
      setErrorMessage('Could not connect to Quality Control service. Please ensure the backend is active.');
    } finally {
      setValidating(false);
    }
  };

  const handleConfirmIndex = async () => {
    if (!file || !validationResult?.is_approved) return;

    setIndexing(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (title.trim()) formData.append('title', title.trim());
      if (organization.trim()) formData.append('organization', organization.trim());
      if (category.trim()) formData.append('category', category.trim());
      if (year.trim()) formData.append('publication_year', year.trim());
      if (version.trim()) formData.append('version', version.trim());

      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';
      const res = await fetch(`${backendUrl}/api/guidelines/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.detail || 'Failed to index guideline.');
        return;
      }

      setSuccessMessage(`Guideline successfully cataloged and indexed (${data.chunks_created} chunks)!`);
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error occurred during guideline ingestion.');
    } finally {
      setIndexing(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setValidationResult(null);
    setErrorMessage(null);
    setSuccessMessage(null);
    setTitle('');
    setOrganization('');
    setCategory('');
    setYear('');
    setVersion('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-purple-100/90 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-purple-100 bg-gradient-to-r from-purple-50/50 to-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-[#5b21b6] flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1b122e]">
                Add Clinical Guideline
              </h2>
              <p className="text-[11px] text-[#716588]">
                Quality Control & Duplicate Prevention Pipeline
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-left">
          {/* Success Banner */}
          {successMessage && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold block mb-0.5">Validation Alert:</span>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* File Upload Dropzone */}
          <div>
            <label className="block text-xs font-bold text-[#2a1e3f] mb-1.5">
              Select Official Clinical Practice Guideline (PDF)
            </label>
            <label
              htmlFor="guideline-file-upload"
              className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                file
                  ? 'border-purple-300 bg-purple-50/30'
                  : 'border-purple-200 bg-[#fdfcff] hover:bg-purple-50/50 hover:border-purple-400'
              }`}
            >
              <input
                id="guideline-file-upload"
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={handleFileChange}
                disabled={validating || indexing}
              />
              <div className="w-10 h-10 rounded-xl bg-purple-100/70 text-[#5b21b6] flex items-center justify-center">
                {validating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : file ? (
                  <FileText className="w-5 h-5 text-purple-700" />
                ) : (
                  <Upload className="w-5 h-5" />
                )}
              </div>
              <div className="text-center">
                <span className="text-xs font-semibold text-[#1b122e] block">
                  {file ? file.name : 'Click to browse or drop guideline PDF'}
                </span>
                <span className="text-[11px] text-[#716588]">
                  {file
                    ? `${(file.size / (1024 * 1024)).toFixed(2)} MB • Automatic SHA-256 analysis`
                    : 'Authoritative WHO, CDC, KDIGO, NIH, or medical society PDF'}
                </span>
              </div>
            </label>
          </div>

          {/* Analyzing indicator */}
          {validating && (
            <div className="flex items-center gap-2 text-xs font-medium text-[#5b21b6] p-3 rounded-xl bg-purple-50 border border-purple-200">
              <Loader2 className="w-4 h-4 animate-spin text-[#5b21b6]" />
              <span>Analyzing document with Clinical Quality Control & Duplicate Detection...</span>
            </div>
          )}

          {/* Approved Metadata Form */}
          {validationResult?.is_approved && (
            <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-200/80 space-y-3 animate-in fade-in">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Document Verified as Authoritative Clinical Guideline</span>
              </div>

              {/* SHA-256 Checksum Badge */}
              <div className="text-[11px] text-[#6b5f83] font-mono bg-white p-2 rounded-lg border border-purple-100 flex items-center justify-between">
                <span>SHA-256 Checksum:</span>
                <span className="font-bold text-[#5b21b6] truncate max-w-[200px]" title={validationResult.checksum}>
                  {validationResult.checksum.slice(0, 16)}...
                </span>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-[#2a1e3f] mb-1">
                  Document Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-purple-200 bg-white focus:outline-none focus:ring-1 focus:ring-purple-400"
                />
              </div>

              {/* Organization & Year */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#2a1e3f] mb-1">
                    Issuing Organization
                  </label>
                  <input
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-purple-200 bg-white focus:outline-none focus:ring-1 focus:ring-purple-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#2a1e3f] mb-1">
                    Publication Year
                  </label>
                  <input
                    type="text"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-purple-200 bg-white focus:outline-none focus:ring-1 focus:ring-purple-400"
                  />
                </div>
              </div>

              {/* Version / Edition (Optional) */}
              <div>
                <label className="block text-xs font-bold text-[#2a1e3f] mb-1">
                  Edition / Version / Reference Code <span className="text-[10px] text-gray-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., 2022 Update, Vol 171, or leave blank"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-purple-200 bg-white focus:outline-none focus:ring-1 focus:ring-purple-400"
                />
              </div>

              {/* Clinical Category */}
              <div>
                <label className="block text-xs font-bold text-[#2a1e3f] mb-1 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#5b21b6]" />
                  <span>Clinical Category (Auto-Detected)</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-purple-200 bg-white focus:outline-none focus:ring-1 focus:ring-purple-400"
                >
                  <option value="Nephrology">Nephrology</option>
                  <option value="Pain Management">Pain Management</option>
                  <option value="Diabetes">Diabetes</option>
                  <option value="Endocrinology">Endocrinology</option>
                  <option value="Cardiovascular">Cardiovascular</option>
                  <option value="Hypertension">Hypertension</option>
                  <option value="Infectious Disease">Infectious Disease</option>
                  <option value="Medications">Medications</option>
                  <option value="General">General</option>
                  <option value="Unclassified">Unclassified</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-purple-100 flex items-center justify-end gap-3 bg-gray-50/50">
          <button
            type="button"
            onClick={handleClose}
            disabled={indexing}
            className="px-4 py-2 rounded-xl border border-purple-200 bg-white hover:bg-purple-50 text-[#4c3f63] font-bold text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmIndex}
            disabled={!validationResult?.is_approved || indexing || validating}
            className="px-5 py-2 rounded-xl bg-[#4a189a] hover:bg-[#3b127e] disabled:bg-[#4a189a]/50 text-white font-bold text-xs shadow-md shadow-purple-950/15 transition-all flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {indexing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{indexing ? 'Indexing Chunks...' : 'Accept & Index Guideline'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

