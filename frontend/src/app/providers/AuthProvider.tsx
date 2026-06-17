import React, { createContext, useContext, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { deferAuthSideEffect, fetchUserProfile } from '@/lib/auth';
import { useAuthStore } from '@/stores/authStore';

interface AuthContextType {
  signOut: () => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { setSession, setUser, setProfile, setLoading, clearAuth } = useAuthStore();

  useEffect(() => {
    const refreshProfile = (userId: string, user: User) => {
      deferAuthSideEffect(async () => {
        try {
          const profile = await fetchUserProfile(userId, user);
          setProfile(profile);
        } catch (err) {
          console.error('Profile refresh error:', err);
        }
      });
    };

    const initializeAuth = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const profile = await fetchUserProfile(session.user.id, session.user);
          setProfile(profile);
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        clearAuth();
      } finally {
        setLoading(false);
      }
    };

    void initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
          clearAuth();
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          refreshProfile(session.user.id, session.user);
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [setSession, setUser, setProfile, setLoading, clearAuth]);

  const signOut = async () => {
    clearAuth();

    try {
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      return { error: error as Error | null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  return (
    <AuthContext.Provider value={{ signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
