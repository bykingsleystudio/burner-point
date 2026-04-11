# Burner Point Production Technical Architecture

Created: 2026-04-11

## Purpose

This document defines the production architecture for Burner Point as a telecom, privacy, and fintech platform. It is architecture-only: it describes system boundaries, provider responsibilities, data ownership, routing decisions, risk controls, and deployment topology. It does not prescribe code changes, migrations, or implementation steps.

The final stack direction is:

- Source control and CI: GitHub
- Web frontend: Vercel + Next.js
- Mobile app: Expo + React Native
- API and workers: Railway + NestJS
- Database: Neon Postgres
- Cache, queues, and routing state: Redis
- Auth: Clerk
- Email: Resend
- Communications: Twilio, Bandwidth, Vonage, Infobip
- Payments: Paystack, Paddle, NOWPayments, with Flutterwave deferred
- eSIM: 1GLOBAL
- Proxies: Bright Data
- VPN feature: self-hosted WireGuard
- AI: OpenAI behind an internal non-blocking service wrapper
- Database client: DBeaver
- Monitoring and telemetry: Sentry, BetterStack or Logtail, PostHog

## 1. Platform Overview

Burner Point has two core telecom systems. They share the same user ecosystem, wallet, risk controls, audit layer, billing ledger, support tooling, and developer API, but they must remain operationally separate because they have different provider risks, pricing models, and abuse profiles.

| System | Scope | Geography | Primary user value | Revenue model | Isolation reason |
| --- | --- | --- | --- | --- | --- |
| Conversation Feature | Direct SMS, MMS/photos, voice calls, WebRTC/WiFi/mobile-data calling, voicemail, contacts, conversation threads, call history, renewable and non-renewable rentals | US and Canada only | A private phone-line experience similar to a WiFi/data phone app | Number rental, monthly renewal, usage-sensitive calling and messaging, premium inbox features | Conversation traffic is ongoing and identity-like; it needs long-lived number ownership and stable inbox state |
| Verification Feature | SMS OTP and voice OTP for service verification across a global catalog | 180+ countries, 900+ services target | Fast code delivery without exposing the user's personal number | Per-verification purchase, service/country margin, retry-aware credits | OTP resale is high-risk and must have independent provider routing, throttles, fraud scoring, and provider health controls |

Shared ecosystem:

```text
Users and developers
  -> Web app on Vercel
  -> Expo mobile app
  -> Developer API clients
      -> Railway NestJS API
          -> Clerk identity bridge
          -> Wallet, ledger, support, audit, risk, API keys
          -> Routing engine
              -> Conversation providers: Twilio, Bandwidth, Vonage
              -> Verification providers: Twilio, Infobip, Vonage
              -> Add-ons: 1GLOBAL, Bright Data, WireGuard control plane
              -> Payments: Paystack, Paddle, NOWPayments, later Flutterwave
          -> Redis queues, rate limits, provider health cache
          -> Neon Postgres system of record
          -> S3-compatible object storage
          -> Sentry, BetterStack/Logtail, PostHog
```

The Conversation Feature should not reuse the Verification Feature's global OTP number pool as if it were an inbox pool. Conversation numbers are user-facing, persistent, and support inbound/outbound communication. Verification numbers are short-lived, service-specific, and routed for delivery success, cost, and provider safety.

## 2. Provider Stack

### Conversation System: US/CA

Decision: launch with Twilio, Bandwidth, and Vonage.

| Responsibility | Provider | Rationale |
| --- | --- | --- |
| Primary messaging, MMS/photos, voice, WebRTC, voicemail | Twilio | Twilio provides the broadest early-stage developer surface for messaging, voice, Verify, and browser-based calling. Twilio's Voice JavaScript SDK supports browser-based voice connections, and Programmable Messaging supports SMS/MMS messaging. |
| Number infrastructure for US/CA | Bandwidth | Number ownership and messaging delivery should be abstracted away from the primary messaging engine. Bandwidth is useful as a number and carrier-facing infrastructure layer so Burner Point is not forced to source every long-lived US/CA number from the same vendor that handles application logic. |
| Fallback SMS/voice route | Vonage | Fallback must be a different provider. If Twilio fails, is rate-limited, or pauses an account, retrying on Twilio again is not resilience. Vonage gives Burner Point a second commercial/provider path. |
| Deferred cost optimization | Telnyx | Telnyx is not a launch blocker. Add it only when usage data shows Twilio voice/SMS costs or routing reliability justify the integration. |

