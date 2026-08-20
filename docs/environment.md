# Burner Point Environment

The root [.env.example](../.env.example) is the canonical environment template.

## Rules

- Keep `.env`, `.env.local`, and `.env.production` out of git.
- Use `NEXT_PUBLIC_` only for safe browser values.
- Use `EXPO_PUBLIC_` only for safe mobile values.
- Keep Supabase service-role keys, provider secrets, webhook secrets, and JWT secrets server-side only.

## Production core

- `APP_URL=https://burnerpoint.com`
- `API_URL=https://api.burnerpoint.com`
- `NEXT_PUBLIC_APP_URL=https://burnerpoint.com`
- `NEXT_PUBLIC_API_URL=https://api.burnerpoint.com`
- `NEXT_PUBLIC_WS_URL=wss://api.burnerpoint.com`

## Required groups

- Supabase: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`
- Storage: the four `SUPABASE_STORAGE_*_BUCKET` variables
- Auth: Google, Apple, Microsoft, email/password, email magic links, phone OTP, Cloudflare Turnstile
- Auth security: `WEBAUTHN_RP_NAME`, `WEBAUTHN_RP_ID`, `WEBAUTHN_ORIGIN`, `OAUTH_ISSUER`
- Telecom: Twilio, Telnyx, Bandwidth
- Payments: Paystack, Flutterwave, Paddle, NOWPayments
- Subscriptions: RevenueCat
- Messaging/email: Resend
- Cache/queues: Redis
- Monitoring: Sentry, PostHog
- Security: encryption, JWT, durable auth sessions, passkeys, OAuth authorization codes/PKCE, webhook signing, internal API key, CORS

## App-specific templates

- API names-only reference: [apps/api/.env.example](../apps/api/.env.example)
- Web names-only reference: [apps/web/.env.local.example](../apps/web/.env.local.example)
