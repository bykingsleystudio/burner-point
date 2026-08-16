#!/usr/bin/env node
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

function run(command, args, options = {}) {
  try {
    return execFileSync(command, args, { stdio: ['ignore', 'pipe', 'pipe'], ...options });
  } catch (error) {
    const stdout = String(error.stdout || '');
    const stderr = String(error.stderr || '');
    throw new Error(`${command} ${args.join(' ')} failed\nSTDOUT:\n${stdout}\nSTDERR:\n${stderr}`);
  }
}

const repoRoot = path.resolve(__dirname, '../../..');
const migrationsDir = path.join(repoRoot, 'supabase', 'migrations');
const databaseUrl = process.env.DATABASE_URL || process.env.DIRECT_DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL or DIRECT_DATABASE_URL is required to apply Supabase migrations.');
  process.exit(1);
}

const files = fs.readdirSync(migrationsDir)
  .filter((file) => /^\d+_.*\.sql$/i.test(file))
  .sort();

if (!files.length) {
  console.error('No SQL migration files found in supabase/migrations.');
  process.exit(1);
}

const hasDestructiveRemoteSnapshot = fs.readFileSync(path.join(migrationsDir, '20260814021930_remote_schema.sql'), 'utf8').match(/drop\s+table\s+"?public"?\.??"?wallet_locks|drop\s+table\s+"?public"?\.??"?credit_locks|drop\s+index\s+if\s+exists\s+"?public"?\.??"?wallet_locks/i);

if (hasDestructiveRemoteSnapshot) {
  console.error('Migration guard failed: remote schema snapshot still contains destructive wallet/credit table drops.');
  process.exit(2);
}

for (const file of files) {
  const fullPath = path.join(migrationsDir, file);
  const sql = fs.readFileSync(fullPath, 'utf8');

  if (/drop\s+table.*wallet_locks|drop\s+table.*credit_locks|drop\s+index.*wallet_locks|drop\s+index.*credit_locks/i.test(sql)) {
    console.error(`Blocking destructive migration: ${file}`);
    process.exit(3);
  }

  console.log(`Applying ${file}`);
  try {
    run('psql', ['-v', 'ON_ERROR_STOP=1', '-d', databaseUrl, '-f', fullPath]);
  } catch (error) {
    console.error(`Migration failed while applying ${file}: ${error.message}`);
    process.exit(4);
  }
}

console.log('All canonical Supabase migrations applied successfully.');
