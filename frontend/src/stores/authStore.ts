import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { Profile } from '@/types';

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isOnboarded: boolean;
  setSession: (session: Session | null) => void;
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (isLoading: boolean) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  profile: null,
  isLoading: true,
  isOnboarded: false,
  setSession: (session) => set({ session }),
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ 
    profile, 
    isOnboarded: profile ? profile.is_onboarded : false 
  }),
  setLoading: (isLoading) => set({ isLoading }),
  clearAuth: () =>
    set({
      session: null,
      user: null,
      profile: null,
      isOnboarded: false,
      isLoading: false,
    }),
}));