Correction: "Fallback Messaging -> Twilio" is invalid. A fallback route that depends on the same provider, same account, same policy exposure, and same outage domain does not reduce risk. It only repeats the same failure. The launch architecture must use Vonage as the independent fallback for conversation traffic, with Bandwidth separating number infrastructure from the Twilio application engine.

Conversation cost controls:

- Track gross margin per number, per user, and per country.
- Separate number rental cost, inbound/outbound SMS, MMS media cost, voice minutes, voicemail storage, and renewal margin.
- Route only real US/CA conversation traffic through this system.
- Apply usage throttles by user, device, IP, destination, payment method, and number.
- Move heavy voice or SIP optimization to Telnyx only after traffic proves a need.

### Verification System: Global OTP

Decision: launch with Twilio, Infobip, and Vonage.

| Route label | Provider | Role | Rationale |
| --- | --- | --- | --- |
| BP Core Verify | Twilio | Primary OTP route | Fast integration and strong early-stage trust for SMS and voice verification. |
| BP Global Route | Infobip | Secondary global delivery | Strong global CPaaS footprint and useful coverage in countries where Twilio delivery or cost is weaker. |
| BP Smart Route | Vonage | Tertiary cost and fallback route | Balances fallback reliability with cost-aware routing and prevents over-dependence on Twilio/Infobip. |
| BP Budget Route | Plivo | Deferred | Useful later for margin optimization, but not a launch dependency. |
| BP Nigeria Local Route | Termii | Deferred | Reserve for +234 delivery improvement if Nigerian carrier filtering or Twilio route cost harms conversion. |

Verification routing must be separate from conversation routing. Example policy:

- US/Canada OTP: start with Twilio if success rate and provider health are acceptable; fallback to Vonage when Twilio degrades.
- India/Pakistan/Africa-sensitive routes: prefer Infobip when delivery history beats Twilio; fallback to Vonage.
- Nigeria: begin with Infobip or Twilio based on measured success and cost; evaluate Termii only when local-route metrics justify it.
- Expensive or high-abuse services: require higher trust score, stricter velocity limits, and lower retry budgets.

### Add-On Features

| Feature | Provider/approach | Integration model | Rationale |
| --- | --- | --- | --- |
| eSIM purchase | 1GLOBAL | Burner Point backend owns plans, orders, entitlement state, activation status, and usage snapshots; 1GLOBAL supplies eSIM/connectivity functions through its Connect API model | Best fit for an embedded telco-style product because 1GLOBAL exposes eSIM, plan, roaming, KYC, and number-porting concepts suitable for a branded platform. |
| Proxies purchase | Bright Data | Burner Point sells and manages proxy plans; Bright Data supplies residential, ISP, datacenter, mobile, and location targeting capability | Bright Data has broad proxy coverage, API/control-panel management, and mobile/residential depth. Burner Point must enforce acceptable-use controls before provisioning. |
| VPN privacy feature | Self-hosted WireGuard | Burner Point runs a VPN control plane and region-based WireGuard servers; app/web surfaces expose toggle, server selection, and session status | WireGuard is the right build choice because VPN is a platform feature, not a resold branded product. This keeps control, cost, and user experience inside Burner Point. |

Partner VPNs such as NordVPN or Proton VPN should be considered only if Burner Point does not want to operate servers. That trade-off reduces operational burden but introduces branding limits, revenue sharing, partner dependency, and less control over session telemetry and abuse response.

## 3. Operational Infrastructure

The following layers are production-critical, not optional.

