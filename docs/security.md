# Burner Point Security

## Enforced controls

- Helmet security headers on the API
- Strict CORS allowlist with optional Vercel preview gating
- Global request validation with whitelisting and non-whitelisted rejection
- Redis-backed rate limits for auth, payments, and webhooks
- Supabase RLS for user-owned data
- Raw-body webhook verification for Paddle and NOWPayments
- Server-side payment verification before fulfillment
- Service-role operations restricted to backend services

## Storage rules

- Supabase Storage is primary.
- Buckets stay private by default.
- Signed URLs are required for controlled access.
- Frontend never receives storage provider credentials.

## Abuse controls

- Auth lockout windows
- OTP abuse throttling
- Payment initialization throttling
- Webhook dedupe and replay resistance
- Input sanitization and payload depth/size checks

## Operator notes

- Do not expose backend/provider errors directly to end users.
- Do not put secrets in public env vars.
- Do not add production origins outside `https://burnerpoint.com` and `https://www.burnerpoint.com` without an explicit release decision.
