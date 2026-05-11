# Burner Point Landing Redesign Stack

## Frontend surface
- Next.js App Router (`apps/web`)
- React 18
- Tailwind CSS
- Existing Burner Point brand primitives

## Existing integrations preserved
- Supabase authentication
- Sentry
- PostHog
- Existing marketing/SEO helpers

## Delivery decision
- Reuse current monorepo and route structure.
- Keep marketing redesign frontend-only.
- Avoid new dependencies.
