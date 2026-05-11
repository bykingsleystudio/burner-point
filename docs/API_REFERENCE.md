# BurnerPoint — Complete Backend API Reference
# All 10 service integrations documented
# Frontend communicates ONLY through these endpoints — never directly to third parties

## Architecture Principle

Frontend and mobile clients communicate only with the Burner Point backend. Third-party API keys stay server-side.

```
Frontend (Next.js / React Native)
    ↓  HTTP only
Backend (NestJS on Railway)
    ↓  Server-side SDK calls (API keys never reach frontend)
Third-party services (Twilio, Paddle, Paystack, OpenAI, etc.)
```

---

## 0. Platform Stack Registry

### GET /platform/stack

Returns the safe Burner Point stack source of truth and configuration status. This endpoint never returns secret values. It only returns provider names, roles, policy decisions, and whether required environment variables are present.

Core encoded providers:

- Web: Next.js, React, Tailwind CSS, TypeScript, Vercel.
- API: NestJS on Railway.
- Data: Supabase Postgres, Supabase Storage, Supabase Realtime, Redis queues.
- Auth: Supabase Auth with email/password, phone sign-in, Google, Apple, and Microsoft OAuth.
- Email: Resend.
- Monitoring: Sentry and PostHog.
- Payments: Paystack, Flutterwave, Paddle, NOWPayments.
- Subscriptions: RevenueCat for App Store / Google Play entitlements.
- Secondary payments: Squad by GTCO, Korapay, OPay behind `SECONDARY_GATEWAYS_ENABLED`.
- Conversation: Twilio, Telnyx, Bandwidth, Tremil.
- Verification: Twilio Verify primary with provider routing.
- Add-ons: Airalo eSIM, Oxylabs and Smartproxy proxies, WireGuard in-platform VPN.

```json
Response: {
  "product": "Burner Point",
  "environment": "production",
  "policies": {
    "webHosting": "Vercel",
    "apiHosting": "Railway",
    "database": "Supabase Postgres",
    "mobileDelivery": "Expo / EAS",
    "primaryPayments": ["paystack", "paddle", "nowpayments"],
    "secondaryGatewaysEnabled": false,
    "conversationScope": "US/Canada only",
    "verificationScope": "Global SMS and voice"
  },
  "summary": {
    "total": 42,
    "configured": 12,
    "planned": 5,
    "deferred": 4
  }
}
```

### GET /platform/readiness

Returns missing required configuration for non-secondary stack integrations.

```json
Response: {
  "status": "needs_configuration",
  "blockers": [
    {
      "id": "paystack",
      "name": "Paystack",
      "status": "missing_env",
      "missingEnv": ["PAYSTACK_SECRET_KEY"]
    }
  ]
}
```

### GET /platform/deployment-readiness

Returns the safe deployment target matrix, environment model, release gates, observability checks, rollback notes, and missing production configuration. Secret values are never returned.

Use this after setting Vercel, Railway, Supabase, Sentry, PostHog, Expo/EAS, telecom, payment, storage, subscription, and provider environment variables.

```json
Response: {
  "product": "Burner Point",
  "status": "needs_configuration",
  "policies": {
    "sourceControl": "GitHub",
    "webDeployment": "Vercel",
    "apiDeployment": "Railway",
    "database": "Supabase Postgres",
    "mobileDelivery": "Expo / EAS"
  },
  "blockers": [
    {
      "id": "vercel",
      "name": "Vercel",
      "status": "partial",
      "missingEnv": ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"]
    }
  ],
  "releaseGates": [
    {
      "id": "secret-scan",
      "command": "npm run security:scan"
    }
  ]
}
```

---

## Authentication Headers

All protected endpoints require:
```
Authorization: Bearer <access_token>
```

Access token lifetime: 15 minutes
Refresh token lifetime: 30 days

---

## 1. Authentication (Supabase Auth + API Session)

Supabase Auth is the primary authentication provider for web and mobile. Burner Point exchanges a verified Supabase access token for a short-lived Burner Point API access token and a refresh token. Email/password, phone sign-in, password recovery, Google, Apple, and Microsoft OAuth are handled through Supabase Auth.

