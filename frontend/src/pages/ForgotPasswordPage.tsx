import React from 'react';
import { AuthLayout } from '../components/auth/AuthLayout';
import { ForgotPasswordForm } from '../components/auth/ForgotPasswordForm';

export const ForgotPasswordPage: React.FC = () => {
  return (
    <AuthLayout
      heading="Reset your password"
      subtitle="Enter your email and we'll send you instructions to reset your password."
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
};