| Layer | Recommended service | Architecture role |
| --- | --- | --- |
| Error monitoring | Sentry | Captures API exceptions, frontend errors, mobile crashes, worker failures, and provider webhook processing errors. |
| Structured logs and uptime | BetterStack/Logtail or equivalent | Centralizes API/worker logs, webhook traces, provider errors, and uptime alerts. |
| Product analytics | PostHog | Tracks onboarding, verification conversion, payment funnel, support friction, feature adoption, and retention across web/mobile. |
| Queues and background jobs | Redis-backed queues such as BullMQ | Processes provider callbacks, retries, OTP state transitions, webhook fan-out, billing reconciliation, fraud checks, expiry jobs, and notifications. |
| Object storage | S3-compatible storage | Stores MMS media, voicemail recordings, call artifacts where allowed, exports, support attachments, and compliance documents behind signed URLs and retention policies. |
| Audit and event logging | Neon Postgres append-only event tables | Records security-sensitive user actions, provider route attempts, billing events, admin actions, API key usage, and support actions. |
| Fraud and abuse controls | Internal risk engine | Scores users, devices, IPs, payment methods, destination numbers, services, provider failures, and velocity patterns before provisioning or routing. |
| Secrets management | Railway, Vercel, Expo EAS env stores, with documented rotation | Keeps provider keys server-side, separates dev/staging/prod credentials, and prevents frontend exposure of telecom/payment secrets. |

Operational principle: provider webhooks should not perform heavy synchronous work. The webhook layer verifies authenticity, persists the raw event and idempotency key, enqueues processing, and returns quickly.

## 4. Routing Engine Design

The routing engine is the decision layer that chooses a provider for each communication, OTP, payment, add-on provisioning, or fallback action.

Routing inputs:

- Product type: conversation, verification, eSIM, proxy, VPN, billing.
- Country and region: US/CA, Nigeria, Europe, India, Pakistan, global fallback.
- Service target: the platform or verification service being requested.
- Provider health: uptime, recent errors, queue latency, webhook lag, account-limit signals.
- Delivery success rate: rolling success by provider, country, service, number type, and time window.
- Cost: provider cost, retry cost, margin by plan, expected user price.
- Speed: latency to code, call setup time, message delivery time.
- Risk: user trust tier, device history, IP reputation, payment quality, service abuse category.
- Inventory: available numbers, active sender pools, country/service compatibility.

Routing outputs:

- Selected provider and route label.
- Retry plan and fallback order.
- Maximum retry budget.
- Required fraud controls before route execution.
- Event/audit record for later analysis.

Decision framework:

```text
Request enters Burner Point API
  -> Validate auth, entitlement, balance, and terms acceptance
  -> Score fraud risk and apply rate limits
  -> Determine product route family
      -> Conversation US/CA: Twilio primary, Vonage fallback, Bandwidth number source
      -> Verification global: Twilio, Infobip, Vonage based on country/service metrics
      -> eSIM/proxy/VPN: provider-specific allocation through add-on adapters
  -> Check provider health and circuit breakers
  -> Select lowest-risk route that satisfies success, speed, and margin thresholds
  -> Persist route attempt
  -> Dispatch through provider adapter
  -> Receive webhook/callback
  -> Update success metrics, wallet/ledger state, audit log, and user-facing status
```

Retry and fallback strategy:

- Never retry with the same provider as a "fallback" after provider-class failure.
- Retry with the same provider only for transient network or 5xx-class errors within a small retry budget.
- Move to the next provider for policy blocks, account limits, country route degradation, abnormal delivery failures, or provider cooldown.
- Use circuit breakers to pause providers by country/service when failure rates breach thresholds.
- Treat unprocessed webhooks as uncertain state, not failure; reconcile through provider status APIs or delayed jobs.

Rate limiting and abuse prevention must run before routing. The routing engine should deny or challenge high-risk requests before money is spent on provider calls.

## 5. Payment Architecture

### Web Payments

Paystack is the primary web payment gateway for Nigeria-first revenue. It should own the default credit purchase and wallet top-up flow.

Paddle is reserved for international merchant-of-record scenarios, such as subscriptions or software-style billing where global tax handling and card coverage justify the compliance and payout trade-off.

NOWPayments is optional and should be activated only if crypto demand is strategic for the privacy audience. It should not be treated as a core revenue rail until real user demand proves it.

Flutterwave is deferred until core revenue is stable. Introduce it when Paystack failure data, settlement needs, regional expansion, or currency coverage justify additional reconciliation complexity.

