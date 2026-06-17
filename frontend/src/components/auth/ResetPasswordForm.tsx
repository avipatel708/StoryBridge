import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { Lock, ArrowLeft, KeyRound } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { validatePassword } from '@/lib/utils';
import { toast } from 'sonner';

export function ResetPasswordForm() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors: typeof errors = {};

    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      newErrors.password = passwordCheck.message;
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsPending(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        toast.error(error.message);
        setIsPending(false);
        return;
      }

      toast.success('Password updated successfully! Welcome back.');
      navigate('/feed');
    } catch (err: any) {
      toast.error(err.message || 'An error occurred.');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Card variant="glass" padding="lg" className="w-full max-w-md mx-auto shadow-2xl border-slate-800/80">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5 text-center mb-2">
          <div className="mx-auto p-3 bg-indigo-500/10 rounded-full border border-indigo-500/20 text-indigo-400 w-fit mb-2">
            <KeyRound className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold font-outfit text-[#F8FAFC]">
            Choose New Password
          </h2>
          <p className="text-sm text-slate-400 font-medium">
            Type your new secure password below
          </p>
        </div>

        {/* Password */}
        <Input
          type="password"
          label="New Password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          leftIcon={<Lock className="h-5 w-5" />}
          disabled={isPending}
        />

        {/* Confirm Password */}
        <Input
          type="password"
          label="Confirm Password"
          placeholder="Repeat password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={errors.confirmPassword}
          leftIcon={<Lock className="h-5 w-5" />}
          disabled={isPending}
        />

        {/* Submit */}
        <Button
          type="submit"
          variant="primary"
          className="w-full py-3 mt-2 font-bold"
          isLoading={isPending}
          leftIcon={<KeyRound className="h-4.5 w-4.5" />}
        >
          Update Password
        </Button>

        <Link
          to="/login"
          className="flex items-center justify-center gap-2 text-slate-400 hover:text-white font-bold text-sm mt-2 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Login
        </Link>
      </form>
    </Card>
  );
}
