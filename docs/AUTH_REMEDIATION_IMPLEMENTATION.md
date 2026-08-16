# Burner Point Authentication Architecture Remediation

**Status:** Implementation Complete (Ready for Testing)  
**Last Updated:** 2026-08-16  
**Author:** GitHub Copilot  

---

## Summary

This document describes the corrected authentication architecture for Burner Point that supports email/password, phone/OTP, and Google OAuth as first-class authentication methods **without fake email generation**.

The previous migration (0008) incorrectly required email for all users. This remediation (0009) makes email nullable, ensures phone-only users work, and centralizes the auth sync layer in the frontend to prevent race conditions.

---

## Problem Statement

The original signup trigger assumed every Burner Point customer has an email address. This created three issues:

1. **Schema mismatch:** `public.users.email` was `NOT NULL`, but phone-only or phone-first users can exist in Supabase Auth without an email.

2. **Provisioning failure:** The trigger would fail with `23502 null value in column "email"` when trying to create a phone-only user.

3. **Frontend sync race:** Individual signup/login pages independently called `exchangeSupabaseSession()`, causing:
   - Double-session exchanges
   - Redirect conflicts
   - Hash-based OAuth URLs not properly consumed

---

## Architecture Changes

### 1. Database Migration: 0009_auth_identity_model_v2.sql

**What Changed:**

- Made `public.users.email` **nullable** (was `NOT NULL`)
- Kept `phone_number` **nullable** (unchanged)
- Added **CHECK constraint**: `email IS NOT NULL OR phone_number IS NOT NULL`
  - Ensures every Burner Point user has at least one identity (email XOR phone XOR both)
- Made email + phone each **separately UNIQUE** (where present)
  - `UNIQUE (email)` allows multiple NULLs (correct behavior)
  - `UNIQUE (phone_number) WHERE phone_number IS NOT NULL` allows multiple NULLs

**Updated Trigger: `handle_new_user_signup()`**

The new trigger:
- Extracts email from multiple sources (auth.users.email, metadata keys)
- Extracts phone from multiple sources (auth.users.phone, metadata keys)
- Validates at least one identity exists (error if both NULL)
- Inserts/updates `public.users` with nullable email
- Inserts/updates `public.profiles` with optional full_name
- Uses `ON CONFLICT DO UPDATE` to remain idempotent
- Does NOT generate fake emails

**Migration Safety:**

- Idempotent (can re-run without errors)
- Preserves existing users
- No data loss
- RLS policies unchanged (they use `auth.uid()`, not email)
- Wallet provisioning unchanged

---

### 2. Frontend Auth Centralization

**New Files:**

#### `apps/web/src/lib/auth-session-sync.ts`

A centralized auth session synchronizer with three key exports:

```typescript
// Main sync function (used by all flows)
export async function synchronizeAuthSession(
  session: Session,
  options?: { redirectTo?: string; profileData?: {...} }
): Promise<AuthSyncResult>

// Hook for automatic sync (OAuth callbacks)
export function useAuthSessionSync(session: Session | null, options?: {...}): void

// Hook for manual sync (signup/login pages)
export function useManualAuthCompletion(): (session, options) => Promise<void>
```

**Key Behavior:**

1. Receives Supabase session (from any auth method: email, phone, OAuth)
2. Calls `exchangeSupabaseSession()` to provision app user
3. Fetches onboarding state from API
4. Calls `buildPostAuthRedirect()` to determine destination
5. Routes to `/onboarding` or `/dashboard` based on account state
6. Returns error object if sync fails (no exception thrown)

#### `apps/web/src/app/auth/callback/page.tsx` (Updated)

Unified OAuth callback handler:
- Consumes OAuth provider redirect
- Calls `getSession()` to retrieve Supabase session
- Calls `synchronizeAuthSession()` for centralized sync
- Routes to `/onboarding` or `/dashboard`
- Prevents double-sync via early return

#### `apps/web/src/app/auth/register/page.tsx` (Updated)

Email/password signup page:
- Calls `supabase.auth.signUp()` to create auth.users
- Calls `completeAuth()` (from `useManualAuthCompletion()`) for centralized sync
- Centralized sync replaces manual `exchangeSupabaseSession()` + `buildPostAuthRedirect()` + `router.push()`
- Prevents direct redirect logic

#### `apps/web/src/app/auth/login/page.tsx` (Updated)

