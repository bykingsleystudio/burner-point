# BurnerPoint — Complete Backend API Reference
# All 10 service integrations documented
# Frontend communicates ONLY through these endpoints — never directly to third parties

## Architecture Principle

```
Frontend (Next.js / React Native)
    ↓  HTTP only
Backend (NestJS on Railway)
    ↓  Server-side SDK calls (API keys never reach frontend)
Third-party services (Twilio, Paddle, Paystack, OpenAI, etc.)
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

## 1. Authentication (Twilio + JWT)

### POST /auth/register
Creates a new account.
```json
Body: {
  "email": "user@example.com",
  "password": "StrongPass123!",
  "firstName": "Kingsley",
  "country": "NG",              // optional
  "referralCode": "ABC1234"     // optional
}
Response: {
  "accessToken": "eyJhb...",
  "refreshToken": "eyJhb...",
  "userId": "uuid"
}
```
Rate limit: 5 attempts / 10 minutes per IP

### POST /auth/login
```json
Body: { "email": "...", "password": "..." }
Response: { "accessToken": "...", "refreshToken": "...", "userId": "..." }
```
Rate limit: 5 attempts / 10 minutes per IP

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
  // "rental"       = $5.00 one-time phone rental
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
Body: { "urls": ["https://burnerpoint.app/blog/new-post"] }
```

---

## 10. SEO (no auth)

### GET /sitemap.xml
Returns XML sitemap.

### GET /robots.txt
Returns robots.txt.

### GET /structured-data
Returns JSON-LD structured data object.

---

## Twilio Webhook Receivers (called by Twilio, not frontend)

### POST /webhooks/twilio/sms
### POST /webhooks/twilio/voice
### POST /webhooks/twilio/status

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
