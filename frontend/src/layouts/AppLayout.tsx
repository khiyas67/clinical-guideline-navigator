import React, { useState } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { MobileSidebar } from '../components/layout/MobileSidebar';
import { Topbar } from '../components/layout/Topbar';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f7f4fc] flex flex-row text-[#1e1333]">
      {/* Desktop Sidebar (Fixed / Sticky) */}
      <div className="hidden lg:block shrink-0 h-screen sticky top-0 z-40">
        <Sidebar />
      </div>

      {/* Mobile Drawer Sidebar */}
      <MobileSidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Workspace Topbar */}
        <Topbar onOpenMobileMenu={() => setMobileMenuOpen(true)} />

        {/* Workspace Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
