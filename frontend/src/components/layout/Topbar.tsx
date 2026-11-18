import React, { useState } from 'react';
import { Search, Bell, Menu } from 'lucide-react';
import { Logo } from '../ui/Logo';

interface TopbarProps {
  onOpenMobileMenu: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onOpenMobileMenu }) => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-purple-100/80 px-4 sm:px-6 lg:px-8 py-3.5 transition-all">
      <div className="flex items-center justify-between gap-4">
        
        {/* Left: Mobile hamburger and logo */}
        <div className="flex items-center gap-3 lg:hidden">
          <button
            onClick={onOpenMobileMenu}
            className="p-2 text-[#4a189a] hover:bg-purple-50 rounded-xl transition-colors cursor-pointer"
            aria-label="Open sidebar menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Logo size="sm" showText={false} />
        </div>

        {/* Center / Right: Global Search & Notifications */}
        <div className="flex-1 flex items-center justify-end sm:justify-between gap-4">
          
          {/* Search bar */}
          <div className="relative w-full max-w-md hidden sm:block">
            <Search className="w-4 h-4 text-[#897c9f] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search anything..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#fcfaff] hover:bg-white text-xs sm:text-sm text-[#1b122e] placeholder-[#9084a5] pl-10 pr-4 py-2 rounded-xl border border-purple-100 focus:border-[#6d28d9] focus:outline-none focus:ring-2 focus:ring-purple-300/30 transition-all shadow-2xs"
            />
          </div>

          {/* Right items: Notification bell */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="relative p-2.5 rounded-xl text-[#675b7e] hover:text-[#5b21b6] hover:bg-purple-50/80 border border-purple-100/70 shadow-2xs transition-colors cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {/* Active unread notification pip */}
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#7c3aed] ring-2 ring-white" />
            </button>
          </div>

        </div>

      </div>
    </header>
  );
};
