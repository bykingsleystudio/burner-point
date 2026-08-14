# PRODUCTION DEPLOYMENT DIRECTIVE

**For**: Burner Point Platform  
**Authority**: Production Architecture & Security Review (Completed)  
**Status**: READY FOR PRODUCTION DEPLOYMENT  
**Operator**: Follow steps 1–5 in order. Do not skip steps.  

---

## CRITICAL: Do These BEFORE Any External Deployment

### Step 1: Rotate Supabase Password (FIRST & MANDATORY)

**Why**: Database password was temporarily exposed in environment file.

**How**:
1. Go to: https://app.supabase.com/projects
2. Select project: `sdjcavvwramruehjdhpb`
3. Click: **Settings** → **Database** → **Change password**
4. Generate new password (store in secure vault)
5. Keep the new password; you'll need it in Railway setup

**Verify**:
```bash
psql postgresql://postgres:[NEW_PASSWORD]@db.sdjcavvwramruehjdhpb.supabase.co:5432/postgres -c "SELECT version();"
# Should return PostgreSQL version without error
```

---

## DEPLOYMENT SEQUENCE

### Step 2: Deploy Web (Vercel)

**Duration**: ~5 minutes  
**Dependencies**: None (runs independently)

#### 2a. Create Vercel Project
1. Go to: https://vercel.com/new
2. Import Git repository: `burner-point`
3. **Framework Preset**: Next.js
4. **Root Directory**: `apps/web`
5. Click: **Deploy**

#### 2b. Set Environment Variables (After deployment starts)
In **Vercel Dashboard** → **Settings** → **Environment Variables**:

```
NEXT_PUBLIC_SUPABASE_URL=https://sdjcavvwramruehjdhpb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[FROM SUPABASE DASHBOARD: settings → API → Key (anon)]
NEXT_PUBLIC_API_URL=https://api.burnerpoint.com
SENTRY_DSN=[YOUR SENTRY PROJECT DSN]
NEXT_PUBLIC_SENTRY_DSN=[YOUR SENTRY PUBLIC DSN]
NEXT_PUBLIC_REVENUECAT_WEB_API_KEY=[FROM REVENUECAT DASHBOARD]
```

**Get Supabase keys**:
- Go to: https://app.supabase.com/project/sdjcavvwramruehjdhpb/settings/api
- Copy "anon" public key and "service_role" secret key

#### 2c. Verify Web Deployment
```bash
curl https://[YOUR_VERCEL_DOMAIN].vercel.app
# Should return HTML (no 500 error)
```

---

### Step 3: Deploy API (Railway)

**Duration**: ~10 minutes  
**Dependencies**: Step 1 (new DB password) + Step 2 (web URL)

#### 3a. Create Railway Project
1. Go to: https://railway.app/new
2. Select: **Deploy from GitHub**
3. Authorize GitHub (if needed)
4. Select repo: `burner-point`
5. Click: **Create Project**

#### 3b. Configure Build Settings
1. In Railway Dashboard: Select your project
2. Click: **Settings**
3. **Build Command**: `npm run build --prefix apps/api`
4. **Start Command**: `npm start --prefix apps/api`
5. **Root Directory**: `/apps/api` (if prompted)

#### 3c. Set Environment Variables (Critical)
In Railway Dashboard → **Variables**:

**Database (Updated with new password from Step 1)**:
```
DATABASE_URL=postgresql://postgres:[NEW_PASSWORD]@db.sdjcavvwramruehjdhpb.supabase.co:5432/postgres
DIRECT_DATABASE_URL=postgresql://postgres:[NEW_PASSWORD]@db.sdjcavvwramruehjdhpb.supabase.co:5432/postgres
```

**Supabase Auth**:
```
SUPABASE_URL=https://sdjcavvwramruehjdhpb.supabase.co
SUPABASE_ANON_KEY=[FROM STEP 2b - anon key]
SUPABASE_SERVICE_ROLE_KEY=[FROM SUPABASE DASHBOARD: settings → API → service_role key]
```

**Production URLs**:
```
API_URL=https://api.burnerpoint.com
APP_URL=https://burnerpoint.com
WEBHOOK_BASE_URL=https://api.burnerpoint.com/webhooks
VERCEL_ENV=production
NODE_ENV=production
```

**Telecom (Twilio)**:
```
TWILIO_ACCOUNT_SID=[YOUR TWILIO SID]
TWILIO_AUTH_TOKEN=[YOUR TWILIO TOKEN]
TWILIO_VERIFY_SERVICE_SID=[YOUR VERIFY SERVICE ID]
TWILIO_DEFAULT_FROM=[YOUR VERIFIED PHONE NUMBER]
```

**Payments**:
```
PAYSTACK_SECRET_KEY=[YOUR PAYSTACK SECRET]
PAYSTACK_WEBHOOK_SECRET=[YOUR PAYSTACK WEBHOOK SECRET]
PADDLE_API_KEY=[YOUR PADDLE API KEY]
PADDLE_WEBHOOK_SECRET=[YOUR PADDLE WEBHOOK SECRET]
NOWPAYMENTS_API_KEY=[YOUR NOWPAYMENTS API KEY]
NOWPAYMENTS_IPN_SECRET=[YOUR NOWPAYMENTS IPN SECRET]
```

**Mobile Subscriptions**:
```
REVENUECAT_SECRET_API_KEY=[FROM REVENUECAT DASHBOARD]
REVENUECAT_PROJECT_ID=[YOUR REVENUECAT PROJECT ID]
REVENUECAT_WEBHOOK_AUTHORIZATION=[YOUR REVENUECAT WEBHOOK SECRET]
```

