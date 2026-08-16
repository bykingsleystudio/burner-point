# Deployment Readiness Checklist

**Status:** ✅ IMPLEMENTATION COMPLETE - READY FOR REVIEW & TESTING

---

## Files Created/Modified

### ✅ Database Layer (Migration 0009)
- [supabase/migrations/0009_auth_identity_model_v2.sql](supabase/migrations/0009_auth_identity_model_v2.sql)
  - Make email nullable
  - Add CHECK constraint (email OR phone required)
  - Rewrite trigger to handle all identity sources
  - Idempotent with ON CONFLICT

### ✅ Frontend Auth Sync Layer
- [apps/web/src/lib/auth-session-sync.ts](apps/web/src/lib/auth-session-sync.ts) ← NEW
  - `synchronizeAuthSession()` - main sync engine
  - `useAuthSessionSync()` - OAuth callback hook
  - `useManualAuthCompletion()` - signup/login hook

### ✅ Updated Auth Pages
- [apps/web/src/app/auth/register/page.tsx](apps/web/src/app/auth/register/page.tsx)
  - Uses `useManualAuthCompletion()` hook
  - Calls centralized sync after signup
  
- [apps/web/src/app/auth/login/page.tsx](apps/web/src/app/auth/login/page.tsx)
  - Uses `useManualAuthCompletion()` hook
  - Calls centralized sync after login
  
- [apps/web/src/app/auth/callback/page.tsx](apps/web/src/app/auth/callback/page.tsx) ← NEW/UPDATED
  - Unified OAuth callback handler
  - Properly consumes session from Supabase
  - Calls centralized sync

### ✅ Documentation
- [CONFIRMED_BUG_ROOT_CAUSE.md](CONFIRMED_BUG_ROOT_CAUSE.md) ← Root cause analysis
- [docs/AUTH_REMEDIATION_IMPLEMENTATION.md](docs/AUTH_REMEDIATION_IMPLEMENTATION.md) ← Architecture guide
- [docs/AUTH_ACCEPTANCE_TEST_PLAN.md](docs/AUTH_ACCEPTANCE_TEST_PLAN.md) ← Complete test matrix
- [DEPLOYMENT_PLAN_AUTH_REMEDIATION.md](DEPLOYMENT_PLAN_AUTH_REMEDIATION.md) ← Deployment guide

---

## Pre-Deployment Review Checklist

### Code Review
- [ ] Review [CONFIRMED_BUG_ROOT_CAUSE.md](CONFIRMED_BUG_ROOT_CAUSE.md) - understand the bug
- [ ] Review [docs/AUTH_REMEDIATION_IMPLEMENTATION.md](docs/AUTH_REMEDIATION_IMPLEMENTATION.md) - understand the fix
- [ ] Review migration SQL in [0009_auth_identity_model_v2.sql](supabase/migrations/0009_auth_identity_model_v2.sql)
  - [ ] Schema changes correct
  - [ ] Trigger logic handles email/phone/Google
  - [ ] CHECK constraint validates identity
  - [ ] ON CONFLICT ensures idempotency
- [ ] Review [auth-session-sync.ts](apps/web/src/lib/auth-session-sync.ts)
  - [ ] Session exchange logic
  - [ ] Onboarding state determination
  - [ ] Error handling
- [ ] Review updated auth pages
  - [ ] Register page uses `completeAuth()`
  - [ ] Login page uses `completeAuth()`
  - [ ] Callback page uses unified handler

### Architecture Review
- [ ] Confirm email/phone/Google flows all use one sync path
- [ ] Confirm RLS policies still work (unchanged)
- [ ] Confirm wallet provisioning still works (unchanged)
- [ ] Confirm no fake emails generated
- [ ] Confirm phone-only users supported

### Security Review
- [ ] Verify redirect sanitization in auth.ts (unchanged)
- [ ] Verify service role still has full access
- [ ] Verify user RLS policies still isolate data
- [ ] Verify no exposure of sensitive auth tokens

---

