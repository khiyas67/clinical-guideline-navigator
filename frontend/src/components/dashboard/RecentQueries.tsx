import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, CheckCircle2, XCircle, Edit3, CheckSquare } from 'lucide-react';
import type { ClinicalDecision } from '../../types/decision';

interface RecentQueriesProps {
  decisions?: ClinicalDecision[];
  loading?: boolean;
}

export const RecentQueries: React.FC<RecentQueriesProps> = ({
  decisions = [],
  loading = false,
}) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-2xl p-6 border border-purple-100/90 shadow-sm shadow-purple-950/5 flex flex-col justify-between h-full text-left">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-purple-50 mb-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#1b122e]">
              Recent Clinical Decisions
            </h2>
            <p className="text-xs text-[#716588]">
              Evaluated and saved guideline guidance
            </p>
          </div>
          <Link
            to="/decision-support"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#5b21b6] hover:text-[#3b127e] hover:underline transition-colors"
          >
            <span>View audit log</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col gap-3 py-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-purple-50/70 rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && decisions.length === 0 && (
          <div className="py-10 text-center flex flex-col items-center justify-center">
            <CheckSquare className="w-10 h-10 text-purple-200 mb-2" />
            <p className="text-xs font-semibold text-[#1b122e]">No clinical decisions recorded yet</p>
            <p className="text-[11px] text-[#716588] max-w-xs mt-0.5 mb-4">
              Query the Clinical Assistant and accept, modify, or reject recommendations to build your patient decision audit trail.
            </p>
            <Link
              to="/assistant"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#4a189a] text-white text-xs font-bold hover:bg-[#3b127e] transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Open Assistant</span>
            </Link>
          </div>
        )}

        {/* Real Decisions List */}
        {!loading && decisions.length > 0 && (
          <div className="flex flex-col divide-y divide-purple-50">
            {decisions.slice(0, 5).map((d) => {
              const formattedTime = new Date(d.created_at).toLocaleString([], {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={d.id}
                  onClick={() => navigate('/decision-support')}
                  className="py-3 px-2 sm:px-3 -mx-2 rounded-xl hover:bg-purple-50/70 transition-colors flex items-center justify-between gap-3 cursor-pointer group"
                >
                  {/* Left: Sparkle icon & Question info */}
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 group-hover:bg-purple-100 text-[#5b21b6] flex items-center justify-center shrink-0 mt-0.5 transition-colors">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>

                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-semibold text-[#1b122e] group-hover:text-[#5b21b6] transition-colors line-clamp-1">
                        {d.question}
                      </div>
                      <div className="text-[11px] text-[#716588] mt-0.5">
                        Patient:{' '}
                        <span className="font-medium text-[#2d2242]">
                          {d.patient?.full_name || 'Patient'}
                        </span>{' '}
                        • {formattedTime}
                      </div>
                    </div>
                  </div>

                  {/* Right: Status Badge */}
                  <div className="shrink-0 flex items-center gap-2">
                    {d.decision_status === 'accepted' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold font-mono">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>ACCEPTED</span>
                      </span>
                    )}

                    {d.decision_status === 'modified' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-50 text-[#5b21b6] border border-purple-200 text-[10px] font-bold font-mono">
                        <Edit3 className="w-3 h-3" />
                        <span>MODIFIED</span>
                      </span>
                    )}

                    {d.decision_status === 'rejected' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold font-mono">
                        <XCircle className="w-3 h-3" />
                        <span>REJECTED</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
