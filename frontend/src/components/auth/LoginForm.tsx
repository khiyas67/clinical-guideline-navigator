import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, Check, AlertCircle, Loader2 } from 'lucide-react';
import { AuthInput } from './AuthInput';
import { useAuth } from '../../context/AuthContext';

export const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, isConfigured } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    if (!isConfigured) {
      setErrorMessage('Supabase is not configured yet. Please set your VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local.');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await signIn(email.trim(), password);

      if (error) {
        const status = (error as any).status;
        const code = ((error as any).code || '').toLowerCase();
        const msg = (error.message || '').toLowerCase();

        if (status === 401 || msg.includes('invalid api key') || msg.includes('jwt')) {
          setErrorMessage('Supabase configuration error: Invalid project URL or API key in .env.local.');
        } else if (code === 'email_not_confirmed' || msg.includes('email not confirmed')) {
          setErrorMessage('Your email address has not been confirmed yet. Please check your inbox for the confirmation link.');
        } else if (status === 429 || msg.includes('rate limit') || msg.includes('too many requests')) {
          setErrorMessage('Too many sign-in attempts. Please wait a few minutes before trying again.');
        } else if (msg.includes('failed to fetch') || msg.includes('network') || msg.includes('load failed')) {
          setErrorMessage('Cannot reach Supabase authentication server. Please check your network connection or use "Instant Demo Access" below.');
        } else if (code === 'invalid_credentials' || msg.includes('invalid login credentials') || msg.includes('invalid grant')) {
          setErrorMessage('Invalid email or password. Please verify your email and password, or use "Forgot password?" to reset.');
        } else {
          setErrorMessage(error.message || 'Unable to sign in. Please verify your credentials.');
        }
        setLoading(false);
        return;
      }

      if (data?.user) {
        // Redirect to originating protected route or default to /dashboard
        const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      const errMsg = err?.message || 'An unexpected error occurred during sign-in.';
      setErrorMessage(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
      {/* Unconfigured Alert Banner if needed */}
      {!isConfigured && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-purple-50/80 border border-purple-200/90 text-xs text-[#5b21b6]">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Configuration Notice:</span> Add your live Supabase project credentials in <code className="bg-purple-100 px-1 py-0.5 rounded text-[11px]">.env.local</code> to enable real user authentication.
          </div>
        </div>
      )}

      {/* Error Message Box */}
      {errorMessage && (
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-red-50/90 border border-red-200 text-xs text-red-700 animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Email Field */}
      <AuthInput
        label="Email address"
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={loading}
        required
      />

      {/* Password Field */}
      <AuthInput
        label="Password"
        type="password"
        placeholder="Enter your password"
        isPassword
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={loading}
        required
      />

      {/* Remember Me & Forgot Password Row */}
      <div className="flex items-center justify-between text-xs sm:text-sm pt-1">
        <label className="flex items-center gap-2 cursor-pointer select-none group">
          <div
            onClick={() => !loading && setRememberMe(!rememberMe)}
            className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
              rememberMe
                ? 'bg-[#5b21b6] border-[#5b21b6] text-white'
                : 'border-purple-300 bg-white group-hover:border-purple-400'
            } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            {rememberMe && <Check className="w-3 h-3 stroke-[3]" />}
          </div>
          <span className="text-[#514566] text-xs font-medium">Remember me</span>
        </label>

        <Link
          to="/forgot-password"
          className="text-xs font-semibold text-[#5b21b6] hover:text-[#3b127e] hover:underline transition-colors"
        >
          Forgot password?
        </Link>
      </div>

      {/* Sign In Primary Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full mt-2 py-3 px-4 rounded-xl bg-[#4a189a] hover:bg-[#3b127e] disabled:bg-[#4a189a]/70 disabled:cursor-not-allowed text-white text-sm font-bold shadow-md shadow-purple-950/15 hover:shadow-lg hover:shadow-purple-950/25 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99]"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Signing In...</span>
          </>
        ) : (
          <>
            <span>Sign In</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      {/* Bottom Sign Up Navigation */}
      <div className="text-center mt-6 text-xs sm:text-sm text-[#615577]">
        Don't have an account?{' '}
        <Link
          to="/signup"
          className="font-bold text-[#5b21b6] hover:text-[#3b127e] hover:underline transition-colors"
        >
          Sign up
        </Link>
      </div>
    </form>
  );
};