Auth routes are rate-limited at 5 attempts per route per 15 minutes by IP and by hashed account identifier. Suspicious auth velocity is logged for abuse review.

### POST /auth/register
Creates a new account.
```json
Body: {
  "email": "user@example.com",
  "phoneNumber": "+14155550182",
  "password": "StrongPass123!",
  "firstName": "Kingsley",
  "lastName": "Doe",
  "acceptTerms": true,
  "acceptPrivacy": true,
  "country": "NG",              // optional
  "referralCode": "ABC1234"     // optional
}
Response: {
  "accessToken": "eyJhb...",
  "refreshToken": "eyJhb...",
  "userId": "uuid"
}
```
Rate limit: 5 attempts / 15 minutes per route, per IP and hashed account identifier

### POST /auth/login
```json
Body: { "identifier": "user@example.com or +14155550182", "password": "..." }
Response: { "accessToken": "...", "refreshToken": "...", "userId": "..." }
```
Rate limit: 5 attempts / 15 minutes per route, per IP and hashed account identifier

### POST /auth/supabase/exchange
Exchanges a verified Supabase access token for Burner Point API tokens. The API requires first name, last name, email, phone number, Terms acceptance, and Privacy Policy acceptance before issuing local API tokens.
```json
Body: {
  "accessToken": "supabase_access_token",
  "profile": {
    "firstName": "Kingsley",
    "lastName": "Doe",
    "email": "user@example.com",
    "phoneNumber": "+14155550182",
    "acceptTerms": true,
    "acceptPrivacy": true
  }
}
Response: { "accessToken": "...", "refreshToken": "...", "user": { "id": "uuid" } }
```

### POST /auth/refresh
```json
Body: { "refreshToken": "..." }
Response: { "accessToken": "...", "refreshToken": "..." }
```

### POST /auth/logout
```json
Body: { "refreshToken": "..." }
Response: { "success": true }
```
Revokes the refresh token in Redis immediately.

---

## 2. Phone OTP (Twilio Verify)

### POST /phone-auth/send
Sends OTP via Twilio Verify. Never exposes Twilio credentials to frontend.
```json
Body: { "phoneNumber": "+2348012345678", "channel": "sms" }
// channel: "sms" | "call" | "whatsapp"
Response: { "success": true, "channel": "sms", "expiresInMinutes": 10 }
```
Rate limit: 3 sends / 10 minutes per phone number

### POST /phone-auth/verify
```json
Body: { "phoneNumber": "+2348012345678", "code": "123456" }
Response: { "success": true, "phoneNumber": "+2348012345678" }
```

---

## 3. Phone Numbers (Twilio + Telnyx)

### GET /numbers/search?country=US&areaCode=212
Returns available numbers from Twilio. Never exposes Twilio SID/token.
```json
Response: [
  { "number": "+12125551234", "capabilities": { "sms": true, "voice": true } }
]
```

### POST /numbers/provision
Purchases number from Twilio, deducts from wallet.
```json
Body: { "phoneNumber": "+12125551234", "type": "burner", "countryCode": "US" }
// type: "burner" | "rental" | "verification" | "enterprise"
Response: { PhoneNumber entity }
```

### GET /numbers
Returns authenticated user's phone numbers.

### POST /numbers/:id/renew
Extends number expiry by 30 days. Deducts from wallet.

### DELETE /numbers/:id
Releases number back to carrier.

---

## 4. Messages

### GET /messages?phoneNumberId=uuid
Returns messages for a specific number.

### POST /messages
Sends SMS from a provisioned number.
```json
Body: { "to": "+2348012345678", "from": "+12125551234", "body": "Hello" }
```

### PATCH /messages/:id/read
Marks a message as read.

---

## 5. Payments — Nigerian Gateways
All 5 gateways use the same initialize endpoint with different `gateway` values.

### GET /payments/packages
Returns credit packages (no auth required).

### POST /payments/initialize  [AUTH REQUIRED]
```json
Body: {
  "packageId": "uuid",
  "gateway": "flutterwave"
  // gateway options (in priority order):
  // "flutterwave" | "paystack" | "squad" | "korapay" | "opay"
  // "paddle" | "nowpayments"
}
Response: {
  "reference": "BP-1234567890-ABCD1234",
  "checkoutUrl": "https://...",
  "amountKobo": 1000000,
  "gateway": "flutterwave"
}
```
Frontend opens checkoutUrl in browser. Never calls gateway directly.

