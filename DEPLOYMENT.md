# Deployment Guide

## Surfaces
- `apps/web`: Vercel
- `apps/api`: Railway
- `apps/mobile`: Expo / EAS
- `DATABASE_URL`: Neon Postgres

## Pre-deploy
- Fill production env vars from `.env.example`.
- Keep `.env` out of git.
- Run:
```bash
npm run release:verify
```
- Apply API SQL migrations in `apps/api/src/database/migrations/`.
- Run `docs/NEON_RLS.sql` in Neon after schema migrations.

## API to Railway
- Root directory: `apps/api`
- Build command: `npm run build`
- Start command: `npm run start:prod`
- Health check path: `/health`
- Required env groups:
  - Core
  - Database
  - Clerk
  - Twilio
  - Payments
  - Redis / queue
  - Support email
  - Connectivity providers
  - Security
  - Monitoring
- Verify:
  - `/health`
  - `/health/db`
  - `/health/queue`
  - `/health/storage`
  - `/api/platform/readiness`

## Web to Vercel
- Root directory: `apps/web`
- Build command: `npm run build`
- Output: Next.js default
- Required env:
  - `NEXT_PUBLIC_APP_URL`
  - `NEXT_PUBLIC_API_URL`
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
  - `NEXT_PUBLIC_SUPPORT_EMAIL`
  - optional public analytics keys and support links
- Confirm security headers from `apps/web/next.config.js` are present on the deployed domain.

## Mobile with Expo / EAS
- Project directory: `apps/mobile`
- Validate config:
```bash
cd apps/mobile
npx tsc --noEmit
```
- Configure EAS secrets for any `EXPO_PUBLIC_*` values that must differ by environment.
- Confirm production bundle identifiers, package names, deep links, and Clerk public key values.

## Database / Migrations
- Apply SQL migrations in order from `apps/api/src/database/migrations/`.
- Confirm:
  - production connection works
  - RLS policies are enabled
  - migration `008_convert_minor_units_to_usd_cents.sql` is applied before wallet funding goes live
  - migration `010_support_tickets.sql` is applied before dashboard support goes live
  - `docs/NEON_RLS.sql` has been applied successfully

## Post-deploy health checks
- `GET /health`
- `GET /health/db`
- `GET /health/queue`
- `GET /health/storage`
- `GET /api/platform/readiness`
- Test sign-in, phone verification, wallet funding, rentals, eSIM, proxy, secure tunnel, and support ticket creation.

## Rollback
- Web: redeploy previous Vercel build.
- API: redeploy previous Railway release.
- Database: do not roll back by ad-hoc destructive SQL; use forward fix migrations.
