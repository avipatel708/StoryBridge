// Apply migration 004 and 005 via Supabase REST API
// Usage: node scripts/apply-migrations.mjs

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

// Load .env
const envPath = resolve(rootDir, '.env');
const envContent = readFileSync(envPath, 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eq = trimmed.indexOf('=');
  if (eq === -1) continue;
  env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
}

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const ANON_KEY = env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !ANON_KEY) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

// Read SQL files
const migrations = [
  resolve(rootDir, 'supabase/migrations/004_reels_and_story_extensions.sql'),
  resolve(rootDir, 'supabase/migrations/005_highlights_expired_stories.sql'),
  resolve(rootDir, 'supabase/migrations/006_instagram_features.sql'),
];

for (const migrationFile of migrations) {
  const sql = readFileSync(migrationFile, 'utf8');
  const fileName = migrationFile.split(/[\\/]/).pop();
  
  console.log(`\nApplying migration: ${fileName}...`);
  
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': ANON_KEY,
      'Authorization': `Bearer ${ANON_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  });

  if (response.ok) {
    console.log(`  ✅ ${fileName} applied successfully`);
  } else {
    const body = await response.text();
    // Try individual statements if the whole file fails
    console.log(`  ⚠️  Bulk apply failed (${response.status}), trying statement-by-statement...`);
    
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    let successCount = 0;
    let failCount = 0;
    
    for (const statement of statements) {
      const stmtResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${ANON_KEY}`,
        },
        body: JSON.stringify({ query: statement + ';' }),
      });
      
      if (stmtResponse.ok) {
        successCount++;
      } else {
        failCount++;
        const stmtBody = await stmtResponse.text();
        console.log(`  ❌ Statement failed: ${statement.slice(0, 60)}...`);
        console.log(`     Error: ${stmtBody.slice(0, 200)}`);
      }
    }
    
    console.log(`  Results: ${successCount} succeeded, ${failCount} failed`);
  }
}

console.log('\n✨ Migration process complete!');
console.log('\nNOTE: If migrations failed, you need to run the SQL manually:');
console.log(`  1. Go to: https://supabase.com/dashboard/project/${SUPABASE_URL.match(/https:\/\/([^.]+)/)?.[1]}/sql/new`);
console.log('  2. Paste the contents of supabase/migrations/004_reels_and_story_extensions.sql');
console.log('  3. Click "Run"');
console.log('  4. Paste the contents of supabase/migrations/005_highlights_expired_stories.sql');
console.log('  5. Click "Run"');
