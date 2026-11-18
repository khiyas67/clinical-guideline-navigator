import React from 'react';
import { AuthLayout } from '../components/auth/AuthLayout';
import { ResetPasswordForm } from '../components/auth/ResetPasswordForm';

export const ResetPasswordPage: React.FC = () => {
  return (
    <AuthLayout
      heading="Set new password"
      subtitle="Enter your new password below to regain account access."
    >
      <ResetPasswordForm />
    </AuthLayout>
  );
};
