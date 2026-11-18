import React from 'react';
import { ArrowUpRight } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change: string;
  icon: React.ReactNode;
  iconBgColor: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  icon,
  iconBgColor,
}) => {
  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-purple-100/90 shadow-sm shadow-purple-950/5 hover:shadow-md hover:border-purple-200 transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between">
      {/* Top: Icon + Title */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold text-[#665a7c]">
          {title}
        </span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBgColor}`}>
          {icon}
        </div>
      </div>

      {/* Value & Indicator */}
      <div>
        <div className="text-2xl sm:text-3xl font-extrabold text-[#1a102f] tracking-tight mb-2">
          {value}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
          <ArrowUpRight className="w-3.5 h-3.5" />
          <span>{change}</span>
        </div>
      </div>
    </div>
  );
};
