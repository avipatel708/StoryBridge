import React from 'react';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import { AuthPageLayout } from '@/components/auth/AuthPageLayout';

export default function ResetPassword() {
  return (
    <AuthPageLayout>
      <ResetPasswordForm />
    </AuthPageLayout>
  );
}
