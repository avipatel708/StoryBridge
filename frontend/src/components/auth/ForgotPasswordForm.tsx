import React, { useState } from 'react';
import { Link } from 'react-router';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { validateEmail } from '@/lib/utils';
import { toast } from 'sonner';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) {
      setError(emailCheck.message || 'Invalid email');
      return;
    }

    setIsPending(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (resetError) {
        toast.error(resetError.message);
        setError(resetError.message);
        setIsPending(false);
        return;
      }

      setEmailSent(true);
      toast.success('Password reset email sent!');
    } catch (err: any) {
      toast.error(err.message || 'An error occurred.');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Card variant="glass" padding="lg" className="w-full max-w-md mx-auto shadow-2xl border-slate-800/80">
      {emailSent ? (
        <div className="flex flex-col gap-5 text-center">
          <div className="mx-auto p-4 bg-indigo-500/10 rounded-full border border-indigo-500/20 text-indigo-400 w-fit">
            <Send className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-bold font-outfit text-[#F8FAFC]">
            Email Sent
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed max-w-xs mx-auto">
            We've sent password reset instructions to{' '}
            <span className="text-[#F8FAFC] font-semibold">{email}</span>.
          </p>
          <Link
            to="/login"
            className="flex items-center justify-center gap-2 text-indigo-400 hover:text-indigo-300 font-bold text-sm mt-3"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5 text-center mb-2">
            <h2 className="text-2xl font-bold font-outfit text-[#F8FAFC]">
              Reset Password
            </h2>
            <p className="text-sm text-slate-400 font-medium">
              We'll send you instructions to reset your password
            </p>
          </div>

          <Input
            type="email"
            label="Email Address"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={error}
            leftIcon={<Mail className="h-5 w-5" />}
            disabled={isPending}
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full py-3 mt-2 font-bold"
            isLoading={isPending}
            leftIcon={<Send className="h-4 w-4" />}
          >
            Send Instructions
          </Button>

          <Link
            to="/login"
            className="flex items-center justify-center gap-2 text-slate-400 hover:text-white font-bold text-sm mt-2 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Link>
        </form>
      )}
    </Card>
  );
}
