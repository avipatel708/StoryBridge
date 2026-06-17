import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { Mail, Lock, User, UserPlus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { validateEmail, validatePassword } from '@/lib/utils';
import { toast } from 'sonner';

export function SignUpForm() {
  const navigate = useNavigate();
  const { setSession, setUser } = useAuthStore();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isPending, setIsPending] = useState(false);
  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors: typeof errors = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Full Name is required';
    }

    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) {
      newErrors.email = emailCheck.message;
    }

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
      // Step 1: Create the account
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (error) {
        toast.error(error.message);
        setIsPending(false);
        return;
      }

      // Step 2: If session came back (no email confirmation), we're done
      if (data.session && data.user) {
        setSession(data.session);
        setUser(data.user);
        toast.success('Account created! Welcome to StoryBridge 🎉');
        navigate('/onboarding');
        return;
      }

      // Step 3: If no session (email confirmation is enabled on Supabase),
      // automatically sign in with the same credentials right away
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        // If sign-in also fails, the account was created but can't auto-login
        // This happens when Supabase has "Confirm email" ON and blocks unverified logins
        // Inform the user clearly
        toast.error(
          'Account created, but your Supabase project requires email verification before login. ' +
          'Please go to Supabase Dashboard → Auth → Providers → Email and turn OFF "Confirm email" to allow direct login.'
        );
        setIsPending(false);
        return;
      }

      // Successfully signed in after signup!
      if (signInData.session && signInData.user) {
        setSession(signInData.session);
        setUser(signInData.user);
      }
      toast.success('Account created! Welcome to StoryBridge 🎉');
      navigate('/onboarding');
    } catch (err: any) {
      toast.error(err.message || 'An error occurred during registration.');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Card variant="glass" padding="lg" className="w-full max-w-md mx-auto shadow-2xl border-slate-200/80 dark:border-slate-800/80">
      <form onSubmit={handleSignUp} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5 text-center mb-2">
          <h2 className="text-2xl font-bold font-outfit text-slate-850 dark:text-[#F8FAFC]">
            Join StoryBridge
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Start sharing stories and building connections
          </p>
        </div>

        {/* Full Name */}
        <Input
          type="text"
          label="Full Name"
          placeholder="John Doe"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          error={errors.fullName}
          leftIcon={<User className="h-5 w-5" />}
          disabled={isPending}
        />

        {/* Email */}
        <Input
          type="email"
          label="Email Address"
          placeholder="john@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          leftIcon={<Mail className="h-5 w-5" />}
          disabled={isPending}
        />

        {/* Password */}
        <Input
          type="password"
          label="Password"
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
          leftIcon={<UserPlus className="h-4.5 w-4.5" />}
        >
          Sign Up
        </Button>

        {/* Footer Redirect */}
        <div className="text-center text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 font-bold">
            Login
          </Link>
        </div>
      </form>
    </Card>
  );
}

