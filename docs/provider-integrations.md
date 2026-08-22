# Provider Integration Contract

This is the activation record for the existing server-side provider architecture. The frontend uses Burner Point API routes only; provider credentials, routing, webhooks, and fulfillment remain server-controlled.

## Rules

- Never put provider secrets, service-role keys, webhook secrets, private keys, or internal API keys in browser variables.
- Configure production values in Railway and Vercel secret stores, not Git.
- Do not mark a provider live until its credentials, webhook URL, signature validation, sandbox test, and rollback path are verified.
- Provider webhooks must acknowledge quickly, validate their provider signature, be idempotent, and defer slow fulfillment work.
- Missing credentials must produce an explicit unavailable/degraded state. The frontend must not fabricate availability, orders, balances, subscription state, or provider responses.

## Existing server routes

| Provider group | Existing server surface | Activation state |
|---|---|---|
| Twilio | `/phone-auth/*`, `/numbers/*`, `/messages`, `/webhooks/twilio/*` | Available when required Twilio env values are configured |
| Telnyx | `/numbers/*`, `/messages`, `/messaging/*`, `/webhooks/telnyx` | Available when `TELNYX_API_KEY` and routing values are configured |
| Bandwidth | `/numbers/*`, `/messages`, `/messaging/*`, `/webhooks/bandwidth*` | Available when account and application values are configured |
| JuicySMS | Verify provider routing and provider adapter | Available when `JUICYSMS_API_KEY` is configured |
| TextVerified | Verify provider routing and provider adapter | Available when `TEXTVERIFIED_API_KEY` is configured |
| SMSPool | Rental provider routing and provider adapter | Available when `SMSPOOL_API_KEY` is configured |
| Quackr | Rental provider routing and provider adapter | Available when `QUACKR_API_KEY` is configured |
| TigerSMS | Provider enum/config placeholder | Official API is verified, but activation remains disabled until its activation-ID/number allocation model is mapped to Verify Hub wallet/order settlement and sandbox-tested |
| Paystack | `/payments/initialize`, `/webhooks/paystack` | Core gateway; requires secret and webhook verification |
| Flutterwave | `/payments/initialize`, `/webhooks/flutterwave` | Deferred behind `SECONDARY_GATEWAYS_ENABLED` |
| Korapay | `/payments/initialize`, `/webhooks/korapay` | Deferred behind `SECONDARY_GATEWAYS_ENABLED` |
| NOWPayments | `/payments/initialize`, `/webhooks/nowpayments` | Available when API/IPN secrets are configured |
| RevenueCat | `/billing/entitlements*`, `/webhooks/revenuecat` | Subscription sync; server secret and webhook authorization required |
| Airalo | `/integrations/esim/*`, `/webhooks/airalo` | Available when Airalo credentials and paths are configured |
| Oxylabs | `/integrations/proxies/orders`, `/webhooks/oxylabs` | Primary proxy fulfillment when configured |
| Smartproxy | `/integrations/proxies/orders`, `/webhooks/smartproxy` | Proxy fallback when configured |
| WireGuard | `/integrations/vpn/sessions`, `/webhooks/wireguard` | Available when server keys and control-plane values are configured |
| Supabase | Supabase Auth, Postgres, Storage, Realtime | Existing platform dependency |
| Redis / Socket.IO | Gateway adapter and queues | Existing platform dependency; degraded behavior is explicit when unavailable |
| Resend | Existing server email services | Server-only email delivery |
| Sentry / PostHog | Existing observability services | Server and approved public telemetry values only |
| OpenAI | Existing backend AI services | Server-only; respect `AI_KILL_SWITCH` |
| Cloudflare Turnstile | `/auth/turnstile/verify` | Requires public site key plus server secret |
| ForexRateAPI | Existing FX service | Server-only API key and configured base URL |
| Railway / Vercel | Deployment surfaces | Configure secrets and public variables in their respective environments |

## Official references checked

- [Twilio webhooks](https://www.twilio.com/docs/usage/webhooks)
- [Telnyx messaging](https://developers.telnyx.com/docs/v2/messaging)
- [Bandwidth messaging](https://dev.bandwidth.com/docs/messaging)
- [Paystack webhooks](https://paystack.com/docs/payments/webhooks/)
- [RevenueCat webhooks](https://www.revenuecat.com/docs/integrations/webhooks)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/)
- [Oxylabs developer documentation](https://developers.oxylabs.io/)
- [TigerSMS API](https://tiger-sms.com/api)
- [TigerSMS OpenAPI specification](https://tiger-sms.com/api/openapi.json)

## Release checklist

1. Set only the provider's required secrets in the deployment secret store.
2. Configure the provider's HTTPS webhook URL and signature/authentication setting.
3. Confirm the corresponding server route returns the expected acknowledgement.
4. Run a sandbox or provider-approved test and verify the durable database record.
5. Confirm retries and duplicate delivery are idempotent.
6. Confirm the frontend reflects backend status and does not expose secret material.
7. Record the provider's rollback switch before enabling production traffic.
