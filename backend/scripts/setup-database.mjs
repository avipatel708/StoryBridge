import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const sqlPath = resolve(rootDir, 'supabase', 'setup.sql');

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

async function verifyProfilesTable(projectUrl, anonKey) {
  const response = await fetch(`${projectUrl}/rest/v1/profiles?select=id&limit=1`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
  });

  if (response.ok) return true;

  const body = await response.text();
  if (body.includes('PGRST205')) return false;
  throw new Error(`Verification failed (${response.status}): ${body}`);
}

async function main() {
  loadEnv();

  const projectUrl = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  const connectionString = buildConnectionString();

  if (!connectionString) {
    console.error('\nMissing database credentials.');
    console.error('Add your Supabase database password to .env:');
    console.error('  SUPABASE_DB_PASSWORD=your_database_password');
    console.error('\nFind it in Supabase Dashboard → Project Settings → Database → Database password');
    console.error('\nOr run the SQL manually:');
    console.error('  https://supabase.com/dashboard/project/' + (getProjectRef() || 'YOUR_PROJECT') + '/sql/new');
    console.error('  Paste the contents of supabase/setup.sql and click Run.\n');
    process.exit(1);
  }

  const sql = readFileSync(sqlPath, 'utf8');
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  console.log('Connecting to Supabase database...');
  await client.connect();
  console.log('Applying StoryBridge schema...');

  try {
    await client.query(sql);
  } finally {
    await client.end();
  }

  if (projectUrl && anonKey) {
    console.log('Verifying profiles table...');
    const ok = await verifyProfilesTable(projectUrl, anonKey);
    if (!ok) {
      throw new Error('Schema applied but profiles table is still not visible. Wait a few seconds and refresh.');
    }
  }

  console.log('Database setup complete.');
}

main().catch((error) => {
  console.error('\nDatabase setup failed:', error.message);
  process.exit(1);
});
