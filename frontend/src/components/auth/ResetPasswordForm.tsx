import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { AuthInput } from './AuthInput';
import { useAuth } from '../../context/AuthContext';

export const ResetPasswordForm: React.FC = () => {
  const { updatePassword, isConfigured } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (password.length < 6) {
      setErrorMessage('New password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (!isConfigured) {
      setErrorMessage('Supabase is not configured yet. Please configure your .env.local file.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await updatePassword(password);

      if (error) {
        setErrorMessage(error.message || 'Unable to update password. Your recovery link may be expired.');
        setLoading(false);
        return;
      }

      setIsSuccess(true);
    } catch {
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center text-center py-4 animate-in fade-in duration-300">
        <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-5">
          <CheckCircle2 className="w-7 h-7" />
        </div>

        <h2 className="text-xl font-bold text-[#1b122e] mb-2">
          Your password has been updated.
        </h2>

        <p className="text-sm text-[#5d5172] leading-relaxed mb-6 max-w-sm">
          You can now sign in with your new password to access your Clinical Navigator workspace.
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
      {/* Error Message Box */}
      {errorMessage && (
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-red-50/90 border border-red-200 text-xs text-red-700 animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* New Password Field */}
      <AuthInput
        label="New password"
        type="password"
        placeholder="Enter new password"
        isPassword
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={loading}
        required
      />

      {/* Confirm New Password Field */}
      <AuthInput
        label="Confirm new password"
        type="password"
        placeholder="Confirm new password"
        isPassword
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        disabled={loading}
        required
      />

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full mt-2 py-3 px-4 rounded-xl bg-[#4a189a] hover:bg-[#3b127e] disabled:bg-[#4a189a]/70 disabled:cursor-not-allowed text-white text-sm font-bold shadow-md shadow-purple-950/15 hover:shadow-lg hover:shadow-purple-950/25 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99]"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Updating Password...</span>
          </>
        ) : (
          <>
            <span>Update Password</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      {/* Back to Sign In Link */}
      <div className="text-center mt-4">
        <Link
          to="/login"
          className="text-xs sm:text-sm font-semibold text-[#5b21b6] hover:text-[#3b127e] hover:underline transition-colors"
        >
          Cancel and return to Sign In
        </Link>
      </div>
    </form>
  );
};
