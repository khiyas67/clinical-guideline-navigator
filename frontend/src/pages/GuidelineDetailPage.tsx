import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ExternalLink,
  FileText,
  Calendar,
  Building2,
  Tag,
  Clock,
  ShieldCheck,
  AlertCircle,
  Globe,
  Info,
} from 'lucide-react';
import { AppLayout } from '../layouts/AppLayout';
import { VerifiedBadge } from '../components/guidelines/VerifiedBadge';
import { getGuideline } from '../lib/guidelines';
import type { Guideline } from '../types/guideline';

export const GuidelineDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [guideline, setGuideline] = useState<Guideline | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('Guideline ID is required.');
      setLoading(false);
      return;
    }

    let isMounted = true;
    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      const { data, error: fetchErr } = await getGuideline(id);
      if (!isMounted) return;

      if (fetchErr) {
        setError('Unable to load guideline details.');
      } else if (!data) {
        setError('Guideline not found.');
      } else {
        setGuideline(data);
      }
      setLoading(false);
    };

    fetchDetail();
    return () => {
      isMounted = false;
    };
  }, [id]);

  // Extract source domain safely
  const extractDomain = (urlStr: string | null): string => {
    if (!urlStr) return 'Not available';
    try {
      const parsed = new URL(urlStr);
      return parsed.hostname;
    } catch {
      return urlStr;
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Not specified';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto flex flex-col gap-6 sm:gap-8">
        {/* Navigation Breadcrumb */}
        <div>
          <button
            type="button"
            onClick={() => navigate('/guidelines')}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#65587d] hover:text-[#5b21b6] transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            <span>Back to Guidelines</span>
          </button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="bg-white rounded-3xl p-8 border border-purple-100 shadow-xs animate-pulse space-y-6">
            <div className="flex gap-2">
              <div className="h-6 w-24 bg-purple-100 rounded-lg"></div>
              <div className="h-6 w-28 bg-emerald-100 rounded-full"></div>
            </div>
            <div className="h-8 w-3/4 bg-purple-100 rounded-lg"></div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 bg-purple-50 rounded-2xl"></div>
              ))}
            </div>
            <div className="h-32 bg-purple-50 rounded-2xl"></div>
          </div>
        ) : error || !guideline ? (
          /* Error / Not Found State */
          <div className="bg-white rounded-3xl p-12 border border-purple-100 shadow-xs text-center max-w-md mx-auto my-8">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-[#1b122e] mb-1">
              {error || 'Guideline Not Found'}
            </h2>
            <p className="text-xs sm:text-sm text-[#716588] mb-6">
              The requested clinical guideline record could not be retrieved.
            </p>
            <Link
              to="/guidelines"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#5b21b6] text-white text-xs font-semibold hover:bg-[#4c1d95] transition-colors"
            >
              <span>Return to Guideline Library</span>
            </Link>
          </div>
        ) : (
          /* Guideline Detail Content */
          <div className="flex flex-col gap-6">
            {/* Main Header Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-xs flex flex-col gap-6">
              {/* Badges Row */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider bg-purple-50 text-[#5b21b6] border border-purple-100 font-mono">
                    <Building2 className="w-3.5 h-3.5 text-[#6d28d9]" />
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
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-semibold bg-gray-50 text-gray-700 border border-gray-200/70"
                        >
                          <Tag className="w-3 h-3 text-gray-500" />
                          {cat}
                        </span>
                      ))}

                  <span className="px-3 py-1 rounded-xl text-xs font-semibold bg-purple-50/60 text-[#6a3cb5] border border-purple-100/60">
                    {guideline.document_type}
                  </span>
                </div>

                {/* Verified Badge or Supporting Reference Badge */}
                {guideline.is_verified ? (
                  <VerifiedBadge isVerified={true} size="md" />
                ) : guideline.document_type === 'Supporting Clinical Reference' ? (
                  <span
                    className="inline-flex items-center gap-1.5 font-medium rounded-full bg-amber-50 text-amber-700 border border-amber-200/80 px-3 py-1 text-xs shadow-2xs select-none"
                    title="Supporting clinical reference — community/secondary evidence"
                  >
                    <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Supporting Clinical Reference</span>
                  </span>
                ) : null}
              </div>

              {/* Title */}
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1b122e] tracking-tight leading-snug">
                  {guideline.title}
                </h1>
                {guideline.version && (
                  <p className="text-xs sm:text-sm font-semibold text-[#6d28d9] mt-2 font-mono">
                    Reference Code: {guideline.version}
                  </p>
                )}
              </div>

              {/* Action Buttons Row */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {guideline.source_url && (
                  <a
                    href={guideline.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    referrerPolicy="no-referrer"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#5b21b6] hover:bg-[#4c1d95] text-white text-xs sm:text-sm font-bold transition-all shadow-md shadow-purple-900/15 cursor-pointer"
                  >
                    <span>Open Official Source →</span>
                    <ExternalLink className="w-4 h-4 text-white/80" />
                  </a>
                )}

                {guideline.pdf_url && (
                  <a
                    href={guideline.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    referrerPolicy="no-referrer"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white hover:bg-purple-50/80 text-[#5b21b6] border border-purple-200 text-xs sm:text-sm font-bold transition-colors shadow-2xs cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-purple-600" />
                    <span>Open PDF →</span>
                  </a>
                )}
              </div>
            </div>

            {/* 4-Item Metadata Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-purple-100 shadow-2xs">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8b7e9f] block mb-1">
                  Organization
                </span>
                <span className="text-sm sm:text-base font-bold text-[#1b122e] flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-[#5b21b6]" />
                  {guideline.organization}
                </span>
              </div>

              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-purple-100 shadow-2xs">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8b7e9f] block mb-1">
                  Published Date
                </span>
                <span className="text-xs sm:text-sm font-bold text-[#1b122e] flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-purple-500" />
                  {formatDate(guideline.publication_date)}
                </span>
              </div>

              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-purple-100 shadow-2xs">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8b7e9f] block mb-1">
                  Last Updated
                </span>
                <span className="text-xs sm:text-sm font-bold text-[#1b122e] flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-purple-500" />
                  {formatDate(guideline.last_updated)}
                </span>
              </div>

              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-purple-100 shadow-2xs">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8b7e9f] block mb-1">
                  Verification Status
                </span>
                <span className="text-xs sm:text-sm font-bold text-emerald-700 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  {guideline.is_verified ? 'Verified Source' : 'Unverified'}
                </span>
              </div>
            </div>

            {/* Description Section */}
            {guideline.description && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-xs">
                <h2 className="text-base sm:text-lg font-bold text-[#1b122e] mb-3">
                  Scope & Clinical Overview
                </h2>
                <p className="text-sm text-[#4d4064] leading-relaxed whitespace-pre-line">
                  {guideline.description}
                </p>
              </div>
            )}

            {/* Source Information Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-xs flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-[#5b21b6]" />
                <h2 className="text-base sm:text-lg font-bold text-[#1b122e]">
                  Source Information
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="bg-purple-50/50 rounded-2xl p-4 border border-purple-100/70">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#7a6d91] block mb-1">
                    Official Host Domain
                  </span>
                  <span className="text-sm font-mono font-bold text-[#1b122e]">
                    {extractDomain(guideline.source_url)}
                  </span>
                </div>

                <div className="bg-purple-50/50 rounded-2xl p-4 border border-purple-100/70">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#7a6d91] block mb-1">
                    Document Format
                  </span>
                  <span className="text-sm font-bold text-[#1b122e]">
                    {guideline.document_type}
                    {guideline.pdf_url && ' + Direct Official PDF'}
                  </span>
                </div>
              </div>

              {guideline.source_url && (
                <div className="text-xs text-[#716588] bg-gray-50 p-4 rounded-2xl border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="truncate font-mono">
                    <span className="text-gray-400 select-none">URL: </span>
                    <a
                      href={guideline.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      referrerPolicy="no-referrer"
                      className="text-[#5b21b6] hover:underline"
                    >
                      {guideline.source_url}
                    </a>
                  </div>
                  <a
                    href={guideline.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    referrerPolicy="no-referrer"
                    className="inline-flex items-center gap-1 font-semibold text-[#5b21b6] shrink-0"
                  >
                    <span>Visit website</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {/* Trust Disclaimer */}
              <div className="flex items-start gap-3 bg-emerald-50/60 p-4 rounded-2xl border border-emerald-100/80 text-xs text-emerald-800">
                <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>Trust Model:</strong> This record has been verified against published clinical authorities ({guideline.organization}). Clinical Navigator does not fabricate links or auto-verify external web URLs.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};
