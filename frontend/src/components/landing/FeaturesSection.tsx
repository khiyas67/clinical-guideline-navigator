import React from 'react';
import { FileCheck, UserCheck, ExternalLink, ArrowUpRight } from 'lucide-react';

export const FeaturesSection: React.FC = () => {
  const features = [
    {
      title: 'Evidence-Based Answers',
      icon: <FileCheck className="w-6 h-6 text-[#5b21b6]" />,
      description: 'Get concise answers grounded in relevant clinical guidelines.',
      tag: 'Guideline Grounded',
      highlight: 'Extracts synthesized answers directly from verified guidelines without generative hallucinations.',
    },
    {
      title: 'Patient-Aware Context',
      icon: <UserCheck className="w-6 h-6 text-[#5b21b6]" />,
      description: "Ask questions in the context of the selected patient's information.",
      tag: 'Clinical Alignment',
      highlight: 'Tailors responses according to age, diagnosis, co-morbidities, and specific patient parameters.',
    },
    {
      title: 'Transparent References',
      icon: <ExternalLink className="w-6 h-6 text-[#5b21b6]" />,
      description: 'Review the original guideline source before making a clinical decision.',
      tag: 'Auditable Citations',
      highlight: 'Every answer includes direct source links, guideline versions, and relevant section identifiers.',
    },
  ];

  return (
    <section id="features" className="py-20 sm:py-28 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100/70 text-[#4a189a] text-xs font-semibold uppercase tracking-wider mb-4">
            Core Capabilities
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1a102f] tracking-tight mb-5">
            Navigate Guidelines With Confidence
          </h2>
          <p className="text-base sm:text-lg text-[#5a4e6e] leading-relaxed">
            Clinical Navigator empowers clinicians to find relevant guideline evidence quickly, navigate complex recommendations, and substantiate clinical decisions with clear, traceable references.
          </p>
        </div>

        {/* 3 Premium Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group relative bg-white rounded-3xl p-8 sm:p-9 border border-purple-100/80 shadow-md shadow-purple-950/5 hover:shadow-xl hover:shadow-purple-900/10 hover:border-purple-300 transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between"
            >
              {/* Top Accent Gradient Pill */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-100 to-purple-50 group-hover:from-purple-200 group-hover:to-purple-100 flex items-center justify-center transition-colors shadow-xs">
                    {feature.icon}
                  </div>
                  <span className="text-[11px] font-semibold tracking-wide uppercase px-2.5 py-1 rounded-full bg-purple-50 text-[#5b21b6] border border-purple-100">
                    {feature.tag}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-[#1b122e] mb-3 group-hover:text-[#4a189a] transition-colors">
                  {feature.title}
                </h3>

                <p className="text-base text-[#4d4261] font-medium mb-4 leading-normal">
                  {feature.description}
                </p>

                <p className="text-xs text-[#736787] leading-relaxed">
                  {feature.highlight}
                </p>
              </div>

              {/* Bottom Subtle Interaction Link */}
              <div className="pt-6 mt-6 border-t border-purple-100/60 flex items-center justify-between text-xs font-semibold text-[#5b21b6] group-hover:text-[#4a189a]">
                <span>Explore capability</span>
                <span className="w-6 h-6 rounded-full bg-purple-50 group-hover:bg-[#4a189a] group-hover:text-white flex items-center justify-center transition-all duration-200">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
