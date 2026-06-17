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
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
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
    console.error('\n❌ ERROR: Missing database password.');
    console.error('Please add your database password to .env:');
    console.error('  SUPABASE_DB_PASSWORD=your_database_password');
    console.error('\nFind it in your Supabase Dashboard → Project Settings → Database → Database password\n');
    process.exit(1);
  }

  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  console.log('Connecting to Supabase Postgres database...');
  await client.connect();
  console.log('Connected successfully!');

  const migrations = [
    resolve(rootDir, 'supabase/migrations/004_reels_and_story_extensions.sql'),
    resolve(rootDir, 'supabase/migrations/005_highlights_expired_stories.sql')
  ];

  for (const file of migrations) {
    console.log(`Applying migration file: ${file}...`);
    const sql = readFileSync(file, 'utf8');
    try {
      await client.query(sql);
      console.log(`✅ Successfully applied ${file.split(/[\\/]/).pop()}`);
    } catch (err) {
      console.error(`❌ Failed to apply migration: ${err.message}`);
      console.log('Attempting statement-by-statement execution...');
      
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
      
      let successCount = 0;
      let failCount = 0;
      
      for (const stmt of statements) {
        try {
          await client.query(stmt + ';');
          successCount++;
        } catch (e) {
          failCount++;
          console.error(`  - Statement failed: ${stmt.slice(0, 100)}...`);
          console.error(`    Error: ${e.message}`);
        }
      }
      console.log(`Statement-by-statement results: ${successCount} succeeded, ${failCount} failed`);
    }
  }

  await client.end();
  console.log('\nMigration process finished.');
}

main().catch((err) => {
  console.error('Migration execution failed:', err);
  process.exit(1);
});
