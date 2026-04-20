# Burner Point Backend Integration Contracts

Burner Point integrations are backend-only unless an environment variable is explicitly marked public. Web, mobile web, and Expo clients call Burner Point API routes only. Provider API keys, webhook secrets, database URLs, SMTP credentials, payment secrets, S3 access keys, WireGuard private keys, and OpenAI keys stay on the API service or deployment secret store.

## Runtime Catalog

Authenticated clients can inspect safe integration status through:

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/integrations/catalog` | Safe integration readiness catalog with configured/missing env names only |
| GET | `/api/integrations/contracts` | Endpoint contract list for provider-backed features |
| GET | `/api/integrations/:id` | One safe integration contract |

The catalog never returns secret values.

## Client-Facing Backend Routes

| Product area | Route | Provider abstraction |
| --- | --- | --- |
| Phone OTP | `POST /api/phone-auth/send` | Twilio Verify, server-side |
| Phone OTP | `POST /api/phone-auth/verify` | Twilio Verify check, server-side |
| Messaging | `POST /api/messaging/sms/send` | Twilio, Infobip, Vonage routing |
| Email | `POST /api/messaging/email/send` | Resend API first, SMTP fallback |
| eSIM | `POST /api/integrations/esim/plans` | Configured 1GLOBAL catalog endpoint |
| eSIM | `POST /api/integrations/esim/orders` | Configured 1GLOBAL order endpoint |
| Proxies | `POST /api/integrations/proxies/orders` | Configured Bright Data proxy endpoint |
| VPN | `POST /api/integrations/vpn/sessions` | Configured WireGuard control-plane endpoint |
| Storage | `POST /api/integrations/storage/upload-intents` | Backend-controlled S3-compatible upload intent |
| Analytics | `POST /api/integrations/analytics/events` | Server-side PostHog capture |
| Payments | `POST /api/payments/initialize` | Paystack, Paddle, NOWPayments, deferred secondary gateways |

## Provider Webhooks

| Provider | Route | Verification |
| --- | --- | --- |
| Twilio | `/api/webhooks/twilio/sms` | Twilio webhook secret, pending provider-specific hardening |
| Twilio | `/api/webhooks/twilio/voice` | Twilio webhook secret, pending provider-specific hardening |
| Twilio | `/api/webhooks/twilio/status` | Twilio webhook secret, pending provider-specific hardening |
| Twilio Verify | `/api/webhooks/twilio/verify` | Twilio callback receiver |
| Vonage | `/api/webhooks/vonage/inbound` | Provider callback receiver |
| Vonage | `/api/webhooks/vonage/status` | Provider callback receiver |
| Infobip | `/api/webhooks/infobip/inbound` | Provider callback receiver |
| Infobip | `/api/webhooks/infobip/status` | Provider callback receiver |
| Bandwidth | `/api/webhooks/bandwidth` | HMAC when `BANDWIDTH_WEBHOOK_SECRET` is configured |
| 1GLOBAL | `/api/webhooks/oneglobal` | HMAC when `ONEGLOBAL_WEBHOOK_SECRET` is configured |
| Bright Data | `/api/webhooks/brightdata` | HMAC when `BRIGHTDATA_WEBHOOK_SECRET` is configured |
| WireGuard control plane | `/api/webhooks/wireguard` | HMAC when `WIREGUARD_WEBHOOK_SECRET` is configured |
| Clerk | `/api/webhooks/clerk` | Standard Webhooks when `CLERK_WEBHOOK_SIGNING_SECRET` is configured |
| Paystack | `/api/payments/webhook/paystack` | Gateway signature |
| Paddle | `/api/payments/webhook/paddle` | Gateway signature |
| NOWPayments | `/api/payments/webhook/nowpayments` | IPN signature |
| Flutterwave | `/api/payments/webhook/flutterwave` | Deferred gateway signature |
| Squad | `/api/payments/webhook/squad` | Deferred gateway signature |
| Korapay | `/api/payments/webhook/korapay` | Deferred gateway signature |
| OPay | `/api/payments/webhook/opay` | Deferred gateway signature |

Webhook events are stored through `WebhookDedup` using provider-prefixed event IDs to prevent replay and duplicate processing.

## Environment Contract

Core server-only secrets:

| Integration | Required env |
| --- | --- |
| Twilio | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SERVICE_SID` |
| Infobip | `INFOBIP_BASE_URL`, `INFOBIP_API_KEY` |
| Vonage | `VONAGE_API_KEY`, `VONAGE_API_SECRET` |
| Bandwidth | `BANDWIDTH_ACCOUNT_ID`, `BANDWIDTH_API_TOKEN` |
| OpenAI | `OPENAI_API_KEY` |
| 1GLOBAL | `ONEGLOBAL_API_KEY` |
| Bright Data | `BRIGHTDATA_API_KEY` |
| WireGuard | `WIREGUARD_PRIVATE_KEY`, `WIREGUARD_ENDPOINT` |
| Resend | `RESEND_API_KEY` |
| Clerk | `CLERK_SECRET_KEY` |
| Neon | `DATABASE_URL` |
| S3-compatible storage | `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` |
| PostHog | `POSTHOG_API_KEY` |
| Paystack | `PAYSTACK_SECRET_KEY` |
| Paddle | `PADDLE_API_KEY`, `PADDLE_WEBHOOK_SECRET` |
| NOWPayments | `NOWPAYMENTS_API_KEY`, `NOWPAYMENTS_IPN_SECRET` |

Provider operation paths are configurable because telecom/connectivity vendors can differ by account, region, and product contract:

| Env | Purpose |
| --- | --- |
| `ONEGLOBAL_BASE_URL` | 1GLOBAL API base |
| `ONEGLOBAL_PLANS_PATH` | eSIM plans endpoint path |
| `ONEGLOBAL_ORDER_PATH` | eSIM order endpoint path |
| `BRIGHTDATA_BASE_URL` | Bright Data API base |
| `BRIGHTDATA_PROXY_ORDER_PATH` | Proxy order endpoint path |
| `WIREGUARD_CONTROL_BASE_URL` | Burner Point WireGuard control API base |
| `WIREGUARD_SESSION_PATH` | VPN session/config endpoint path |

## Frontend Rule

Frontend code may use only public app configuration such as `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_WEB_URL`, and public observability DSNs/keys when appropriate. Any direct frontend call to Twilio, Infobip, Vonage, Bandwidth, OpenAI, 1GLOBAL, Bright Data, WireGuard, payment gateways, Resend, Neon, S3, or private PostHog capture is a security violation.
