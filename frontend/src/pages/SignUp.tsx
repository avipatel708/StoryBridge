import React from 'react';
import { SignUpForm } from '@/components/auth/SignUpForm';
import { AuthPageLayout } from '@/components/auth/AuthPageLayout';

export default function SignUp() {
  return (
    <AuthPageLayout>
      <SignUpForm />
    </AuthPageLayout>
  );
}
