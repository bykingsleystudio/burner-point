# Burner Point Authentication Acceptance Test Plan

## Objective
Verify that email/password, phone OTP, and Google OAuth authentication flows all work correctly through a unified provisioning architecture, with proper redirects to onboarding or dashboard based on account state.

## Test Environment Setup

**Prerequisites:**
- Staging or test Supabase project with database migration 0009 applied
- Test Google OAuth credentials configured in Supabase
- Test user identities ready (fresh emails, phone numbers)
- Browser dev tools access for session inspection
- API server running with latest auth handler code

**Cleanup Between Tests:**
- Clear browser localStorage/sessionStorage
- Close all auth session cookies
- Verify old Supabase sessions are revoked

---

## Test Matrix

### 1. Email/Password Signup

**Test: E-01 Email signup with new account**

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/auth/register` | Registration form loads |
| 2 | Enter first name, last name | Fields accept input |
| 3 | Enter new email (not in system) | Email field accepts valid email |
| 4 | Enter valid international phone | Phone field accepts format |
| 5 | Enter password (8+ chars) | Password field accepts input |
| 6 | Confirm password matches | Passwords match validation passes |
| 7 | Accept Terms & Privacy | Checkboxes can be checked |
| 8 | Submit form | No client-side errors |
| 9 | **Expected flow** | <ol><li>Supabase auth.signUp() succeeds</li><li>auth.users row created</li><li>Trigger fires: handle_new_user_signup()</li><li>public.users row created with email + phone</li><li>public.profiles row created</li><li>public.wallets row created</li><li>Session available in data.session</li><li>exchangeSupabaseSession() called</li><li>App user provisioned in API</li><li>User needs email verification OR onboarding (missing full profile?)</li><li>Redirect to `/onboarding`</li></ol> |
| 10 | Wait 2 seconds | Page transitions to onboarding or dashboard |
| 11 | Check browser DevTools: Application → Cookies | Supabase session cookie present (supabase-auth-token or similar) |
| 12 | Check browser DevTools: Application → localStorage | `sb-auth-session` or similar key contains valid JWT |
| 13 | Inspect Database | New row in `public.users` with email + phone, both set |
| 14 | Inspect Database | New row in `public.profiles` with matching user_id |
| 15 | Inspect Database | New row in `public.wallets` with user_id and zero balance |
| 16 | **Postgres checks** | <ol><li>No duplicate `public.users` rows by id</li><li>email UNIQUE constraint not violated</li><li>phone_number UNIQUE constraint not violated</li><li>Both email and phone_number NOT NULL at record level? (should pass CHECK)</li></ol> |

**Test: E-02 Email signup with duplicate email**

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Use email from previous test | Same email as E-01 |
| 2 | Submit form | Supabase rejects with "Email already registered" or similar |
| 3 | UI shows error | Toast or form error displayed |
| 4 | No redirect occurs | User stays on registration form |
| 5 | Database check | No new `public.users` or `public.profiles` rows created |

**Test: E-03 Email signup requires password confirmation**

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enter valid email, name, phone | All fields valid |
| 2 | Enter password but different confirmation | Passwords don't match |
| 3 | Try to submit | Client-side validation error: "Passwords do not match" |
| 4 | Fix confirmation password | Now passwords match |
| 5 | Submit | Form submits successfully |

---

### 2. Email/Password Login

**Test: L-01 Email login with valid credentials**

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/auth/login` | Login form loads |
| 2 | Clear any existing session | Use incognito window or clear cookies |
| 3 | Enter email from E-01 test | Email field accepts input |
| 4 | Enter password | Password field accepts input |
| 5 | Submit form | No client-side errors |
| 6 | **Expected flow** | <ol><li>supabase.auth.signInWithPassword(email, password) succeeds</li><li>Session returned in data.session</li><li>completeAuth() called with session</li><li>exchangeSupabaseSession() called</li><li>App user fetched from API</li><li>Determine onboarding state</li><li>Redirect to `/dashboard` (or `/onboarding` if profile incomplete)</li></ol> |
| 7 | Check redirect | Browser navigates to dashboard or onboarding |
| 8 | Verify session cookie | Session cookie set and valid |
| 9 | Verify localStorage | Auth session stored correctly |
| 10 | Load Dashboard | Authenticated user data displays (name, account info) |

**Test: L-02 Email login with invalid password**

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enter email from E-01 | Valid registered email |
| 2 | Enter wrong password | Incorrect password |
| 3 | Submit | Supabase returns error |
| 4 | UI shows error | Toast: "Email/phone number or password is incorrect" |
| 5 | No redirect | User stays on login page |

