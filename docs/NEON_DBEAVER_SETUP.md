# Burner Point Neon Postgres And DBeaver Setup

This codebase uses Postgres through TypeORM. Neon Postgres is the selected database, and DBeaver is the selected database client. TablePlus is not required for this repo.

## Source Of Truth

- Runtime database: Neon Postgres.
- Database client: DBeaver.
- API env key: `DATABASE_URL`.
- Optional fallback env keys: `DB_HOST`, `DB_PORT`, `DB_USER` or `DB_USERNAME`, `DB_PASS` or `DB_PASSWORD`, `DB_NAME` or `DB_DATABASE`.
- SSL keys: `DB_SSL=true`, `DB_SSL_REJECT_UNAUTHORIZED=false`.

Do not commit real Neon credentials. Put real values in local `.env` files and platform secret stores only.

## Neon Connection Format

Use the Neon connection string format below in Railway and local API development:

```env
DATABASE_URL=postgresql://neon_user:neon_password@ep-example-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=false
DB_SYNCHRONIZE=false
DB_LOGGING=false
```

Replace the placeholder values with the values from Neon:

| Value | Where it goes |
| --- | --- |
| Host | `DB_HOST` and the host section of `DATABASE_URL` |
| Port | `DB_PORT`, usually `5432` |
| Database | `DB_NAME` and the path section of `DATABASE_URL` |
| User | `DB_USER` and the username section of `DATABASE_URL` |
| Password | `DB_PASS` and the password section of `DATABASE_URL` |
| SSL mode | `?sslmode=require` plus `DB_SSL=true` |

Use a separate Neon branch or database per environment:

| Environment | Neon target |
| --- | --- |
| Development | Development branch/database |
| Staging | Staging branch/database |
| Production | Production branch/database |

## Railway API Variables

Set these in Railway under `burner-point-api -> Variables`:

```env
DATABASE_URL=postgresql://neon_user:neon_password@ep-example-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=false
DB_SYNCHRONIZE=false
DB_LOGGING=false
```

Keep Redis on Railway if that is your active Redis service:

```env
REDIS_URL=${{Redis.REDIS_URL}}
```

Do not use a Railway Postgres plugin as the production system of record for Burner Point unless you intentionally roll back this Neon decision.

## Local API Setup

For local backend development:

```powershell
Copy-Item apps/api/.env.example apps/api/.env
```

Then replace the placeholder Neon values in `apps/api/.env` with the real development Neon branch credentials. The TypeORM config also supports root `.env`, but `apps/api/.env` should be the app-specific source during API work.

## DBeaver Connection

Create a new DBeaver connection:

1. Select `Database -> New Database Connection`.
2. Choose `PostgreSQL`.
3. Use these connection fields:

| DBeaver field | Value |
| --- | --- |
| Host | `ep-example-123456.us-east-2.aws.neon.tech` |
| Port | `5432` |
| Database | `neondb` |
| Username | `neon_user` |
| Password | `neon_password` |

4. Open the `SSL` tab or driver properties.
5. Enable SSL and set driver property `sslmode=require`.
6. Test the connection.
7. Save it as `Burner Point - Neon - Development`, `Burner Point - Neon - Staging`, or `Burner Point - Neon - Production`.

If DBeaver prompts for a PostgreSQL driver download, allow it to install the official PostgreSQL JDBC driver.

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

Production validation should be done through Railway after setting the Neon `DATABASE_URL` and redeploying `burner-point-api`.

## Notes

- Existing TypeORM entities and SQL migrations are Postgres-compatible.
- Neon requires SSL; the API now infers SSL from `NODE_ENV=production`, `DB_SSL=true`, `sslmode=require`, or `.neon.tech` hosts.
- DBeaver is only a database client. No runtime code imports or depends on DBeaver.
- TablePlus is not referenced by the active source tree.
