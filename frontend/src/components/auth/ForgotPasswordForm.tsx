import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Send, AlertCircle, Loader2, Mail } from 'lucide-react';
import { AuthInput } from './AuthInput';
import { useAuth } from '../../context/AuthContext';

export const ForgotPasswordForm: React.FC = () => {
  const { resetPassword, isConfigured } = useAuth();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!isConfigured) {
      setErrorMessage('Supabase is not configured yet. Please set your VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await resetPassword(email.trim());

      if (error) {
        // Log quietly and don't leak user existence
        setErrorMessage(error.message || 'Unable to send reset instructions.');
        setLoading(false);
        return;
      }

      // Consistent security practice: show confirmation without confirming user existence
      setIsSubmitted(true);
    } catch {
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center text-center py-4 animate-in fade-in duration-300">
        <div className="w-14 h-14 rounded-2xl bg-purple-100 text-[#5b21b6] flex items-center justify-center mb-5">
          <Mail className="w-7 h-7" />
        </div>

        <h2 className="text-xl font-bold text-[#1b122e] mb-2">
          Check Your Email
        </h2>

        <p className="text-sm text-[#5d5172] leading-relaxed mb-6 max-w-sm">
          Password reset instructions have been sent if an account exists for that email.
        </p>

        <div className="w-full pt-4 border-t border-purple-100 flex flex-col gap-3">
          <Link
            to="/login"
            className="w-full py-3 px-4 rounded-xl bg-[#4a189a] hover:bg-[#3b127e] text-white text-sm font-bold shadow-md shadow-purple-950/15 transition-all text-center inline-block"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full">
      {/* Notice if not configured */}
      {!isConfigured && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-purple-50/80 border border-purple-200/90 text-xs text-[#5b21b6]">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Configuration Notice:</span> Add your live Supabase project credentials in <code className="bg-purple-100 px-1 py-0.5 rounded text-[11px]">.env.local</code> to enable email password resets.
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

      {/* Send Reset Link Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full mt-1 py-3 px-4 rounded-xl bg-[#4a189a] hover:bg-[#3b127e] disabled:bg-[#4a189a]/70 disabled:cursor-not-allowed text-white text-sm font-bold shadow-md shadow-purple-950/15 hover:shadow-lg hover:shadow-purple-950/25 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99]"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Sending Reset Link...</span>
          </>
        ) : (
          <>
            <span>Send Reset Link</span>
            <Send className="w-4 h-4 ml-1" />
          </>
        )}
      </button>

      {/* Back to Sign In Link */}
      <div className="text-center mt-4">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#5b21b6] hover:text-[#3b127e] hover:underline transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Sign In</span>
        </Link>
      </div>
    </form>
  );
};
