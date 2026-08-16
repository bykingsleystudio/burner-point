#!/usr/bin/env node
const fs = require('fs');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres.sdjcavvwramruehjdhpb:udS4kasrdNotwLG2@aws-0-eu-west-1.pooler.supabase.com:5432/postgres"
});

async function main() {
  const sql = fs.readFileSync('supabase/migrations/0007_production_schema_reconciliation.sql', 'utf-8');
  
  try {
    const client = await pool.connect();
    await client.query(sql);
    console.log('✅ Schema reconciliation migration applied successfully!');
    client.release();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
