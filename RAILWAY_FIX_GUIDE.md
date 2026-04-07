# Railway Deployment Fix — Complete Solution
# Solves: "Could not find root directory: apps/api"

## ROOT CAUSE
Railway looked for your app at `apps/api` but your GitHub repo has
the monorepo structure with `burner-point/apps/api`. Railway's root
directory setting must be a path RELATIVE to the repo root.
Also: Railway needs a Dockerfile OR a package.json with build/start
scripts in that exact folder.

---

## STEP 1 — Copy files into your project (PowerShell)

```powershell
cd C:\Users\HP\projects\burner-point\burner-point

# Copy railway.toml into the API directory
# Railway reads this file to know how to build and start your app
Copy-Item "C:\PATH_TO_THIS_BUNDLE\railway.toml" ".\apps\api\railway.toml"

# Copy Dockerfile into the API directory
Copy-Item "C:\PATH_TO_THIS_BUNDLE\Dockerfile" ".\apps\api\Dockerfile"

# Copy nest-cli.json (required for `nest build` to work)
Copy-Item "C:\PATH_TO_THIS_BUNDLE\nest-cli.json" ".\apps\api\nest-cli.json"

# Copy the corrected tsconfig.json
Copy-Item "C:\PATH_TO_THIS_BUNDLE\tsconfig.json" ".\apps\api\tsconfig.json"

# Replace main.ts with the health-check version
Copy-Item "C:\PATH_TO_THIS_BUNDLE\main.ts" ".\apps\api\src\main.ts"

# Update turbo.json at root
Copy-Item "C:\PATH_TO_THIS_BUNDLE\turbo.json" ".\turbo.json"
```

---

## STEP 2 — Verify the structure looks exactly like this

Run in PowerShell:
```powershell
Get-ChildItem ".\apps\api" | Select-Object Name
```

You must see:
```
Dockerfile          ← NEW
nest-cli.json       ← NEW
package.json        ← existing
railway.toml        ← NEW
src/
tsconfig.json       ← updated
```

---

## STEP 3 — Install @nestjs/cli locally (fixes nest build command)

```powershell
cd C:\Users\HP\projects\burner-point\burner-point\apps\api
npm install --save-dev @nestjs/cli
cd ..\..
```

---

## STEP 4 — Test the build locally before pushing

```powershell
cd C:\Users\HP\projects\burner-point\burner-point\apps\api
npm run build
# Expected: creates a dist/ folder with main.js inside
# If this works locally, it will work on Railway

node dist/main
# Expected: "🔥 BurnerPoint API running on port 3001"
# Ctrl+C to stop
```

---

## STEP 5 — Commit and push to GitHub

```powershell
cd C:\Users\HP\projects\burner-point\burner-point

git add apps/api/railway.toml
git add apps/api/Dockerfile
git add apps/api/nest-cli.json
git add apps/api/tsconfig.json
git add apps/api/src/main.ts
git add apps/api/package.json
git add turbo.json

git commit -m "fix: add Railway deployment config and health check endpoint"
git push origin main
```

---

## STEP 6 — Fix Railway service settings (dashboard)

Go to railway.app → your project → burner-point-api service

Click Settings → scroll to "Source":

Set Root Directory to:
```
apps/api
```
(This is the RELATIVE path from your repo root — no leading slash, no Windows backslash)

IMPORTANT: Make sure it says exactly `apps/api` NOT:
- ❌ `C:\Users\HP\projects\burner-point\burner-point\apps\api`
- ❌ `/apps/api`
- ❌ `burner-point/apps/api`
- ✅ `apps/api`

---

## STEP 7 — Set Railway environment variables

Railway Dashboard → your API service → Variables tab

Add every variable from the list below (Railway provides DATABASE_URL
and REDIS_URL automatically from the database plugins):

### Required to start (app crashes without these):
```
NODE_ENV=production
APP_PORT=3001
JWT_ACCESS_SECRET=<your 128-char hex>
JWT_REFRESH_SECRET=<your different 128-char hex>
ENCRYPTION_KEY=<your 32-char hex>
ADMIN_SECRET_KEY=<your strong string>
```

### Required for Twilio features:
```
TWILIO_ACCOUNT_SID=ACxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxx
TWILIO_VERIFY_SERVICE_SID=VAxxxxxxxx
TWILIO_DEFAULT_FROM=+15551234567
```

