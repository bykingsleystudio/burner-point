#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Load .env
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const dbUrl = envContent
  .split('\n')
  .find(line => line.startsWith('DIRECT_DATABASE_URL='))
  .split('=')[1]
  .trim();

console.log('🔍 Verifying production schema migration...\n');

// Test 1: Email column nullability
try {
  const result = execSync(
    `psql "${dbUrl}" -t -c "SELECT is_nullable FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email';"`,
    { encoding: 'utf8' }
  ).trim();
  console.log(`✓ Email column nullability: ${result === 'YES' ? 'NULLABLE ✓' : 'NOT NULL ✗'}`);
} catch (e) {
  console.error(`✗ Query failed: ${e.message}`);
}

// Test 2: Identity constraint
try {
  const result = execSync(
    `psql "${dbUrl}" -t -c "SELECT constraint_name FROM information_schema.table_constraints WHERE table_name = 'users' AND constraint_name = 'users_requires_identity';"`,
    { encoding: 'utf8' }
  ).trim();
  console.log(
    `✓ Identity constraint: ${result === 'users_requires_identity' ? 'EXISTS ✓' : 'MISSING ✗'}`
  );
} catch (e) {
  console.error(`✗ Query failed: ${e.message}`);
}

// Test 3: Partial unique indexes
try {
  const result = execSync(
    `psql "${dbUrl}" -t -c "SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'users' AND indexname LIKE 'idx_users_%';"`,
    { encoding: 'utf8' }
  ).trim();
  const count = parseInt(result, 10);
  console.log(
    `✓ Partial unique indexes: Found ${count} indexes ${count >= 3 ? '✓' : '✗'}`
  );
} catch (e) {
  console.error(`✗ Query failed: ${e.message}`);
}

// Test 4: Trigger
try {
  const result = execSync(
    `psql "${dbUrl}" -t -c "SELECT EXISTS(SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created');"`,
    { encoding: 'utf8' }
  ).trim();
  console.log(`✓ Trigger on_auth_user_created: ${result === 't' ? 'EXISTS ✓' : 'MISSING ✗'}`);
} catch (e) {
  console.error(`✗ Query failed: ${e.message}`);
}

console.log('\n✓ Schema verification complete');
