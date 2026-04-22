# Burner Point

Burner Point is a multi-app monorepo for private telecom, verification, routing, and account-management flows across web, API, and mobile surfaces.

The current live applications ship from app-local entrypoints:

- `apps/api` - NestJS API deployed to Railway
- `apps/web` - Next.js App Router frontend deployed to Vercel
- `apps/mobile` - Expo app deployed through EAS
- `packages/shared` - shared types used across apps

## Current Architecture

```text
burner-point/
|-- apps/
|   |-- api/
|   |-- mobile/
|   `-- web/
|-- docs/
|-- infra/
|-- packages/
|   `-- shared/
|-- scripts/
|-- app.json                     # root-level Expo duplicate, review before deletion
|-- eas.json                     # root-level EAS duplicate, review before deletion
`-- README.md
```

## Live Stack

- Auth: Clerk on web and mobile, with backend session exchange through `apps/api`
- Phone verification: Twilio Verify via `apps/api`
- Database: Neon Postgres
- Web deploy: Vercel
- API deploy: Railway
- Mobile deploy: Expo / EAS
- Monitoring: Sentry and PostHog

## Working Commands

Use app-local commands when possible:

```bash
# API
cd apps/api
npm run dev
npm run build

# Web
cd apps/web
npm run dev
npm run build

# Mobile
cd apps/mobile
npm run start
npx tsc --noEmit
```

Existing root-level verification helpers:

```bash
npm run verify:api
npm run verify:web
npm run verify:mobile
npm run release:verify
```

## Deployment Surfaces

- `apps/api/railway.toml`
- `apps/web/vercel.json`
- `apps/mobile/app.json`
- `apps/mobile/eas.json`

These app-local files are the authoritative deployment configs.

## Notes

- Public test and demo routes have been removed from `apps/web` so production builds do not expose diagnostic pages.
- Legacy snapshot folders and malformed duplicate import directories were removed from repo root during the cleanup pass.
- The root README previously described an older JWT-first architecture. This file now reflects the current Clerk-based app structure.
- A full audit of delete, move, keep, and confirmation-needed items lives in `docs/CODEBASE_ARCHITECTURE_AUDIT.md`.
