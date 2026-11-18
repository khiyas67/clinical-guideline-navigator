import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, AlertCircle, Loader2, Mail } from 'lucide-react';
import { AuthInput } from './AuthInput';
import { useAuth } from '../../context/AuthContext';
import { validateEmail, validatePassword } from '../../lib/validation';

export const SignupForm: React.FC = () => {
  const navigate = useNavigate();
  const { signUp, isConfigured } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successConfirmation, setSuccessConfirmation] = useState(false);

  const clearFieldError = (field: string) => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const errors: Record<string, string> = {};

    // 1. Full Name Validation
    const trimmedName = fullName.trim();
    if (!trimmedName) {
      errors.fullName = 'Please enter your full name and clinical title.';
    } else if (trimmedName.length < 2) {
      errors.fullName = 'Full name must be at least 2 characters.';
    }

    // 2. Strict Email Validation
    const emailResult = validateEmail(email, { required: true });
    if (!emailResult.isValid) {
      errors.email = emailResult.error || 'Please enter a valid email address.';
    }

    // 3. Password Validation
    const passResult = validatePassword(password);
    if (!passResult.isValid) {
      errors.password = passResult.error || 'Password must be at least 6 characters.';
    }

    // 4. Confirm Password Validation
    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password.';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    // 5. Terms Agreement
    if (!agreeTerms) {
      errors.agreeTerms = 'Please agree to the Terms of Service and Privacy Policy.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      // Set top banner if multiple or terms error
      if (errors.agreeTerms) {
        setErrorMessage(errors.agreeTerms);
      } else if (errors.email) {
        setErrorMessage(errors.email);
      }
      return;
    }

    setFieldErrors({});

    if (!isConfigured) {
      setErrorMessage('Supabase is not configured yet. Please set your VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local.');
      return;
    }

    setLoading(true);

    try {
      const normalizedEmail = emailResult.normalized || email.trim().toLowerCase();
      const { data, error } = await signUp(normalizedEmail, password, trimmedName);

      if (error) {
        const errLower = error.message.toLowerCase();
        if (errLower.includes('user already registered') || errLower.includes('already exists') || errLower.includes('unique constraint')) {
          const duplicateMsg = 'An account with this email is already registered. Please sign in instead.';
          setErrorMessage(duplicateMsg);
          setFieldErrors({ email: duplicateMsg });
        } else if (errLower.includes('password')) {
          const passMsg = 'Password must meet security requirements (at least 6 characters).';
          setErrorMessage(passMsg);
          setFieldErrors({ password: passMsg });
        } else if (errLower.includes('email') || errLower.includes('invalid')) {
          setErrorMessage(error.message);
          setFieldErrors({ email: error.message });
        } else {
          setErrorMessage(error.message || 'Unable to create account. Please try again.');
        }
        setLoading(false);
        return;
      }

      // If Supabase provides an immediate session, redirect straight to /dashboard
      if (data?.session) {
        navigate('/dashboard', { replace: true });
        return;
      }

      // If email confirmation is required by Supabase project settings
      setSuccessConfirmation(true);
    } catch {
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Success State for Email Confirmation
  if (successConfirmation) {
    return (
      <div className="flex flex-col items-center text-center py-4 animate-in fade-in duration-300">
        <div className="w-14 h-14 rounded-2xl bg-purple-100 text-[#5b21b6] flex items-center justify-center mb-5">
          <Mail className="w-7 h-7" />
        </div>

        <h2 className="text-xl font-bold text-[#1b122e] mb-2">
          Account Created
        </h2>

        <p className="text-sm text-[#5d5172] leading-relaxed mb-6 max-w-sm">
          Please check your email (<span className="font-semibold text-[#1b122e]">{email}</span>) to confirm your account before signing in.
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
      {/* Configuration notice if not configured */}
      {!isConfigured && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-purple-50/80 border border-purple-200/90 text-xs text-[#5b21b6]">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Configuration Notice:</span> Add your live Supabase project credentials in <code className="bg-purple-100 px-1 py-0.5 rounded text-[11px]">.env.local</code> to enable real user registration.
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

      {/* Full Name Field */}
      <AuthInput
        label="Full name"
        type="text"
        placeholder="Dr. John Doe"
        value={fullName}
        error={fieldErrors.fullName}
        onChange={(e) => {
          setFullName(e.target.value);
          clearFieldError('fullName');
        }}
        disabled={loading}
      />

      {/* Email Address Field */}
      <div>
        <AuthInput
          label="Email address"
          type="text"
          placeholder="doctor@hospital.com"
          value={email}
          error={fieldErrors.email}
          onChange={(e) => {
            setEmail(e.target.value);
            clearFieldError('email');
          }}
          disabled={loading}
        />
        <p className="text-[11px] text-[#786b8f] mt-1 pl-1">
          Note: A valid email format does not verify account existence. A verification link will be sent upon registration.
        </p>
      </div>

      {/* Password Field */}
      <AuthInput
        label="Password"
        type="password"
        placeholder="At least 6 characters"
        isPassword
        value={password}
        error={fieldErrors.password}
        onChange={(e) => {
          setPassword(e.target.value);
          clearFieldError('password');
        }}
        disabled={loading}
      />

      {/* Confirm Password Field */}
      <AuthInput
        label="Confirm password"
        type="password"
        placeholder="Confirm your password"
        isPassword
        value={confirmPassword}
        error={fieldErrors.confirmPassword}
        onChange={(e) => {
          setConfirmPassword(e.target.value);
          clearFieldError('confirmPassword');
        }}
        disabled={loading}
      />

      {/* Terms & Privacy Agreement Checkbox */}
      <div className="pt-1">
        <label className="flex items-start gap-2.5 cursor-pointer select-none group">
          <div
            onClick={() => !loading && setAgreeTerms(!agreeTerms)}
            className={`w-4 h-4 rounded-md border mt-0.5 shrink-0 flex items-center justify-center transition-colors ${
              agreeTerms
                ? 'bg-[#5b21b6] border-[#5b21b6] text-white'
                : 'border-purple-300 bg-white group-hover:border-purple-400'
            } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            {agreeTerms && <Check className="w-3 h-3 stroke-[3]" />}
          </div>
          <span className="text-[#514566] text-xs leading-snug">
            I agree to the{' '}
            <Link to="/terms" className="text-[#5b21b6] font-semibold hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-[#5b21b6] font-semibold hover:underline">
              Privacy Policy
            </Link>
          </span>
        </label>
      </div>

      {/* Create Account Primary Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full mt-2 py-3 px-4 rounded-xl bg-[#4a189a] hover:bg-[#3b127e] disabled:bg-[#4a189a]/70 disabled:cursor-not-allowed text-white text-sm font-bold shadow-md shadow-purple-950/15 hover:shadow-lg hover:shadow-purple-950/25 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99]"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Creating Account...</span>
          </>
        ) : (
          <>
            <span>Create Account</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      {/* Bottom Sign In Navigation */}
      <div className="text-center mt-6 text-xs sm:text-sm text-[#615577]">
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-bold text-[#5b21b6] hover:text-[#3b127e] hover:underline transition-colors"
        >
          Sign in
        </Link>
      </div>
    </form>
  );
};
