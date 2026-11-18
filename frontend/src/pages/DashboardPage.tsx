import React, { useState, useEffect } from 'react';
import { Users, Sparkles, CheckSquare, BookOpen } from 'lucide-react';
import { AppLayout } from '../layouts/AppLayout';
import { StatCard } from '../components/dashboard/StatCard';
import { RecentPatients } from '../components/dashboard/RecentPatients';
import { RecentQueries } from '../components/dashboard/RecentQueries';
import { QuickActions } from '../components/dashboard/QuickActions';
import { useAuth } from '../context/AuthContext';
import { getPatients } from '../lib/patients';
import { getVerifiedGuidelineCount } from '../lib/guidelines';
import { getDecisionStats, getRecentDecisions } from '../lib/decisions';
import type { Patient } from '../types/patient';
import type { ClinicalDecision, DecisionStats } from '../types/decision';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientsLoading, setPatientsLoading] = useState(true);
  const [verifiedGuidelinesCount, setVerifiedGuidelinesCount] = useState<number>(0);
  const [guidelinesLoading, setGuidelinesLoading] = useState(true);

  // Real Decision Stats and Recent Decisions
  const [decisionStats, setDecisionStats] = useState<DecisionStats>({ total: 0, accepted: 0, modified: 0, rejected: 0 });
  const [recentDecisions, setRecentDecisions] = useState<ClinicalDecision[]>([]);
  const [decisionsLoading, setDecisionsLoading] = useState(true);

  // Load real data from Supabase
  useEffect(() => {
    let isMounted = true;
    const fetchDashboardData = async () => {
      setPatientsLoading(true);
      setGuidelinesLoading(true);
      setDecisionsLoading(true);

      const [patientsRes, countRes, statsRes, recentRes] = await Promise.all([
        getPatients(),
        getVerifiedGuidelineCount(),
        getDecisionStats(),
        getRecentDecisions(5),
      ]);

      if (isMounted) {
        setPatients(patientsRes.data);
        setPatientsLoading(false);
        setVerifiedGuidelinesCount(countRes);
        setGuidelinesLoading(false);
        setDecisionStats(statsRes);
        setRecentDecisions(recentRes.data);
        setDecisionsLoading(false);
      }
    };
    fetchDashboardData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Resolve clinician name dynamically from user metadata or email
  const rawName = user?.user_metadata?.full_name || (user?.email ? user.email.split('@')[0] : 'Clinician');
  const greetingName = rawName.replace(/^Dr\.\s*/i, '');

  const stats = [
    {
      title: 'Total Patients',
      value: patientsLoading ? '...' : patients.length,
      change: patients.length > 0 ? `${patients.length} registered` : 'No records yet',
      icon: <Users className="w-4 h-4 text-rose-600" />,
      iconBgColor: 'bg-rose-50 border border-rose-100/70',
    },
    {
      title: 'Accepted Decisions',
      value: decisionsLoading ? '...' : decisionStats.accepted,
      change: decisionStats.total > 0 ? `${Math.round((decisionStats.accepted / decisionStats.total) * 100)}% acceptance rate` : 'Audit trail ready',
      icon: <Sparkles className="w-4 h-4 text-purple-600" />,
      iconBgColor: 'bg-purple-50 border border-purple-100/70',
    },
    {
      title: 'Saved Decisions',
      value: decisionsLoading ? '...' : decisionStats.total,
      change: decisionStats.total > 0 ? `${decisionStats.modified} modified, ${decisionStats.rejected} rejected` : 'No decisions yet',
      icon: <CheckSquare className="w-4 h-4 text-blue-600" />,
      iconBgColor: 'bg-blue-50 border border-blue-100/70',
    },
    {
      title: 'Verified Guidelines',
      value: guidelinesLoading ? '...' : verifiedGuidelinesCount,
      change: verifiedGuidelinesCount > 0 ? `${verifiedGuidelinesCount} verified sources` : 'Source layer active',
      icon: <BookOpen className="w-4 h-4 text-emerald-600" />,
      iconBgColor: 'bg-emerald-50 border border-emerald-100/70',
    },
  ];

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 sm:gap-8">
        
        {/* Top Greeting Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-left">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1a102f] tracking-tight">
              Good morning, Dr. {greetingName} 👋
            </h1>
            <p className="text-xs sm:text-sm text-[#665a7c] mt-1">
              Here's an overview of your clinical workspace and decision audit trail.
            </p>
          </div>

          <div className="text-[11px] font-medium text-[#7a6e92] bg-white px-3 py-1.5 rounded-xl border border-purple-100 shadow-2xs self-start sm:self-auto">
            Clinical Decision Support System Active
          </div>
        </div>

        {/* 4 Summary Cards Grid (All connected to real Supabase data) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat) => (
            <StatCard
              key={stat.title}
              title={stat.title}
              value={stat.value}
              change={stat.change}
              icon={stat.icon}
              iconBgColor={stat.iconBgColor}
            />
          ))}
        </div>

        {/* Quick Actions Row */}
        <QuickActions />

        {/* 2-Column Grid: Recent Patients & Recent Real Decisions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          <RecentPatients patients={patients} loading={patientsLoading} />
          <RecentQueries decisions={recentDecisions} loading={decisionsLoading} />
        </div>

      </div>
    </AppLayout>
  );
};