**Observability**:
```
SENTRY_DSN=[YOUR SENTRY BACKEND DSN]
```

#### 3d. Verify API Deployment
```bash
curl https://[YOUR_RAILWAY_DOMAIN].railway.app/health
# Should return JSON: {"status":"ok",...}
```

---

### Step 4: Configure DNS (Cloudflare)

**Duration**: ~5 minutes  
**Dependencies**: Step 2 (Vercel domain) + Step 3 (Railway domain)

#### 4a. Add CNAME Records
In **Cloudflare Dashboard** → **DNS Records**:

**For Web** (burnerpoint.com):
```
Type: CNAME
Name: @
Content: [YOUR_VERCEL_DOMAIN].vercel.app
TTL: Auto
Proxy: ✓ Proxied
```

**For API** (api.burnerpoint.com):
```
Type: CNAME
Name: api
Content: [YOUR_RAILWAY_DOMAIN].railway.app
TTL: Auto
Proxy: ✓ Proxied
```

#### 4b. Flush Cache
- Cloudflare Dashboard → **Caching** → **Purge Everything**
- Wait 2–5 minutes for DNS propagation

#### 4c. Verify DNS Resolution
```bash
nslookup burnerpoint.com
# Should resolve to Cloudflare IPs

nslookup api.burnerpoint.com
# Should resolve to Cloudflare IPs
```

---

### Step 5: Configure Supabase Auth Redirects

**Duration**: ~2 minutes  
**Dependencies**: Step 4 (DNS working)

#### 5a. Add Redirect URLs
1. Go to: https://app.supabase.com/project/sdjcavvwramruehjdhpb/auth/url-configuration
2. Under **Redirect URLs**, add:
   ```
   https://burnerpoint.com/auth/callback
   https://burnerpoint.com/auth/verify
   https://burnerpoint.com/auth/password-reset
   https://burnerpoint.com
   ```
3. Click: **Save**

#### 5b. Verify Auth Flow
1. Go to: https://burnerpoint.com/auth/signin
2. Enter test email
3. Should redirect to Supabase login (no 404)

---

## PRODUCTION SMOKE TEST

After all 5 steps, run this verification:

```bash
# Test 1: Web is online
curl -I https://burnerpoint.com
# Expected: HTTP 200 or 307 (redirect)

# Test 2: API is online
curl https://api.burnerpoint.com/health
# Expected: JSON with status

# Test 3: Database connectivity
# (Supabase Dashboard → SQL Editor → run query)
SELECT COUNT(*) FROM users;
# Expected: Integer result (no error)

# Test 4: Auth is configured
# Go to: https://burnerpoint.com/auth/signin
# Expected: Can enter email without 404

# Test 5: API can reach database
curl -X POST https://api.burnerpoint.com/auth/exchange \
  -H "Content-Type: application/json" \
  -d '{"idToken":"test"}'
# Expected: 401 or 400 (auth error, not 500 database error)
```

---

## IF SOMETHING FAILS

### API returns 500
```bash
# Check Railway logs
# In Railway Dashboard → Deployments → [latest] → Logs
# Look for: "DATABASE_URL", "SUPABASE_URL", "TWILIO"
# If missing, add it in Variables
```

### Users cannot log in
```bash
# Check Supabase Auth Redirects
# https://app.supabase.com/project/sdjcavvwramruehjdhpb/auth/url-configuration
# Verify https://burnerpoint.com/auth/callback is listed
```

### DNS not resolving
```bash
# In Cloudflare, check CNAME records
# If using root domain (@), ensure root domain is also set
# TTL may take 5–10 minutes to update
```

### Webhooks not firing
```bash
# In Supabase Dashboard → Database Webhooks
# Verify webhook URLs point to https://api.burnerpoint.com/webhooks/[provider]
# Check Railway logs for 401/403 (invalid webhook signature)
```

---

## FINAL VERIFICATION CHECKLIST

- [ ] Supabase password rotated (Step 1)
- [ ] Vercel project created and deployed (Step 2)
- [ ] Railway project created and deployed (Step 3)
- [ ] DNS records added to Cloudflare (Step 4)
- [ ] Supabase Auth redirects configured (Step 5)
- [ ] `curl https://burnerpoint.com` returns web content
- [ ] `curl https://api.burnerpoint.com/health` returns JSON
- [ ] Web can reach API (check browser Network tab)
- [ ] Auth flow works (can sign in)
- [ ] Sentry is receiving errors (check Sentry dashboard)

---

## PRODUCTION PRINCIPLES ENFORCED

✅ **No destructive database migrations** — schema preserved  
✅ **All secrets in environment variables** — no hardcoded values  
✅ **Role-based access control** — admin routes protected  
✅ **Webhook verification** — all provider calls authenticated  
✅ **Error monitoring** — Sentry enabled  
✅ **Database authority** — Supabase is single source of truth  

---

## AFTER DEPLOYMENT

1. **Monitor Sentry** for errors
2. **Check Railway logs** for warnings
3. **Verify Supabase metrics** (database connections, query time)
4. **Test payment webhook** by running test transaction in Paystack dashboard
5. **Test Twilio integration** by sending test SMS

---

**Deployment Authority**: Production Architecture (Complete)  
**Codebase Version**: Ready for Production  
**Database Baseline**: Live Supabase (sdjcavvwramruehjdhpb)  
**Last Validated**: 2025-02-14  

**DO NOT SKIP ANY STEP. Follow 1 → 2 → 3 → 4 → 5 in order.**
