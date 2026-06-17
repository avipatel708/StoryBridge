import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';

/**
 * Supabase auth uses an internal lock. Never await Supabase calls inside
 * onAuthStateChange — defer work with queueMicrotask instead.
 */
export function deferAuthSideEffect(task: () => void | Promise<void>) {
  queueMicrotask(() => {
    void task();
  });
}

export async function fetchUserProfile(
  userId: string,
  user?: User | null
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (data) {
    return data as Profile;
  }

  if (error) {
    console.error('Error fetching profile:', error);
  }

  return ensureUserProfile(userId, user);
}

async function ensureUserProfile(
  userId: string,
  user?: User | null
): Promise<Profile | null> {
  let metadata = user?.user_metadata;

  if (!metadata) {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    metadata = authUser?.user_metadata;
  }

  const username =
    (typeof metadata?.username === 'string' && metadata.username) ||
    `user_${userId.replace(/-/g, '').slice(0, 8)}`;
  const fullName =
    (typeof metadata?.full_name === 'string' && metadata.full_name) || '';

  const { data: created, error: insertError } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      username,
      full_name: fullName,
      is_onboarded: false,
    })
    .select('*')
    .single();

  if (created) {
    return created as Profile;
  }

  if (insertError) {
    const { data: existing } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (existing) {
      return existing as Profile;
    }

    console.error('Error creating profile:', insertError);
  }

  return null;
}

export function syncSessionToStore(
  session: Session | null,
  setters: {
    setSession: (session: Session | null) => void;
    setUser: (user: User | null) => void;
  }
) {
  setters.setSession(session);
  setters.setUser(session?.user ?? null);
}