**Test: L-03 Email login with unregistered email**

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enter email that doesn't exist | new-user-12345@example.com |
| 2 | Enter any password | 12345678 |
| 3 | Submit | Supabase returns error (user not found) |
| 4 | UI shows error | Toast: "Email/phone number or password is incorrect" (no email enumeration) |

---

### 3. Phone OTP Signup (if phone-first signup is supported)

**Test: P-01 Phone signup with OTP**

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to phone signup (if link exists) | Form loads or modal opens |
| 2 | Enter valid international phone | +1-415-555-0182 or similar |
| 3 | Submit | Supabase auth.signInWithOtp({ phone }) called |
| 4 | Check Supabase logs or SMS delivery | OTP code sent to phone |
| 5 | Receive OTP code | (in test SMS service or logs) |
| 6 | Enter OTP code | OTP field accepts 6-digit code |
| 7 | Submit OTP | Supabase verifies and returns session |
| 8 | **Database check** | <ol><li>New auth.users row created with phone, no email</li><li>Trigger fires: handle_new_user_signup()</li><li>public.users row created with phone_number set, email NULL</li><li>CHECK constraint passes (at least one identity)</li></ol> |
| 9 | Session available | data.session contains valid JWT |
| 10 | App sync flow | exchangeSupabaseSession() handles phone-only user |
| 11 | Redirect to onboarding | Email may be added during onboarding |
| 12 | Dashboard loads | Phone-only user can access account |

**Note:** If phone-only signup is NOT yet supported, this test can be marked "FUTURE" or skipped.

---

### 4. Google OAuth Signup

**Test: G-01 Google OAuth signup with new account**

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/auth/register` | Registration form with "Continue with Google" button |
| 2 | Click "Google" button | OAuth flow starts, redirects to Google login |
| 3 | Sign in with Google test account | (use test@gmail.com or similar) |
| 4 | Approve Burner Point scopes | OAuth consent screen (if needed) |
| 5 | **Expected redirect** | Redirected to `/auth/callback` |
| 6 | **Callback flow** | <ol><li>getSession() retrieves Supabase session from OAuth code exchange</li><li>auth.users created with email from Google, no password</li><li>Trigger fires: handle_new_user_signup()</li><li>public.users row created with email from Google</li><li>public.profiles row created with full_name from Google if available</li></ol> |
| 7 | Sync completes | synchronizeAuthSession() called in callback |
| 8 | Redirect destination | Browser navigates to `/onboarding` or `/dashboard` |
| 9 | Check Database | <ol><li>New auth.users with email, no password set</li><li>New public.users with email populated</li><li>public.profiles with optional full_name</li></ol> |
| 10 | **No fake email generated** | public.users.email is real Google email, not "user@burnerpoint.local" |
| 11 | Load Dashboard | User authenticated and data displays |

**Test: G-02 Google OAuth login with existing account**

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Use same Google test account as G-01 | Same Google email |
| 2 | Navigate to `/auth/login` | Login form |
| 3 | Click "Google" button | OAuth flow starts |
| 4 | Sign in with same Google test account | Should auto-select if still logged into Google |
| 5 | Redirected to `/auth/callback` | Callback handles OAuth response |
| 6 | **Existing user matched** | <ol><li>auth.uid() from Google exists in public.users</li><li>Session sync finds existing app user</li><li>No duplicate created</li><li>Existing public.users.email matches</li></ol> |
| 7 | Redirect to dashboard | Should NOT force onboarding again |
| 8 | Check Database | <ol><li>No duplicate public.users row</li><li>Same user_id as G-01</li><li>phone_number may still be NULL (if not added)</li></ol> |

**Test: G-03 Google OAuth with email that conflicts with phone-only account**

| Step | Action | Expected Result |
|------|--------|-----------------|
| **Precondition** | Create phone-only account (test via direct DB or API) | Phone number set, email NULL |
| 1 | Google account with matching email | Same email as will be used in Google login |
| 2 | Click Google login | OAuth flow starts with different Google account |
| 3 | User confirms login | Supabase processes Google auth |
| 4 | Database state | <ol><li>If accounts can be merged: existing phone_only user now has email added</li><li>If accounts cannot merge: new user created with email only, old phone_only user unchanged</li></ol> |
| 5 | Check app behavior | App handles this gracefully (no error, correct account loads) |

---

### 5. Password Reset (Email Users Only)

**Test: R-01 Password reset flow**

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/auth/login` | Login form loads |
| 2 | Click "Forgot password?" link | Redirected to `/auth/reset-password` |
| 3 | Enter email from E-01 | Valid registered email |
| 4 | Submit | API calls requestPasswordReset() |
| 5 | Supabase sends email | Reset link generated (check Supabase logs or email service) |
| 6 | UI shows success | Toast: "If the email exists, a reset link has been sent" |
| 7 | Click reset link in email | Redirected to password reset form with token |
| 8 | Enter new password | Password field accepts input (different from old) |
| 9 | Confirm new password | Passwords match |
| 10 | Submit | New password applied |
| 11 | Login with new password | Old password no longer works, new password accepted |

