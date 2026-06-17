import React from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { AuthPageLayout } from '@/components/auth/AuthPageLayout';

export default function Login() {
  return (
    <AuthPageLayout>
      <LoginForm />
    </AuthPageLayout>
  );
}
