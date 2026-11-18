import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Sparkles,
  BookOpen,
  CheckSquare,
  Settings,
  MoreVertical,
  LogOut,
  UserCheck,
  X
} from 'lucide-react';
import { Logo } from '../ui/Logo';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  onClose?: () => void;
  isMobile?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ onClose, isMobile = false }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close popup menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    if (isMobile && onClose) {
      onClose();
    }
  }, [location.pathname]);

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Patients', path: '/patients', icon: Users },
    { label: 'AI Assistant', path: '/assistant', icon: Sparkles },
    { label: 'Guidelines', path: '/guidelines', icon: BookOpen },
    { label: 'Decision Support', path: '/decision-support', icon: CheckSquare },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  // Resolve clinician name and initials
  const fullName = user?.user_metadata?.full_name || (user?.email ? user.email.split('@')[0] : 'Dr. Clinician');
  const displayName = fullName.startsWith('Dr.') ? fullName : `Dr. ${fullName}`;
  
  const getInitials = (name?: string | null) => {
    if (!name || typeof name !== 'string') return 'DR';
    const cleaned = name.replace(/^Dr\.\s*/i, '').trim();
    const parts = cleaned.split(/\s+/);
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return cleaned.slice(0, 2).toUpperCase() || 'DR';
  };

  const initials = getInitials(fullName);

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <aside className={`h-full flex flex-col justify-between bg-white border-r border-purple-100/90 select-none ${isMobile ? 'w-72 p-5' : 'w-64 p-5'}`}>
      
      {/* Top: Brand Header & Nav Links */}
      <div>
        {/* Brand Logo & Close button on mobile */}
        <div className="flex items-center justify-between pb-6 mb-2 border-b border-purple-50">
          <Logo size="md" />
          {isMobile && onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-purple-50 text-[#645778] hover:text-[#4a189a] transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-1.5 mt-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-purple-100/80 text-[#5b21b6] shadow-2xs'
                      : 'text-[#5a4e6f] hover:text-[#1e1333] hover:bg-purple-50/70'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive ? 'text-[#5b21b6]' : 'text-[#7e7195]'
                      }`}
                    />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom: Authenticated User Profile */}
      <div className="pt-4 border-t border-purple-100/80 relative" ref={menuRef}>
        
        {/* Popover Menu for Profile & Logout */}
        {menuOpen && (
          <div className="absolute bottom-full left-0 mb-2 w-full bg-white rounded-2xl border border-purple-100 shadow-xl shadow-purple-950/10 p-2 animate-in fade-in zoom-in-95 duration-150 z-50">
            <div className="px-3 py-2 border-b border-purple-50">
              <div className="text-xs font-bold text-[#1b122e] truncate">{displayName}</div>
              <div className="text-[11px] text-[#786b8f] truncate">{user?.email || 'Authenticated Clinician'}</div>
            </div>
            
            <NavLink
              to="/settings"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#463a5d] hover:text-[#5b21b6] hover:bg-purple-50/80 rounded-xl transition-colors mt-1"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Settings</span>
            </NavLink>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-left cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        )}

        {/* User Card Bar */}
        <div className="flex items-center justify-between p-2 rounded-xl hover:bg-purple-50/60 transition-colors">
          <div className="flex items-center gap-3 overflow-hidden">
            {/* Initials Avatar */}
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#5b21b6] to-[#7c3aed] text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
              {initials}
            </div>

            {/* Clinician Title & Role */}
            <div className="overflow-hidden text-left">
              <div className="text-xs font-bold text-[#1b122e] truncate">
                {displayName}
              </div>
              <div className="text-[11px] text-[#716487] flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-[#5b21b6]" />
                <span>Clinician</span>
              </div>
            </div>
          </div>

          {/* Three-dots menu trigger */}
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 text-[#867a9d] hover:text-[#4a189a] hover:bg-purple-100/60 rounded-lg transition-colors cursor-pointer"
            aria-label="User menu"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>

      </div>
    </aside>
  );
};