**Test: R-02 Password reset for phone-only user**

| Step | Action | Expected Result |
|------|--------|-----------------|
| **Precondition** | Phone-only user exists (email NULL) | |
| 1 | User navigates to password reset | /auth/reset-password |
| 2 | User enters phone or email field | Phone-only user has no email |
| 3 | **Expected behavior** | <ol><li>UI should either: (a) show message "Password reset requires an email", or (b) allow recovery via phone OTP</li><li>If (a): password reset not available without email</li><li>If (b): OTP recovery flow starts</li></ol> |
| 4 | Check documentation | Confirm product requirement for password recovery |

---

### 6. Authenticated Redirects & Onboarding

**Test: O-01 First-time user routed to onboarding**

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Complete email signup (E-01) | Receive Supabase session |
| 2 | exchangeSupabaseSession() called | App user created in database |
| 3 | Check response | `needsOnboarding: true` or `missingFields: [...]` |
| 4 | Check redirect | Routed to `/onboarding` not `/dashboard` |
| 5 | Load onboarding page | Form to complete profile (name, phone, preferences) |
| 6 | Complete onboarding | Submit form |
| 7 | Redirect to dashboard | After onboarding complete, routed to `/dashboard` |

**Test: O-02 Returning user skips onboarding**

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log out existing user | Session cleared |
| 2 | Log in same user (L-01) | Login succeeds |
| 3 | Check response | `needsOnboarding: false` |
| 4 | Check redirect | Routed directly to `/dashboard` not `/onboarding` |

**Test: O-03 Redirect parameter preserved through auth flow**

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/auth/login?redirect=/dashboard/settings` | Login form loads |
| 2 | Complete login | Session established |
| 3 | completeAuth() called with redirectTo param | Redirect target preserved through sync |
| 4 | Check final redirect | Routed to `/dashboard/settings` (or sanitized safe equivalent) |
| 5 | Dangerous redirect rejected | <ol><li>Navigate to `/auth/login?redirect=https://evil.com`</li><li>After login, redirect to evil.com should NOT happen</li><li>Should redirect to safe default instead</li></ol> |

---

### 7. OAuth Hash/Session Callback Handling

**Test: CB-01 OAuth callback consumes session correctly**

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Start Google OAuth from register | OAuth flow initiated |
| 2 | Google redirects to `/auth/callback?code=...&state=...` | Callback page loads |
| 3 | getSession() called | Supabase consumes OAuth code, returns session |
| 4 | Session present and valid | data.session available with access_token |
| 5 | synchronizeAuthSession() called | App user provisioned |
| 6 | No race condition | <ol><li>Only ONE session exchange happens (not double-sync)</li><li>Callback page does not call exchangeSupabaseSession twice</li><li>Router redirects once to final destination</li></ol> |
| 7 | Check logs | No "session already consumed" or duplicate errors |
| 8 | Final redirect happens | Routed to `/onboarding` or `/dashboard` |

**Test: CB-02 OAuth callback with missing session**

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Directly navigate to `/auth/callback` with no code | (invalid callback) |
| 2 | getSession() returns null | No session available |
| 3 | Error handled | UI shows "Authentication failed" message |
| 4 | Redirect to sign-in | After 2 seconds, routed to `/sign-in` |
| 5 | No exception thrown | App doesn't crash |

---

### 8. Logout & Session Revocation

**Test: LO-01 Logout clears session**

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | User logged in | Dashboard displays with auth state |
| 2 | Click logout button | Logout endpoint called |
| 3 | Supabase session revoked | supabase.auth.signOut() called |
| 4 | App state cleared | Zustand store cleared or reset |
| 5 | Redirect to sign-in | Routed to `/sign-in` or `/` |
| 6 | Cookies cleared | Session cookies removed |
| 7 | localStorage cleared | Auth tokens removed from storage |
| 8 | Verify unauthenticated | Attempting to access `/dashboard` redirects to `/sign-in` |

---

### 9. RLS & Authorization

