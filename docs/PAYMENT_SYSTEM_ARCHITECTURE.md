# Burner Point Payment System Architecture

This document defines the production payment architecture for verification credits, number rentals, and monthly subscriptions.

## Product Pricing

| Product | Type | Target price | Fulfillment |
| --- | --- | ---: | --- |
| Verification credits | One-time | $0.99+ | Credit wallet after signed webhook confirmation |
| Non-renewable rental | One-time | $5.99 | Assign selected US/Canada number after signed webhook, or create a paid rental entitlement for operator-assisted assignment |
| Privacy Monthly | Recurring monthly | $15.99/month | Activate `user_subscriptions` after signed webhook confirmation |

`PAYMENT_USD_TO_NGN_RATE` converts USD target pricing to NGN kobo for Paystack and deferred Nigerian gateways. The current production default is `1500`.

## Gateway Policy

| Gateway | Role | Status |
| --- | --- | --- |
| Paystack | Primary Nigerian/local card checkout | Core |
| Paddle | International card and recurring subscription checkout | Core |
| NOWPayments | Crypto checkout | Core |
| Flutterwave | Secondary Nigerian/local checkout | Deferred behind `SECONDARY_GATEWAYS_ENABLED=true` |
| Squad by GTCO | Secondary Nigerian/local checkout | Deferred behind `SECONDARY_GATEWAYS_ENABLED=true` |
| Korapay | Secondary Nigerian/local checkout | Deferred behind `SECONDARY_GATEWAYS_ENABLED=true` |
| OPay | Secondary Nigerian/local checkout | Deferred behind `SECONDARY_GATEWAYS_ENABLED=true` |

The frontend never calls gateway APIs directly. It only calls `POST /api/payments/initialize`, receives a checkout URL, and leaves fulfillment to webhooks.

## Backend Flow

1. Authenticated user calls `POST /api/payments/initialize`.
2. API validates product type, gateway, platform policy, rental duration, selected plan, and optional rental number.
3. API creates a `payment_sessions` row with:
   - `reference`
   - `gateway`
   - `amount_kobo` as gateway minor units
   - `currency`
   - `metadata.paymentType`
   - `metadata.fulfillmentStatus=awaiting_webhook`
4. API calls the selected gateway server-side and stores the gateway checkout reference.
5. User completes checkout on the gateway-hosted page.
6. Gateway posts a webhook to the API.
7. API verifies the webhook signature and deduplicates the event through `webhook_dedup`.
8. API reconciles amount and currency against `payment_sessions`.
9. API claims the session by moving `pending -> processing`.
10. API applies exactly one fulfillment path:
    - credits: increment wallet and write a `wallet_transactions` row
    - rental: assign the selected number, or record a paid rental entitlement
    - subscription: upsert `user_subscriptions` and write a subscription transaction
11. API marks the session `completed`.
12. If fulfillment fails after payment, API marks `paid_pending_fulfillment` so support can reconcile manually without double-crediting.

## Frontend Flow

Web routes:

- `/dashboard/credits`: credit packages and gateway selection.
- `/dashboard/rentals`: rental duration, US/Canada country, optional selected number, and gateway selection.
- `/dashboard/billing`: subscription plan selection and checkout.
- `/dashboard/payments/success`: tells users webhook reconciliation is in progress.
- `/dashboard/payments/cancel`: tells users no entitlement is applied until webhook confirmation.

Frontend rule: never show a product as paid because the browser returned from checkout. The source of truth is the backend webhook state.

## Webhook Endpoints

| Endpoint | Purpose |
| --- | --- |
| `POST /api/webhooks/paystack` | Recommended Paystack webhook URL for provider dashboards |
| `POST /api/payments/webhook/paystack` | Paystack `charge.success` |
| `POST /api/webhooks/paddle` | Recommended Paddle webhook URL for provider dashboards |
| `POST /api/payments/webhook/paddle` | Paddle transaction and subscription events |
| `POST /api/webhooks/nowpayments` | Recommended NOWPayments IPN URL for provider dashboards |
| `POST /api/payments/webhook/nowpayments` | NOWPayments IPN |
| `POST /api/webhooks/flutterwave` | Recommended Flutterwave webhook URL for provider dashboards |
| `POST /api/payments/webhook/flutterwave` | Deferred gateway |
| `POST /api/webhooks/squad` | Recommended Squad webhook URL for provider dashboards |
| `POST /api/payments/webhook/squad` | Deferred gateway |
| `POST /api/webhooks/korapay` | Recommended Korapay webhook URL for provider dashboards |
| `POST /api/payments/webhook/korapay` | Deferred gateway |
| `POST /api/webhooks/opay` | Recommended OPay webhook URL for provider dashboards |
| `POST /api/payments/webhook/opay` | Deferred gateway |

