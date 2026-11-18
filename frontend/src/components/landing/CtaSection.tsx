import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';

export const CtaSection: React.FC = () => {
  return (
    <section className="py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Deep Purple Gradient Container */}
        <div className="relative rounded-[2.5rem] bg-gradient-to-br from-[#2a0e52] via-[#3d1473] to-[#4e1b91] p-10 sm:p-14 lg:p-18 text-white shadow-2xl shadow-purple-950/25 overflow-hidden text-center">
          
          {/* Ambient Decorative Lighting */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-8 left-12 text-purple-300/40 pointer-events-none">
            <Sparkles className="w-8 h-8" />
          </div>

          <div className="relative z-10 max-w-2xl mx-auto">
            {/* Top Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-purple-200 text-xs font-medium mb-6">
              <Sparkles className="w-3.5 h-3.5 text-purple-300" />
              <span>Next Generation Decision Support</span>
            </div>

            {/* Main CTA Heading */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-6 leading-tight">
              Make Every Clinical Question Easier to Navigate.
            </h2>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-purple-100/90 leading-relaxed mb-10 max-w-xl mx-auto">
              Find relevant evidence, review the source, and make the final decision with confidence.
            </p>

            {/* CTA Button */}
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button
                to="/signup"
                variant="secondary"
                size="lg"
                icon={<ArrowRight className="w-4 h-4 ml-1" />}
                className="font-bold text-[#3d1473] hover:text-[#2a0e52] bg-white hover:bg-purple-50 px-8 py-3.5 shadow-lg shadow-black/20"
              >
                Get Started
              </Button>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
