#!/usr/bin/env python3
import psycopg2
import sys

connection_string = "postgresql://postgres.sdjcavvwramruehjdhpb:udS4kasrdNotwLG2@aws-0-eu-west-1.pooler.supabase.com:5432/postgres"

# Read the migration file
with open("supabase/migrations/0007_production_schema_reconciliation.sql", "r") as f:
    sql_content = f.read()

# Connect and execute
try:
    conn = psycopg2.connect(connection_string)
    cursor = conn.cursor()
    cursor.execute(sql_content)
    conn.commit()
    print("✅ Schema reconciliation migration applied successfully!")
except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1)
finally:
    cursor.close()
    conn.close()