### GET /payments/history  [AUTH REQUIRED]
Returns last 50 wallet transactions.

### POST /payments/webhook/:gateway  [NO AUTH — verified by signature]
Webhook receivers for all payment gateways.
```
/payments/webhook/flutterwave
/payments/webhook/paystack
/payments/webhook/squad
/payments/webhook/korapay
/payments/webhook/opay
/payments/webhook/nowpayments
```
Returns: { "received": true } (always 200)

---

## 6. Paddle — Cards + Subscriptions

### POST /paddle/checkout  [AUTH REQUIRED]
Creates Paddle checkout for credits, rental, or subscription.
```json
Body: {
  "type": "verification",
  // "verification" = $0.99 one-time OTP credits
  // "rental"       = $5.99 one-time phone rental
  // "subscription" = $15.99/month recurring
  "metadata": {}  // optional
}
Response: {
  "checkoutUrl": "https://checkout.paddle.com/...",
  "transactionId": "txn_xxx"
}
```
Frontend opens checkoutUrl. Never receives Paddle API key or Price IDs.

### GET /paddle/subscription  [AUTH REQUIRED]
```json
Response: {
  "active": true,
  "status": "active",
  "nextBilledAt": "2026-05-06T00:00:00Z",
  "canceledAt": null
}
```

### POST /paddle/subscription/cancel  [AUTH REQUIRED]
```json
Response: { "cancelled": true }
```
Effective at end of current billing period.

### POST /paddle/webhook  [NO AUTH — verified by HMAC-SHA256]
Handles: transaction.completed, subscription.created, subscription.updated, subscription.canceled

---

## 7. User Profile

### GET /users/me  [AUTH REQUIRED]
### PATCH /users/me  [AUTH REQUIRED]
```json
Body: { "firstName": "...", "timezone": "Africa/Lagos", "preferences": {} }
```

### GET /users/me/wallet  [AUTH REQUIRED]
```json
Response: { "balanceKobo": 500000, "balanceNgn": 5000 }
```

### DELETE /users/me  [AUTH REQUIRED]
Soft-deletes account. Data retained per Privacy Policy schedule.

---

## 8. Developer API Platform

### POST /developer/keys  [AUTH REQUIRED]
```json
Body: { "name": "Production", "scopes": ["read", "write"] }
Response: {
  "id": "uuid",
  "rawKey": "bp_xxxxx",  // shown ONCE — user must save this
  "keyPrefix": "bp_abc123",
  "scopes": ["read", "write"]
}
```

### GET /developer/keys  [AUTH REQUIRED]
Returns keys without rawKey (never re-exposed after creation).

### DELETE /developer/keys/:id  [AUTH REQUIRED]

### POST /developer/webhooks  [AUTH REQUIRED]
### GET /developer/webhooks  [AUTH REQUIRED]
### DELETE /developer/webhooks/:id  [AUTH REQUIRED]

---

## 9. Admin (requires role: admin)

### GET /admin/stats  [ADMIN]
### GET /admin/users?page=1&limit=20  [ADMIN]
### PATCH /admin/users/:id/status  [ADMIN]
### POST /admin/users/:id/credit  [ADMIN]
```json
Body: { "amountKobo": 100000 }
```

### GET /admin/ai/status  [ADMIN]
```json
Response: { "active": true, "killSwitch": false }
```

### POST /admin/indexnow/ping  [ADMIN]
```json
Body: { "urls": ["https://burnerpoint.com/blog/new-post"] }
```

---

## 10. SEO (no auth)

### GET /sitemap.xml
Returns XML sitemap.

### GET /robots.txt
Returns robots.txt.

### GET /structured-data
Returns JSON-LD structured data object.

### Web SEO routes
The Next.js web app also serves `/sitemap.xml`, `/robots.txt`, `/opengraph-image`, `/twitter-image`, `/manifest.webmanifest`, and `/indexnow-key.txt`.

