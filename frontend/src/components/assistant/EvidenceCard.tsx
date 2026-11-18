import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, BookOpen, FileText, Quote, ChevronRight } from 'lucide-react';
import type { Source } from '../../types/assistant';
import { VerifiedBadge } from '../guidelines/VerifiedBadge';

interface EvidenceCardProps {
  source?: Source;
}

export const EvidenceCard: React.FC<EvidenceCardProps> = ({ source }) => {
  if (!source) {
    return null;
  }

  const officialUrl = source.source_url || source.url;
  const isVerified = source.is_verified ?? true;

  return (
    <div className="mt-3 p-4 rounded-2xl bg-white border border-purple-100 shadow-2xs flex flex-col gap-3 text-left transition-all hover:border-purple-200">
      {/* Top Header: Organization, Section, Page, Verified Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#6d28d9] px-2.5 py-0.5 rounded-lg bg-purple-50 border border-purple-100 font-mono">
            {source.organization}
          </span>

          {source.section && (
            <span className="text-[11px] font-semibold text-[#5b21b6] bg-purple-50/50 px-2 py-0.5 rounded-md border border-purple-100/60 max-w-[200px] truncate" title={source.section}>
              {source.section}
            </span>
          )}

          {source.page && (
            <span className="text-[11px] text-[#716588] font-mono bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
              p. {source.page}
            </span>
          )}

          {source.similarity !== undefined && source.similarity > 0 && (
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100">
              {Math.round(source.similarity * 100)}% match
            </span>
          )}
        </div>

        <VerifiedBadge isVerified={isVerified} size="sm" />
      </div>

      {/* Guideline Title */}
      <div className="flex items-start gap-2.5">
        <BookOpen className="w-4 h-4 text-[#5b21b6] shrink-0 mt-0.5" />
        {source.guideline_id ? (
          <Link
            to={`/guidelines/${source.guideline_id}`}
            className="text-xs sm:text-sm font-bold text-[#1b122e] hover:text-[#5b21b6] transition-colors leading-snug"
          >
            {source.title}
          </Link>
        ) : (
          <h4 className="text-xs sm:text-sm font-bold text-[#1b122e] leading-snug">
            {source.title}
          </h4>
        )}
      </div>

      {/* Relevant Evidence Excerpt */}
      {source.excerpt && (
        <div className="bg-purple-50/40 rounded-xl p-3 border border-purple-100/60 text-xs text-[#4b3f62] leading-relaxed relative flex items-start gap-2">
          <Quote className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5 rotate-180" />
          <p className="italic line-clamp-3">
            "{source.excerpt}"
          </p>
        </div>
      )}

      {/* Action Links */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-purple-50/80">
        {source.guideline_id ? (
          <Link
            to={`/guidelines/${source.guideline_id}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#5b21b6] hover:text-[#43148f] transition-colors"
          >
            <span>View Details</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        ) : <div />}

        <div className="flex flex-wrap items-center gap-2">
          {source.pdf_url && (
            <a
              href={source.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              referrerPolicy="no-referrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-purple-200/90 bg-white hover:bg-purple-50 text-xs font-semibold text-[#5b21b6] shadow-2xs transition-colors cursor-pointer"
              title="Open official PDF"
            >
              <FileText className="w-3.5 h-3.5 text-purple-600" />
              <span>Open PDF</span>
            </a>
          )}

          {officialUrl && (
            <a
              href={officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              referrerPolicy="no-referrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#5b21b6] hover:bg-[#4c1d95] text-white text-xs font-semibold transition-all shadow-2xs hover:shadow-xs cursor-pointer"
              title="Open official guideline website"
            >
              <span>View Source</span>
              <ExternalLink className="w-3 h-3 text-white/80" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
