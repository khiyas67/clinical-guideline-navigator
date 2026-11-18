import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  isPassword?: boolean;
  error?: string;
}

export const AuthInput: React.FC<AuthInputProps> = ({
  label,
  id,
  type = 'text',
  isPassword = false,
  error,
  className = '',
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || label.toLowerCase().replace(/\s+/g, '-');
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="flex flex-col gap-1.5 text-left w-full">
      <label 
        htmlFor={inputId} 
        className="text-xs sm:text-sm font-semibold text-[#2a1d40]"
      >
        {label}
      </label>
      
      <div className="relative flex items-center">
        <input
          id={inputId}
          type={inputType}
          className={`w-full bg-[#fdfcff] hover:bg-white text-[#1a102f] placeholder-[#9c91b0] text-sm px-4 py-2.5 sm:py-3 rounded-xl border transition-all duration-200 shadow-2xs ${
            error
              ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-400/20 bg-red-50/20'
              : 'border-purple-200/90 focus:border-[#6d28d9] focus:outline-none focus:ring-2 focus:ring-purple-400/25'
          } ${
            isPassword ? 'pr-11' : ''
          } ${className}`}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 p-1 text-[#84789c] hover:text-[#4a189a] transition-colors focus:outline-none"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {error && (
        <span className="text-xs text-red-600 font-medium animate-in fade-in duration-150">
          {error}
        </span>
      )}
    </div>
  );
};
