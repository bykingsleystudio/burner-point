# Burner Point Production Remediation Design

## Goal

Bring the existing Burner Point repository to one coherent, secure, deployable
implementation without inventing credentials or provider success responses.

## Decisions

- Supabase SQL migrations are the sole schema authority. TypeORM remains a query
  mapper only and its migration discovery/execution is removed.
- All monetary values are integer USD cents. Public application fields no longer
  describe those values as kobo.
- `/api/messages` is the canonical customer and SDK contract. It owns message
  listing, conversation views, sending, read state, delivery state, and unread
  counts.
- Supabase remains the identity authority; the API issues its scoped access token
  after validating a Supabase session. Legacy direct-password paths are removed
  only when all clients use the Supabase exchange path.
- An explicit `@Roles()` decorator defaults to deny when a guarded route has no
  required role. Admin endpoints require `admin`.
- Workspace reads require membership; mutations require workspace `owner` or
  `admin`. Mutations append an audit record within the same transaction.
- The supported provider set is Twilio, Telnyx, Bandwidth; Paystack, Paddle,
  NOWPayments, Flutterwave, Korapay; Airalo, Oxylabs, Smartproxy, WireGuard;
  Supabase, Redis, Socket.IO, RevenueCat, Resend, OpenAI, Sentry, and PostHog.
  Tremil, Squad, OPay, Stripe, and PayPal are removed.
- Verification, eSIM, proxy, VPN, and developer-webhook work is represented by
  durable first-party records before a provider operation is attempted. Missing
  credentials yield a clear unavailable/configuration error, never fabricated
  data or success.

## Data flow

```text
Authenticated user
  -> API authorization / ownership check
  -> durable order, message, or financial-lock record
  -> supported provider request
  -> verified idempotent provider webhook
  -> state transition + immutable ledger/audit event
  -> authorized Socket.IO event + user-visible history
```

## Data safety and migration strategy

The consolidation migration is additive: it adds canonical columns/tables,
backfills from legacy columns when they exist, preserves the old columns for a
release window, adds constraints only after backfill, and records no destructive
drop. A later, separately approved cleanup migration may remove retired columns
only after production backup and row-count validation. A new Supabase project is
initialized exclusively with the ordered SQL migrations in `supabase/migrations`.

## Operational boundary

Code validates all required environment variables immediately before making a
provider request. Deploying real provider operations still requires operator
credentials, dashboard webhook URLs, payment product IDs, WireGuard control-plane
access, Redis, and the Supabase migration deployment; source code must not invent
any of these values.
