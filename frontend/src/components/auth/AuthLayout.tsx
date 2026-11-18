import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
  heading: string;
  subtitle: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  heading,
  subtitle,
}) => {
  return (
    <div className="min-h-screen bg-[#f7f4fc] flex flex-col justify-center items-center px-4 py-8 sm:py-12 relative overflow-hidden">
      {/* Ambient background glow shapes */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-purple-200/35 via-violet-100/25 to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-purple-300/15 rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* Floating back to home link (top-left) */}
      <div className="w-full max-w-[460px] mb-3 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#665a7c] hover:text-[#4a189a] transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Landing Page</span>
        </Link>
      </div>

      {/* Center Authentication Card */}
      <div className="w-full max-w-[460px] bg-white rounded-[2rem] p-7 sm:p-9 border border-purple-100/90 shadow-xl shadow-purple-950/5 relative z-10 transition-all">
        
        {/* Centered Clinical Navigator Logo (Clickable to /) */}
        <div className="flex flex-col items-center justify-center mb-6 text-center">
          <Link to="/" className="inline-flex flex-col items-center gap-2.5 group cursor-pointer" title="Return to home">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#4a189a] via-[#6d28d9] to-[#8b5cf6] p-0.5 shadow-md shadow-purple-900/15 flex items-center justify-center group-hover:scale-105 transition-transform">
              <svg 
                viewBox="0 0 24 24" 
                fill="none" 
                className="w-6 h-6 text-white transform transition-transform group-hover:rotate-12 duration-300"
                stroke="currentColor" 
                strokeWidth="2.2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M12 2v20M2 12h20" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
                <path d="m4.93 4.93 14.14 14.14" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
                <path d="M12 4a8 8 0 1 0 8 8 8 8 0 0 0-8-8Z" stroke="white" strokeWidth="2.2" strokeDasharray="16 6" />
                <circle cx="12" cy="12" r="3" fill="white" />
              </svg>
            </div>
            <span className="text-base font-bold text-[#1e1333] tracking-tight">
              Clinical <span className="text-[#5b21b6]">Navigator</span>
            </span>
          </Link>
        </div>

        {/* Heading & Subtitle */}
        <div className="text-center mb-7">
          <h1 className="text-2xl sm:text-[26px] font-extrabold text-[#1a102f] tracking-tight mb-1.5">
            {heading}
          </h1>
          <p className="text-xs sm:text-sm text-[#665a7c]">
            {subtitle}
          </p>
        </div>

        {/* Form Body */}
        {children}

      </div>

      {/* Subtle Bottom System Disclaimer */}
      <div className="mt-8 text-center text-[11px] text-[#867a9c] max-w-sm">
        Clinical Navigator Decision Support Platform • Certified Clinician Portal
      </div>
    </div>
  );
};