Email/password login page:
- Calls `supabase.auth.signInWithPassword()` to authenticate
- Calls `completeAuth()` (from `useManualAuthCompletion()`) for centralized sync
- Centralized sync replaces manual session exchange + redirect
- Both email and phone login flows converge at same sync point

**Result:**

All three auth methods (email, phone, Google) now:
1. Establish a Supabase session
2. Route through `synchronizeAuthSession()`
3. Sync app user state
4. Route to correct destination
5. Handle errors consistently

---

### 3. What Did NOT Change

✅ RLS policies remain unchanged  
✅ Wallet provisioning trigger unchanged  
✅ Profile provisioning remains in trigger  
✅ Existing users preserved  
✅ Password reset flow unchanged  
✅ Email verification flow unchanged  
✅ Session token generation unchanged  

---

## Deployment Order

### Step 1: Code Deployment (No Database Changes Yet)

1. Deploy the frontend changes:
   - `auth-session-sync.ts`
   - Updated `register/page.tsx`
   - Updated `login/page.tsx`
   - Updated `auth/callback/page.tsx`

2. These changes are **backward compatible** with the existing schema (email still `NOT NULL` for now)

3. All auth flows will route through the centralized sync layer but database behavior remains unchanged

### Step 2: Database Migration (After Frontend Validation)

1. Run migration 0009: `supabase db push`
   - Makes email nullable
   - Updates trigger
   - Adds CHECK constraint
   - Preserves existing data

2. After migration, phone-only users will work correctly

### Step 3: Smoke Testing

Run the acceptance test plan (Phase 4):
- E-01: Email signup
- L-01: Email login
- G-01: Google OAuth signup
- O-02: Returning user dashboard
- LO-01: Logout

---

## Test Coverage

See [AUTH_ACCEPTANCE_TEST_PLAN.md](AUTH_ACCEPTANCE_TEST_PLAN.md) for complete test matrix.

**Key Tests:**
- **E-01:** Email signup creates public.users with email + phone
- **L-01:** Email login syncs and routes to dashboard
- **G-01:** Google OAuth signup does NOT generate fake email
- **G-02:** Google OAuth login finds existing user (no duplicate)
- **CB-01:** OAuth callback consumes session (no double-sync)
- **O-01 / O-02:** Onboarding state determines routing correctly
- **DB-03:** Phone-only user can be created and authenticated

---

## Architecture Diagram

```
                    Supabase Auth
                         │
             ┌───────────┼───────────┐
             │           │           │
          Email        Phone       Google
          Auth         OTP         OAuth
          /pwd        /OTP        /OAuth
             │           │           │
             └───────────┼───────────┘
                         ↓
                  auth.users
                         │
                 AFTER INSERT TRIGGER
                         ↓
          handle_new_user_signup()
                         │
        ┌────────────────┼────────────────┐
        ↓                ↓                ↓
   public.users    public.profiles   public.wallets
   (email OR                (full_name)  (wallet_init)
    phone, NOT fake)
        │
        └────────────────┬─────────────────┘
                         │
              Frontend: synchronizeAuthSession()
                         │
       ┌─────────────────┼─────────────────┐
       ↓                 ↓                 ↓
   exchange_session  fetch_state    build_redirect
       ↓                 ↓                 ↓
   app.users         onboarding    /onboarding
   + tokens          state flag    OR /dashboard
       │                 │                 │
       └─────────────────┼─────────────────┘
                         ↓
                  router.push(destination)
```

---

## Migration Path: Old vs New

### 0008 (Previous - DO NOT USE)
```sql
-- ❌ Hard-fails if no email exists
IF v_email IS NULL THEN
  RAISE EXCEPTION 'Burner Point signup requires a valid email address...';
END IF;

-- ❌ Never creates phone-only users
INSERT INTO public.users (id, email, ...)
  VALUES (NEW.id, v_email, ...)  -- v_email could fail
```

### 0009 (Replacement - USE THIS)
```sql
-- ✅ Accepts email OR phone
IF v_email IS NULL AND v_phone IS NULL THEN
  RAISE EXCEPTION 'Burner Point signup requires either email or phone...';
END IF;

-- ✅ Creates any combination: email-only, phone-only, or both
INSERT INTO public.users (id, email, phone_number, ...)
  VALUES (NEW.id, v_email, v_phone, ...)  -- both can be NULL individually
  
-- ✅ Schema enforces at least one identity
-- CHECK (email IS NOT NULL OR phone_number IS NOT NULL)
```

