import React from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../ui/Logo';

export const Footer: React.FC = () => {
  return (
    <footer id="about" className="border-t border-purple-200/50 bg-white/70 py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-10 border-b border-purple-100">
          
          {/* Left: Brand & Statement */}
          <div className="max-w-sm">
            <Logo size="md" />
            <p className="mt-3 text-xs sm:text-sm text-[#615576] leading-relaxed">
              AI-assisted clinical guideline navigation platform. Helping clinicians find concise, evidence-based answers from trusted sources for selected patient cases.
            </p>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-wrap items-center gap-6 sm:gap-8 text-sm font-medium text-[#463a5a]">
            <a href="#features" className="hover:text-[#4a189a] transition-colors">
              Product
            </a>
            <a href="#guidelines" className="hover:text-[#4a189a] transition-colors">
              Guidelines
            </a>
            <a href="#value" className="hover:text-[#4a189a] transition-colors">
              Platform
            </a>
            <a href="#about" className="hover:text-[#4a189a] transition-colors">
              About
            </a>
            <Link to="/privacy" className="hover:text-[#4a189a] transition-colors">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-[#4a189a] transition-colors">
              Terms
            </Link>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#7c7092]">
          <div>
            © 2026 Clinical Navigator. All rights reserved.
          </div>
          <div className="text-center sm:text-right">
            Clinical Guideline Navigation & Decision Support System • Step 1 Foundation
          </div>
        </div>

      </div>
    </footer>
  );
};