**Test: A-01 User can only access their own data**

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | User A logged in | Access own profile via API |
| 2 | User A calls `/api/user` | Returns User A's data |
| 3 | User A attempts to call `/api/user/USER-B-ID` | API returns 403 Forbidden (RLS blocks) |
| 4 | User A cannot read User B's wallet | RLS policy prevents query |
| 5 | User A cannot update User B's profile | RLS policy prevents mutation |

**Test: A-02 Service role can access any user**

| Step | Action | Expected Result |
|------|--------|-----------------|
| **Precondition** | API server has SUPABASE_SERVICE_ROLE_KEY | Backend auth |
| 1 | Backend calls Supabase with service role | Supabase recognizes is_service_role() |
| 2 | Service role queries any user | No RLS restrictions apply |
| 3 | Service role creates wallet for new user | Trigger fires with service role context |

---

### 10. Database Integrity

**Test: DB-01 Trigger fires correctly on auth.users insert**

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Email signup completes | auth.users row created |
| 2 | Trigger on_auth_user_created fires | AFTER INSERT ON auth.users |
| 3 | handle_new_user_signup() executes | Function runs successfully |
| 4 | public.users row created | Populated with email, phone, names |
| 5 | public.profiles row created | Populated with full_name if available |
| 6 | public.wallets row created | Populated via wallet creation trigger |
| 7 | CHECK constraint passes | At least one identity (email OR phone) NOT NULL |
| 8 | No duplicate rows | Single row per auth.uid() in public.users |

**Test: DB-02 Idempotency on conflict**

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Simulate trigger firing twice for same auth.users row | (manually or via ON CONFLICT test) |
| 2 | First insert succeeds | public.users row created |
| 3 | Second insert hits ON CONFLICT | Does not raise error |
| 4 | ON CONFLICT DO UPDATE applies | Existing row updated (not replaced) |
| 5 | No duplicate rows | Still single row for that user_id |
| 6 | Data consistent | Email, phone, names correct |

**Test: DB-03 Nullable email supported**

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Phone-only user created | (phone signup if supported) |
| 2 | Check public.users.email | Column allows NULL |
| 3 | phone_number NOT NULL | Phone value is set |
| 4 | CHECK constraint passes | (email IS NOT NULL OR phone_number IS NOT NULL) |
| 5 | User can authenticate | Phone OTP login works |
| 6 | User can access dashboard | Email not required for dashboard access |

---

## Test Execution Strategy

### Phase 1: Pre-Deployment (Local/Staging)
1. **Database Migration Tests** (DB-01, DB-02, DB-03)
   - Verify migration 0009 applies without errors
   - Check schema changes (email nullable, phone unique, CHECK constraint)
   
2. **Auth Trigger Tests** (DB-01)
   - Verify trigger executes on auth.users insert
   - Check public.users/profiles/wallets created correctly

3. **Frontend Signup Flow** (E-01, E-02, E-03)
   - Test email registration end-to-end
   - Verify redirects and session state

4. **Frontend Login Flow** (L-01, L-02, L-03)
   - Test email login end-to-end
   - Verify failed login handling

### Phase 2: Integration (Staging Environment)
5. **OAuth Flow** (G-01, G-02, G-03)
   - Test Google OAuth signup and login
   - Verify callback handling

6. **Callback Handler** (CB-01, CB-02)
   - Test OAuth callback page
   - Verify no race conditions in session sync

7. **Onboarding Routing** (O-01, O-02, O-03)
   - Test first-time user onboarding
   - Verify redirect preservation

### Phase 3: Security & Authorization (Staging)
8. **RLS Enforcement** (A-01, A-02)
   - Verify users cannot access others' data
   - Verify service role can access all data

9. **Logout & Session** (LO-01)
   - Verify logout clears all session state

10. **Password Reset** (R-01, R-02)
    - Test email-based password recovery
    - Document phone-only user recovery strategy

### Phase 4: Production Deployment
11. **Smoke Tests in Production**
    - E-01: Email signup
    - L-01: Email login
    - G-01: Google OAuth signup
    - O-02: Returning user dashboard access
    - LO-01: Logout

---

## Success Criteria

✅ All tests pass without errors
✅ No fake emails generated
✅ Email, phone, and Google flows all work independently
✅ No race conditions in session sync
✅ RLS policies prevent unauthorized access
✅ Onboarding/dashboard routing correct
✅ Database integrity maintained
✅ No duplicate user rows created
✅ Auth session properly consumed (no double-sync)

---

## Known Limitations & Future Work

- Phone-only signup (P-01): Marked as FUTURE if not yet supported
- Apple & Microsoft OAuth: Not included in initial scope (can be added later)
- MFA / 2FA: Not included in initial scope
- Account linking / identity merging: Needs product decision (G-03 test)

