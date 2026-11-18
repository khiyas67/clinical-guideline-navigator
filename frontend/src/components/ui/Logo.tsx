import React from 'react';
import { Link } from 'react-router-dom';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ 
  className = '', 
  size = 'md',
  showText = true 
}) => {
  const sizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
  };

  const textClasses = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
  };

  return (
    <Link to="/" className={`inline-flex items-center gap-2.5 group transition-opacity hover:opacity-90 ${className}`}>
      {/* Dynamic Purple Swirl/Helix Logo Icon */}
      <div className={`relative ${sizeClasses[size]} rounded-xl bg-gradient-to-tr from-[#4a189a] via-[#6d28d9] to-[#8b5cf6] p-0.5 shadow-md shadow-purple-900/15 flex items-center justify-center overflow-hidden`}>
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          className="w-5 h-5 text-white transform transition-transform group-hover:rotate-12 duration-300"
          stroke="currentColor" 
          strokeWidth="2.2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          {/* Medical compass / guideline sparkle spiral */}
          <path d="M12 2v20M2 12h20" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
          <path d="m4.93 4.93 14.14 14.14" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
          <path d="M12 4a8 8 0 1 0 8 8 8 8 0 0 0-8-8Z" stroke="white" strokeWidth="2.2" strokeDasharray="16 6" />
          <circle cx="12" cy="12" r="3" fill="white" />
        </svg>
      </div>

      {showText && (
        <span className={`font-bold tracking-tight text-[#1e1333] ${textClasses[size]}`}>
          Clinical <span className="text-[#5b21b6]">Navigator</span>
        </span>
      )}
    </Link>
  );
};
