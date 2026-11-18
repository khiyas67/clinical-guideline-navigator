import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Menu, X } from 'lucide-react';
import { Logo } from '../ui/Logo';
import { Button } from '../ui/Button';

export const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Product', href: '#features' },
    { label: 'Guidelines', href: '#guidelines' },
    { label: 'Platform', href: '#value' },
    { label: 'About', href: '#about' },
  ];

  return (
    <header className="sticky top-4 z-50 w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto transition-all">
      <nav className="bg-white/85 backdrop-blur-md border border-purple-100/90 shadow-sm shadow-purple-900/5 rounded-2xl sm:rounded-full px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between">
        {/* Left: Logo */}
        <Logo size="md" />

        {/* Center: Desktop Navigation */}
        <div className="hidden md:flex items-center gap-7 text-sm font-medium text-[#4b435b]">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="hover:text-[#4a189a] transition-colors py-1 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-[#6d28d9] hover:after:w-full after:transition-all after:duration-200"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Right: Auth & Get Started */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/login"
            className="text-sm font-medium text-[#392d4f] hover:text-[#4a189a] px-3.5 py-2 transition-colors"
          >
            Sign In
          </Link>
          <Button
            to="/signup"
            variant="primary"
            size="md"
            icon={<ArrowRight className="w-4 h-4 ml-0.5 transition-transform group-hover:translate-x-0.5" />}
          >
            Get Started
          </Button>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
          <Button
            to="/signup"
            variant="primary"
            size="sm"
            className="text-xs px-3 py-1.5"
          >
            Get Started
          </Button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[#4a189a] hover:bg-purple-50 rounded-xl transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-2 bg-white/95 backdrop-blur-lg border border-purple-100 rounded-2xl shadow-xl p-5 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col gap-2.5">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium text-[#3b324c] hover:text-[#4a189a] hover:bg-purple-50/70 px-3 py-2 rounded-lg transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>
          <div className="pt-3 border-t border-purple-100 flex flex-col gap-2.5">
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="text-center text-sm font-medium text-[#4a189a] py-2 hover:bg-purple-50 rounded-xl transition-colors"
            >
              Sign In
            </Link>
            <Button
              to="/signup"
              variant="primary"
              size="md"
              className="w-full justify-center"
              icon={<ArrowRight className="w-4 h-4 ml-1" />}
            >
              Get Started
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};
