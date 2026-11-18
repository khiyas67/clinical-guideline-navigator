import React from 'react';
import { ArrowRight, Sparkles, BookOpen, ShieldCheck, HeartPulse } from 'lucide-react';
import { Button } from '../ui/Button';
import heroImage from '../../assets/hero-clinician.jpg';

export const HeroSection: React.FC = () => {
  return (
    <section className="relative pt-10 sm:pt-16 pb-16 sm:pb-24 overflow-hidden">
      {/* Soft lavender atmospheric ambient background lights */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-purple-200/40 via-violet-100/30 to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute top-40 right-10 w-[450px] h-[450px] bg-purple-300/20 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Headline and CTAs (lg:col-span-7) */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#1a102f] tracking-tight leading-[1.12] mb-6">
              Evidence-Based <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4a189a] via-[#6d28d9] to-[#7c3aed]">
                Care, Made Simple.
              </span>
            </h1>

            {/* Supporting Text */}
            <p className="text-base sm:text-lg text-[#554a67] max-w-xl mb-8 leading-relaxed">
              Your AI-powered clinical guideline navigator. Find, understand, and apply trusted medical guidelines faster, safer, and with confidence.
            </p>

            {/* CTA Button */}
            <div className="flex items-center w-full sm:w-auto">
              <Button
                to="/signup"
                variant="primary"
                size="lg"
                icon={<ArrowRight className="w-4 h-4 ml-1" />}
                className="w-full sm:w-auto font-semibold px-8 py-3.5 text-base shadow-md shadow-purple-950/15"
              >
                Get Started
              </Button>
            </div>

            {/* Subtle trust indicator */}
            <div className="mt-10 pt-6 border-t border-purple-200/50 flex items-center gap-6 text-xs text-[#716685]">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#6d28d9]" />
                <span>Auditable Guideline Citations</span>
              </div>
              <div className="h-3 w-px bg-purple-200" />
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#8b5cf6]" />
                <span>Clinician-in-the-Loop</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual & Floating Cards (lg:col-span-5) */}
          <div className="lg:col-span-5 relative flex justify-center items-center">
            
            {/* Visual Canvas Container */}
            <div className="relative w-full max-w-[420px] sm:max-w-[460px] aspect-[4/4.5] flex items-center justify-center">
              
              {/* Layered fluid purple background shapes */}
              <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-tr from-[#ede8f8] via-[#e5ddf6] to-[#f4f0fb] transform -rotate-1 shadow-inner border border-purple-200/40" />
              <div className="absolute -inset-2 bg-gradient-to-br from-purple-400/15 via-transparent to-indigo-400/10 rounded-[3rem] blur-xl -z-10" />

              {/* Decorative sparkle shapes */}
              <div className="absolute top-4 right-6 text-purple-400 opacity-80 animate-pulse">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="absolute bottom-16 left-4 text-purple-300 opacity-60">
                <Sparkles className="w-4 h-4" />
              </div>

              {/* Clinician Portrait */}
              <div className="relative z-10 w-[82%] h-[88%] rounded-[2rem] overflow-hidden shadow-2xl shadow-purple-950/20 border-2 border-white/80">
                <img
                  src={heroImage}
                  alt="Doctor reviewing clinical guideline recommendations"
                  className="w-full h-full object-cover object-top filter contrast-[1.02]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-purple-950/20 via-transparent to-transparent pointer-events-none" />
              </div>

              {/* Floating Card 1: Top-Right "Latest Guidelines" */}
              <div className="absolute -top-3 right-0 sm:-right-4 z-20 bg-white/95 backdrop-blur-md border border-purple-100/90 rounded-2xl px-3.5 py-2.5 shadow-lg shadow-purple-950/10 flex items-center gap-3 animate-in fade-in zoom-in-95 duration-500">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-[#5b21b6] flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4 text-[#6d28d9]" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#1b122e]">Latest Guidelines</div>
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Always up to date
                  </div>
                </div>
              </div>

              {/* Floating Card 2: Mid-Left "AI Assistant" */}
              <div className="absolute top-1/2 -left-4 sm:-left-8 -translate-y-1/2 z-20 bg-white/95 backdrop-blur-md border border-purple-100/90 rounded-2xl px-3.5 py-2.5 shadow-lg shadow-purple-950/10 flex items-center gap-3 animate-in fade-in zoom-in-95 duration-700">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#6d28d9] to-[#8b5cf6] text-white flex items-center justify-center shrink-0 shadow-xs shadow-purple-900/20">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#1b122e]">AI Assistant</div>
                  <div className="text-[11px] text-[#635777]">Evidence-based answers</div>
                </div>
              </div>

              {/* Floating Card 3: Bottom-Right "Better Decisions" */}
              <div className="absolute -bottom-3 right-2 sm:right-2 z-20 bg-white/95 backdrop-blur-md border border-purple-100/90 rounded-2xl px-3.5 py-2.5 shadow-lg shadow-purple-950/10 flex items-center gap-3 animate-in fade-in zoom-in-95 duration-900">
                <div className="w-8 h-8 rounded-xl bg-violet-100 text-[#4a189a] flex items-center justify-center shrink-0">
                  <HeartPulse className="w-4 h-4 text-[#5b21b6]" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#1b122e]">Better Decisions</div>
                  <div className="text-[11px] text-[#635777]">Improved Patient Care</div>
                </div>
              </div>

            </div>

          </div>

        </div>
      </div>
    </section>
  );
};