Payment architecture rules:

- All checkout initiation happens through Burner Point backend endpoints.
- The frontend never talks directly to payment secrets.
- All webhooks require signature verification and idempotency.
- Wallet credits are ledger entries, not mutable balance-only updates.
- A payment is not final until webhook verification or trusted provider verification confirms it.
- Refunds, chargebacks, crypto confirmations, Paddle subscription state, and Paystack wallet top-ups must land in the same ledger/audit model.

### Mobile Payments

Mobile payment posture must be policy-safe by default.

Apple App Review Guidelines state that apps enabling anonymous/prank phone calls or SMS/MMS can be rejected, and the payment rules around digital purchases are strict. Google Play policy requires Google Play billing for in-app purchases of app features, services, digital content, goods, and virtual currencies unless an exception or enrolled alternative billing program applies.

Burner Point should therefore treat mobile as:

- A signed-in companion app for account access, inbox, active numbers, OTP status, notifications, support, settings, and entitlement consumption.
- A mobile surface that can show existing credits and subscriptions.
- A policy-reviewed product that avoids external payment calls-to-action for digital credits, numbers, subscriptions, or virtual access unless a compliant store billing or approved alternative billing flow is added.

The safest launch posture is web checkout for purchases and mobile entitlement consumption. If store billing is added later, Burner Point must map store purchases into the same wallet/ledger model and keep user-facing pricing and entitlement state consistent.

## 6. Anti-Ban And Fraud Protection Strategy

This product category is high-risk because OTP resale, temporary numbers, proxies, and privacy infrastructure can attract abuse. Provider suspension is an existential risk: if a primary provider suspends Burner Point, onboarding, revenue, and support all degrade immediately.

Core controls:

- Number rotation: rotate verification sender/receiver pools by service, country, provider, and abuse category; do not overuse one number for high-risk services.
- Velocity limits: enforce per-user, per-device, per-IP, per-payment-method, per-destination, per-service, and per-country thresholds.
- Trust tiers: require account age, successful payment history, email/phone verification, 2FA, or manual review before allowing high-risk services or high-volume usage.
- Provider health tracking: track delivery failures, policy rejections, queue lag, webhook delays, account warnings, spend spikes, and country-specific degradation.
- Abuse event capture: record suspicious requests, blocked attempts, repeated OTP failures, chargeback-linked users, proxy/VPN misuse, and admin actions.
- Account suspension prevention: separate high-risk traffic from core conversation traffic, throttle suspicious routes before provider calls, maintain fallback providers, and keep audit evidence for provider reviews.
- Service-level rules: block or restrict services with unusual fraud pressure, chargebacks, or provider complaints.
- Payment risk: hold or delay access for suspicious payment patterns, crypto confirmations, repeated failed cards, or high refund/chargeback risk.

Anti-ban architecture is not a moderation afterthought. It is part of routing, billing, number lifecycle, support, and provider account survival.

## 7. Database And Storage Design

Neon Postgres is the primary system of record. Use DBeaver as the database client for day-to-day inspection and admin work.

Recommended schema organization:

| Schema/domain | Data ownership |
| --- | --- |
| identity | Burner Point user profiles, Clerk mapping, OAuth identities, device sessions, terms/privacy acceptance, 2FA settings, backup codes |
| wallet_billing | Wallet ledger, payment sessions, transactions, subscriptions, refunds, chargebacks, gateway events, credit packages, discount tiers |
| conversation | US/CA phone numbers, rentals, conversation threads, messages, MMS metadata, calls, voicemail, contacts, call history, renewal events |
| verification | Service catalog, country catalog, pricing, verification attempts, code delivery state, route attempts, retry budgets, provider inventory |
| provider_routing | Provider accounts, route labels, provider health snapshots, circuit breakers, cost tables, success-rate aggregates, provider incidents |
| add_ons | eSIM plans/purchases/usage, proxy plans/allocations, VPN servers/sessions, add-on entitlements |
| support | Tickets, support messages, Telegram references, contact-form messages, support attachments |
| developer_platform | API keys, scopes, developer webhooks, webhook deliveries, usage metrics, docs metadata |
| audit | Append-only audit logs, admin actions, risk decisions, security events, policy events |
| event_log | Raw provider webhooks, processed webhook ids, idempotency keys, event payload hashes, processing status |

