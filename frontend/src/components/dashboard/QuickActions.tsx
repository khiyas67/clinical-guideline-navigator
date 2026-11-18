import React from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, MessageSquare, BookOpen, Zap } from 'lucide-react';

export const QuickActions: React.FC = () => {
  const actions = [
    {
      label: 'Add Patient',
      to: '/patients',
      icon: <UserPlus className="w-4 h-4 text-white" />,
      buttonClass: 'bg-[#4a189a] hover:bg-[#3b127e] text-white shadow-xs hover:shadow',
    },
    {
      label: 'Ask Clinical Question',
      to: '/assistant',
      icon: <MessageSquare className="w-4 h-4 text-[#5b21b6]" />,
      buttonClass: 'bg-white hover:bg-purple-50 text-[#3b127e] border border-purple-200/80 shadow-2xs hover:shadow-xs',
    },
    {
      label: 'Browse Guidelines',
      to: '/guidelines',
      icon: <BookOpen className="w-4 h-4 text-[#5b21b6]" />,
      buttonClass: 'bg-white hover:bg-purple-50 text-[#3b127e] border border-purple-200/80 shadow-2xs hover:shadow-xs',
    },
  ];

  return (
    <div className="bg-white rounded-2xl p-5 border border-purple-100/90 shadow-sm shadow-purple-950/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      {/* Title */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-purple-100/70 text-[#5b21b6] flex items-center justify-center">
          <Zap className="w-4 h-4 fill-[#5b21b6]" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-[#1b122e]">Quick Actions</h3>
          <p className="text-[11px] text-[#716588]">Common clinical tasks</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
        {actions.map((act) => (
          <Link
            key={act.label}
            to={act.to}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${act.buttonClass}`}
          >
            {act.icon}
            <span>{act.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};
