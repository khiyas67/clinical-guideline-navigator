import React from 'react';
import { AuthLayout } from '../components/auth/AuthLayout';
import { LoginForm } from '../components/auth/LoginForm';

export const LoginPage: React.FC = () => {
  return (
    <AuthLayout
      heading="Welcome back"
      subtitle="Sign in to your account"
    >
      <LoginForm />
    </AuthLayout>
  );
};
