import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

function loadEnv() {
  const envPath = resolve(rootDir, '.env');
  if (!existsSync(envPath)) {
    console.log('No .env found at:', envPath);
    return;
  }

  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: missing env variables', { supabaseUrl, supabaseAnonKey });
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testUpload() {
  console.log('Testing Supabase Connection...');
  console.log('URL:', supabaseUrl);
  
  // Test 1: Fetch profiles and stories
  try {
    const { data: profiles, error: pError } = await supabase.from('profiles').select('*').limit(1);
    if (pError) {
      console.error('Profiles query failed:', pError.message);
    } else {
      console.log('Profiles query success. Found profiles:', profiles.length);
    }

    const { data: stories, error: sError } = await supabase.from('stories').select('*').limit(1);
    if (sError) {
      console.error('Stories query failed:', sError.message);
    } else {
      console.log('Stories query success. Found stories:', stories.length);
    }
  } catch (err) {
    console.error('Database query exception:', err.message);
  }

  // Test 2: Try to upload a mock jpeg to 'stories' bucket
  try {
    console.log('Testing upload of mock JPEG to "nonexistent_bucket_xyz" bucket...');
    // A tiny 1x1 transparent pixel GIF or JPEG buffer
    const mockImageBuffer = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );
    const fileName = `test-${Date.now()}.jpg`;
    
    const { data, error } = await supabase.storage
      .from('nonexistent_bucket_xyz')
      .upload(fileName, mockImageBuffer, {
        contentType: 'image/jpeg',
      });
      
    if (error) {
      console.error('Upload failed:', error.message);
      console.error('Full error details:', JSON.stringify(error, null, 2));
    } else {
      console.log('Upload success! File path in bucket:', data.path);
      
      // Clean up
      console.log('Cleaning up uploaded file...');
      const { error: dError } = await supabase.storage.from('stories').remove([fileName]);
      if (dError) {
        console.error('Cleanup failed:', dError.message);
      } else {
        console.log('Cleanup success.');
      }
    }
  } catch (err) {
    console.error('Upload exception:', err.message);
  }
}

testUpload();
