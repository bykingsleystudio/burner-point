# Burner Point Supabase Postgres And DBeaver Setup

This codebase uses Supabase Postgres through TypeORM and Supabase client APIs. DBeaver is the approved database client for manual inspection and support operations.

## Source Of Truth

- Runtime database: Supabase Postgres.
- Database client: DBeaver.
- API database env key: `DATABASE_URL`.
- Supabase API env keys: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- Optional database fallback env keys: `DB_HOST`, `DB_PORT`, `DB_USER` or `DB_USERNAME`, `DB_PASS` or `DB_PASSWORD`, `DB_NAME` or `DB_DATABASE`.
- SSL keys: `DB_SSL=true`, `DB_SSL_REJECT_UNAUTHORIZED=false`.

Do not commit real Supabase credentials. Put real values in ignored `.env` files and platform secret stores only.

## Supabase Connection Format

Use the Supabase pooled connection string in Railway and production API environments:

```env
DATABASE_URL=<paste_supabase_pooled_connection_string_with_sslmode_require>
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=false
DB_SYNCHRONIZE=false
DB_LOGGING=false
```

Set `DATABASE_URL` to the exact pooled production connection string copied from the Supabase dashboard:

| Value | Where it goes |
| --- | --- |
| Host | `DB_HOST` and the host section of `DATABASE_URL` |
| Port | `DB_PORT`, usually `6543` for the Supabase pooler |
| Database | `DB_NAME` and the path section of `DATABASE_URL` |
| User | `DB_USER` and the username section of `DATABASE_URL` |
| Password | `DB_PASS` and the password section of `DATABASE_URL` |
| SSL mode | `?sslmode=require` plus `DB_SSL=true` |

Use separate Supabase projects or isolated databases per environment:

| Environment | Supabase target |
| --- | --- |
| Development | Development project or local Supabase |
| Staging | Staging project |
| Production | Production project |

## Railway API Variables

Set these in Railway under `burner-point-api -> Variables`:

```env
DATABASE_URL=
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=false
DB_SYNCHRONIZE=false
DB_LOGGING=false
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Keep Redis on Railway if that is your active Redis service:

```env
REDIS_URL=${{Redis.REDIS_URL}}
```

Do not use a Railway Postgres plugin as the production system of record unless you intentionally roll back the Supabase database decision.

## Local API Setup

For local backend development:

```powershell
Copy-Item apps/api/.env.example apps/api/.env
```

Then set development Supabase credentials in `apps/api/.env`. The TypeORM config also supports root `.env`, but `apps/api/.env` should be the app-specific source during API work.

## DBeaver Connection

Create a new DBeaver connection:

1. Select `Database -> New Database Connection`.
2. Choose `PostgreSQL`.
3. Use these connection fields from the Supabase database settings or pooler details:

| DBeaver field | Value |
| --- | --- |
| Host | Supabase database or pooler host |
| Port | Supabase database or pooler port |
| Database | Supabase database name |
| Username | Supabase database username |
| Password | Supabase database password |

4. Open the `SSL` tab or driver properties.
5. Enable SSL and set driver property `sslmode=require`.
6. Test the connection.
7. Save it as `Burner Point - Supabase - Development`, `Burner Point - Supabase - Staging`, or `Burner Point - Supabase - Production`.

Use read-only credentials for routine inspection where possible.

## Verification

Backend build:

```powershell
cd apps/api
npm run build
```

Migration/data-source validation:

```powershell
cd apps/api
npm run typeorm -- migration:show -d src/database/data-source.ts
```

Runtime validation:

```powershell
cd apps/api
npm run start:prod
```

Then check the API health endpoint:

```powershell
Invoke-WebRequest -Uri "http://localhost:3001/health" -UseBasicParsing
```

Production validation should be done through Railway after setting the Supabase `DATABASE_URL` and redeploying `burner-point-api`, then checking `https://api.burnerpoint.com/health`.

## Notes

- Existing TypeORM entities and SQL migrations are Postgres-compatible.
- Supabase production database connections require SSL; the API infers SSL from `NODE_ENV=production`, `DB_SSL=true`, `sslmode=require`, or Supabase pooler hosts.
- Supabase Auth and Storage credentials are separate from the Postgres connection string.
- DBeaver is only a database client. No runtime code imports or depends on DBeaver.
