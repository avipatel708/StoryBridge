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

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkBuckets() {
  console.log('Fetching stories bucket info...');
  const { data: storyBucket, error: storyError } = await supabase.storage.getBucket('stories');
  if (storyError) {
    console.error('Error getting stories bucket:', storyError.message);
  } else {
    console.log('Stories bucket info:', storyBucket);
  }

  console.log('Fetching posts bucket info...');
  const { data: postBucket, error: postError } = await supabase.storage.getBucket('posts');
  if (postError) {
    console.error('Error getting posts bucket:', postError.message);
  } else {
    console.log('Posts bucket info:', postBucket);
  }

  console.log('Listing files in stories bucket...');
  const { data: storyFiles, error: storyFilesError } = await supabase.storage.from('stories').list('', { limit: 5 });
  if (storyFilesError) {
    console.error('Error listing files in stories bucket:', storyFilesError.message);
  } else {
    console.log('Stories files (first 5):', storyFiles);
  }

  console.log('Listing files in posts bucket...');
  const { data: postFiles, error: postFilesError } = await supabase.storage.from('posts').list('', { limit: 5 });
  if (postFilesError) {
    console.error('Error listing files in posts bucket:', postFilesError.message);
  } else {
    console.log('Posts files (first 5):', postFiles);
  }
}

checkBuckets().catch(console.error);
