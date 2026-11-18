import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface VerifiedBadgeProps {
  isVerified?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  isVerified = false,
  className = '',
  size = 'sm',
}) => {
  if (!isVerified) {
    return null;
  }

  const isMd = size === 'md';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs shrink-0 select-none ${
        isMd ? 'px-3 py-1 text-xs' : 'px-2.5 py-0.5 text-[11px]'
      } ${className}`}
      title="Verified official source"
    >
      <CheckCircle2 className={`${isMd ? 'w-3.5 h-3.5' : 'w-3 h-3'} text-emerald-600 shrink-0`} />
      <span>Verified Source</span>
    </span>
  );
};
