# Confirmed Root Cause: Database Schema Blocks Phone-Only Users

## The Problem

**Current Schema (0001_initial_schema.sql, line 45):**
```sql
email TEXT UNIQUE NOT NULL,
```

**Current Trigger (0001_initial_schema.sql, lines 617-620):**
```sql
INSERT INTO public.users (id, email, phone_number, first_name, last_name, email_verified, phone_verified)
VALUES (
  NEW.id,
  NEW.email,  -- ← This can be NULL for phone-only users
  ...
)
```

**Result when phone-only user tries to sign up:**
1. Google OAuth / Supabase OAuth provider allows phone-only users in auth.users
2. `on_auth_user_created` trigger fires
3. `handle_new_user_signup()` tries to INSERT with `NEW.email = NULL`
4. **Database rejects: SQLSTATE 23502 "null value in column "email" violates not-null constraint"**
5. ❌ Account provisioning fails silently
6. ❌ User redirected to `/` (homepage) instead of `/dashboard`

---

## The Fix

### Migration 0009 Changes:

**1. Schema Change (make email nullable):**
```sql
-- OLD (0001):
email TEXT UNIQUE NOT NULL,

-- NEW (0009):
ALTER TABLE public.users ALTER COLUMN email DROP NOT NULL;
ALTER TABLE public.users ADD CONSTRAINT users_email_unique UNIQUE (email) DEFERRABLE INITIALLY DEFERRED;
```

**2. Integrity Constraint (ensure at least one identity):**
```sql
ALTER TABLE public.users ADD CONSTRAINT users_requires_identity 
  CHECK (email IS NOT NULL OR phone_number IS NOT NULL);
```

**3. Unique Indexes (allow multiple NULLs, but enforce uniqueness where present):**
```sql
CREATE UNIQUE INDEX idx_users_phone_unique 
  ON public.users(phone_number) WHERE phone_number IS NOT NULL;
```

**4. Trigger Rewrite (handle all identity sources):**
```sql
-- OLD (0001):
INSERT INTO public.users (id, email, phone_number, ...)
VALUES (NEW.id, NEW.email, NEW.phone, ...)

-- NEW (0009):
v_email := NULLIF(TRIM(COALESCE(NEW.email, NEW.raw_user_meta_data->>'email', ...)), '');
v_phone := NULLIF(TRIM(COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone_number', ...)), '');

IF v_email IS NULL AND v_phone IS NULL THEN
  RAISE EXCEPTION 'Burner Point signup requires either an email address or phone number...';
END IF;

INSERT INTO public.users (id, email, phone_number, ...)
VALUES (NEW.id, v_email, v_phone, ...)
ON CONFLICT (id) DO UPDATE SET ...;
```

---

## Why This Happens

### Supabase Auth Behavior
- **Email signup:** `auth.users` gets email, phone_number is NULL
- **Phone OTP:** `auth.users` gets phone_number, email is NULL  
- **Google OAuth:** `auth.users` gets email (from Google profile), phone_number is NULL
- **Apple OAuth:** `auth.users` might have email (private) or NOT, phone_number is NULL

### Burner Point Product Design
- Burner Point should support all three as first-class auth methods
- Product allows phone-only users (email not required)
- Product allows email-only users (phone not required)
- RLS policies don't care which identity type exists (they use `auth.uid()`)

### Schema Mismatch
- ❌ **Old Schema:** Assumes all users must have email
- ❌ **Old Trigger:** Tries to insert `NEW.email` directly (fails if NULL)
- ✅ **New Schema:** Allows email NULL OR phone NULL, but not both
- ✅ **New Trigger:** Extracts any identity source and validates at least one exists

---

## Proof This Is The Bug

**Scenario 1: Phone OTP Signup**
1. User signs up with +1-415-555-0182
2. `auth.users` created with phone_number set, email = NULL
3. Trigger fires with NEW.email = NULL
4. INSERT tries: `VALUES (..., NULL, ...)`
5. ❌ SQLSTATE 23502: "null value in column "email" violates not-null constraint"
6. User gets blank page or redirects to `/`

**Scenario 2: Google OAuth (with private email)**
1. User signs up with Google account (email hidden)
2. `auth.users` created with email = NULL or hidden
3. Trigger fires with NEW.email = NULL
4. INSERT tries: `VALUES (..., NULL, ...)`
5. ❌ SQLSTATE 23502: Same error
6. User gets blank page or redirects to `/`

**Scenario 3: Email/Password Signup (currently works)**
1. User signs up with email + password
2. `auth.users` created with email set, phone_number = NULL
3. Trigger fires with NEW.email = 'user@example.com'
4. INSERT tries: `VALUES (..., 'user@example.com', NULL, ...)`
5. ✅ Success: Email is NOT NULL, CHECK constraint passes
6. User redirects to `/dashboard` (or `/onboarding`)

---

## Why Frontend Changes Matter

Even with migration 0009 applied, the frontend auth sync layer must:

1. **Handle session consumption correctly** (OAuth callback)
2. **Call exchange/sync at one location** (not scattered across pages)
3. **Prevent race conditions** (no double-sync)
4. **Determine onboarding state** (from app API, not hardcoded)

This is why we created:
- `auth-session-sync.ts` (single source of truth)
- Updated `/auth/callback/page.tsx` (unified OAuth handler)
- Updated `/auth/register/page.tsx` (uses centralized sync)
- Updated `/auth/login/page.tsx` (uses centralized sync)

The frontend changes are NOT just "nice to have" — they're necessary to prevent race conditions and ensure reliable routing after database provisioning succeeds.

---

## Verification Steps

### Before Migration 0009:
```sql
SELECT column_name, is_nullable, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name IN ('email', 'phone_number');

-- Expected result:
-- email        | NO   | text
-- phone_number | YES  | text
```

### After Migration 0009:
```sql
SELECT column_name, is_nullable, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name IN ('email', 'phone_number');

-- Expected result:
-- email        | YES  | text
-- phone_number | YES  | text
```

### Test Phone-Only Signup After Migration:
```sql
-- Simulate phone OTP signup
INSERT INTO auth.users (id, email, phone, raw_user_meta_data)
VALUES (
  uuid_generate_v4(),
  NULL,  -- No email
  '+1-415-555-0182',
  '{"phone_verified": true}'::jsonb
);

-- Trigger should fire and create public.users with phone_number set
SELECT id, email, phone_number FROM public.users WHERE phone_number = '+1-415-555-0182';

-- Expected: One row with email = NULL, phone_number = '+1-415-555-0182'
```

---

## Timeline

**Current State (Before Fix):**
- ❌ Phone-only users fail at database layer
- ❌ User sees redirect to `/` or blank page
- ❌ No error message (silent failure)

**After Migration 0009 Applied:**
- ✅ Phone-only users can be provisioned
- ✅ Email-only users still work
- ✅ Multi-identity users work

**After Frontend Changes Deployed:**
- ✅ Session sync unified across all auth methods
- ✅ Race conditions prevented
- ✅ Routing determined by account state
- ✅ Error handling consistent

---

## Summary

| Component | Issue | Fix |
|-----------|-------|-----|
| **Database Schema** | email NOT NULL blocks phone-only | Make email nullable with CHECK |
| **Trigger Logic** | Assumes email always exists | Extract email/phone from multiple sources |
| **Frontend Auth** | Scattered, fragmented sync | Centralize in auth-session-sync.ts |
| **OAuth Callback** | Hash URL not consumed properly | New unified callback handler |
| **Onboarding Routing** | Hardcoded redirects | Dynamic routing based on profile state |

All components are now fixed in migration 0009 + frontend changes.

