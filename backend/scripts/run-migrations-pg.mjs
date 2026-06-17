import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

function loadEnv() {
  const envPath = resolve(rootDir, '.env');
  if (!existsSync(envPath)) return;

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

function getProjectRef() {
  const url = process.env.VITE_SUPABASE_URL || '';
  const match = url.match(/https:\/\/([^.]+)\.supabase\.(co|net)/);
  return match?.[1] || null;
}

function buildConnectionString() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const password = process.env.SUPABASE_DB_PASSWORD;
  const projectRef = getProjectRef();
  if (!password || !projectRef) return null;

  return `postgresql://postgres:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:5432/postgres`;
}

async function main() {
  loadEnv();

  const connectionString = buildConnectionString();

  if (!connectionString) {
    console.error('\n❌ Error: Missing DATABASE_URL or SUPABASE_DB_PASSWORD in .env');
    console.error('Please add your database password to .env:');
    console.error('  SUPABASE_DB_PASSWORD=your_database_password');
    console.error('\nAlternatively, you can run the SQL manually by pasting these files in your Supabase SQL editor:');
    console.log('  1. supabase/migrations/004_reels_and_story_extensions.sql');
    console.log('  2. supabase/migrations/005_highlights_expired_stories.sql');
    console.log('  3. supabase/migrations/006_instagram_features.sql');
    process.exit(1);
  }

  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  console.log('Connecting to Supabase Database...');
  await client.connect();

  const migrations = [
    'supabase/migrations/004_reels_and_story_extensions.sql',
    'supabase/migrations/005_highlights_expired_stories.sql',
    'supabase/migrations/006_instagram_features.sql'
  ];

  try {
    for (const mig of migrations) {
      console.log(`Running migration: ${mig}...`);
      const sql = readFileSync(resolve(rootDir, mig), 'utf8');
      await client.query(sql);
      console.log(`✅ ${mig} completed successfully.`);
    }
    console.log('\n🎉 All migrations executed successfully!');
  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('\nDatabase setup failed:', error.message);
  process.exit(1);
});
