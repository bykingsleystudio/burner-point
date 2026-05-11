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

Burner Point uses Supabase Postgres as the system-of-record database. Railway should run the API and Redis, but the production `DATABASE_URL` should come from Supabase's pooled connection string.

### Database And Cache

Use real values from the Supabase dashboard. Do not commit real Supabase credentials.

```env
DATABASE_URL=
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
JWT_SECRET=
JWT_REFRESH_SECRET=
ENCRYPTION_KEY=
ADMIN_SECRET_KEY=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
REVENUECAT_SECRET_API_KEY=
REVENUECAT_PROJECT_ID=
REVENUECAT_WEBHOOK_AUTHORIZATION=
```

Do not commit Supabase service-role keys, RevenueCat secret keys, JWT secrets, or provider API keys. Rotate any secret that was shared in chat or screenshots before production.

### Twilio

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxx
TWILIO_AUTH_TOKEN=
TWILIO_VERIFY_SERVICE_SID=
TWILIO_DEFAULT_FROM=
```

### Telnyx and Tremil Routing

Set these when enabling the global verification fallback routes, Telnyx number infrastructure, and the Tremil economy route. Provider callback URLs should point to the production API domain under the global `/api` prefix:

- Telnyx messaging and number events: `https://api.burnerpoint.com/api/webhooks/telnyx`

```env
SMS_DEFAULT_FROM=BurnerPoint
TELNYX_API_KEY=
TELNYX_MESSAGING_PROFILE_ID=
TELNYX_CONNECTION_ID=
TELNYX_DEFAULT_FROM=
TREMIL_API_KEY=
TREMIL_SECRET=
TREMIL_BASE_URL=
```

### Payments

Use live production keys for the production Railway service. Use a separate staging service for sandbox or test credentials.

```env
PAYSTACK_SECRET_KEY=
PAYSTACK_PUBLIC_KEY=
PAYSTACK_WEBHOOK_SECRET=

PADDLE_API_KEY=
PADDLE_CLIENT_TOKEN=
PADDLE_WEBHOOK_SECRET=
PADDLE_SANDBOX=
PADDLE_PRICE_VERIFICATION=
PADDLE_PRICE_RENTAL=
PADDLE_PRICE_SUB_MONTHLY=

NOWPAYMENTS_API_KEY=
NOWPAYMENTS_IPN_SECRET=
NOWPAYMENTS_SANDBOX=false
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
RESEND_API_KEY=
RESEND_FROM_EMAIL=Burner Point <no-reply@burnerpoint.com>
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_USER=resend
SMTP_PASS=
SMTP_FROM=Burner Point <no-reply@burnerpoint.com>
```

### CORS

Set this to your actual production web domains:

```env
CORS_ALLOWED_ORIGINS=https://burnerpoint.com,https://www.burnerpoint.com
WEB_URL=https://burnerpoint.com
APP_URL=https://burnerpoint.com
API_URL=https://api.burnerpoint.com
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
Invoke-WebRequest -Uri "https://api.burnerpoint.com/health" -UseBasicParsing |
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
- `DATABASE_URL` is set to the Supabase pooled connection string.
- `REDIS_URL` is set.
- `JWT_SECRET`, `ENCRYPTION_KEY`, and `ADMIN_SECRET_KEY` are set.
- Supabase allows SSL connections and the URL includes the correct pooler parameters.

### DATABASE_URL not set

Copy the pooled connection string from Supabase and add it to Railway as:

```env
DATABASE_URL=<paste_supabase_pooled_connection_string_with_sslmode_require>
```

Do not use Railway Postgres as the production system of record unless you intentionally roll back the Supabase database decision.
