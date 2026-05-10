# Burner Point Backend Integration Contracts

Burner Point web and mobile clients talk to the Burner Point API only. Supabase, telecom providers, payment gateways, storage credentials, webhook secrets, and operator tooling remain server-side or in deployment secret stores.

## Runtime Catalog

Authenticated clients can inspect safe integration status through:

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/integrations/catalog` | Safe integration readiness catalog with configured or missing env names only |
| GET | `/api/integrations/contracts` | Backend integration contract list |
| GET | `/api/integrations/:id` | One safe integration contract |

The catalog never returns secret values.

## Client-Facing Backend Routes

| Product area | Route | Provider abstraction |
| --- | --- | --- |
| Supabase session exchange | `POST /api/auth/supabase/exchange` | Supabase browser or mobile session to Burner Point API session |
| Password reset | `POST /api/auth/password/reset` | Supabase Auth |
| Phone OTP | `POST /api/phone-auth/send` | Twilio Verify via backend |
| Phone OTP | `POST /api/phone-auth/verify` | Twilio Verify via backend |
| Messaging | `POST /api/messaging/sms/send` | Twilio, Telnyx, Bandwidth, Tremil routing |
| Email | `POST /api/messaging/email/send` | Resend API first, SMTP fallback |
| eSIM | `POST /api/integrations/esim/plans` | Airalo catalog |
| eSIM | `POST /api/integrations/esim/orders` | Airalo order creation |
| Proxies | `POST /api/integrations/proxies/orders` | Oxylabs or Smartproxy |
| VPN | `POST /api/integrations/vpn/sessions` | WireGuard control-plane integration |
| Storage | `POST /api/integrations/storage/upload-intents` | Backend-controlled object upload intent |
| Analytics | `POST /api/integrations/analytics/events` | Server-side PostHog capture |
| Payments | `POST /api/payments/initialize` | Paystack, Paddle, NOWPayments, and deferred secondary gateways |

## Provider Webhooks

| Provider | Route | Verification |
| --- | --- | --- |
| Twilio SMS | `/api/webhooks/twilio/sms` | Twilio request signature |
| Twilio Voice | `/api/webhooks/twilio/voice` | Twilio request signature |
| Twilio Status | `/api/webhooks/twilio/status` | Twilio request signature |
| Twilio Verify | `/api/webhooks/twilio/verify` | Twilio callback receiver |
| Telnyx | `/api/webhooks/telnyx` | Telnyx Ed25519 signature |
| Bandwidth messaging | `/api/webhooks/bandwidth` | Basic auth or HMAC fallback |
| Bandwidth voice | `/api/webhooks/bandwidth/voice` | Basic auth or HMAC fallback |
| Airalo | `/api/webhooks/airalo` | HMAC when `AIRALO_WEBHOOK_SECRET` is configured |
| Oxylabs | `/api/webhooks/oxylabs` | HMAC when `OXYLABS_WEBHOOK_SECRET` is configured |
| Smartproxy | `/api/webhooks/smartproxy` | HMAC when `SMARTPROXY_WEBHOOK_SECRET` is configured |
| WireGuard control plane | `/api/webhooks/wireguard` | HMAC when `WIREGUARD_WEBHOOK_SECRET` is configured |
| Paystack | `/api/webhooks/paystack` or `/api/payments/webhook/paystack` | HMAC SHA512 using secret key |
| Flutterwave | `/api/webhooks/flutterwave` or `/api/payments/webhook/flutterwave` | Secret hash or HMAC validation |
| Squad | `/api/webhooks/squad` or `/api/payments/webhook/squad` | Gateway signature |
| Korapay | `/api/webhooks/korapay` or `/api/payments/webhook/korapay` | Gateway signature |
| OPay | `/api/webhooks/opay` or `/api/payments/webhook/opay` | Gateway signature |
| Paddle | `/api/webhooks/paddle` or `/api/payments/webhook/paddle` | `Paddle-Signature` verification |
| NOWPayments | `/api/webhooks/nowpayments` or `/api/payments/webhook/nowpayments` | IPN signature |

Webhook events are deduplicated through `webhook_dedup` with provider-prefixed event IDs to prevent replay and double fulfillment.

## Environment Contract

Core server-side credentials:

| Integration | Required env |
| --- | --- |
| Supabase Auth | `SUPABASE_URL` plus `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SECRET_KEY` |
| Supabase Postgres | `DATABASE_URL`, `DIRECT_DATABASE_URL` |
| Twilio Verify | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SERVICE_SID` |
| Telnyx | `TELNYX_API_KEY` |
| Bandwidth | `BANDWIDTH_ACCOUNT_ID`, `BANDWIDTH_USERNAME`, `BANDWIDTH_PASSWORD` |
| Tremil | `TREMIL_API_KEY` |
| Paystack | `PAYSTACK_SECRET_KEY` |
| Paddle | `PADDLE_API_KEY`, `PADDLE_WEBHOOK_SECRET` |
| NOWPayments | `NOWPAYMENTS_API_KEY`, `NOWPAYMENTS_IPN_SECRET` |
| Resend | `RESEND_API_KEY` |
| Airalo | `AIRALO_API_KEY`, `AIRALO_API_SECRET` |
| Oxylabs | `OXYLABS_USERNAME`, `OXYLABS_PASSWORD` |
| Smartproxy | `SMARTPROXY_API_KEY` |
| WireGuard | `WIREGUARD_PRIVATE_KEY`, `WIREGUARD_SERVER_ENDPOINT` |
| Redis | `REDIS_URL` |
| OpenAI | `OPENAI_API_KEY` |
| Sentry | `SENTRY_DSN` |
| PostHog | `POSTHOG_KEY` |

Public client-safe Supabase keys:

| Surface | Supported env |
| --- | --- |
| Next.js web | `NEXT_PUBLIC_SUPABASE_ANON_KEY` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |
| Expo mobile | `EXPO_PUBLIC_SUPABASE_ANON_KEY` or `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |

Provider operation paths remain configurable because vendor APIs differ by contract, region, and product:

| Env | Purpose |
| --- | --- |
| `AIRALO_BASE_URL` | Airalo API base |
| `AIRALO_PLANS_PATH` | Airalo plans endpoint path |
| `AIRALO_ORDER_PATH` | Airalo order endpoint path |
| `OXYLABS_BASE_URL` | Oxylabs API base |
| `OXYLABS_PROXY_ORDER_PATH` | Oxylabs proxy order endpoint path |
| `SMARTPROXY_BASE_URL` | Smartproxy API base |
| `SMARTPROXY_PROXY_ORDER_PATH` | Smartproxy proxy order endpoint path |
| `WIREGUARD_CONTROL_BASE_URL` | Burner Point WireGuard control API base |
| `WIREGUARD_SESSION_PATH` | VPN session or config endpoint path |

## Frontend Rule

Frontend code may use only public app configuration such as `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_WEB_URL`, and public observability DSNs or keys when appropriate. Any direct frontend call to Supabase server keys, Twilio, Telnyx, Bandwidth, Tremil, Airalo, Oxylabs, Smartproxy, WireGuard, payment gateways, Resend, database URLs, private PostHog capture, or OpenAI is a security violation.