---

## Known Limitations & Future Work

### Phone-Only Users (Supported by this migration)
- ✅ Can sign up with phone OTP
- ✅ Can create account without email
- ✅ Can log in with phone OTP
- ✅ Can access dashboard
- **Limitation:** Password reset requires email (no email → no reset link)
  - **Solution:** Offer OTP-based password recovery for phone-only users (future enhancement)

### Account Identity Linking (Not Included)
- What if a user signs up with Google (email = user@gmail.com) and later tries phone OTP (no email)?
- Current behavior: Two separate users created
- **Solution:** Product decision needed on account merging (future work)

### Apple & Microsoft OAuth (Not Included)
- Removed from current Supabase config (Apple/Microsoft auth not enabled)
- ✅ Can be added later by enabling in Supabase and updating trigger to extract correct fields

### MFA / 2FA (Not Included)
- Phone OTP is NOT the same as 2FA
- MFA enablement is a future feature (uses `public.two_factor_secret`, etc.)

---

## Rollback Plan

If migration 0009 causes issues in production:

1. **Immediate (Before Rollback):**
   - Deploy frontend code that reverts auth session sync back to direct calls
   - This is backward compatible with both old and new schema

2. **Database Rollback:**
   ```sql
   -- Run in reverse order (in Supabase migrations)
   -- This requires a new migration file 0010_rollback_auth_identity_model.sql
   -- That re-creates the original schema:
   -- - email TEXT NOT NULL
   -- - Restore old handle_new_user_signup() function
   -- - Restore old on_auth_user_created trigger
   ```

3. **Verify:**
   - Email/password flow still works
   - Existing users still authenticate
   - No data loss (users table kept as-is)

---

## FAQ

**Q: Why not generate fake emails like `+1234567890@burnerpoint.local`?**  
A: That contaminates customer data and breaks: billing (email required), notifications, password reset, and uniqueness constraints. Better to store NULL where email doesn't exist.

**Q: What about email confirmations for phone-only users?**  
A: Not needed. Phone is verified via OTP. Email confirmations are only required if email is provided.

**Q: Will existing email users continue to work?**  
A: Yes. The CHECK constraint is `email IS NOT NULL OR phone_number IS NOT NULL`, so email-only users remain valid (phone can be NULL).

**Q: Can RLS break with nullable emails?**  
A: No. RLS policies use `auth.uid() = users.id`, not email. Email is just data.

**Q: What if Supabase doesn't send email for Google OAuth?**  
A: Google always sends email as part of OAuth scope. The trigger tries multiple metadata keys, so it should extract the email correctly.

**Q: Can a user have email = NULL and phone_number = NULL?**  
A: No. The CHECK constraint prevents it at the database level. The trigger also validates before insert.

---

## Files Changed

| File | Change | Impact |
|------|--------|--------|
| `supabase/migrations/0009_auth_identity_model_v2.sql` | **NEW** | Schema migration to support email/phone/Google |
| `apps/web/src/lib/auth-session-sync.ts` | **NEW** | Centralized auth sync layer |
| `apps/web/src/app/auth/callback/page.tsx` | Updated | Use centralized sync |
| `apps/web/src/app/auth/register/page.tsx` | Updated | Use centralized sync |
| `apps/web/src/app/auth/login/page.tsx` | Updated | Use centralized sync |
| `docs/AUTH_ACCEPTANCE_TEST_PLAN.md` | **NEW** | Comprehensive test matrix |
| `supabase/migrations/0008_auth_signup_trigger_fix.sql` | ⚠️ **ARCHIVED** | Old migration, do NOT apply |

---

## Next Steps

1. **Code Review:** Review all changes against the target architecture
2. **Staging Deploy:** Deploy code + database migration to staging
3. **Test Execution:** Run acceptance test plan (AUTH_ACCEPTANCE_TEST_PLAN.md)
4. **Production Deploy:** After all tests pass, deploy to production with care:
   - Deploy frontend first (backward compatible)
   - Monitor for errors
   - Deploy database migration
   - Run smoke tests
   - Monitor ongoing

---

## Questions or Issues

If migration 0009 fails or tests fail:
1. Do NOT apply 0008 (old migration)
2. Check exact error in Supabase logs
3. Verify auth.users created correctly
4. Verify trigger executes
5. Check public.users/profiles/wallets provisioning
6. Review test plan for expected behavior

