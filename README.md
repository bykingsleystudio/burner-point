# Burner Point

Burner Point is a production-focused monorepo for privacy-first telecom, verification, rentals, eSIM, proxy access, secure tunnel sessions, billing, and support across web, API, and mobile clients.

## Applications

- `apps/api` - NestJS API for auth exchange, provider orchestration, billing, webhooks, support tickets, and health checks
- `apps/web` - Next.js customer-facing site and authenticated dashboard
- `apps/mobile` - Expo / EAS mobile shell
- `packages/shared` - shared types and cross-app utilities

## Core Stack

- Auth: Clerk
- Phone verification: Twilio Verify
- Database: Neon Postgres
- Web deploy: Vercel
- API deploy: Railway
- Mobile deploy: Expo / EAS
- Monitoring: Sentry and PostHog
- Email: Resend
- Realtime / queue: Redis

## Local Commands

```bash
# API
cd apps/api
npm run dev
npm run build

# Web
cd apps/web
npm run dev
npx tsc --noEmit

# Mobile
cd apps/mobile
npm run start
npx tsc --noEmit
```

## Production Checks

- API health:
  - `/health`
  - `/health/db`
  - `/health/queue`
  - `/health/storage`
- Run the app-local build and verification commands before release.
- Add real values to `.env` or platform secret stores using `.env.example` as the key list.

## Deployment Config

- `apps/api/railway.toml`
- `apps/web/vercel.json`
- `apps/mobile/app.json`
- `apps/mobile/eas.json`

## Operational Docs

- `DEPLOYMENT.md`
- `ENVIRONMENT.md`
- `TROUBLESHOOTING.md`
- `POST_DEPLOYMENT_CHECKLIST.md`
- `docs/NEON_RLS.sql`
