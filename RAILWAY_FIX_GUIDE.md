# Railway Deployment Guide

This guide documents the current Burner Point Railway API deployment setup. The previous "copy files from bundle" steps are no longer needed because the required Railway files already exist in the repo under `apps/api`.

## Problem This Solves

Railway can fail with:

```text
Could not find root directory: apps/api
```

This happens when Railway is pointed at the wrong repo root or at an absolute Windows path. Railway root directories must be relative to the GitHub repo root.

## Current Repo State

The API service lives at:

```text
apps/api
```

The required Railway deployment files are already present:

```text
apps/api/Dockerfile
apps/api/nest-cli.json
apps/api/package.json
apps/api/railway.toml
apps/api/src
apps/api/tsconfig.json
```

Verify locally:

```powershell
Get-ChildItem ".\apps\api" | Select-Object Name
```

## Railway Service Settings

In Railway:

1. Open the `burner-point-production` project.
2. Open the `burner-point-api` service.
3. Go to `Settings -> Source`.
4. Set root directory to:

```text
apps/api
```

Use exactly `apps/api`.

Do not use:

```text
C:\Users\HP\projects\burner-point\burner-point\apps\api
/apps/api
burner-point/apps/api
```

## Railway Build Config

Railway reads [apps/api/railway.toml](apps/api/railway.toml):

```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "Dockerfile"

[deploy]
startCommand = "node dist/main.js"
healthcheckPath = "/health"
healthcheckTimeout = 120
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

The Dockerfile builds from inside `apps/api`, runs `npm ci`, runs the Nest build, verifies `dist/main.js`, and starts:

```text
node dist/main.js
```

## Required Railway Variables

Set these in Railway under:

```text
burner-point-api -> Variables
```

Burner Point uses Neon Postgres as the system-of-record database. Railway should run the API and Redis, but the production `DATABASE_URL` should come from Neon.

### Database And Cache

Use real values from the Neon dashboard. Do not commit real Neon credentials.

```env
DATABASE_URL=postgresql://neon_user:neon_password@ep-example-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=false
DB_SYNCHRONIZE=false
DB_LOGGING=false
REDIS_URL=${{Redis.REDIS_URL}}
```

Notes:

- `DATABASE_URL` must include `?sslmode=require`, or `DB_SSL=true` must be set.
- Keep `DB_SYNCHRONIZE=false` in production.
- Keep `REDIS_URL` pointed at Railway Redis if Redis is hosted in Railway.

### Required App Secrets

```env
NODE_ENV=production
APP_PORT=3001
JWT_ACCESS_SECRET=<your 128-char hex>
JWT_REFRESH_SECRET=<your different 128-char hex>
ENCRYPTION_KEY=<your 32-char hex>
ADMIN_SECRET_KEY=<your strong string>
```

### Twilio

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxx
TWILIO_VERIFY_SERVICE_SID=VAxxxxxxxx
TWILIO_DEFAULT_FROM=+15551234567
```

### Payments

Use sandbox keys first, then rotate to production keys after payment testing.

```env
PAYSTACK_SECRET_KEY=sk_test_xxx
PAYSTACK_PUBLIC_KEY=pk_test_xxx
PAYSTACK_WEBHOOK_SECRET=xxx

PADDLE_API_KEY=xxx
PADDLE_CLIENT_TOKEN=xxx
PADDLE_WEBHOOK_SECRET=whsec_xxx
PADDLE_SANDBOX=true
PADDLE_PRICE_VERIFICATION=pri_xxx
PADDLE_PRICE_RENTAL=pri_xxx
PADDLE_PRICE_SUB_MONTHLY=pri_xxx

NOWPAYMENTS_API_KEY=xxx
NOWPAYMENTS_IPN_SECRET=xxx
NOWPAYMENTS_SANDBOX=true
```

Flutterwave, Squad, Korapay, and OPay can stay disabled or sandbox-only unless they are intentionally enabled for the current revenue flow.

### OpenAI

```env
OPENAI_API_KEY=sk-proj-xxx
OPENAI_MODEL=gpt-4o-mini
AI_KILL_SWITCH=false
```

### Email

```env
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_USER=resend
SMTP_PASS=re_xxx
SMTP_FROM=noreply@burnerpoint.app
```

### CORS

Set this to your actual production web domains:

```env
CORS_ORIGINS=https://burnerpoint.vercel.app,https://burnerpoint.app,https://www.burnerpoint.app
WEB_URL=https://burnerpoint.vercel.app
APP_URL=https://burner-point-api-production.up.railway.app
```

## Local Verification Before Deploy

```powershell
cd C:\Users\HP\projects\burner-point\burner-point\apps\api
npm run build
```

Expected result:

```text
nest build
```

The build should complete without TypeScript errors and create `dist/main.js`.

## Deploy

Railway auto-deploys from GitHub if the service is connected to `main`. You can also deploy manually from the API directory:

```powershell
cd C:\Users\HP\projects\burner-point\burner-point\apps\api
railway up --service burner-point-api --environment production --detach --message "Manual API deploy"
```

## Verify Production

Check Railway service status:

```powershell
railway service status --service burner-point-api --environment production --json
```

Check the health endpoint:

```powershell
Invoke-WebRequest -Uri "https://burner-point-api-production.up.railway.app/health" -UseBasicParsing |
  Select-Object -ExpandProperty Content
```

Expected response shape:

```json
{"status":"ok","timestamp":"2026-04-07T00:00:00.000Z","uptime":12,"environment":"production"}
```

If the endpoint returns HTTP 200, the Railway API deployment is healthy.

## Common Failures

### Could not find root directory

Set Railway root directory to exactly:

```text
apps/api
```

### nest: command not found

Confirm `@nestjs/cli` is available in [apps/api/package.json](apps/api/package.json). The Dockerfile uses the local binary:

```text
./node_modules/.bin/nest build
```

### Health check failing

Confirm:

- `/health` returns HTTP 200.
- `DATABASE_URL` is set to the Neon connection string.
- `REDIS_URL` is set.
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `ENCRYPTION_KEY`, and `ADMIN_SECRET_KEY` are set.
- Neon allows SSL connections and the URL includes `?sslmode=require`.

### DATABASE_URL not set

Copy the connection string from Neon and add it to Railway as:

```env
DATABASE_URL=postgresql://...?...sslmode=require
```

Do not use Railway Postgres as the production system of record unless you intentionally roll back the Neon database decision.
