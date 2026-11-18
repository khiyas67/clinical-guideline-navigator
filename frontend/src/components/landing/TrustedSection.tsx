import React from 'react';
import { Landmark, Globe, Activity, Building2, Stethoscope } from 'lucide-react';

export const TrustedSection: React.FC = () => {
  const organizations = [
    {
      name: 'World Health Organization',
      fullName: 'WHO Global Health Norms & Standards',
      icon: <Globe className="w-5 h-5 text-[#5b21b6]" />,
      badge: 'Global',
    },
    {
      name: 'CDC',
      fullName: 'Centers for Disease Control and Prevention',
      icon: <Stethoscope className="w-5 h-5 text-[#5b21b6]" />,
      badge: 'US',
    },
    {
      name: 'NIH / NLM',
      fullName: 'National Institutes of Health Clinical Guidelines',
      icon: <Building2 className="w-5 h-5 text-[#5b21b6]" />,
      badge: 'Global',
    },
    {
      name: 'International Guidelines',
      fullName: 'Evidence-Based Global Clinical Guidelines',
      icon: <Activity className="w-5 h-5 text-[#5b21b6]" />,
      badge: 'Open',
    },
    {
      name: 'Public Health Authorities',
      fullName: 'Verified Public Clinical Evidence Repositories',
      icon: <Landmark className="w-5 h-5 text-[#5b21b6]" />,
      badge: 'Verified',
    },
  ];

  return (
    <section id="guidelines" className="py-12 sm:py-16 border-y border-purple-200/40 bg-white/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        
        {/* Subtle Section Label */}
        <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#6d5f85] mb-8">
          Trusted clinical guidance from leading organizations
        </p>

        {/* Organizations Grid */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 lg:gap-8">
          {organizations.map((org) => (
            <div
              key={org.name}
              title={org.fullName}
              className="group flex items-center gap-3 px-4 sm:px-5 py-3 rounded-2xl bg-white border border-purple-100/90 shadow-xs hover:shadow-md hover:border-purple-300 transition-all duration-200 hover:-translate-y-0.5"
            >
              <div className="w-8 h-8 rounded-xl bg-purple-50 group-hover:bg-purple-100/80 flex items-center justify-center transition-colors">
                {org.icon}
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-[#1e1333] group-hover:text-[#4a189a] transition-colors flex items-center gap-2">
                  {org.name}
                  <span className="text-[10px] font-medium px-1.5 py-0.2 rounded-md bg-purple-100/60 text-[#5b21b6]">
                    {org.badge}
                  </span>
                </div>
                <div className="text-[11px] text-[#716685] max-w-[170px] truncate hidden sm:block">
                  {org.fullName}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Subtle Tagline Bar from UI Reference */}
        <div className="mt-12 flex items-center justify-center gap-4 text-xs text-[#807497]">
          <div className="h-px w-12 sm:w-24 bg-gradient-to-r from-transparent to-purple-200" />
          <span className="font-medium tracking-wide">Modern AI for a healthier tomorrow</span>
          <div className="h-px w-12 sm:w-24 bg-gradient-to-l from-transparent to-purple-200" />
        </div>

      </div>
    </section>
  );
};
