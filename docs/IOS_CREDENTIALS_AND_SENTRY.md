# Burner Point iOS Credentials and Sentry Setup

This document captures the external-account steps that cannot be completed by code alone.

## iOS EAS Credentials

Burner Point's iOS bundle identifier is:

```text
app.burnerpoint.mobile
```

EAS can build Android with the existing remote keystore, but iOS requires Apple Developer signing assets. The non-interactive iOS build is currently blocked because EAS reported:

```text
Credentials are not set up. Run this command again in interactive mode.
```

Run this from the mobile app directory:

```powershell
cd C:\Users\HP\projects\burner-point\burner-point\apps\mobile
eas credentials:configure-build --platform ios --profile production
```

When prompted, sign in with the Apple Developer account that owns Burner Point. Complete 2FA, choose the Apple Developer team, and let EAS manage credentials unless you already have a distribution certificate and provisioning profile to upload.

After credentials are configured, start the iOS production build:

```powershell
eas build --platform ios --profile production
```

## Required Apple Developer Assets

EAS needs these Apple-side assets for production iOS builds:

- Apple Developer Program membership for the account/team.
- App ID / bundle identifier matching `app.burnerpoint.mobile`.
- Apple Distribution certificate.
- App Store provisioning profile for the bundle identifier.
- App Store Connect app record before TestFlight or App Store submission.

Use EAS-managed credentials for launch unless there is a reason to manually control certificates.

## Sentry DSN Setup

Sentry is separate from GitHub, Neon, Railway, Vercel, Clerk, Resend, Expo, and OpenAI. Create separate Sentry projects so errors do not mix across surfaces:

- `burner-point-web` using the Next.js platform.
- `burner-point-api` using the Node.js platform.
- `burner-point-mobile` using the React Native / Expo platform.

Copy each project's DSN from Sentry Project Settings -> Client Keys (DSN), then set:

```text
apps/api/.env:
SENTRY_DSN=https://your_real_api_dsn_here

apps/web/.env.local:
NEXT_PUBLIC_SENTRY_DSN=https://your_real_web_dsn_here

apps/mobile/.env:
EXPO_PUBLIC_SENTRY_DSN=https://your_real_mobile_dsn_here
```

For deployed environments, set the same values in Railway, Vercel, and EAS environment variables. A DSN is not a Clerk key, API key, or database URL; it is the full Sentry URL-like value for the specific Sentry project.

`SENTRY_AUTH_TOKEN` is optional for runtime error reporting. Add it only when Burner Point should upload source maps or attach release metadata during builds. The DSN variables are the required values for basic error capture.

## Clerk Secret Rotation

The Clerk secret key was shared during setup. Rotate it in Clerk before production or real users, then update:

- Local ignored `.env` files.
- Vercel web environment variables.
- Railway API environment variables.
- Any CI/CD secret store that references `CLERK_SECRET_KEY`.
