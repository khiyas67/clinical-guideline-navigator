import React from 'react';
import { Link, useLocation, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Sparkles, LayoutDashboard, Users, MessageSquare, BookOpen, CheckSquare, Settings, LogIn, UserPlus, LogOut, UserCheck } from 'lucide-react';
import { Logo } from '../components/ui/Logo';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { AppLayout } from '../layouts/AppLayout';

interface PlaceholderProps {
  title?: string;
  description?: string;
  step?: string;
  inAppLayout?: boolean;
}

export const PlaceholderPage: React.FC<PlaceholderProps> = ({
  title,
  description,
  step = 'Next Steps',
  inAppLayout = false,
}) => {
  const location = useLocation();
  const params = useParams();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  // Resolve dynamic display title if not explicitly passed
  const getPageInfo = () => {
    const pathname = location.pathname;
    if (title) return { title, description: description || '' };

    if (pathname === '/login') {
      return {
        title: 'Sign In to Clinical Navigator',
        description: 'Authentication will be implemented in subsequent steps. Secure sign-in for certified clinicians.',
        icon: <LogIn className="w-8 h-8 text-[#5b21b6]" />,
      };
    }
    if (pathname === '/signup') {
      return {
        title: 'Create Clinician Account',
        description: 'Clinician onboarding and credentials validation will be connected in future steps.',
        icon: <UserPlus className="w-8 h-8 text-[#5b21b6]" />,
      };
    }
    if (pathname === '/dashboard') {
      return {
        title: 'Clinical Workspace Dashboard',
        description: 'Clinician workspace overview, active queries, recent patients, and guideline activity.',
        icon: <LayoutDashboard className="w-8 h-8 text-[#5b21b6]" />,
      };
    }
    if (pathname.startsWith('/patients/') && params.id) {
      return {
        title: `Patient Profile: ${params.id}`,
        description: `Patient clinical details, past medical history, and clinical question history for Patient ${params.id}.`,
        icon: <Users className="w-8 h-8 text-[#5b21b6]" />,
      };
    }
    if (pathname === '/patients') {
      return {
        title: 'Patients Management',
        description: 'Patient directory with clinical records, primary conditions, and guideline query linkage.',
        icon: <Users className="w-8 h-8 text-[#5b21b6]" />,
      };
    }
    if (pathname === '/assistant') {
      return {
        title: 'AI Clinical Assistant',
        description: 'Context-aware guideline interrogation assistant with source grounding and citation anchors.',
        icon: <MessageSquare className="w-8 h-8 text-[#5b21b6]" />,
      };
    }
    if (pathname === '/guidelines') {
      return {
        title: 'Clinical Guidelines Library',
        description: 'Searchable repository of clinical guidelines from WHO, CDC, and NIH/NCBI.',
        icon: <BookOpen className="w-8 h-8 text-[#5b21b6]" />,
      };
    }
    if (pathname === '/decision-support') {
      return {
        title: 'Clinical Decision Support',
        description: 'Structured decision review interface where clinicians evaluate guideline recommendations.',
        icon: <CheckSquare className="w-8 h-8 text-[#5b21b6]" />,
      };
    }
    if (pathname === '/settings') {
      return {
        title: 'Application & Profile Settings',
        description: 'Clinician preferences, specialty configuration, and guideline regional defaults.',
        icon: <Settings className="w-8 h-8 text-[#5b21b6]" />,
      };
    }

    return {
      title: 'Page Under Construction',
      description: 'This route is reserved in the application routing hierarchy for subsequent implementation phases.',
      icon: <Clock className="w-8 h-8 text-[#5b21b6]" />,
    };
  };

  const pageInfo = getPageInfo();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const allRoutes = [
    { label: 'Landing Page', path: '/' },
    { label: 'Login', path: '/login' },
    { label: 'Sign Up', path: '/signup' },
    { label: 'Forgot Password', path: '/forgot-password' },
    { label: 'Reset Password', path: '/reset-password' },
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Patients', path: '/patients' },
    { label: 'Patient Profile (demo)', path: '/patients/P-2026-001' },
    { label: 'AI Assistant', path: '/assistant' },
    { label: 'Guidelines', path: '/guidelines' },
    { label: 'Decision Support', path: '/decision-support' },
    { label: 'Settings', path: '/settings' },
  ];

  const contentCard = (
    <div className="bg-white rounded-[2rem] p-8 sm:p-12 border border-purple-100/90 shadow-xl shadow-purple-950/5 text-center max-w-2xl mx-auto w-full my-6">
      {/* Status Badge */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-50 text-[#5b21b6] border border-purple-100 text-xs font-semibold mb-6">
        <Clock className="w-3.5 h-3.5 text-[#7c3aed]" />
        <span>Application Routing Architecture • {step}</span>
      </div>

      {/* User Session Banner if logged in and not in AppLayout */}
      {user && !inAppLayout && (
        <div className="mb-6 p-3 rounded-2xl bg-purple-50/70 border border-purple-200/80 flex items-center justify-between text-left text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-200/80 text-[#4a189a] flex items-center justify-center font-bold">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-[#1b122e]">
                {user.user_metadata?.full_name || 'Authenticated Clinician'}
              </div>
              <div className="text-[#645778]">{user.email}</div>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="px-3 py-1 rounded-lg bg-white border border-purple-200 text-[#5b21b6] font-semibold hover:bg-purple-100 transition-colors"
          >
            Sign Out
          </button>
        </div>
      )}

      {/* Icon */}
      <div className="w-16 h-16 rounded-2xl bg-purple-100/60 mx-auto flex items-center justify-center mb-6 text-[#5b21b6]">
        {pageInfo.icon || <Sparkles className="w-8 h-8" />}
      </div>

      {/* Title */}
      <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1a102f] tracking-tight mb-3">
        {pageInfo.title}
      </h1>

      {/* Route path badge */}
      <div className="inline-block font-mono text-xs text-[#6d5f85] bg-purple-50 px-3 py-1 rounded-md mb-5 border border-purple-100">
        Route: {location.pathname}
      </div>

      {/* Description */}
      <p className="text-sm sm:text-base text-[#5c5072] leading-relaxed max-w-md mx-auto mb-8">
        {pageInfo.description}
      </p>

      {/* Action */}
      <div className="flex flex-wrap justify-center gap-3">
        {inAppLayout ? (
          <Button to="/dashboard" variant="primary" size="md">
            Return to Dashboard
          </Button>
        ) : (
          <Button to="/" variant="primary" size="md">
            Return to Landing Page
          </Button>
        )}
      </div>

      {/* Quick Route Switcher for Verification */}
      <div className="mt-10 pt-8 border-t border-purple-100 text-left">
        <div className="text-xs font-bold uppercase tracking-wider text-[#7c3aed] mb-3">
          Application Routes Hierarchy
        </div>
        <div className="flex flex-wrap gap-2">
          {allRoutes.map((r) => {
            const isActive = location.pathname === r.path;
            return (
              <Link
                key={r.path}
                to={r.path}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                  isActive
                    ? 'bg-[#4a189a] text-white border-[#4a189a] font-semibold'
                    : 'bg-purple-50/50 hover:bg-purple-100/60 text-[#4c3f62] border-purple-100'
                }`}
              >
                {r.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );

  if (inAppLayout) {
    return <AppLayout>{contentCard}</AppLayout>;
  }

  return (
    <div className="min-h-screen bg-[#f7f4fc] flex flex-col justify-between p-4 sm:p-8">
      {/* Top Bar */}
      <div className="max-w-5xl w-full mx-auto flex items-center justify-between py-4">
        <Logo size="md" />
        <div className="flex items-center gap-3">
          {user ? (
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-purple-50 text-[#5b21b6] border border-purple-200 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          ) : (
            <Button to="/login" variant="secondary" size="sm" icon={<LogIn className="w-4 h-4 mr-1" />}>
              Sign In
            </Button>
          )}
          <Button to="/" variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4 mr-1" />}>
            Back to Landing
          </Button>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="max-w-2xl w-full mx-auto my-auto py-8">
        {contentCard}
      </div>

      {/* Footer info */}
      <div className="text-center text-xs text-[#807497] py-4">
        Clinical Navigator • Decision Support Architecture
      </div>
    </div>
  );
};
