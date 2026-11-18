import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, FileText, Calendar, Building2, ChevronRight, Info } from 'lucide-react';
import type { Guideline } from '../../types/guideline';
import { VerifiedBadge } from './VerifiedBadge';

interface GuidelineCardProps {
  guideline: Guideline;
}

export const GuidelineCard: React.FC<GuidelineCardProps> = ({ guideline }) => {
  // Format updated/publication date
  const displayDate = guideline.last_updated || guideline.publication_date;
  const formattedDate = displayDate
    ? new Date(displayDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
      })
    : null;

  return (
    <div className="group bg-white rounded-2xl p-5 sm:p-6 border border-purple-100/90 shadow-xs hover:shadow-md hover:border-purple-200 transition-all duration-200 flex flex-col justify-between h-full">
      <div>
        {/* Top Badges Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-purple-50 text-[#5b21b6] border border-purple-100 font-mono">
              <Building2 className="w-3 h-3 text-[#6d28d9]" />
              {guideline.organization}
            </span>

            {guideline.category &&
              guideline.category
                .split(/[,;/|]+/)
                .map((c) => c.trim())
                .filter(Boolean)
                .map((cat) => (
                  <span
                    key={cat}
                    className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-gray-50 text-gray-700 border border-gray-100"
                  >
                    {cat}
                  </span>
                ))}
          </div>

          {/* Verified Badge or Supporting Reference Badge */}
          {guideline.is_verified ? (
            <VerifiedBadge isVerified={true} />
          ) : guideline.document_type === 'Supporting Clinical Reference' ? (
            <span
              className="inline-flex items-center gap-1.5 font-medium rounded-full bg-amber-50 text-amber-700 border border-amber-200/80 px-2.5 py-0.5 text-[11px] shadow-2xs select-none"
              title="Supporting clinical reference — community/secondary evidence"
            >
              <Info className="w-3 h-3 text-amber-600 shrink-0" />
              <span>Supporting Reference</span>
            </span>
          ) : null}
        </div>

        {/* Guideline Title */}
        <Link
          to={`/guidelines/${guideline.id}`}
          className="block group-hover:text-[#5b21b6] transition-colors"
        >
          <h3 className="text-base sm:text-lg font-bold text-[#1b122e] leading-snug line-clamp-2">
            {guideline.title}
          </h3>
        </Link>

        {/* Version & Date Metadata */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-[#716588] mt-2 mb-3">
          {guideline.version && (
            <span className="font-medium bg-purple-50/50 px-2 py-0.5 rounded text-[#5b21b6]">
              Ref: {guideline.version}
            </span>
          )}
          {formattedDate && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3 h-3 text-purple-400" />
              Updated: {formattedDate}
            </span>
          )}
          <span className="text-[11px] font-medium text-gray-400">
            • {guideline.document_type}
          </span>
        </div>

        {/* Short Description */}
        {guideline.description && (
          <p className="text-xs sm:text-sm text-[#5f5376] leading-relaxed line-clamp-3 mb-4">
            {guideline.description}
          </p>
        )}
      </div>

      {/* Card Actions Footer */}
      <div className="pt-4 border-t border-purple-50/80 flex flex-wrap items-center justify-between gap-2.5 mt-auto">
        <Link
          to={`/guidelines/${guideline.id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#5b21b6] hover:text-[#43148f] transition-colors"
        >
          <span>View Details</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>

        <div className="flex items-center gap-2">
          {/* Action: Open PDF if direct official PDF available */}
          {guideline.pdf_url ? (
            <a
              href={guideline.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              referrerPolicy="no-referrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-purple-200/90 bg-white hover:bg-purple-50/70 text-xs font-semibold text-[#5b21b6] transition-colors shadow-2xs cursor-pointer"
              title="Open verified official PDF in new tab"
            >
              <FileText className="w-3.5 h-3.5 text-purple-600" />
              <span>Open PDF ↗</span>
            </a>
          ) : guideline.source_url ? (
            /* Fallback Action: Open Official Guideline Landing Page */
            <a
              href={guideline.source_url}
              target="_blank"
              rel="noopener noreferrer"
              referrerPolicy="no-referrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#5b21b6] hover:bg-[#4c1d95] text-white text-xs font-semibold transition-all shadow-xs hover:shadow-purple-900/15 cursor-pointer"
              title="Open official guideline website in new tab"
            >
              <span>Open Official Guideline ↗</span>
              <ExternalLink className="w-3 h-3 text-white/80" />
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
};
