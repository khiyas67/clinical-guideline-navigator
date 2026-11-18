import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckSquare,
  Sparkles,
  ExternalLink,
  FileText,
  Clock,
  RefreshCw,
  AlertCircle,
  Edit3,
  XCircle,
  CheckCircle2,
} from 'lucide-react';
import type { Patient } from '../../types/patient';
import type { ClinicalDecision } from '../../types/decision';
import { getPatientDecisions } from '../../lib/decisions';

interface PatientDecisionsTabProps {
  patient: Patient;
}

export const PatientDecisionsTab: React.FC<PatientDecisionsTabProps> = ({ patient }) => {
  const [decisions, setDecisions] = useState<ClinicalDecision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDecisions = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await getPatientDecisions(patient.id);
    if (error) {
      setError(error.message);
    } else {
      setDecisions(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadDecisions();
  }, [patient.id]);

  return (
    <div className="flex flex-col gap-6 text-left">
      {/* Header with Title and Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-[#1b122e]">
            Clinical Decision Audit Trail
          </h3>
          <p className="text-xs text-[#716588]">
            Evidence-based recommendations evaluated and recorded for this patient.
          </p>
        </div>

        <button
          type="button"
          onClick={loadDecisions}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-purple-200 bg-white hover:bg-purple-50 text-[#5b21b6] text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="flex flex-col gap-4">
          {[1, 2].map((n) => (
            <div
              key={n}
              className="p-6 rounded-3xl bg-white border border-purple-100 shadow-2xs animate-pulse flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-32 h-5 bg-purple-100/70 rounded" />
                <div className="w-24 h-4 bg-purple-100/50 rounded" />
              </div>
              <div className="w-3/4 h-5 bg-purple-100/80 rounded" />
              <div className="w-full h-16 bg-purple-50 rounded-2xl" />
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="p-6 rounded-3xl bg-rose-50 border border-rose-200 text-center">
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-rose-900 mb-1">Failed to load decisions</h4>
          <p className="text-xs text-rose-700 mb-4">{error}</p>
          <button
            type="button"
            onClick={loadDecisions}
            className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && decisions.length === 0 && (
        <div className="bg-white rounded-3xl p-12 border border-purple-100/90 shadow-sm text-center">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-[#5b21b6] flex items-center justify-center mx-auto mb-3">
            <CheckSquare className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#1b122e] mb-1">
            No clinical decisions recorded yet
          </h3>
          <p className="text-xs sm:text-sm text-[#6f6385] max-w-sm mx-auto mb-5">
            Query the clinical guideline assistant for {patient.full_name} and evaluate recommendations to build this patient's decision audit trail.
          </p>
          <Link
            to={`/assistant?patient=${patient.id}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#4a189a] hover:bg-[#3b127e] text-white text-xs font-bold transition-all shadow-xs"
          >
            <Sparkles className="w-4 h-4" />
            <span>Ask Clinical Question</span>
          </Link>
        </div>
      )}

      {/* Decisions List */}
      {!loading && !error && decisions.length > 0 && (
        <div className="flex flex-col gap-5">
          {decisions.map((dec) => {
            const formattedDate = new Date(dec.created_at).toLocaleString([], {
              dateStyle: 'medium',
              timeStyle: 'short',
            });

            return (
              <div
                key={dec.id}
                className="bg-white rounded-3xl p-6 sm:p-7 border border-purple-100/90 shadow-2xs hover:shadow-xs transition-all flex flex-col gap-4 text-left"
              >
                {/* Top Row: Status badge, Category, and Timestamp */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-purple-50">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Status Badge */}
                    {dec.decision_status === 'accepted' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Accepted</span>
                      </span>
                    )}

                    {dec.decision_status === 'modified' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-purple-50 text-[#5b21b6] border border-purple-200">
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Modified</span>
                      </span>
                    )}

                    {dec.decision_status === 'rejected' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Rejected</span>
                      </span>
                    )}

                    {dec.category && (
                      <span className="text-[10px] font-semibold text-[#6d28d9] px-2 py-0.5 rounded-md bg-purple-50/60 border border-purple-100 font-mono">
                        {dec.category}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-[#7e7295] font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formattedDate}</span>
                  </div>
                </div>

                {/* Clinical Question */}
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#7b6e92] block mb-1">
                    Clinical Question
                  </span>
                  <p className="text-sm font-bold text-[#1b122e] leading-snug">
                    {dec.question}
                  </p>
                </div>

                {/* Final Decision / Answer Section */}
                {dec.decision_status !== 'rejected' && (
                  <div className="p-4 rounded-2xl bg-[#faf8fe] border border-purple-100/70">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#5b21b6] block mb-1.5">
                      {dec.decision_status === 'modified'
                        ? 'Clinician-Modified Final Decision'
                        : 'Accepted Clinical Guidance'}
                    </span>
                    <p className="text-xs sm:text-sm text-[#1e1430] leading-relaxed whitespace-pre-line font-medium">
                      {dec.final_decision || dec.ai_answer}
                    </p>
                  </div>
                )}

                {/* If Modified, show original AI Answer below */}
                {dec.decision_status === 'modified' && dec.ai_answer && (
                  <details className="text-xs group">
                    <summary className="font-semibold text-[#7b6e92] hover:text-[#5b21b6] cursor-pointer transition-colors list-none flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      <span>View Original AI Recommendation</span>
                    </summary>
                    <div className="mt-2 p-3.5 rounded-xl bg-gray-50 border border-gray-100 text-[#4c3f62] leading-relaxed whitespace-pre-line">
                      {dec.ai_answer}
                    </div>
                  </details>
                )}

                {/* Rejection Details */}
                {dec.decision_status === 'rejected' && (
                  <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-100">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 block mb-1">
                      Rejection Rationale
                    </span>
                    <p className="text-xs sm:text-sm text-rose-900 font-medium leading-relaxed italic">
                      "{dec.rejection_reason || 'No specific clinical rationale entered by clinician.'}"
                    </p>
                    {dec.ai_answer && (
                      <details className="mt-2 text-xs">
                        <summary className="font-semibold text-rose-700/80 hover:text-rose-900 cursor-pointer list-none flex items-center gap-1">
                          <span>View Rejected AI Recommendation</span>
                        </summary>
                        <div className="mt-1.5 p-3 rounded-xl bg-white/80 border border-rose-100 text-[#4c3f62] leading-relaxed whitespace-pre-line">
                          {dec.ai_answer}
                        </div>
                      </details>
                    )}
                  </div>
                )}

                {/* Referenced Guideline Sources */}
                {dec.sources && dec.sources.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#6d28d9] block mb-2">
                      Referenced Guideline Evidence ({dec.sources.length})
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {dec.sources.map((src, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-2xl bg-white border border-purple-100 shadow-2xs flex flex-col justify-between gap-2"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="text-[9px] font-bold text-[#6d28d9] px-2 py-0.2 rounded bg-purple-50 border border-purple-100 font-mono">
                                {src.organization}
                              </span>
                              {src.page && (
                                <span className="text-[9px] text-[#716588] font-mono">
                                  p. {src.page}
                                </span>
                              )}
                            </div>
                            <h5 className="text-xs font-bold text-[#1b122e] line-clamp-1">
                              {src.title}
                            </h5>
                            {src.section && (
                              <p className="text-[10px] text-[#5b21b6] font-medium line-clamp-1 mt-0.5">
                                {src.section}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-1 border-t border-purple-50">
                            {src.pdf_url && (
                              <a
                                href={src.pdf_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                referrerPolicy="no-referrer"
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-purple-200 bg-white hover:bg-purple-50 text-[10px] font-semibold text-[#5b21b6] transition-colors"
                              >
                                <FileText className="w-3 h-3 text-purple-600" />
                                <span>PDF</span>
                              </a>
                            )}
                            {(src.source_url || src.url) && (
                              <a
                                href={src.source_url || src.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                referrerPolicy="no-referrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#5b21b6] hover:bg-[#4c1d95] text-white text-[10px] font-semibold transition-colors"
                              >
                                <span>Source</span>
                                <ExternalLink className="w-2.5 h-2.5 text-white/80" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
