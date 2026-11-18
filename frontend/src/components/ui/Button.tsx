import React from 'react';
import { Link } from 'react-router-dom';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  to?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  to,
  children,
  icon,
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const sizeStyles = {
    sm: 'text-xs px-3.5 py-1.5 rounded-full gap-1.5',
    md: 'text-sm px-5 py-2.5 rounded-full gap-2',
    lg: 'text-base px-6 py-3 rounded-full gap-2.5',
  };

  const variantStyles = {
    primary: 'bg-[#4a189a] hover:bg-[#3b127e] text-white shadow-md shadow-purple-900/20 hover:shadow-lg hover:shadow-purple-900/30 hover:-translate-y-0.5 active:translate-y-0',
    secondary: 'bg-white hover:bg-purple-50/70 text-[#2e1065] border border-purple-200/80 shadow-sm hover:shadow hover:border-purple-300',
    outline: 'bg-transparent hover:bg-purple-100/50 text-[#4a189a] border border-[#6d28d9]/30 hover:border-[#6d28d9]',
    ghost: 'bg-transparent hover:bg-purple-100/60 text-[#3b1c68]',
  };

  const combinedClasses = `${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`;

  if (to) {
    return (
      <Link to={to} className={combinedClasses}>
        {children}
        {icon && <span className="inline-flex items-center">{icon}</span>}
      </Link>
    );
  }

  return (
    <button className={combinedClasses} {...props}>
      {children}
      {icon && <span className="inline-flex items-center">{icon}</span>}
    </button>
  );
};
