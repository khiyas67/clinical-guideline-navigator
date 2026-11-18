import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckSquare,
  Sparkles,
  Search,
  CheckCircle2,
  Edit3,
  XCircle,
  Clock,
  User,
  ExternalLink,
  FileText,
  RefreshCw,
  AlertCircle,
  X,
} from 'lucide-react';
import { AppLayout } from '../layouts/AppLayout';
import type { ClinicalDecision, DecisionStatus, DecisionStats } from '../types/decision';
import { getRecentDecisions, getDecisionStats } from '../lib/decisions';
import { useAuth } from '../context/AuthContext';

export const DecisionSupportPage: React.FC = () => {
  const { user } = useAuth();
  const [decisions, setDecisions] = useState<ClinicalDecision[]>([]);
  const [stats, setStats] = useState<DecisionStats>({ total: 0, accepted: 0, modified: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | DecisionStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Audit Detail Modal
  const [selectedDecision, setSelectedDecision] = useState<ClinicalDecision | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [decisionsRes, statsRes] = await Promise.all([
        getRecentDecisions(50, statusFilter === 'all' ? undefined : statusFilter),
        getDecisionStats(),
      ]);

      if (decisionsRes.error) {
        setError(decisionsRes.error.message);
      } else {
        setDecisions(decisionsRes.data);
      }
      setStats(statsRes);
    } catch (err: any) {
      setError(err.message || 'Failed to load clinical decision records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  // Filtered decisions based on search input
  const filteredDecisions = decisions.filter((d) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const patientName = d.patient?.full_name?.toLowerCase() || '';
    const patientCode = d.patient?.patient_code?.toLowerCase() || '';
    const question = d.question.toLowerCase();
    const category = d.category?.toLowerCase() || '';
    return (
      patientName.includes(q) ||
      patientCode.includes(q) ||
      question.includes(q) ||
      category.includes(q)
    );
  });

  const clinicianName =
    user?.user_metadata?.full_name || (user?.email ? user.email.split('@')[0] : 'Dr. Clinician');

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 sm:gap-8 text-left">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1a102f] tracking-tight">
              Clinical Decision Support
            </h1>
            <p className="text-xs sm:text-sm text-[#665a7c] mt-1">
              Audit log and historical tracking for guideline-assisted clinical decisions.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-purple-200 bg-white hover:bg-purple-50 text-[#5b21b6] text-xs font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Log</span>
            </button>

            <Link
              to="/assistant"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#4a189a] hover:bg-[#3b127e] text-white text-xs font-bold shadow-md shadow-purple-950/15 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>New Clinical Query</span>
            </Link>
          </div>
        </div>

        {/* 4 Stat Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Total Decisions */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-purple-100 shadow-2xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-[#5b21b6] border border-purple-100/70 flex items-center justify-center shrink-0">
              <CheckSquare className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-[#74678b] block">Total Decisions</span>
              <span className="text-2xl font-extrabold text-[#1a102f]">
                {loading ? '...' : stats.total}
              </span>
            </div>
          </div>

          {/* Accepted */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-purple-100 shadow-2xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100/70 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-[#74678b] block">Accepted</span>
              <span className="text-2xl font-extrabold text-emerald-700">
                {loading ? '...' : stats.accepted}
              </span>
            </div>
          </div>

          {/* Modified */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-purple-100 shadow-2xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-[#5b21b6] border border-purple-100/70 flex items-center justify-center shrink-0">
              <Edit3 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-[#74678b] block">Modified</span>
              <span className="text-2xl font-extrabold text-[#5b21b6]">
                {loading ? '...' : stats.modified}
              </span>
            </div>
          </div>

          {/* Rejected */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-purple-100 shadow-2xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100/70 flex items-center justify-center shrink-0">
              <XCircle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-[#74678b] block">Rejected</span>
              <span className="text-2xl font-extrabold text-rose-700">
                {loading ? '...' : stats.rejected}
              </span>
            </div>
          </div>
        </div>

        {/* Filters & Search Row */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-purple-100/90 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {(
              [
                { id: 'all', label: 'All Decisions', count: stats.total },
                { id: 'accepted', label: 'Accepted', count: stats.accepted },
                { id: 'modified', label: 'Modified', count: stats.modified },
                { id: 'rejected', label: 'Rejected', count: stats.rejected },
              ] as const
            ).map((tab) => {
              const isActive = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-[#4a189a] text-white shadow-xs'
                      : 'text-[#675a7f] hover:text-[#1b122e] hover:bg-purple-50'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isActive ? 'bg-white/20 text-white' : 'bg-purple-100/60 text-[#5b21b6]'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-[#8a7d9f] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search patient, question, category..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-purple-200 bg-[#fdfcff] text-xs focus:bg-white focus:border-[#6d28d9] focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <div className="bg-white rounded-3xl p-8 border border-purple-100 shadow-2xs animate-pulse flex flex-col gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-purple-50 rounded-2xl" />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredDecisions.length === 0 && (
          <div className="bg-white rounded-3xl p-12 border border-purple-100 shadow-2xs text-center">
            <CheckSquare className="w-12 h-12 text-purple-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-[#1b122e] mb-1">
              No clinical decision records match your filter
            </h3>
            <p className="text-xs sm:text-sm text-[#73668b] max-w-sm mx-auto mb-4">
              Decisions will populate as you evaluate and accept, modify, or reject AI recommendations in the Clinical Assistant.
            </p>
            <Link
              to="/assistant"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#4a189a] text-white text-xs font-bold hover:bg-[#3b127e] transition-colors"
            >
              <span>Open Assistant</span>
            </Link>
          </div>
        )}

        {/* Decisions Table / List */}
        {!loading && !error && filteredDecisions.length > 0 && (
          <div className="bg-white rounded-3xl border border-purple-100/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-purple-100 bg-[#faf8fe] text-[#716588] font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4 sm:px-6">Patient</th>
                    <th className="py-3.5 px-4">Clinical Question</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Sources</th>
                    <th className="py-3.5 px-4">Recorded At</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-50">
                  {filteredDecisions.map((dec) => {
                    const formattedTime = new Date(dec.created_at).toLocaleString([], {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    });

                    return (
                      <tr
                        key={dec.id}
                        onClick={() => setSelectedDecision(dec)}
                        className="hover:bg-purple-50/40 transition-colors cursor-pointer"
                      >
                        {/* Patient Code & Name */}
                        <td className="py-4 px-4 sm:px-6">
                          <div className="font-bold text-[#1b122e]">
                            {dec.patient?.full_name || 'Assigned Patient'}
                          </div>
                          <div className="text-[10px] text-[#7a6e92] font-mono">
                            {dec.patient?.patient_code || dec.patient_id.slice(0, 8)}
                          </div>
                        </td>

                        {/* Clinical Question */}
                        <td className="py-4 px-4 max-w-xs">
                          <p className="font-semibold text-[#2b1f41] line-clamp-2 leading-relaxed">
                            {dec.question}
                          </p>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4">
                          {dec.decision_status === 'accepted' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>ACCEPTED</span>
                            </span>
                          )}
                          {dec.decision_status === 'modified' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-purple-50 text-[#5b21b6] border border-purple-200 font-mono">
                              <Edit3 className="w-3 h-3" />
                              <span>MODIFIED</span>
                            </span>
                          )}
                          {dec.decision_status === 'rejected' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 font-mono">
                              <XCircle className="w-3 h-3" />
                              <span>REJECTED</span>
                            </span>
                          )}
                        </td>

                        {/* Category */}
                        <td className="py-4 px-4">
                          <span className="text-[10px] text-[#6d28d9] px-2 py-0.5 rounded bg-purple-50/70 border border-purple-100 font-mono">
                            {dec.category || 'General'}
                          </span>
                        </td>

                        {/* Source Count */}
                        <td className="py-4 px-4 font-mono text-[#5b21b6]">
                          {dec.sources?.length || 0} cited
                        </td>

                        {/* Timestamp */}
                        <td className="py-4 px-4 text-[#786c8f] font-mono whitespace-nowrap">
                          {formattedTime}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-4 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDecision(dec);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-purple-200 bg-white hover:bg-purple-50 text-[#5b21b6] text-xs font-semibold shadow-2xs transition-colors"
                          >
                            <span>Audit Trail</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Audit Detail Modal */}
        {selectedDecision && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
              onClick={() => setSelectedDecision(null)}
            />

            <div className="relative bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-purple-100 z-10 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh] text-left">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-purple-100">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-[#6d28d9] uppercase tracking-wider font-mono">
                      Clinical Audit Record
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.2 rounded font-mono ${
                        selectedDecision.decision_status === 'accepted'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : selectedDecision.decision_status === 'modified'
                          ? 'bg-purple-50 text-[#5b21b6] border border-purple-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {selectedDecision.decision_status.toUpperCase()}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-[#1b122e]">
                    {selectedDecision.patient?.full_name || 'Patient'} ({selectedDecision.patient?.patient_code || 'ID'})
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedDecision(null)}
                  className="p-2 rounded-xl text-[#786b8f] hover:text-[#1b122e] hover:bg-purple-50 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="overflow-y-auto py-4 flex flex-col gap-4 flex-1 text-xs sm:text-sm">
                {/* Clinician and Timestamp Info */}
                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-purple-50/40 border border-purple-100 text-xs text-[#524567]">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-[#5b21b6]" />
                    <span>Clinician: <strong>{clinicianName}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#5b21b6]" />
                    <span>
                      {new Date(selectedDecision.created_at).toLocaleString([], {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                  </div>
                </div>

                {/* Question */}
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#73668b] block mb-1">
                    Question Evaluated
                  </span>
                  <p className="font-bold text-[#1b122e] p-3 rounded-xl bg-purple-50/30 border border-purple-100/60">
                    "{selectedDecision.question}"
                  </p>
                </div>

                {/* Final Decision */}
                {selectedDecision.decision_status !== 'rejected' && (
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#5b21b6] block mb-1">
                      {selectedDecision.decision_status === 'modified'
                        ? 'Clinician-Modified Final Decision'
                        : 'Accepted Recommendation'}
                    </span>
                    <div className="p-4 rounded-2xl bg-[#faf8fe] border border-purple-100 font-medium text-[#180e2a] leading-relaxed whitespace-pre-line text-xs sm:text-sm">
                      {selectedDecision.final_decision || selectedDecision.ai_answer}
                    </div>
                  </div>
                )}

                {/* Original AI Answer if Modified */}
                {selectedDecision.decision_status === 'modified' && (
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#73668b] block mb-1">
                      Original AI Answer (Audit History)
                    </span>
                    <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 text-[#54476a] leading-relaxed whitespace-pre-line text-xs">
                      {selectedDecision.ai_answer}
                    </div>
                  </div>
                )}

                {/* Rejection Details */}
                {selectedDecision.decision_status === 'rejected' && (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 block mb-1">
                      Rejection Rationale
                    </span>
                    <p className="text-xs sm:text-sm text-rose-950 font-medium italic mb-3">
                      "{selectedDecision.rejection_reason || 'No clinical rationale specified.'}"
                    </p>
                    <span className="text-[10px] font-bold uppercase text-rose-800/80 block mb-1">
                      Rejected AI Recommendation:
                    </span>
                    <p className="text-xs text-[#524567] bg-white/90 p-3 rounded-xl border border-rose-100 leading-relaxed whitespace-pre-line">
                      {selectedDecision.ai_answer}
                    </p>
                  </div>
                )}

                {/* Sources Referenced */}
                {selectedDecision.sources && selectedDecision.sources.length > 0 && (
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#6d28d9] block mb-2">
                      Guideline Evidence Sources ({selectedDecision.sources.length})
                    </span>
                    <div className="flex flex-col gap-2">
                      {selectedDecision.sources.map((src, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-2xl bg-white border border-purple-100 shadow-2xs flex flex-col gap-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="text-[10px] font-bold text-[#6d28d9] px-2 py-0.2 rounded bg-purple-50 border border-purple-100 font-mono">
                                  {src.organization}
                                </span>
                                {src.section && (
                                  <span className="text-[10px] font-semibold text-[#5b21b6] bg-purple-50/50 px-2 py-0.2 rounded">
                                    {src.section}
                                  </span>
                                )}
                                {src.page && (
                                  <span className="text-[10px] text-[#716588] font-mono">
                                    p. {src.page}
                                  </span>
                                )}
                              </div>
                              <h5 className="text-xs font-bold text-[#1b122e]">
                                {src.title}
                              </h5>
                            </div>
                          </div>

                          {src.excerpt && (
                            <p className="text-xs text-[#584a6f] italic bg-purple-50/30 p-2.5 rounded-xl border border-purple-100/50">
                              "{src.excerpt}"
                            </p>
                          )}

                          <div className="flex items-center justify-end gap-2 pt-1 border-t border-purple-50">
                            {src.pdf_url && (
                              <a
                                href={src.pdf_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                referrerPolicy="no-referrer"
                                className="inline-flex items-center gap-1 px-3 py-1 rounded-xl border border-purple-200 bg-white hover:bg-purple-50 text-xs font-semibold text-[#5b21b6] transition-colors"
                              >
                                <FileText className="w-3.5 h-3.5 text-purple-600" />
                                <span>Open PDF →</span>
                              </a>
                            )}
                            {(src.source_url || src.url) && (
                              <a
                                href={src.source_url || src.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                referrerPolicy="no-referrer"
                                className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-[#5b21b6] hover:bg-[#4c1d95] text-white text-xs font-semibold transition-colors"
                              >
                                <span>Open Official Source →</span>
                                <ExternalLink className="w-3 h-3 text-white/80" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-purple-100 flex items-center justify-between">
                {selectedDecision.patient_id && (
                  <Link
                    to={`/patients/${selectedDecision.patient_id}`}
                    className="text-xs font-bold text-[#6d28d9] hover:underline"
                  >
                    Open Patient Profile →
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedDecision(null)}
                  className="px-5 py-2 rounded-xl bg-purple-50 text-[#5b21b6] text-xs font-bold hover:bg-purple-100 transition-colors ml-auto cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};
