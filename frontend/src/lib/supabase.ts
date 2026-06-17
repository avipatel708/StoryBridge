import { createClient } from '@supabase/supabase-js';

export const getSupabaseUrl = () => {
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    return `${window.location.origin}/supabase-api`;
  }
  return import.meta.env.VITE_SUPABASE_URL || '';
};

export const supabaseUrl = getSupabaseUrl();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
