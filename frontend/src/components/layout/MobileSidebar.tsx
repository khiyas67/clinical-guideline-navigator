import React from 'react';
import { Sidebar } from './Sidebar';

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileSidebar: React.FC<MobileSidebarProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden flex">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200" 
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Content */}
      <div className="relative z-10 animate-in slide-in-from-left duration-200 shadow-2xl">
        <Sidebar onClose={onClose} isMobile />
      </div>
    </div>
  );
};
