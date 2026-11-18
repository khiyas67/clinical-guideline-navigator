import React from 'react';
import { Header } from '../components/landing/Header';
import { HeroSection } from '../components/landing/HeroSection';
import { TrustedSection } from '../components/landing/TrustedSection';
import { FeaturesSection } from '../components/landing/FeaturesSection';
import { StatsSection } from '../components/landing/StatsSection';
import { CtaSection } from '../components/landing/CtaSection';
import { Footer } from '../components/landing/Footer';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#f7f4fc] selection:bg-purple-200 selection:text-[#2e1065]">
      {/* Floating Header */}
      <Header />

      {/* Main Content */}
      <main className="flex-1">
        <HeroSection />
        <TrustedSection />
        <FeaturesSection />
        <StatsSection />
        <CtaSection />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};
