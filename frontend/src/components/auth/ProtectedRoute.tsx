import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../ui/Logo';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f4fc] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 animate-in fade-in duration-300">
          <Logo size="lg" />
          <div className="flex items-center gap-2 mt-4 text-[#5b21b6] text-sm font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-[#5b21b6] animate-pulse" />
            <span>Verifying clinician credentials...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f4fc] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 animate-in fade-in duration-300">
          <Logo size="lg" />
          <div className="flex items-center gap-2 mt-4 text-[#5b21b6] text-sm font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-[#5b21b6] animate-pulse" />
            <span>Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
