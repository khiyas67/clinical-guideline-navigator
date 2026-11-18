import React from 'react';
import { BookOpen, FileCheck, UserCheck, ShieldCheck } from 'lucide-react';

export const StatsSection: React.FC = () => {
  const valueItems = [
    {
      title: 'Guidelines',
      label: 'Relevant clinical guideline sources',
      icon: <BookOpen className="w-6 h-6 text-[#5b21b6]" />,
      detail: 'Indexed repository of authoritative clinical documents structured for fast semantic navigation.',
    },
    {
      title: 'Evidence',
      label: 'Guideline-grounded clinical information',
      icon: <FileCheck className="w-6 h-6 text-[#5b21b6]" />,
      detail: 'Synthesized answers tied directly to specific sections of trusted medical guidelines.',
    },
    {
      title: 'Patient Context',
      label: 'Patient-specific clinical context',
      icon: <UserCheck className="w-6 h-6 text-[#5b21b6]" />,
      detail: 'Contextual queries adapted to patient age, condition parameters, and clinical history.',
    },
    {
      title: 'Clinical Decisions',
      label: 'Clinician-reviewed decisions',
      icon: <ShieldCheck className="w-6 h-6 text-[#5b21b6]" />,
      detail: 'Structured decision records ensuring final medical discretion remains with the qualified healthcare provider.',
    },
  ];

  return (
    <section id="value" className="py-16 sm:py-24 bg-white/50 border-t border-purple-100/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="inline-block px-3 py-1 rounded-full bg-purple-100/70 text-[#4a189a] text-xs font-semibold uppercase tracking-wider mb-3">
            Platform Pillars
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1a102f] tracking-tight">
            Designed for Clinical Precision
          </h2>
          <p className="mt-3 text-base text-[#5c5072]">
            Core structural components ensuring every query is grounded, context-aware, and clinician-guided.
          </p>
        </div>

        {/* 4 Value Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {valueItems.map((item) => (
            <div
              key={item.title}
              className="bg-white rounded-3xl p-7 border border-purple-100/90 shadow-sm hover:shadow-lg hover:border-purple-300 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center mb-5 text-[#5b21b6]">
                  {item.icon}
                </div>

                <div className="text-xs font-bold uppercase tracking-wider text-[#7c3aed] mb-1.5">
                  {item.title}
                </div>

                <h3 className="text-lg font-bold text-[#1b122e] mb-3 leading-snug">
                  {item.label}
                </h3>

                <p className="text-xs text-[#5e5374] leading-relaxed">
                  {item.detail}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-purple-50 flex items-center gap-2 text-[11px] font-medium text-[#7c3aed]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#7c3aed]" />
                <span>Verified Foundation</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
