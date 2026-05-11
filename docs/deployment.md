# Burner Point Deployment

## Targets

- `apps/web` -> Vercel
- `apps/api` -> Railway
- `supabase/` -> Supabase migrations, policies, storage
- `apps/mobile` -> Expo EAS

## Production domains

- `https://burnerpoint.com`
- `https://api.burnerpoint.com`

## Release gate

Run before promotion:

```bash
npm run security:scan
npm run build --prefix apps/api
npm run build --prefix apps/web
cd apps/mobile && npx tsc --noEmit
npm run test:e2e --prefix apps/web
```

## Railway

- Service root: `apps/api`
- Build command: `npm run build`
- Start command: `npm run start:prod`
- Health checks:
  - `GET /health`
  - `GET /health/db`
  - `GET /health/redis`
  - `GET /health/storage`

## Vercel

- Project root: `apps/web`
- Framework preset: `Next.js`
- Build command: `npm run build`
- Required public env:
  - `NEXT_PUBLIC_APP_URL=https://burnerpoint.com`
  - `NEXT_PUBLIC_API_URL=https://api.burnerpoint.com`
  - `NEXT_PUBLIC_WS_URL=wss://api.burnerpoint.com`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Supabase

- Apply `supabase/migrations` in order.
- Verify RLS is enabled on production tables.
- Verify storage buckets exist:
  - `bp-user-uploads`
  - `bp-media`
  - `bp-verification-assets`
  - `bp-documents`

## Expo EAS

- Project: `@bykingsleystudio/burnerpoint`
- Confirm production bundle IDs, deep links, Supabase public keys, and RevenueCat public SDK keys before store builds.

## Known external blockers

- Vercel is still resolving the current web project as static output and returning `NOT_FOUND`; this must be fixed in Vercel project configuration before go-live.
- Railway production deploys are blocked during free-tier peak hours in `us-west2`; retry outside the restricted window or upgrade the plan.
- Public DNS for `burnerpoint.com` and `api.burnerpoint.com` must resolve before external verification can pass.
