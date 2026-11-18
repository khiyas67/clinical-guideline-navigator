import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  isDemoUser?: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ data: any; error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ data: any; error: Error | null }>;
  signInAsDemo: () => void;
  signOut: () => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (password: string) => Promise<{ error: Error | null }>;
  updateProfile: (fullName: string) => Promise<{ data: any; error: Error | null }>;
}

const DEMO_CLINICIAN_USER: User = {
  id: '00000000-0000-0000-0000-000000000001',
  app_metadata: { provider: 'demo' },
  user_metadata: { full_name: 'Dr. Sarah Mitchell, MD' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  email: 'dr.mitchell@clinicalnavigator.demo',
  phone: '',
  role: 'authenticated',
  updated_at: new Date().toISOString(),
} as User;

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check for active demo clinician session
    const storedDemo = localStorage.getItem('clinical_nav_demo_user');
    if (storedDemo) {
      try {
        const parsed = JSON.parse(storedDemo);
        setUser(parsed);
        setSession({ user: parsed } as any);
        setLoading(false);
        return;
      } catch {
        localStorage.removeItem('clinical_nav_demo_user');
      }
    }

    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    // 2. Fetch current session from Supabase on mount with safety timeout
    const timeoutId = setTimeout(() => {
      setLoading(false);
    }, 2500);

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      clearTimeout(timeoutId);
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      setLoading(false);
    }).catch(() => {
      clearTimeout(timeoutId);
      setLoading(false);
    });

    // 3. Subscribe to auth state updates
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      clearTimeout(timeoutId);
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    if (!isSupabaseConfigured) {
      return { data: null, error: new Error('Supabase is not configured yet. Please configure your .env.local file.') };
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    if (data?.session) {
      setSession(data.session);
      setUser(data.user);
      setLoading(false);
    }
    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return { data: null, error: new Error('Supabase is not configured yet. Please configure your .env.local file.') };
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (data?.session) {
      setSession(data.session);
      setUser(data.user);
      setLoading(false);
    }
    return { data, error };
  };

  const signInAsDemo = () => {
    localStorage.setItem('clinical_nav_demo_user', JSON.stringify(DEMO_CLINICIAN_USER));
    setUser(DEMO_CLINICIAN_USER);
    setSession({ user: DEMO_CLINICIAN_USER } as any);
  };

  const signOut = async () => {
    localStorage.removeItem('clinical_nav_demo_user');
    if (!isSupabaseConfigured) {
      setUser(null);
      setSession(null);
      return { error: null };
    }
    const { error } = await supabase.auth.signOut().catch(() => ({ error: null }));
    setUser(null);
    setSession(null);
    return { error };
  };

  const resetPassword = async (email: string) => {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase is not configured yet. Please configure your .env.local file.') };
    }
    const redirectTo = `${window.location.origin}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    return { error };
  };

  const updatePassword = async (password: string) => {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase is not configured yet. Please configure your .env.local file.') };
    }
    const { error } = await supabase.auth.updateUser({
      password,
    });
    return { error };
  };

  const updateProfile = async (fullName: string) => {
    if (user?.app_metadata?.provider === 'demo') {
      const updatedUser: User = {
        ...user,
        user_metadata: { ...user.user_metadata, full_name: fullName },
      };
      localStorage.setItem('clinical_nav_demo_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      return { data: { user: updatedUser }, error: null };
    }

    if (!isSupabaseConfigured) {
      return { data: null, error: new Error('Supabase is not configured yet. Please configure your .env.local file.') };
    }
    const { data, error } = await supabase.auth.updateUser({
      data: {
        full_name: fullName,
      },
    });
    if (data?.user) {
      setUser(data.user);
    }
    return { data, error };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isConfigured: isSupabaseConfigured,
        isDemoUser: user?.app_metadata?.provider === 'demo',
        signUp,
        signIn,
        signInAsDemo,
        signOut,
        resetPassword,
        updatePassword,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
