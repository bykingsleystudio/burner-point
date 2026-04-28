# Environment Guide

## Source of truth
- Variable names live in `.env.example`.
- Real values belong in `.env` or platform secret stores.
- Do not commit `.env`.

## Core runtime rules
- Web only reads `NEXT_PUBLIC_*`.
- Mobile only reads `EXPO_PUBLIC_*`.
- Secrets stay server-side.
- The backend accepts a few legacy aliases for compatibility, but new deployments should use the names from `.env.example`.

## Required setup order
1. Database (`DATABASE_URL`, `DIRECT_DATABASE_URL`)
2. Auth (`CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_WEBHOOK_SECRET`)
3. Phone verification (`TWILIO_*`)
4. Payments (`PAYSTACK_*`, `PADDLE_*`, `NOWPAYMENTS_*`, optional secondary gateways)
5. Security (`JWT_SECRET`, `ENCRYPTION_KEY`, `CORS_ALLOWED_ORIGINS`)
6. Redis / queue (`REDIS_URL`, `QUEUE_REDIS_URL`, `SOCKET_IO_REDIS_URL`)
7. Monitoring (`SENTRY_*`, `POSTHOG_*`)
8. Storage (`AWS_*` or `R2_*`)
9. Support and notifications (`SUPPORT_EMAIL`, `RESEND_FROM_EMAIL`, optional public support link env)

## Important values
- `CORS_ALLOWED_ORIGINS`: comma-separated explicit production origins
- `CORS_ALLOW_VERCEL_PREVIEWS`: set `true` only if preview deploys must call the API
- `PAYMENT_USD_TO_NGN_RATE`: display conversion only
- `NEXT_PUBLIC_API_URL`: required by the web app
- `NEXT_PUBLIC_SUPPORT_EMAIL`, `NEXT_PUBLIC_SUPPORT_TELEGRAM_URL`, `NEXT_PUBLIC_COMMUNITY_TELEGRAM_URL`: optional branded public support links for the web client
- `POSTHOG_KEY`: server-side PostHog key consumed by backend analytics capture

## Wallet rule
- Wallet balance is stored in USD cents.
- Legacy `*Kobo` names remain in schema/code for compatibility only.
- Local currency is display-only.

## Webhooks
- Every provider webhook secret must be configured before going live.
- Missing secrets should be treated as deployment blockers for that provider.

## Compatibility aliases
- `JWT_SECRET` is the canonical JWT secret; older `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` values are still accepted.
- `FLUTTERWAVE_WEBHOOK_SECRET` is the canonical Flutterwave webhook secret; older `FLUTTERWAVE_WEBHOOK_HASH` is still accepted.
- `OPAY_PRIVATE_KEY` is the canonical OPay server credential; older `OPAY_SECRET_KEY` is still accepted.
- `AIRALO_API_KEY` and `AIRALO_API_SECRET` are the canonical Airalo credentials; older `AIRALO_CLIENT_ID` and `AIRALO_CLIENT_SECRET` are still accepted.
