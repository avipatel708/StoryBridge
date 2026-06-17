import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { Mail, Lock, LogIn } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { validateEmail } from '@/lib/utils';
import { toast } from 'sonner';

export function LoginForm() {
  const navigate = useNavigate();
  const { setSession, setUser, setProfile } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate inputs
    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) {
      setErrors((prev) => ({ ...prev, email: emailCheck.message }));
      return;
    }
    if (!password) {
      setErrors((prev) => ({ ...prev, password: 'Password is required' }));
      return;
    }

    setIsPending(true);
    try {
      let { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      // If login fails because of unconfirmed email, auto-fix it
      if (error && error.message.toLowerCase().includes('email not confirmed')) {
        // Re-trigger signUp — since "Confirm email" is now OFF in Supabase,
        // this will auto-confirm the existing unconfirmed account
        const { error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

        if (!signUpError) {
          // Retry login after auto-confirm
          const retry = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });
          data = retry.data;
          error = retry.error;
        }
      }

      if (error) {
        // Show a clearer, friendlier error message
        if (error.message.toLowerCase().includes('invalid login credentials') || error.code === 'invalid_credentials') {
          toast.error('Wrong email or password. If you\'re new, click "Sign Up" to create an account!');
        } else {
          toast.error(error.message);
        }
        setIsPending(false);
        return;
      }

      if (!data.user || !data.session) {
        toast.error('Login failed. Please try again.');
        setIsPending(false);
        return;
      }

      setSession(data.session);
      setUser(data.user);

      toast.success('Successfully logged in!');

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError || !profileData) {
        // If profile fetch fails or onboarding not done, go to onboarding
        navigate('/onboarding');
      } else {
        setProfile(profileData);
        if (profileData.is_onboarded) {
          navigate('/feed');
        } else {
          navigate('/onboarding');
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred during login');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Card variant="glass" padding="lg" className="w-full max-w-md mx-auto shadow-2xl border-slate-200/80 dark:border-slate-800/80">
      <form onSubmit={handleLogin} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5 text-center mb-2">
          <h2 className="text-2xl font-bold font-outfit text-slate-850 dark:text-[#F8FAFC]">
            Welcome Back
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Enter your credentials to access your stories
          </p>
        </div>

        {/* Email */}
        <Input
          type="email"
          label="Email Address"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          leftIcon={<Mail className="h-5 w-5" />}
          disabled={isPending}
        />

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <Input
            type="password"
            label="Password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            leftIcon={<Lock className="h-5 w-5" />}
            disabled={isPending}
          />
          <Link
            to="/forgot-password"
            className="text-xs font-semibold text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 self-end mt-1"
          >
            Forgot password?
          </Link>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          variant="primary"
          className="w-full py-3 mt-2 font-bold"
          isLoading={isPending}
          leftIcon={<LogIn className="h-4.5 w-4.5" />}
        >
          Sign In
        </Button>

        {/* Footer Redirect */}
        <div className="text-center text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">
          Don't have an account?{' '}
          <Link to="/signup" className="text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 font-bold">
            Sign Up
          </Link>
        </div>
      </form>
    </Card>
  );
}