Storage policy:

- Store raw provider payloads in event logs with sensitive fields redacted or encrypted where necessary.
- Store MMS photos, voicemail recordings, call recordings if allowed, exports, KYC documents if introduced, and support attachments in S3-compatible object storage.
- Reference files by object key, checksum, retention class, access policy, and owning entity in Neon.
- Use signed URLs for private file access.
- Apply retention rules separately for conversation artifacts, support attachments, audit logs, provider events, and analytics events.

Webhook storage:

- Every webhook gets a provider name, event id/reference, payload hash, received timestamp, signature verification result, idempotency state, processing status, and linked internal entity when known.
- Duplicate webhooks return success but do not credit wallets, trigger duplicate retries, or emit duplicate notifications.

## 8. API And Webhook Architecture

API surface groups:

| API group | Responsibility |
| --- | --- |
| Auth and profile | Clerk session bridge, onboarding profile fields, terms/privacy acceptance, 2FA state, device sessions |
| Dashboard | Active numbers, wallet balance, stats, renewals, recent verifications, alerts |
| Conversation | US/CA number search, purchase, renewal, release, inbox threads, SMS/MMS, calls, voicemail, contacts, call history |
| Verification | Service catalog, country pricing, availability, purchase, active attempts, code receive state, voice OTP, history |
| Rentals and numbers | Purchased numbers, filters, search, renewable/non-renewable status, overdue tracking |
| eSIM | Plans, purchase state, activation status, usage snapshots, active eSIMs |
| Proxies | Plans, proxy allocation, active/inactive state, location, mobile/desktop, SOCKS5 options |
| VPN | Server list, session state, toggle status, region selection, usage status |
| Billing | Credit packages, payment initialization, transaction history, subscriptions, discount tiers, refund/chargeback state |
| Support | Ticket creation, ticket messages, open/closed state, email support, Telegram support references |
| Settings | Personal info, notifications, preferences, delete account, API keys, webhook settings |
| Developer API | API key management, scopes, docs metadata, developer webhooks, usage reporting |
| Admin/risk | Abuse events, provider health, user risk state, manual review, provider incidents |

Webhook flows:

| Webhook source | Receiver responsibility |
| --- | --- |
| Twilio messaging/voice/Verify | Validate signature, persist event, enqueue processing, update messages/calls/verifications, update provider health |
| Bandwidth number/messaging events | Validate provider signature model, persist event, update number/message delivery state |
| Vonage messaging/voice/verify events | Validate signature, persist event, update fallback delivery and provider health metrics |
| Infobip OTP/voice events | Validate signature, persist event, update global OTP attempt state and route metrics |
| Paystack | Verify signature, apply idempotency, update payment session and wallet ledger |
| Paddle | Verify signature, apply idempotency, update subscriptions, invoices, entitlements, and ledger |
| NOWPayments | Verify IPN signature/secret, wait for sufficient confirmation status, update ledger only after confirmed states |
| 1GLOBAL | Persist activation/usage/order callbacks, update eSIM entitlement and usage state |
| Bright Data | Persist allocation/status events where available, update proxy entitlement state |
| WireGuard control plane | Internal events only; update VPN server/session health and user session status |

Developer-facing API docs should be organized by product domain, not by provider. Developers should see Burner Point concepts such as verification attempts, numbers, messages, wallet transactions, and webhooks. They should not need to understand Twilio, Infobip, or Vonage-specific payloads.

## 9. Authentication And Security Layers

Clerk is the auth authority for web and mobile sessions.

Auth requirements:

- Account creation requires first name, last name, email, phone number, password or OAuth identity, terms acceptance, and privacy policy acceptance.
- Sign-in supports email or phone number as identifier, plus OAuth with Google, Apple, and Microsoft.
- 2FA supports phone-based and email-based flows; TOTP/backup codes can be added for higher-risk accounts and admins.
- Forgot password and password reset flows must be owned by the auth system and audited.
- Sessions are valid across web and mobile, with device tracking and revocation.

Backend security:

- The API validates Clerk session/JWT state through an internal auth bridge instead of spreading provider-specific auth logic everywhere.
- API keys are hashed at rest, scoped, rate-limited, and shown only once at creation.
- Developer webhooks should be signed with per-endpoint secrets.
- Admin endpoints require higher trust, 2FA, and audit logging.
- Provider secrets remain server-side only.
- Webhook signature verification is mandatory before state mutation.
- Sensitive actions require audit records, including delete account, number release, wallet adjustment, API key creation, provider reroute, and support/admin actions.

Token/session strategy:

- Web uses Clerk-managed browser sessions.
- Mobile uses Clerk/Expo-compatible session persistence and secure device storage.
- Backend issues or maps internal authorization context from the validated Clerk user.
- Short-lived internal claims can be used for API authorization, but the internal user record remains linked to Clerk's canonical identity.

## 10. Deployment And Infrastructure Topology

Recommended launch architecture: modular monolith on Railway, not microservices.

Why modular monolith:

- The product is early-stage and needs fast iteration.
- Shared user, wallet, fraud, provider routing, support, and audit state are tightly coupled.
- Premature microservices would increase deployment, observability, secrets, and debugging overhead.
- Provider adapters and queues can still be cleanly isolated inside the monolith.

Extract separate services only after load or operational ownership proves the need. Candidate future extractions are routing/telecom workers, billing reconciliation workers, VPN control plane, and analytics/event ingestion.

Topology:

```text
GitHub
  -> CI checks and deploy triggers

Vercel
  -> Next.js landing, dashboard, docs, auth pages
  -> Calls Railway API over HTTPS
  -> Public env only for safe frontend config

Expo / EAS
  -> iOS and Android builds
  -> Mobile app consumes Railway API
  -> Push notifications and secure local session storage

Railway
  -> NestJS API
  -> Queue workers
  -> Webhook receivers
  -> Routing engine
  -> Provider adapters
  -> Redis for queues, rate limits, sessions, provider health cache

Neon Postgres
  -> System of record for users, wallet, numbers, OTP, audit, provider events, support, developer API, add-ons

External providers
  -> Clerk for auth
  -> Resend for email
  -> Twilio, Bandwidth, Vonage, Infobip for telecom
  -> Paystack, Paddle, NOWPayments, later Flutterwave for payments
  -> 1GLOBAL for eSIM
  -> Bright Data for proxies
  -> WireGuard servers for VPN sessions
  -> OpenAI for async classification/assistant features
  -> Sentry, BetterStack/Logtail, PostHog for observability and telemetry
```

Environment strategy:

| Environment | Purpose | Data/provider posture |
| --- | --- | --- |
| Development | Local iteration and safe testing | Local/test database, sandbox payment keys, provider test credentials where possible, no production webhooks |
| Staging | Pre-production validation | Separate Neon branch or database, staging Railway/Vercel/Expo builds, sandbox payments, test provider routes, full observability |
| Production | Real users and money | Production Neon database, production provider keys, real webhooks, strict secrets, monitoring alerts, audit retention |

Production constraints:

- Railway API services must be always-on for telecom and payment webhooks.
- Webhooks must not depend on sleeping/free-tier behavior.
- Neon is the database source of truth, not Railway Postgres.
- DBeaver is the selected database client, not TablePlus.
- OpenAI calls are non-blocking and must not drop messages or break OTP/payment flows if unavailable.
- All provider adapters should expose a Burner Point internal model so future provider changes do not rewrite business logic.

## Source References

- [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Payments policy](https://support.google.com/googleplay/android-developer/answer/9858738)
- [Twilio Voice JavaScript SDK](https://www.twilio.com/docs/voice/sdks/javascript)
- [Twilio Programmable Messaging](https://www.twilio.com/docs/messaging)
- [Twilio Verify](https://www.twilio.com/docs/verify)
- [Bandwidth Messaging API docs](https://dev.bandwidth.com/docs/messaging/)
- [1GLOBAL eSIM connectivity page](https://www.1global.com/telco-as-a-service/esim-app)
- [Bright Data proxy types](https://brightdata.com/proxy-types)
- [WireGuard official overview](https://www.wireguard.com/)
