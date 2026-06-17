import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env');

const env = {};
if (existsSync(envPath)) {
  const content = readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    env[key] = value;
  }
}

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkStorage() {
  console.log('Testing connection to:', supabaseUrl);
  
  // Try to query public.profiles to see if DB is reachable
  const { data: profiles, error: pError } = await supabase
    .from('profiles')
    .select('id, username')
    .limit(1);
    
  if (pError) {
    console.error('Error fetching profiles:', pError.message);
  } else {
    console.log('Successfully connected to DB! Profiles sample:', profiles);
  }

  // Try to fetch public URLs for test objects
  const { data: storyUrl } = supabase.storage.from('stories').getPublicUrl('test.jpg');
  console.log('Test public URL for stories bucket:', storyUrl?.publicUrl);

  const { data: postUrl } = supabase.storage.from('posts').getPublicUrl('test.jpg');
  console.log('Test public URL for posts bucket:', postUrl?.publicUrl);
}

checkStorage().catch(console.error);
