import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const sqlPath = resolve(rootDir, 'supabase', 'fix_storage_permissions.sql');

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
    console.error('\n[Error] Missing database credentials.');
    console.error('Please add your Supabase database password to your .env file:');
    console.error('  SUPABASE_DB_PASSWORD=your_database_password');
    console.error('\nAlternatively, you can run the SQL script manually:');
    console.error('  1. Open: https://supabase.com/dashboard/project/' + (getProjectRef() || 'YOUR_PROJECT') + '/sql/new');
    console.error('  2. Paste the contents of supabase/fix_storage_permissions.sql');
    console.error('  3. Click "Run" at the bottom right.\n');
    process.exit(1);
  }

  const sql = readFileSync(sqlPath, 'utf8');
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  console.log('Connecting to Supabase database...');
  await client.connect();
  console.log('Applying storage permissions fix...');

  try {
    await client.query(sql);
    console.log('\n[Success] Storage permissions and RLS policies applied successfully!');
  } catch (error) {
    console.error('\n[Error] Failed to execute SQL script:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('\nDatabase setup failed:', error.message);
  process.exit(1);
});