## Staging Deployment Checklist

### Phase 1: Code Deployment (No DB Changes)
```bash
# Deploy frontend code (backward compatible)
git add apps/web/src/lib/auth-session-sync.ts
git add apps/web/src/app/auth/callback/page.tsx
git add apps/web/src/app/auth/register/page.tsx
git add apps/web/src/app/auth/login/page.tsx
git commit -m "feat: centralize auth session sync layer"
git push origin main

# Deploy to staging (frontend only)
# No database changes yet
```

### Phase 2: Test with Old Schema
```bash
# Test that email signup/login still work with current schema
# (email column still NOT NULL)
```

**Phase 2 Tests to Run:**
- [ ] **E-01:** Email signup → Should create user → Redirect to /onboarding
- [ ] **L-01:** Email login → Should find user → Redirect to /dashboard
- [ ] **CB-01:** OAuth callback → Should sync session → No double-sync

**Expected:** All tests pass. Email flows still work because email is still NOT NULL.

### Phase 3: Database Migration
```bash
# Apply migration 0009 to staging database
supabase db push --db-url $STAGING_DB_URL

# Verify migration applied
SELECT column_name, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'email';
-- Should return: is_nullable = YES
```

**Verification:**
- [ ] Migration applies without errors
- [ ] No data loss (existing users preserved)
- [ ] Schema changes as expected
- [ ] Trigger updated
- [ ] CHECK constraint in place

### Phase 4: Full Integration Testing
```bash
# Run complete acceptance test plan
```

**Phase 4 Tests to Run:**

**Email Flows:**
- [ ] E-01: Email signup (new account)
- [ ] E-02: Email signup (duplicate email)
- [ ] E-03: Email signup (password validation)
- [ ] L-01: Email login (valid credentials)
- [ ] L-02: Email login (invalid password)
- [ ] L-03: Email login (unregistered email)

**Google OAuth:**
- [ ] G-01: Google OAuth signup (new account) - NO FAKE EMAIL
- [ ] G-02: Google OAuth login (existing account)
- [ ] G-03: Google OAuth with identity conflict

**Callback & Sync:**
- [ ] CB-01: OAuth callback consumes session correctly
- [ ] CB-02: OAuth callback handles errors

**Onboarding & Routing:**
- [ ] O-01: First-time user → /onboarding
- [ ] O-02: Returning user → /dashboard
- [ ] O-03: Redirect parameter preserved

**Session & Authorization:**
- [ ] LO-01: Logout clears session
- [ ] A-01: User isolation (RLS)
- [ ] A-02: Service role access

**Database & Trigger:**
- [ ] DB-01: Trigger fires on auth.users insert
- [ ] DB-02: Idempotency (no duplicate rows)
- [ ] DB-03: Nullable email works (phone-only user)

### Phase 5: Production Smoke Tests
```bash
# After full staging validation, deploy to production
# Run only critical smoke tests in production
```

**Smoke Tests (Production Only):**
- [ ] E-01: Email signup with test account
- [ ] L-01: Email login with test account
- [ ] G-01: Google OAuth signup with test account
- [ ] O-02: Verify user reaches dashboard
- [ ] LO-01: Logout and verify session cleared

---

## Success Criteria

✅ **All tests pass** without errors  
✅ **No fake emails** generated (Google OAuth users have real email)  
✅ **Phone-only signup** works (if enabled)  
✅ **Email-only signup** works  
✅ **Multi-identity users** work (email + phone)  
✅ **OAuth callback** doesn't double-sync  
✅ **Onboarding routing** correct (first-time vs returning)  
✅ **Password reset** works for email users  
✅ **Logout** clears all session data  
✅ **RLS policies** still enforce user isolation  
✅ **No data loss** from existing users  
✅ **Wallet provisioning** still works  
✅ **No production downtime** (code-first deployment)  

---

## Rollback Plan

If migration 0009 causes issues:

### Immediate Actions
1. **Stop auth signup** - disable registration endpoint
2. **Revert frontend** - deploy previous version (code is backward compatible)
3. **Create rollback migration** (0010_rollback.sql):
   ```sql
   -- Restore original schema
   ALTER TABLE public.users ALTER COLUMN email SET NOT NULL;
   DROP CONSTRAINT users_requires_identity;
   
   -- Restore original trigger
   CREATE OR REPLACE FUNCTION handle_new_user_signup() RETURNS TRIGGER AS $$
     INSERT INTO public.users (id, email, phone_number, ...)
     VALUES (NEW.id, NEW.email, ...)
     ON CONFLICT (id) DO UPDATE SET ...;
   $$;
   ```

### No Data Loss
- Existing users preserved
- Only schema and trigger updated
- RLS unchanged

### Timeline
- Revert to old code: 5 minutes
- Apply rollback migration: 10 minutes
- Verify system: 15 minutes
- **Total rollback time: ~30 minutes**

---

## Post-Deployment Monitoring

### Day 1 (Launch)
- [ ] Monitor auth signup errors (Sentry)
- [ ] Monitor database trigger execution
- [ ] Monitor user provisioning success rate
- [ ] Monitor redirect destinations (/onboarding vs /dashboard)
- [ ] Monitor RLS policy violations

### Week 1
- [ ] Verify no duplicate user rows created
- [ ] Verify email/phone uniqueness constraints
- [ ] Verify wallet provisioning for all users
- [ ] Verify session token generation works
- [ ] Verify OAuth callback handling stable

### Ongoing
- [ ] Track phone-only user signup rate
- [ ] Track Google OAuth signup rate
- [ ] Track password reset usage
- [ ] Track abandonment at each auth stage
- [ ] Track RLS policy performance

---

## Contacts & Escalation

**If migration 0009 fails:**
1. Check Supabase logs for exact error
2. Check database state (schema, constraints)
3. Verify trigger function definition
4. Contact database team

**If frontend auth fails:**
1. Check browser console for JavaScript errors
2. Check network requests to `/auth/callback`
3. Check API logs for session exchange errors
4. Contact frontend team

**If tests fail:**
1. Identify which test failed
2. Review test expectations vs actual behavior
3. Check database query results
4. Review relevant code logic

---

## Next Action

**You are here:** ✅ Implementation complete, waiting for user decision

**Choose one:**

1. **Proceed with staging deployment** (recommended)
   - Deploy frontend code (no database changes)
   - Run Phase 2 tests to verify old schema still works
   - Then apply migration 0009
   - Run Phase 4 tests with new schema

2. **Request additional review**
   - Have product confirm architecture
   - Have security review RLS + nullable email
   - Have engineering review code quality
   - Then proceed with staging deployment

3. **Wait for production error details**
   - Get exact Supabase error from production logs (SQLSTATE code)
   - Confirm this matches SQLSTATE 23502 hypothesis
   - Then proceed with migration as confirmed fix

**Recommendation:** Option 1 (staging deployment) is safest because:
- Frontend changes are backward compatible
- Old schema still works during Phase 2 tests
- New schema only applied after old schema tests pass
- Full test coverage before production

---

## Files Summary

| File | Type | Purpose |
|------|------|---------|
| 0009_auth_identity_model_v2.sql | Migration | Fix database schema + trigger |
| auth-session-sync.ts | Frontend | Centralize auth sync |
| register/page.tsx | Update | Use centralized sync |
| login/page.tsx | Update | Use centralized sync |
| callback/page.tsx | Update | Unified OAuth handler |
| CONFIRMED_BUG_ROOT_CAUSE.md | Doc | Root cause analysis |
| AUTH_REMEDIATION_IMPLEMENTATION.md | Doc | Architecture guide |
| AUTH_ACCEPTANCE_TEST_PLAN.md | Doc | Complete test matrix |
| DEPLOYMENT_PLAN_AUTH_REMEDIATION.md | Doc | Deployment guide |

---

**Status:** All code ready. All documentation complete. Waiting for you to proceed.

