# Burner Point Supabase Postgres and DBeaver

Use DBeaver only for manual inspection and support operations. Runtime database access stays on Supabase Postgres through the API and Supabase clients.

## Connection source

- Primary runtime database: Supabase Postgres
- Production API connection: `DATABASE_URL`
- Optional direct admin connection: `DIRECT_DATABASE_URL`
- Pooler reference: `POOLER_URL`

## DBeaver setup

1. Create a PostgreSQL connection.
2. Use the Supabase database or pooler host, port, database, username, and password.
3. Enable SSL and set `sslmode=require`.
4. Save separate named connections for development, staging, and production.

## Operator rules

- Use least-privilege credentials where possible.
- Keep production credentials out of docs, screenshots, and issue comments.
- Validate production health through `https://api.burnerpoint.com/health` after deploy, not through ad hoc SQL alone.
