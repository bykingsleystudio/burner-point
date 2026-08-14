# Burner Point Production Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Burner Point's existing telecom, billing, messaging, connectivity, and developer surfaces coherent, secure, and deployable.

**Architecture:** Supabase SQL owns the schema; NestJS/TypeORM maps it without running migrations. Durable product records are created before provider calls, and verified webhooks perform idempotent state transitions. All user-facing clients share canonical API contracts.

**Tech Stack:** Supabase PostgreSQL SQL migrations, NestJS, TypeORM, Redis, Socket.IO, Next.js, Expo React Native, TypeScript, JavaScript/Python SDKs.

**Spec:** `docs/superpowers/specs/2026-08-13-production-remediation-design.md`

## Global Constraints

- The public brand is `Burner Point`; technical identifiers may remain `burner-point`.
- Use integer USD cents for money and never fabricate provider credentials or success.
- Preserve existing production data with additive/backfill migrations; no schema drops in this delivery.
- Retain only Twilio, Telnyx, Bandwidth; Paystack, Paddle, NOWPayments, Flutterwave, Korapay; Airalo, Oxylabs, Smartproxy, and WireGuard.
- Do not run TypeORM migrations in any runtime or deployment path.

---

### Task 1: Establish the canonical Supabase schema

**Files:**
- Create: `supabase/migrations/0007_production_schema_reconciliation.sql`
- Modify: `apps/api/src/database/data-source.ts`
- Modify: `apps/api/package.json`
- Test: `apps/api/test/supabase-schema-contract.test.ts`

**Interfaces:**
- Produces canonical `phone_numbers.phone_number`, `messages.from_number`, `messages.to_number`, canonical wallet cents columns, and durable order/delivery tables.
- Consumes TypeORM entity mappings without TypeORM migration execution.

- [ ] Add additive canonical columns/tables, indexes, FKs, constraints, and deterministic data backfills.
- [ ] Disable TypeORM migration discovery and migration scripts while retaining entity mapping.
- [ ] Add a schema-contract test that asserts canonical table/column identifiers used by entities.

### Task 2: Harden authentication and authorization

**Files:**
- Create: `apps/api/src/modules/auth/decorators/roles.decorator.ts`
- Modify: `apps/api/src/modules/auth/guards/roles.guard.ts`
- Modify: `apps/api/src/modules/admin/admin.controller.ts`
- Modify: `apps/api/src/modules/seo/seo.controller.ts`
- Modify: `apps/api/src/modules/enterprise/enterprise.controller.ts`
- Modify: `apps/api/src/modules/enterprise/enterprise.service.ts`
- Test: `apps/api/test/authorization.test.ts`

**Interfaces:**
- Produces `@Roles(...roles)` metadata and a deny-by-default `RolesGuard`.
- Produces `EnterpriseService.requireMembership` and `requireWorkspaceRole` authorization checks.

- [ ] Write tests for anonymous, regular-user, and admin route access plus cross-workspace denial.
- [ ] Require `admin` for every administrative operation and owner/admin for workspace mutations.
- [ ] Record workspace mutations through transaction-bound audit entries.

### Task 3: Implement the canonical messaging domain

**Files:**
- Create: `apps/api/src/modules/messages/messages.controller.ts`
- Create: `apps/api/src/modules/messages/messages.service.ts`
- Create: `apps/api/src/modules/messages/messages.module.ts`
- Modify: `apps/api/src/modules/webhooks/webhooks.service.ts`
- Modify: `apps/api/src/app.module.ts`
- Modify: `apps/web/src/lib/api.ts`
- Modify: `apps/mobile/src/app/(tabs)/messages.tsx`
- Modify: `packages/sdk/js/src/index.ts`
- Modify: `packages/sdk/python/burnerpoint/__init__.py`
- Test: `apps/api/test/messages.service.test.ts`

**Interfaces:**
- `GET /messages?phoneNumberId=&page=&limit=` returns paginated owned messages and unread totals.
- `POST /messages` sends owned-number SMS and persists pending state.
- `PATCH /messages/:id/read` updates only an owned inbound message.
- `GET /messages/conversations/:phoneNumberId/:counterpart` returns an owned thread.

- [ ] Add lifecycle tests for send, inbound persistence, delivery status, pagination, unread counts, realtime emission, and cross-user denial.
- [ ] Implement owned-number checks and provider-message-ID uniqueness.
- [ ] Move clients/SDKs to the typed canonical response and remove stale assumptions.