### Required for payments (use test keys first):
```
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-xxx
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-xxx
FLUTTERWAVE_ENCRYPTION_KEY=xxx
FLUTTERWAVE_WEBHOOK_HASH=xxx
PAYSTACK_SECRET_KEY=sk_test_xxx
PAYSTACK_PUBLIC_KEY=pk_test_xxx
SQUAD_SECRET_KEY=sandbox_sk_xxx
SQUAD_PUBLIC_KEY=sandbox_pk_xxx
SQUAD_BASE_URL=https://sandbox-api-d.squadco.com
KORAPAY_SECRET_KEY=sk_test_xxx
KORAPAY_PUBLIC_KEY=pk_test_xxx
KORAPAY_ENCRYPTION_KEY=xxx
OPAY_MERCHANT_ID=xxx
OPAY_PUBLIC_KEY=xxx
OPAY_PRIVATE_KEY=xxx
OPAY_BASE_URL=https://sandboxapi.opayweb.com
```

### Paddle (add after creating products and prices in Paddle dashboard):
```
PADDLE_API_KEY=xxx
PADDLE_CLIENT_TOKEN=xxx
PADDLE_WEBHOOK_SECRET=whsec_xxx
PADDLE_SANDBOX=true
PADDLE_PRICE_VERIFICATION=pri_xxx
PADDLE_PRICE_RENTAL=pri_xxx
PADDLE_PRICE_SUB_MONTHLY=pri_xxx
```

### NOWPayments:
```
NOWPAYMENTS_API_KEY=xxx
NOWPAYMENTS_IPN_SECRET=xxx
NOWPAYMENTS_SANDBOX=true
```

### OpenAI:
```
OPENAI_API_KEY=sk-proj-xxx
OPENAI_MODEL=gpt-4o-mini
AI_KILL_SWITCH=false
```

### Email (Resend):
```
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_USER=resend
SMTP_PASS=re_xxx
SMTP_FROM=noreply@burnerpoint.app
```

### CORS (add your actual domains):
```
CORS_ORIGINS=https://burnerpoint.app,https://www.burnerpoint.app
WEB_URL=https://burnerpoint.app
APP_URL=https://your-railway-domain.up.railway.app
```

---

## STEP 8 — Trigger Railway redeployment

After saving variables in Railway:
Railway Dashboard → Deployments tab → click "Deploy" button (or push a new commit)

Watch the build logs. You should see:
```
==> Building with Dockerfile
==> npm run build  (or nest build)
==> Starting service
🔥 BurnerPoint API running on port 3001
```

---

## STEP 9 — Verify deployment

Once Railway shows "Active" (green):

```powershell
# Replace with your actual Railway domain
$domain = "https://your-service.up.railway.app"

Invoke-WebRequest -Uri "$domain/health" -UseBasicParsing |
  Select-Object -ExpandProperty Content
```

Expected:
```json
{"status":"ok","timestamp":"2026-04-07T...","uptime":12,"environment":"production"}
```

If this returns 200 — deployment is fully working.

---

## Common failures and fixes

### "nest: command not found" during Railway build
Fix: Make sure `@nestjs/cli` is in devDependencies in package.json (already added in this bundle).

### "Cannot find module 'reflect-metadata'"
Fix: `reflect-metadata` is in dependencies. Check package.json has it.
If missing: `npm install reflect-metadata`

### "Error: listen EADDRINUSE: address already in use :::3001"
Fix: Not a Railway issue — only happens locally.
Railway always sets `PORT` env var. The main.ts reads:
`parseInt(process.env.APP_PORT ?? process.env.PORT ?? '3001')`
So Railway's PORT variable is automatically used.

### Health check failing (Railway shows "Unhealthy")
Fix: The `/health` endpoint must return 200 within 30 seconds.
Check that `app.getHttpAdapter().get('/health', ...)` is in main.ts
and that DATABASE_URL and REDIS_URL are set (app crashes without DB).

### "DATABASE_URL not set"
Fix: In Railway dashboard, click the PostgreSQL plugin → Connect tab →
copy the DATABASE_URL → add it to your API service's Variables.
(Railway does NOT automatically inject plugin vars into other services —
you must manually copy and paste them.)
