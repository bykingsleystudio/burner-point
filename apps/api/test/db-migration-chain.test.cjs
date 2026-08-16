const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('production-safe migration runner exists and the neutralized remote schema preserves the financial ledger', () => {
  const runnerPath = path.join(__dirname, '../scripts/run-db-migrations.js');
  assert.equal(fs.existsSync(runnerPath), true, 'run-db-migrations.js should exist');

  const remoteSchemaPath = path.join(__dirname, '../../../supabase/migrations/20260814021930_remote_schema.sql');
  const remoteSchema = fs.readFileSync(remoteSchemaPath, 'utf8');

  assert.match(remoteSchema, /CREATE TABLE IF NOT EXISTS public\.wallet_locks/i);
  assert.match(remoteSchema, /CREATE TABLE IF NOT EXISTS public\.credit_locks/i);
  assert.doesNotMatch(remoteSchema, /drop table\s+"public"\."wallet_locks"|drop table.*wallet_locks/i);
  assert.doesNotMatch(remoteSchema, /drop table\s+"public"\."credit_locks"|drop table.*credit_locks/i);
});
