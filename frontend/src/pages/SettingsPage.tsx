import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Shield,
  Palette,
  Sparkles,
  Bell,
  Lock,
  LogOut,
  Check,
  Save,
  AlertCircle,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { AppLayout } from '../layouts/AppLayout';
import { useAuth } from '../context/AuthContext';

export const SettingsPage: React.FC = () => {
  const { user, signOut, resetPassword, updateProfile } = useAuth();
  const navigate = useNavigate();

  // Profile State
  const initialName = user?.user_metadata?.full_name || '';
  const [fullName, setFullName] = useState(initialName);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Clinical Assistant Preferences State
  const [responseStyle, setResponseStyle] = useState<'concise' | 'detailed'>(() => {
    return (localStorage.getItem('clinical_nav_response_style') as 'concise' | 'detailed') || 'concise';
  });

  const [defaultCategory, setDefaultCategory] = useState<string>(() => {
    return localStorage.getItem('clinical_nav_default_category') || 'General';
  });

  const [assistantPrefSaved, setAssistantPrefSaved] = useState(false);

  // Notifications State
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('clinical_nav_notifications');
    return saved !== null ? saved === 'true' : true;
  });

  // Security / Password Reset State
  const [sendingReset, setSendingReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  // Sync initial full name if user loads late
  useEffect(() => {
    if (user?.user_metadata?.full_name) {
      setFullName(user.user_metadata.full_name);
    }
  }, [user]);

  // Handle Save Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setProfileError('Full name cannot be blank.');
      return;
    }

    setSavingProfile(true);
    setProfileError(null);
    setProfileSaved(false);

    try {
      const { error } = await updateProfile(fullName.trim());
      if (error) {
        setProfileError(error.message || 'Failed to update profile.');
      } else {
        setProfileSaved(true);
        setTimeout(() => setProfileSaved(false), 3000);
      }
    } catch (err: any) {
      setProfileError(err.message || 'An unexpected error occurred.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle Assistant Preferences Change
  const handleResponseStyleChange = (style: 'concise' | 'detailed') => {
    setResponseStyle(style);
    localStorage.setItem('clinical_nav_response_style', style);
    setAssistantPrefSaved(true);
    setTimeout(() => setAssistantPrefSaved(false), 2000);
  };

  const handleDefaultCategoryChange = (category: string) => {
    setDefaultCategory(category);
    localStorage.setItem('clinical_nav_default_category', category);
    setAssistantPrefSaved(true);
    setTimeout(() => setAssistantPrefSaved(false), 2000);
  };

  // Handle Notifications Toggle
  const handleToggleNotifications = () => {
    const nextVal = !notificationsEnabled;
    setNotificationsEnabled(nextVal);
    localStorage.setItem('clinical_nav_notifications', String(nextVal));
  };

  // Handle Password Reset Request
  const handleSendPasswordReset = async () => {
    if (!user?.email) return;

    setSendingReset(true);
    setResetError(null);
    setResetSent(false);

    try {
      const { error } = await resetPassword(user.email);
      if (error) {
        setResetError(error.message || 'Unable to send password reset email.');
      } else {
        setResetSent(true);
      }
    } catch (err: any) {
      setResetError(err.message || 'An error occurred while sending reset email.');
    } finally {
      setSendingReset(false);
    }
  };

  // Handle Sign Out
  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const categories = [
    'General',
    'Diabetes',
    'Cardiovascular',
    'Hypertension',
    'Infectious Disease',
    'Medications',
    'Diagnosis',
    'Treatment',
    'Other',
  ];

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto flex flex-col gap-8 pb-12">
        
        {/* Page Header */}
        <div className="flex flex-col gap-1.5 text-left border-b border-purple-100/80 pb-5">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1a102f] tracking-tight">
            Settings
          </h1>
          <p className="text-xs sm:text-sm text-[#615576]">
            Manage your Clinical Navigator account, preferences, and application settings.
          </p>
        </div>

        {/* 1. Profile Section */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100/90 shadow-sm shadow-purple-950/5 text-left">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-purple-50">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-[#5b21b6] flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1b122e]">Profile</h2>
              <p className="text-xs text-[#6e6183]">Your account information</p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="flex flex-col gap-5">
            {profileError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            {profileSaved && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Profile information successfully saved.</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Full Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#3a2d4f]">
                  Full Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Dr. Jane Smith"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#faf8fe] border border-purple-200 text-xs sm:text-sm text-[#1a102f] placeholder-[#9084a4] focus:outline-none focus:border-[#5b21b6] focus:ring-2 focus:ring-purple-300/30 transition-all"
                  />
                </div>
              </div>

              {/* Email (Read-Only) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#3a2d4f] flex items-center justify-between">
                  <span>Email</span>
                  <span className="text-[10px] text-[#86799d] font-normal">Managed via Auth</span>
                </label>
                <div className="relative flex items-center">
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    readOnly
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-purple-50/50 border border-purple-100 text-xs sm:text-sm text-[#5d5173] cursor-not-allowed select-all"
                  />
                  <Mail className="w-4 h-4 text-[#8f82a7] absolute right-3.5 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Role & Verification Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#3a2d4f]">Role:</span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100/80 text-[#5b21b6] text-xs font-bold border border-purple-200/70">
                  <Shield className="w-3.5 h-3.5" />
                  Clinician
                </span>
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#4a189a] hover:bg-[#3b127e] disabled:bg-[#4a189a]/50 text-white font-semibold text-xs transition-all shadow-xs cursor-pointer self-end sm:self-auto"
              >
                {savingProfile ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : profileSaved ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Saved</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* 2. Appearance Section */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100/90 shadow-sm shadow-purple-950/5 text-left">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-purple-50">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-[#5b21b6] flex items-center justify-center">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1b122e]">Appearance</h2>
              <p className="text-xs text-[#6e6183]">Customize how Clinical Navigator looks.</p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <label className="text-xs font-bold text-[#3a2d4f]">Theme</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg">
              <div className="p-4 rounded-2xl border-2 border-[#5b21b6] bg-purple-50/70 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-[#5b21b6] flex items-center justify-center text-white">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#1b122e]">Light (Default)</div>
                    <div className="text-[10px] text-[#6d5f83]">Clinical Lavender</div>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-[#786b8f]">
              Clinical Navigator uses the official high-contrast healthcare lavender palette optimized for clinical readouts.
            </p>
          </div>
        </div>

        {/* 3. Clinical Assistant Preferences */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100/90 shadow-sm shadow-purple-950/5 text-left">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-purple-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-[#5b21b6] flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#1b122e]">Clinical Assistant</h2>
                <p className="text-xs text-[#6e6183]">Customize how clinical responses are presented.</p>
              </div>
            </div>

            {assistantPrefSaved && (
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 animate-in fade-in flex items-center gap-1">
                <Check className="w-3 h-3" />
                Preference Saved
              </span>
            )}
          </div>

          <div className="flex flex-col gap-6">
            {/* Response Style */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-[#3a2d4f]">
                Response Style
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
                <button
                  type="button"
                  onClick={() => handleResponseStyleChange('concise')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    responseStyle === 'concise'
                      ? 'border-[#5b21b6] bg-purple-50/80 text-[#1b122e] ring-1 ring-[#5b21b6]'
                      : 'border-purple-100 bg-[#faf8fe] text-[#483c5d] hover:bg-purple-100/40'
                  }`}
                >
                  <div className="text-xs font-bold flex items-center justify-between">
                    <span>Concise (Recommended)</span>
                    {responseStyle === 'concise' && <Check className="w-3.5 h-3.5 text-[#5b21b6]" />}
                  </div>
                  <p className="text-[11px] text-[#6d5f83] mt-1 leading-snug">
                    Direct bullet-points emphasizing first-line guidance, dosages, and contraindications.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleResponseStyleChange('detailed')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    responseStyle === 'detailed'
                      ? 'border-[#5b21b6] bg-purple-50/80 text-[#1b122e] ring-1 ring-[#5b21b6]'
                      : 'border-purple-100 bg-[#faf8fe] text-[#483c5d] hover:bg-purple-100/40'
                  }`}
                >
                  <div className="text-xs font-bold flex items-center justify-between">
                    <span>Detailed</span>
                    {responseStyle === 'detailed' && <Check className="w-3.5 h-3.5 text-[#5b21b6]" />}
                  </div>
                  <p className="text-[11px] text-[#6d5f83] mt-1 leading-snug">
                    Comprehensive synthesis with extended clinical reasoning and guideline methodology.
                  </p>
                </button>
              </div>
            </div>

            {/* Default Category */}
            <div className="flex flex-col gap-2 max-w-md">
              <label className="text-xs font-bold text-[#3a2d4f]">
                Default Clinical Category
              </label>
              <select
                value={defaultCategory}
                onChange={(e) => handleDefaultCategoryChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#faf8fe] border border-purple-200 text-xs sm:text-sm font-medium text-[#1a102f] focus:outline-none focus:border-[#5b21b6] focus:ring-2 focus:ring-purple-300/30 transition-all cursor-pointer"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-[#786b8f]">
                The AI Assistant will automatically initialize with this category when no overriding patient condition is detected.
              </p>
            </div>
          </div>
        </div>

        {/* 4. Notifications Section */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100/90 shadow-sm shadow-purple-950/5 text-left">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-purple-50">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-[#5b21b6] flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1b122e]">Notifications</h2>
              <p className="text-xs text-[#6e6183]">Manage application notifications.</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-[#faf8fe] border border-purple-100/90">
            <div className="flex flex-col gap-0.5">
              <div className="text-xs font-bold text-[#1b122e]">
                Application Alerts & In-App Notifications
              </div>
              <p className="text-[11px] text-[#6e6183] max-w-md leading-relaxed">
                Receive real-time in-app alerts when clinical guidelines or patient records are updated.
              </p>
            </div>

            <button
              type="button"
              onClick={handleToggleNotifications}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                notificationsEnabled ? 'bg-[#5b21b6]' : 'bg-gray-300'
              }`}
              aria-label="Toggle notifications"
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  notificationsEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* 5. Security Section */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100/90 shadow-sm shadow-purple-950/5 text-left">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-purple-50">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-[#5b21b6] flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1b122e]">Security</h2>
              <p className="text-xs text-[#6e6183]">Manage your account security and credentials.</p>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            {resetError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{resetError}</span>
              </div>
            )}

            {resetSent && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>A secure password reset link has been dispatched to {user?.email}. Please check your inbox.</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#faf8fe] border border-purple-100/90">
              <div className="flex flex-col gap-0.5">
                <div className="text-xs font-bold text-[#1b122e] flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-[#5b21b6]" />
                  <span>Password Management</span>
                </div>
                <p className="text-[11px] text-[#6e6183]">
                  Receive an authenticated link at {user?.email || 'your registered email'} to safely update your password.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSendPasswordReset}
                disabled={sendingReset || resetSent}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-purple-50 border border-purple-200 text-[#4a189a] font-semibold text-xs transition-all shadow-2xs cursor-pointer shrink-0 disabled:opacity-50"
              >
                {sendingReset ? (
                  <>
                    <span className="w-3 h-3 border-2 border-purple-400 border-t-purple-800 rounded-full animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : resetSent ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Link Dispatched</span>
                  </>
                ) : (
                  <span>Send Reset Link</span>
                )}
              </button>
            </div>

            {/* Account Status Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-purple-50/40 border border-purple-100 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold text-[#645778]">Account Status</div>
                  <div className="text-xs font-bold text-[#1b122e] mt-0.5 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Active Clinician Session
                  </div>
                </div>
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              </div>

              <div className="p-4 rounded-2xl bg-purple-50/40 border border-purple-100 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold text-[#645778]">Authentication Provider</div>
                  <div className="text-xs font-bold text-[#1b122e] mt-0.5">
                    Supabase OAuth / JWT
                  </div>
                </div>
                <Lock className="w-5 h-5 text-[#5b21b6]" />
              </div>
            </div>
          </div>
        </div>

        {/* 6. Account Actions / Danger Zone */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-rose-100 shadow-sm shadow-purple-950/5 text-left">
          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-rose-50">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <LogOut className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1b122e]">Account Actions</h2>
              <p className="text-xs text-[#6e6183]">Manage active session state.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <div className="flex flex-col gap-0.5">
              <div className="text-xs font-bold text-[#1b122e]">Sign Out of Clinical Navigator</div>
              <p className="text-[11px] text-[#6e6183]">
                Safely terminate your current authenticated clinician session on this browser.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs transition-all shadow-2xs cursor-pointer shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

      </div>
    </AppLayout>
  );
};