### Task 4: Normalize money and supported payment policy

**Files:**
- Modify: `apps/api/src/config/money.ts`
- Modify: `apps/api/src/modules/payments/payments.service.ts`
- Modify: `apps/api/src/modules/payments/payments.controller.ts`
- Modify: `apps/api/src/modules/payments/payments.module.ts`
- Modify: `.env.example`
- Test: `apps/api/test/payment-fulfillment.test.ts`

**Interfaces:**
- Restricts checkout and webhook provider IDs to Paystack, Paddle, NOWPayments, Flutterwave, and Korapay.
- Returns `usdCents` in public money DTOs and accepts integer minor units only.

- [ ] Test payment creation, missing credentials, duplicate webhook, failure, fulfillment, and reversal handling.
- [ ] Remove outdated provider branches/adapter imports and align environment variable names with required paths.

### Task 5: Add durable verification and connectivity lifecycles

**Files:**
- Create: `apps/api/src/modules/verification/*`
- Create: `apps/api/src/modules/connectivity/*`
- Modify: `apps/api/src/modules/integrations/*`
- Modify: `apps/api/src/database/entities/extended-entities.ts`
- Modify: `apps/api/src/modules/webhooks/*`
- Test: `apps/api/test/verification-lifecycle.test.ts`
- Test: `apps/api/test/connectivity-lifecycle.test.ts`

**Interfaces:**
- Produces verification catalog/order state machine, eSIM order records, proxy order/credential records, VPN device/session records, and provider event transitions.
- Uses wallet locks and first-party IDs before provider operations.

- [ ] Test valid and invalid state transitions, ownership, expiry/cancel/refund, and unavailable-provider behavior.
- [ ] Encrypt provider-delivered proxy/VPN secrets at rest; do not return private keys or provider secrets in logs.

### Task 6: Complete developer API access and webhooks

**Files:**
- Create: `apps/api/src/modules/api-platform/api-key.guard.ts`
- Create: `apps/api/src/modules/api-platform/webhook-delivery.service.ts`
- Modify: `apps/api/src/modules/api-platform/*`
- Modify: `packages/sdk/js/src/index.ts`
- Modify: `packages/sdk/python/burnerpoint/__init__.py`
- Test: `apps/api/test/api-platform.test.ts`

**Interfaces:**
- Produces scoped API-key authentication separate from JWT/internal keys.
- Produces persistent signed outbound webhook delivery attempts, retry status, and manual retry.

- [ ] Test one-time key output, hashed storage, scope denial, revocation, rotation, signing, retries, and user/workspace isolation.

### Task 7: Secure realtime and remove retired providers

**Files:**
- Modify: `apps/api/src/modules/gateway/*`
- Modify: `apps/api/src/modules/global/provider.service.ts`
- Modify: `apps/api/src/modules/platform/*`
- Modify: `apps/api/src/modules/integrations/integration-registry.ts`
- Modify: `apps/api/src/modules/webhooks/*`
- Modify: `apps/web/src/lib/trusted-platforms.tsx`
- Modify: `README.md`
- Modify: `.env.example`
- Test: `apps/api/test/realtime-authorization.test.ts`

**Interfaces:**
- Emits private user-room events only after authenticated room binding.
- Leaves no Tremil, Squad, OPay, Stripe, or PayPal production provider branch, route, environment variable, UI entry, or registry entry.

- [ ] Test room authorization and provider webhook validation.
- [ ] Use a Socket.IO Redis adapter only when Redis configuration is present and fail clearly when a multi-node deployment requires it.

### Task 8: Repair deployment and verify the integrated system

**Files:**
- Modify: `apps/web/next.config.js`
- Modify: `apps/web/Dockerfile`
- Modify: `docker-compose.yml`
- Modify: `railway.json`
- Modify: `apps/api/railway.toml`
- Modify: `README.md`
- Test: `apps/api/test/runtime-env.test.ts`

**Interfaces:**
- Produces a Next standalone image, explicit API build context, and an API migration command that runs Supabase SQL rather than TypeORM migrations.

- [ ] Add production-build configuration tests where tooling permits.
- [ ] Run focused API tests, API build/type check, web build/type check, mobile type check, and repository-wide unsupported-provider searches.
- [ ] Record only commands actually executed and external credential/dashboard actions still required.