### Search verification
Set `GOOGLE_SITE_VERIFICATION`, `BING_SITE_VERIFICATION`, and `INDEXNOW_KEY` in deployment env before launch. See `docs/SEO_SEARCH_DISCOVERY.md`.

---

## 11. Backend Integration Contracts

All third-party provider calls route through the BurnerPoint backend. Clients never call provider APIs directly and never receive provider secrets.

### GET /integrations/catalog  [AUTH REQUIRED]
Returns safe integration readiness for Twilio, Telnyx, Tremil, Bandwidth, OpenAI, Airalo, Oxylabs, Smartproxy, WireGuard, Paystack, Flutterwave, Squad, Korapay, OPay, Paddle, NOWPayments, RevenueCat, Resend, Supabase, Sentry, Railway, DBeaver, PostHog, and Expo. Secret values are never returned.

### GET /integrations/contracts  [AUTH REQUIRED]
Returns the backend endpoint contract map for every integration.

### GET /integrations/:id  [AUTH REQUIRED]
Returns one safe backend integration contract.

### POST /integrations/analytics/events  [AUTH REQUIRED]
Captures sensitive product analytics through server-side PostHog.

### POST /integrations/storage/upload-intents  [AUTH REQUIRED]
Creates a backend-controlled private upload intent. S3 credentials stay server-side.

### POST /integrations/esim/plans  [AUTH REQUIRED]
Queries the configured Airalo eSIM plans endpoint through the backend.

### POST /integrations/esim/orders  [AUTH REQUIRED]
Creates a configured Airalo eSIM order through the backend.

### POST /integrations/proxies/orders  [AUTH REQUIRED]
Creates a configured Oxylabs or Smartproxy order through the backend.

### POST /integrations/vpn/sessions  [AUTH REQUIRED]
Creates a configured WireGuard VPN session through the backend control plane.

---

## Provider Webhook Receivers (called by providers, not frontend)

### POST /webhooks/twilio/sms
### POST /webhooks/twilio/voice
### POST /webhooks/twilio/status
### POST /webhooks/twilio/recording
### POST /webhooks/twilio/verify
### POST /webhooks/telnyx
### POST /webhooks/tremil
### POST /webhooks/bandwidth
### POST /webhooks/airalo
### POST /webhooks/oxylabs
### POST /webhooks/smartproxy
### POST /webhooks/wireguard
### POST /webhooks/revenuecat

---

## Common Error Responses

```json
// 400 Bad Request
{ "statusCode": 400, "message": "Validation failed", "error": "Bad Request" }

// 401 Unauthorized
{ "statusCode": 401, "message": "Unauthorized" }

// 403 Forbidden
{ "statusCode": 403, "message": "Insufficient permissions" }

// 404 Not Found
{ "statusCode": 404, "message": "User not found" }

// 429 Too Many Requests
{ "statusCode": 429, "message": "Rate limit exceeded", "retryAfter": 300 }

// 500 Internal Server Error (production: no details exposed)
{ "statusCode": 500, "message": "Internal server error" }
```

---

## What the Frontend Knows vs What Stays Backend-Only

| Information               | Frontend | Backend |
|--------------------------|----------|---------|
| Direct provider API calls | Never    | Always through BurnerPoint API |
| Provider secret values    | Never    | Server-side only |
| NEXT_PUBLIC_API_URL       | ✅       | —       |
| NEXT_PUBLIC_PADDLE_CLIENT_TOKEN | ✅ | ✅     |
| All other API keys        | ❌       | ✅ only |
| Payment gateway URLs      | ❌       | ✅ only |
| Paddle Price IDs          | ❌       | ✅ only |
| Webhook secrets           | ❌       | ✅ only |
| JWT secrets               | ❌       | ✅ only |
| Database credentials      | ❌       | ✅ only |
| Twilio credentials        | ❌       | ✅ only |
| OpenAI API key            | ❌       | ✅ only |

The frontend never calls Twilio, OpenAI, Paystack, Flutterwave, Paddle, or
NOWPayments directly. All calls route through the BurnerPoint backend.

This also applies to Telnyx, Tremil, Bandwidth, Airalo, Oxylabs, Smartproxy,
WireGuard, RevenueCat server keys, Resend, Supabase service-role access,
database URLs, and private PostHog capture.
