import React from 'react';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { AuthPageLayout } from '@/components/auth/AuthPageLayout';

export default function ForgotPassword() {
  return (
    <AuthPageLayout>
      <ForgotPasswordForm />
    </AuthPageLayout>
  );
}
