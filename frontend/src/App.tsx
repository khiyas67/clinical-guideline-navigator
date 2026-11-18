import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, PublicOnlyRoute } from './components/auth/ProtectedRoute';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { PatientsPage } from './pages/PatientsPage';
import { PatientProfilePage } from './pages/PatientProfilePage';
import { AssistantPage } from './pages/AssistantPage';
import { GuidelinesPage } from './pages/GuidelinesPage';
import { GuidelineDetailPage } from './pages/GuidelineDetailPage';
import { DecisionSupportPage } from './pages/DecisionSupportPage';
import { SettingsPage } from './pages/SettingsPage';
import { PlaceholderPage } from './pages/PlaceholderPage';

import { ErrorBoundary } from './components/common/ErrorBoundary';

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/privacy" element={<PlaceholderPage title="Privacy Policy" />} />
          <Route path="/terms" element={<PlaceholderPage title="Terms of Service" />} />

          {/* Public-Only Auth Routes (Redirects authenticated clinicians to /dashboard) */}
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <LoginPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicOnlyRoute>
                <SignupPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <PublicOnlyRoute>
                <ForgotPasswordPage />
              </PublicOnlyRoute>
            }
          />

          {/* Password Recovery Session Route */}
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Step 4: Real Dashboard Workspace */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Step 5: Real Patient Management & Profile Pages */}
          <Route
            path="/patients"
            element={
              <ProtectedRoute>
                <PatientsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patients/:id"
            element={
              <ProtectedRoute>
                <PatientProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Step 6: Real AI Clinical Assistant Interface */}
          <Route
            path="/assistant"
            element={
              <ProtectedRoute>
                <AssistantPage />
              </ProtectedRoute>
            }
          />

          {/* Step 7: Real Guidelines Library & Detail Routes */}
          <Route
            path="/guidelines"
            element={
              <ProtectedRoute>
                <GuidelinesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/guidelines/:id"
            element={
              <ProtectedRoute>
                <GuidelineDetailPage />
              </ProtectedRoute>
            }
          />

          {/* Step 9: Real Clinical Decision Support & Audit Trail */}
          <Route
            path="/decision-support"
            element={
              <ProtectedRoute>
                <DecisionSupportPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />

          {/* Catch-all 404 Route */}
          <Route
            path="*"
            element={
              <PlaceholderPage
                title="404 - Page Not Found"
                description="The requested route does not exist."
              />
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </ErrorBoundary>
  );
};

export default App;
