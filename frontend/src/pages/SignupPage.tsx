import React from 'react';
import { AuthLayout } from '../components/auth/AuthLayout';
import { SignupForm } from '../components/auth/SignupForm';

export const SignupPage: React.FC = () => {
  return (
    <AuthLayout
      heading="Create your account"
      subtitle="Join Clinical Navigator today"
    >
      <SignupForm />
    </AuthLayout>
  );
};
