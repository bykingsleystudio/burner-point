# Burner Point API

## Base URLs

- Web: `https://burnerpoint.com`
- API: `https://api.burnerpoint.com/api`
- WebSocket: `wss://api.burnerpoint.com/events`

## Auth surface

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `POST /auth/supabase/exchange`
- `POST /phone-auth/send`
- `POST /phone-auth/verify`

Browser-facing routes:

- `/sign-in`
- `/sign-up`
- `/forgot-password`
- `/verify-phone`
- `/reset-password`
- `/auth/callback`

## Health endpoints

- `GET /health`
- `GET /health/db`
- `GET /health/redis`
- `GET /health/storage`

`GET /health/queue` remains as a compatibility alias for the Redis probe.

## Payment webhooks

- `POST /webhooks/paystack`
- `POST /webhooks/flutterwave`
- `POST /webhooks/paddle`
- `POST /webhooks/nowpayments`
- `POST /webhooks/squad`
- `POST /webhooks/korapay`
- `POST /webhooks/opay`

## Provider rules

- Frontend never calls payment, telecom, or storage providers directly.
- Secrets stay on Railway, Supabase, Vercel, or EAS secret stores.
- All payment success states are verified server-side before wallet crediting or fulfillment.
- All webhook handlers must stay idempotent.