Webhook handlers must be public, but they must verify provider signatures and must not trust browser redirects.

## Environment Variables

Required for core launch:

```env
PAYMENT_USD_TO_NGN_RATE=1500
PAYSTACK_SECRET_KEY=sk_live_xxxxxxxxx
PAYSTACK_PUBLIC_KEY=pk_live_xxxxxxxxx
PAYSTACK_WEBHOOK_SECRET=your_paystack_webhook_secret
PADDLE_API_KEY=pdl_live_apikey_xxxxxxxxx
PADDLE_CLIENT_TOKEN=live_xxxxxxxxx
PADDLE_WEBHOOK_SECRET=pdl_ntfset_xxxxxxxxx
PADDLE_SANDBOX=false
PADDLE_PRICE_VERIFICATION=pri_xxx
PADDLE_PRICE_RENTAL=pri_xxx
PADDLE_PRICE_SUB_MONTHLY=pri_xxx
NOWPAYMENTS_API_KEY=NP_live_xxxxxxxxx
NOWPAYMENTS_IPN_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SECONDARY_GATEWAYS_ENABLED=false
MOBILE_EXTERNAL_PAYMENTS_ENABLED=false
```

Do not expose secret keys in web or mobile bundles. `NEXT_PUBLIC_*` and `EXPO_PUBLIC_*` values may only contain publishable/client-safe values.

## Mobile App Store Policy

Native iOS and Android apps must not enable in-app external checkout for digital goods until the product has a reviewed policy path.

Current operating rule:

- Web app can use Paystack, Paddle, and NOWPayments.
- Native app opens web billing surfaces only when policy-safe.
- `MOBILE_EXTERNAL_PAYMENTS_ENABLED=false` keeps the API from creating mobile-origin external checkout sessions by default.
- If Burner Point sells digital credits, digital subscriptions, or app-unlocked functionality directly inside the native app, add StoreKit / Google Play Billing support or a compliant entitlement-specific external-purchase path before release.

Primary policy references:

- Apple App Store Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Google Play Payments policy: https://support.google.com/googleplay/android-developer/answer/9858738

## Reconciliation Checklist

- Confirm the gateway signature is valid.
- Confirm the event has not been processed in `webhook_dedup`.
- Confirm payment reference exists.
- Confirm session status is `pending`.
- Confirm amount is not lower than the session amount.
- Confirm currency matches the session currency.
- Move session to `processing`.
- Apply fulfillment.
- Write transaction history.
- Mark session `completed`.
- If fulfillment fails after payment, mark `paid_pending_fulfillment` and keep enough metadata for manual repair.

## Failure Modes

| Failure | Expected state |
| --- | --- |
| User closes checkout | `payment_sessions.status=pending` until expiry |
| Browser returns success before webhook | Success page says reconciliation is pending |
| Duplicate webhook | API returns success with duplicate ignored |
| Underpaid or wrong currency | `payment_sessions.status=reconciliation_failed` |
| Provider confirms but number assignment fails | `payment_sessions.status=paid_pending_fulfillment` |
| Subscription webhook arrives twice | `webhook_dedup` prevents duplicate activation |

## Deployment Order

1. Apply Supabase migrations:
   - `supabase/migrations/0001_initial_schema.sql`
   - `supabase/migrations/0002_rls_policies.sql`
2. Set Railway environment variables for payment providers.
3. Confirm Paystack webhook URL points to `/api/webhooks/paystack`.
4. Confirm Paddle webhook URL points to `/api/webhooks/paddle`.
5. Confirm NOWPayments IPN URL points to `/api/webhooks/nowpayments`.
6. Deploy API to Railway.
7. Deploy web to Vercel.
8. Run controlled live smoke tests for credits, rental entitlement, rental with selected test number, and subscription.
9. Verify `payment_sessions`, `wallet_transactions`, `phone_numbers`, and `user_subscriptions`.
10. Keep secondary gateways disabled until the core flows are stable in production.
