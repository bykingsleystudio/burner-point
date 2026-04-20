# Burner Point Clerk Auth Migration

## Scope

Burner Point now uses Clerk as the identity authority for web and mobile authentication:

- Web sign-in: `apps/web/src/app/auth/login/page.tsx`
- Web sign-up/register: `apps/web/src/app/auth/register/page.tsx`
- Web sign-up alias: `apps/web/src/app/auth/signup/page.tsx`
- Web SSO callback: `apps/web/src/app/sso-callback/page.tsx`
- Web onboarding for OAuth profile completion: `apps/web/src/app/onboarding/page.tsx`
- Web route protection: `apps/web/src/proxy.ts`
- Web Clerk provider: `apps/web/src/app/layout.tsx`
- Web signed-in/signed-out header controls: `apps/web/src/components/marketing.tsx`
- Web dashboard session bootstrap/logout: `apps/web/src/app/dashboard/layout.tsx`
- Mobile Clerk provider: `apps/mobile/src/app/_layout.tsx`
- Mobile sign-in: `apps/mobile/src/app/auth/login.tsx`
- Mobile sign-up/register: `apps/mobile/src/app/auth/register.tsx`
- Mobile protected tabs: `apps/mobile/src/app/(tabs)/_layout.tsx`
- Mobile API session helper: `apps/mobile/src/lib/auth.ts`
- API Clerk session exchange: `apps/api/src/modules/auth/auth.controller.ts`, `apps/api/src/modules/auth/auth.service.ts`

## Architecture

Clerk authenticates the user and owns sign-in, sign-up, OAuth, SSO, session storage, and sign-out. The API still uses the existing Burner Point JWT guards for protected telecom, billing, wallet, and dashboard endpoints.

To avoid breaking current dashboard and mobile feature calls, clients exchange the active Clerk session token through:

`POST /auth/clerk/exchange`

The API validates the Clerk token using `CLERK_SECRET_KEY`, syncs or creates a local Burner Point user by email/phone, stores Clerk linkage metadata in the existing `users.preferences` JSONB field, and returns the existing short-lived API token pair.

This gives Clerk control of user identity while preserving current authorization and domain data ownership.

## Required Environment Variables

Web, Vercel:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_or_pk_live_REPLACE_ME
CLERK_SECRET_KEY=sk_test_or_sk_live_REPLACE_ME
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/auth/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/auth/signup
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard
```

These must be real keys copied from the Clerk application created for Burner Point. Do not paste example placeholder values into production Vercel env.

The Next.js App Router integration uses `clerkMiddleware()` from `@clerk/nextjs/server` in `apps/web/src/proxy.ts`, keeps `<ClerkProvider>` inside the `<body>` element in `apps/web/src/app/layout.tsx`, and uses Clerk's current `Show`, `SignInButton`, `SignUpButton`, and `UserButton` components for the marketing header.

Mobile, Expo/EAS:

```env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_or_pk_live_REPLACE_ME
```

The mobile app currently uses `@clerk/clerk-expo` because this repo is on Expo SDK 51. Clerk's newer `@clerk/expo` package requires a newer Expo SDK, so switch to it only after upgrading Expo and enabling Native API in the Clerk dashboard.

API, Railway:

```env
CLERK_SECRET_KEY=sk_test_or_sk_live_REPLACE_ME
```

`CLERK_SECRET_KEY` is required on the Railway API because `/auth/clerk/exchange` verifies the active Clerk session before issuing Burner Point API tokens.

Clerk webhooks are not required for basic sign-up or sign-in. Add them only when Burner Point needs server-to-server syncing for Clerk events such as `user.created`, `user.updated`, or `user.deleted` without relying on the current `/auth/clerk/exchange` flow. If this is added later, create a Clerk webhook endpoint in the API and configure:

```env
CLERK_WEBHOOK_SIGNING_SECRET=whsec_REPLACE_ME
```

## Clerk Dashboard Setup

- Enable Email/password.
- Enable phone number as a sign-in identifier because Burner Point accepts phone login.
- Enable first name and last name collection/requirements where available in the Clerk dashboard.
- Enable Google, Apple, and Microsoft OAuth providers.
- Enable or configure Clerk Legal acceptance if you want Clerk itself to enforce Terms of Service and Privacy Policy. Burner Point's custom sign-up and onboarding screens already require those checkboxes and pass `legalAccepted: true`.
- Add web redirect URL: `https://burnerpoint.vercel.app/sso-callback`.
- Add local web redirect URL: `http://localhost:3000/sso-callback`.
- Add Expo redirect scheme: `burnerpoint://auth/login` and `burnerpoint://auth/register` if using mobile SSO.
- Configure email verification and 2FA/MFA policies in Clerk if required for production.

## Current Gap Status

- Web forgot-password/reset-password now stays inside the Burner Point sign-in screen and uses Clerk reset password codes.
- Mobile forgot-password/reset-password now stays inside the native Burner Point sign-in screen and uses Clerk email or phone reset codes.
- Mobile sign-up now handles both email verification and phone verification when Clerk requires both.
- Real Clerk keys are intentionally not committed. Set them in local `.env` files, Vercel environment variables, Railway variables, and EAS environment variables from the Clerk Dashboard.
- Because a Clerk secret key was shared in chat during setup, rotate that key in Clerk before production or before handling real users, then update Vercel, Railway, and local `.env` values with the rotated secret.

## Test Checklist

- Web: create an account with first name, last name, email, phone, password, Terms, and Privacy accepted.
- Web: verify email if Clerk requires an email code, then confirm redirect to `/dashboard`.
- Web: click Forgot password, send a reset code, enter the code, set a new password, and confirm redirect to `/dashboard`.
- Web: sign in with email and password, then confirm dashboard data loads through the API.
- Web: sign in or sign up with Google, Apple, and Microsoft and confirm redirect to `/onboarding` or `/dashboard`.
- Web: sign out from dashboard and confirm both Clerk and Burner Point API sessions are cleared.
- Mobile: create account with required profile fields, complete email and phone code verification when Clerk asks for them, and confirm tabs load after Clerk activation.
- Mobile: sign in with email/phone and password and confirm API-backed numbers/messages/profile screens load.
- Mobile: tap Forgot password, request an email or phone reset code, submit the code with a new password, and confirm the app opens the protected tabs.
- Mobile: sign out from profile and confirm SecureStore API tokens are removed and Clerk signs out.
- API: call `/auth/clerk/exchange` with an active Clerk session token and confirm it returns `accessToken`, `refreshToken`, and `user`.

## Notes

- The legacy `/auth/register`, `/auth/login`, `/auth/refresh`, and `/auth/logout` API endpoints remain for backward compatibility and internal token refresh.
- New Clerk user linkage is stored in `users.preferences.clerkUserId` to avoid a database migration in this pass.
- A future schema migration should add a nullable, indexed `clerk_id` column once the Clerk migration is stable in production.
