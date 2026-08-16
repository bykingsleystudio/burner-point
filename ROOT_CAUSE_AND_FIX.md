# Production Authentication Failure - Root Cause Analysis

## Executive Summary

The production Burner Point authentication is failing because:

1. **CRITICAL: Database schema migration not applied to production**
   - Migration file: `supabase/migrations/20260816150000_auth_identity_model_v2.sql`
   - Status: Created but NOT yet applied to production Supabase
   - Impact: Email column still has NOT NULL constraint
   - Effect: All user operations involving phone-only identities fail with database errors

2. **Service-layer fixes applied but schema changes missing**
   - API code updated to support phone-only users (COMPLETED ✓)
   - Tests verify logic works (PASSED ✓)
   - Web app auth flow updated (COMPLETED ✓)
   - BUT: Production database still enforces old schema (FAILED ✗)

## User-Reported Failures (Root Causes)

### 1. "Google OAuth returns to homepage instead of dashboard"
**Root Cause**: Login endpoint returns 500 → Session exchange fails → Redirect to homepage  
**Why**: Google Auth typically uses phone as identity, database rejects phone-only user

### 2. "Email + phone + password signup returns database error"
**Root Cause**: `exchangeSupabaseSession()` tries to create user with nullable email → Database constraint violation  
**Error**: `users.email NOT NULL constraint violation`

### 3. "Existing Supabase user login returns HTTP 500"  
**Root Cause**: `login()` → `syncLocalUserFromSupabaseAuthUser()` → User update fails → 500  
**Why**: User might have NULL email, schema rejects it

## Solution: Apply Database Migration

The migration file at `supabase/migrations/20260816150000_auth_identity_model_v2.sql` needs to be applied to production Supabase database.

### What the migration does:
```sql
-- 1. Remove NOT NULL constraint from email column
ALTER TABLE public.users ALTER COLUMN email DROP NOT NULL;

-- 2. Add CHECK constraint requiring at least email OR phone
ALTER TABLE public.users ADD CONSTRAINT users_requires_identity
  CHECK (email IS NOT NULL OR phone_number IS NOT NULL);

-- 3. Create partial unique indexes (only for non-NULL values)
CREATE UNIQUE INDEX idx_users_email_unique ON public.users (email) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX idx_users_phone_unique ON public.users (phone_number) WHERE phone_number IS NOT NULL;

-- 4. Update auth trigger to use provider-agnostic identity logic
CREATE OR REPLACE FUNCTION public.handle_new_user_signup() ...
```

### Impact After Migration:
- ✓ Phone-only users can be created and synced
- ✓ Email-only users continue to work
- ✓ Email+Phone users work
- ✓ OAuth with phone identity works
- ✓ Login endpoint returns 401 (not found) instead of 500 for invalid credentials

## Deployment Steps

### Option 1: Via Supabase Dashboard (Recommended for immediate fix)
1. Go to Supabase dashboard → Project → SQL Editor
2. Copy migration from `supabase/migrations/20260816150000_auth_identity_model_v2.sql`
3. Paste and execute in SQL Editor
4. Verify: Check users table schema and constraints

### Option 2: Via CLI (if available)
```bash
supabase db push --password "<service-role-key>"
```

### Option 3: Via Direct Database Connection
```bash
psql postgresql://postgres:<password>@db.sdjcavvwramruehjdhpb.supabase.co:5432/postgres < supabase/migrations/20260816150000_auth_identity_model_v2.sql
```

## Verification Steps (Post-Migration)

1. **Check schema**:
   ```sql
   \d public.users
   ```
   Should show:
   - email column as `character varying NULL`
   - phone_number column as `character varying NULL`
   - users_requires_identity CHECK constraint

2. **Test auth endpoints**:
   ```bash
   # Should return 401 (not 500)
   curl -X POST https://api.burnerpoint.com/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"identifier":"nonexistent@test.com","password":"wrongpass"}'
   ```

3. **Test OAuth flow**:
   - Go to https://burnerpoint.com/sign-in
   - Click "Google Login"
   - Complete OAuth flow
   - Should redirect to /dashboard (not homepage)

4. **Test signup**:
   - Register with email + phone + password
   - Should complete without database error
   - Existing users should be able to login

## Expected Timeline
- Migration execution: < 1 minute
- DNS/Cache propagation: 5-10 minutes
- Full system stabilization: 15-30 minutes

## Rollback Plan
If issues arise after migration:
1. Database is backward compatible (nullable email was optional enhancement)
2. No data loss occurs during migration
3. Service code already supports old schema
4. Simply restart API if needed
