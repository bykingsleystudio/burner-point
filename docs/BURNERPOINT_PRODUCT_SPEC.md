# BurnerPoint Product Specification And Implementation Roadmap

## Purpose

This document defines the product, design, and implementation scope for BurnerPoint across web, mobile, and backend surfaces. It is grounded in the current monorepo as of April 9, 2026, including:

- `apps/api` for the NestJS backend
- `apps/web` for the Next.js website and dashboard
- `apps/mobile` for the Expo mobile app
- `packages/shared` for shared types

## Important Assumption

The prompt references uploaded landing-page design documents. Those files are not available inside this workspace, so this specification uses the current BurnerPoint brand system already present in the repo:

- Deep black background
- Neon green primary accent
- Space Grotesk for headings
- DM Mono / monospace for numbers, balances, and OTPs
- Privacy-first telecom positioning

Before final visual polish, the landing page and marketing system should be reconciled against the external design reference you mentioned.

## Product Positioning

BurnerPoint is a privacy-first telecommunications platform for individuals, operators, creators, and enterprises who need:

- Temporary or renewable phone numbers
- OTP and verification flows
- SMS, MMS, calls, voicemail, and inbox management
- Credits, rentals, and subscription billing
- Privacy infrastructure such as eSIM, proxies, and VPN
- Developer tooling for automation and integrations

## Product Principles

- Privacy first: protect the real identity and real phone number of the user.
- Telecom clarity: show line status, carrier-like states, delivery states, and billing states clearly.
- Trust through visibility: surface logs, histories, statuses, webhook results, and verification timestamps.
- Fast path for common tasks: get number, receive OTP, renew line, add credits, contact support.
- Cohesive multi-platform UX: web is control center, mobile is operational companion.
- Dark, premium, technical aesthetic: neon green is the primary action color, never decorative noise.

## User Roles And Access Model

- Guest
  - Can browse landing, pricing, FAQ, blog, about, contact
  - Can begin registration and login
- Authenticated User
  - Can manage own numbers, inbox, verifications, rentals, credits, billing, support, settings, API keys
- Enterprise User
  - All authenticated capabilities plus workspace, team, role, and shared billing features
- Admin
  - Platform oversight, user moderation, credits adjustment, abuse events, AI status, operational analytics

## Cross-Platform Experience Model

- Web
  - Primary for discovery, onboarding, billing, number search, inbox power usage, API tools, support, admin-style control
- Mobile
  - Primary for quick actions, OTP receipt, active number monitoring, call control, credits, notifications, inbox triage
- Backend
  - Canonical source for auth, number provisioning, provider integrations, payment initiation, webhooks, rate limiting, audit data

## Shared Design System

### Color

- Primary background: `#0A0A0A`
- Secondary surfaces: `#111111`, `#1A1A1A`
- Border: `#2A2A2A`
- Primary accent: `#00FF9D`
- Accent hover / emphasis: `#39FF14`
- Danger: use muted red, never bright brand-red takeover
- Info and beta states: blue, yellow, and violet can appear as secondary utility colors only

### Typography

- Headings: Space Grotesk
- Data and OTP codes: DM Mono or equivalent monospace
- Numbers, balances, timers, OTPs, status pills: monospace treatment for precision

### Interaction Rules

- Primary actions glow subtly with neon green
- Success state is quiet and crisp, not celebratory clutter
- Security-sensitive actions require confirmation sheets or modal reviews
- Empty states should always include one action to recover
- Every operational view needs visible status and last-updated time

## Core Data Domains

### Existing In Repo

- User
- PhoneNumber
- Message
- Call
- WalletTransaction
- PaymentSession
- PhoneOtpSession
- CreditPackage
- ApiKey
- DeveloperWebhook
- Workspace
- WorkspaceMember
- AuditLog
- Referral
- AbuseEvent
- WebhookDedup

### Required Additions For Full Product Scope

- Contact
- ConversationThread
- VerificationCatalogService
- VerificationAttempt
- RentalOrder
- RentalRenewalEvent
- ESIMPlan
- ESIMPurchase
- ESIMUsageSnapshot
- ProxyPlan
- ProxyAllocation
- VPNServer
- VPNSession
- SupportTicket
- SupportMessage
- NotificationPreference
- DeviceSession
- OAuthIdentity
- TermsAcceptance
- PasswordResetToken
- TwoFactorBackupCode
- BlogPost

## Canonical API Strategy

- Frontend calls BurnerPoint backend only
- Backend talks to Twilio, Telnyx, Paddle, Flutterwave, Paystack, Korapay, OPay, NOWPayments, OpenAI, SMTP, Telegram
- WebSocket channel supports real-time events for messages, calls, verification, ticket updates, and billing updates
- All provider webhooks must land on `/api/...` public routes in production

## Feature Specification

### 1. Landing Page

**Purpose**

Convert visitors into authenticated users, buyers, and app downloads while establishing trust in privacy telecom services.

**Status**

- Exists in `apps/web/src/app/page.tsx`
- Needs refinement to match the referenced “final” landing design

**Primary User Flows**

- Visitor lands on homepage and understands value proposition in under 5 seconds
- Visitor compares verification, rental, and subscription pricing
- Visitor checks FAQ, trust signals, and testimonials
- Visitor chooses web signup or downloads mobile app

**Key Screens And Components**

- Hero section
  - Headline
  - Supporting copy
  - Primary CTA: Get Started
  - Secondary CTA: View Pricing or Learn More
  - Product preview mockup for inbox, OTP receipt, and active numbers
- Feature showcase
  - Verification
  - Rentals
  - Inbox and calling
  - API and developer use cases
- Pricing section
  - Verification credits
  - Short rentals
  - Renewable rentals / subscription
- FAQ accordion
- Testimonials / trust carousel
- Download CTA block
  - iOS
  - Android
  - Web app
- Footer
  - Brand logo
  - Product links
  - Company links
  - Legal links

**Required Data / CMS Inputs**

- Marketing hero copy
- Feature cards
- Pricing plans
- FAQ items
- Testimonials
- Store links
- Legal links

**API / Integration Needs**

- Public pricing endpoint or CMS config feed
- Blog preview feed
- Contact capture or waitlist endpoint
- Analytics events for CTA clicks

**Permissions / Security**

- Public
- Protect forms with anti-bot measures

**Design Notes**

- Use cinematic black-to-green gradients and glass-dark cards
- Product mockups should show real BurnerPoint UI patterns, not generic SaaS art
- Neon green should emphasize CTA, highlights, and telemetry markers

**Mobile Adaptation**

- Collapse hero into stacked card layout
- Use sticky download CTA at bottom
- Pricing cards become horizontal snap carousel

### 2. Authentication And Onboarding

**Purpose**

Create low-friction but high-trust account entry with strong recovery and verification paths.

**Status**

- Email/password exists
- Twilio Verify phone flow exists
- OAuth, forgot password, Apple, Microsoft, terms acceptance, and full 2FA setup are not complete

**Primary User Flows**

- Register with email and password
- Register with Google, Apple, or Microsoft
- Acknowledge terms and privacy policy
- Verify phone by OTP
- Set up 2FA
- Log in
- Recover forgotten password
- Reset password
- Add backup recovery methods

**Key Screens And Components**

- Login
- Registration
- Terms acknowledgment
- OAuth chooser
- Phone verification
- 2FA enrollment
- Recovery codes download
- Forgot password
- Reset password
- Device trust prompt

**Core Data**

- User
- OAuthIdentity
- PhoneOtpSession
- TermsAcceptance
- DeviceSession
- PasswordResetToken
- TwoFactorMethod
- TwoFactorBackupCode

**API Endpoints**

- Existing
  - `POST /auth/register`
  - `POST /auth/login`
  - `POST /auth/refresh`
  - `POST /auth/logout`
  - `POST /phone-auth/send`
  - `POST /phone-auth/verify`
- Needed
  - `POST /auth/oauth/google`
  - `POST /auth/oauth/apple`
  - `POST /auth/oauth/microsoft`
  - `POST /auth/forgot-password`
  - `POST /auth/reset-password`
  - `POST /auth/2fa/setup`
  - `POST /auth/2fa/verify`
  - `POST /auth/2fa/disable`
  - `POST /auth/terms/accept`

**Permissions / Security**

- Rate-limit login, reset, and OTP
- Require step-up verification for password change and payout-sensitive actions
- Never expose provider secrets to client
- Record IP, device, and consent timestamps

**Design Notes**

- Avoid intimidating security language; frame it as protection and control
- OTP views should favor mono typography and countdown timer
- Terms acceptance must be explicit, not buried

**Mobile Adaptation**

- Phone-first auth should be the default fast path
- Biometric unlock after first successful login
- Use OS-native autofill and OTP autofetch where available

### 3. Dashboard

**Purpose**

Give the user a clear operational snapshot of lines, activity, balance, and risk.

**Status**

- Exists in web and mobile in simplified form

**Primary User Flows**

- Review active numbers and expiry
- Check wallet balance and usage
- Jump to inbox, verification, renewal, and top-up actions
- Monitor alerts and support responses

**Key Screens And Components**

- Wallet balance card
- Active numbers summary
- Messages received summary
- Active verifications summary
- Expiring soon panel
- Quick actions
- Notification center
- Trust and uptime panel

**Core Data**

- User
- PhoneNumber
- WalletTransaction
- Notification
- VerificationAttempt

**API Endpoints**

- Existing
  - `GET /users/me`
  - `GET /users/me/wallet`
  - `GET /numbers`
- Needed
  - `GET /dashboard/overview`
  - `GET /notifications`

**Permissions / Security**

- Authenticated
- Enterprise users can switch workspace context

**Design Notes**

- Use dense but calm telemetry layout
- Each card needs primary metric, secondary context, and direct action

**Mobile Adaptation**

- Keep to 4-6 tiles max above the fold
- Emphasize quick actions and current line status

### 4. Inbox

**Purpose**

Provide a unified communications console for SMS, MMS, calls, voicemail, and contact context.

**Status**

- Inbox surfaces exist
- Realtime message and incoming call events exist
- Full conversation model, media composer, and contacts still need expansion

**Primary User Flows**

- Open a number’s conversation thread
- Read inbound SMS and extracted OTPs
- Send SMS or MMS
- Receive incoming call alert
- Review call history
- Play voicemail
- Save contact metadata

**Key Screens And Components**

- Thread list
- Conversation thread
- Composer with text, attachments, and templates
- Contact profile drawer
- Call history list
- Voicemail player
- Media gallery
- Spam / AI labeling state

**Core Data**

- Message
- Call
- Contact
- PhoneNumber
- MediaAttachment
- VoicemailAsset

**API Endpoints**

- Existing or implied
  - `GET /messages`
  - `POST /messages`
  - Twilio webhook routes for SMS, voice, status, recording
- Needed
  - `GET /calls`
  - `GET /voicemail`
  - `POST /contacts`
  - `PATCH /messages/:id/read`
  - `POST /messages/media`

**Realtime**

- Existing websocket events
  - `message.received`
  - `call.incoming`
- Needed
  - `call.updated`
  - `voicemail.ready`
  - `message.status.updated`

**Permissions / Security**

- Authenticated
- Strict per-number ownership validation
- Media upload virus / file-type validation
- Message retention controls configurable per account tier

**Design Notes**

- OTPs should be visually elevated without overwhelming normal message content
- Voicemail and call status should feel telecom-native, not chat-only

**Mobile Adaptation**

- Native-feeling thread UX
- Swipe actions for archive, copy OTP, mark spam, call back
- Full-screen call UI and voicemail sheet

### 5. Verification

**Purpose**

Make OTP acquisition and service verification the fastest path in the product.

**Status**

- OTP send/verify endpoints exist
- Full “900+ services” catalog and verification tracking model still need productization

**Primary User Flows**

- Browse or search service catalog
- Start a verification using a selected number
- Receive OTP by SMS or voice
- Copy OTP and mark verification complete
- Review verification history

**Key Screens And Components**

- Service catalog
- Verification launcher
- Active verification queue
- OTP receipt panel
- History and logs
- Recommended numbers by region/service

**Core Data**

- VerificationCatalogService
- VerificationAttempt
- PhoneOtpSession
- Message
- Call

**API Endpoints**

- Existing foundation
  - `POST /phone-auth/send`
  - `POST /phone-auth/verify`
- Needed
  - `GET /verification/services`
  - `POST /verification/start`
  - `GET /verification/active`
  - `GET /verification/history`
  - `POST /verification/:id/cancel`

**Permissions / Security**

- Authenticated
- Abuse throttles are critical here
- Service and geography restrictions must be enforced server-side

**Design Notes**

- Treat active verifications like jobs with states: queued, awaiting code, code received, expired, completed
- Use mono OTP chips with one-tap copy

**Mobile Adaptation**

- Bottom-sheet verification launch
- Push notifications when OTP arrives

### 6. Rentals

**Purpose**

Support short-term and renewable number rentals with billing clarity and expiry control.

**Status**

- Number provisioning and renewal exist
- Dedicated rental commerce experience is partial

**Primary User Flows**

- Search rental numbers
- Choose duration and renewal type
- Purchase
- View active rental
- Renew before expiry
- Track overdue or released lines

**Key Screens And Components**

- Rental marketplace
- Duration selector
- Price estimator
- Active rentals table
- Renewal center
- Billing history

**Core Data**

- PhoneNumber
- RentalOrder
- WalletTransaction
- PaymentSession
- RenewalEvent

**API Endpoints**

- Existing foundation
  - `GET /numbers/search`
  - `POST /numbers/provision`
  - `POST /numbers/:id/renew`
  - `DELETE /numbers/:id`
- Needed
  - `GET /rentals`
  - `GET /rentals/history`
  - `POST /rentals/:id/set-auto-renew`

**Permissions / Security**

- Authenticated
- Ownership checks on renew/release
- Renewal reminders by notification and email

**Design Notes**

- Expiry should be highly legible
- Use warning amber before hard-expire red

**Mobile Adaptation**

- Emphasize “expiring soon” cards
- Quick renew from push notification deep link

### 7. Numbers

**Purpose**

Give users a central library for all purchased and provisioned numbers.

**Status**

- Web and mobile number views exist in simplified form

**Primary User Flows**

- Browse owned numbers
- Filter by status, country, provider, type
- Search by number or label
- Open inbox for a line
- Renew, release, or copy number

**Key Screens And Components**

- Number list and filters
- Number detail drawer
- Usage stats
- Tags and labels
- Ownership and provider metadata

**Core Data**

- PhoneNumber
- Message aggregates
- Call aggregates
- Renewal metadata

**API Endpoints**

- Existing
  - `GET /numbers`
  - `GET /numbers/search`
  - `POST /numbers/provision`
  - `POST /numbers/:id/renew`
  - `DELETE /numbers/:id`

**Permissions / Security**

- Authenticated
- Enterprise workspace scoping where applicable

**Design Notes**

- Number should be the main visual anchor
- Use metadata sublines for country, provider, type, and expiry

### 8. eSIM

**Purpose**

Extend BurnerPoint from virtual identity protection into mobile connectivity.

**Status**

- Placeholder route exists in web
- Product and backend are not yet implemented

**Primary User Flows**

- Browse data plans by country and region
- Purchase eSIM plan
- Install eSIM using QR or deep link
- Track usage and renewal
- Manage active and expired plans

**Key Screens And Components**

- Plan catalog
- Coverage map
- Purchase flow
- Installation instructions
- QR display
- Usage meter
- Active eSIM card

**Core Data**

- ESIMPlan
- ESIMPurchase
- ESIMUsageSnapshot
- DeviceBinding

**API Endpoints Needed**

- `GET /esim/plans`
- `POST /esim/purchase`
- `GET /esim/active`
- `GET /esim/:id/usage`
- `POST /esim/:id/recharge`

**Permissions / Security**

- Authenticated
- Strong billing validation
- Regional compliance and refund policy rules

**Design Notes**

- Make carrier concepts understandable for non-technical users
- Installation help should be visual and stepwise

**Mobile Adaptation**

- Prefer deep links into device settings where platform permits
- QR install handoff to another device if needed

### 9. Proxies

**Purpose**

Sell and manage privacy connectivity options that complement BurnerPoint numbers.

**Status**

- Placeholder route exists in web
- Full product model not implemented

**Primary User Flows**

- Browse proxy types
- Purchase residential / mobile / datacenter proxy
- View active allocations
- Rotate credentials
- Toggle IP replacement or sticky session

**Key Screens And Components**

- Product comparison table
- Region and provider selector
- Active proxy list
- Credentials panel
- SOCKS5 / HTTP instructions
- Rotation controls

**Core Data**

- ProxyPlan
- ProxyAllocation
- ProxyCredential
- RegionNode

**API Endpoints Needed**

- `GET /proxies/plans`
- `POST /proxies/purchase`
- `GET /proxies/allocations`
- `POST /proxies/:id/rotate`
- `POST /proxies/:id/revoke`

**Permissions / Security**

- Authenticated
- Secrets shown once or behind re-auth
- Usage logging kept minimal and policy-aligned

**Design Notes**

- Treat credentials as sensitive material
- Show copy buttons, masked values, and protocol tags clearly

### 10. VPN

**Purpose**

Provide lightweight privacy connectivity and routing from the same account.

**Status**

- Placeholder route exists in web
- Not yet implemented end to end

**Primary User Flows**

- View available VPN regions
- Connect or disconnect
- See latency and status
- Choose protocol or auto mode

**Key Screens And Components**

- Connection card
- Server list
- Connection status indicator
- Traffic and session timer
- Quick-connect button

**Core Data**

- VPNServer
- VPNSession
- DeviceSession

**API Endpoints Needed**

- `GET /vpn/servers`
- `POST /vpn/connect`
- `POST /vpn/disconnect`
- `GET /vpn/session`

**Permissions / Security**

- Authenticated
- Re-auth for downloading client configs
- Session secrets never stored insecurely on device

**Design Notes**

- Keep VPN status obvious and honest
- Avoid fake “protected” language if not fully connected

### 11. Credits And Billing

**Purpose**

Handle all prepaid and subscription economics with transparency and local-market flexibility.

**Status**

- Strong backend foundation exists
- Web credits page exists
- Needs richer transaction UX and discount tier strategy

**Primary User Flows**

- View wallet balance
- Buy credits
- Choose gateway
- Review transaction history
- See pricing tiers and promos
- Download invoice or receipt

**Key Screens And Components**

- Wallet balance hero
- Credit package grid
- Gateway chooser
- Checkout redirect confirmation
- Billing history table
- Discounts and tier explainer

**Core Data**

- CreditPackage
- WalletTransaction
- PaymentSession
- SubscriptionPlan
- UserSubscription

**API Endpoints**

- Existing
  - `GET /payments/packages`
  - `POST /payments/initialize`
  - `GET /payments/history`
  - `/payments/webhook/*`
  - `POST /paddle/checkout`
  - `GET /paddle/subscription`
  - `POST /paddle/subscription/cancel`

**Permissions / Security**

- Authenticated for purchases and history
- Webhooks verified by signature
- Idempotent fulfillment required

**Design Notes**

- Pricing must support NGN-first local clarity and USD/international fallback
- Receipts should show gateway, reference, timestamp, and applied credits

**Mobile Adaptation**

- Open checkout in trusted webview/browser handoff
- Persist pending payment state when app resumes

### 12. Support

**Purpose**

Reduce churn and operational frustration with visible help channels and trackable ticket states.

**Status**

- Placeholder route exists in web
- Backend ticketing not yet implemented

**Primary User Flows**

- Create support ticket
- Attach screenshots or references
- Track open and closed tickets
- Receive Telegram or email notification on updates
- Escalate billing or telecom incident

**Key Screens And Components**

- Ticket inbox
- New ticket form
- Ticket detail thread
- Status filter
- Telegram connect prompt
- SLA / response expectation panel

**Core Data**

- SupportTicket
- SupportMessage
- Attachment
- NotificationPreference

**API Endpoints Needed**

- `GET /support/tickets`
- `POST /support/tickets`
- `GET /support/tickets/:id`
- `POST /support/tickets/:id/messages`
- `POST /support/telegram/link`

**Permissions / Security**

- Authenticated
- Ticket attachments virus-scanned
- Redact secrets in logs and agent console views

**Design Notes**

- Use calm, human language
- Show status clearly: open, waiting on user, in progress, resolved

### 13. Settings And Profile

**Purpose**

Give users control over identity, security, notifications, preferences, and account lifecycle.

**Status**

- Partial profile and auth foundations exist
- Full settings center needs expansion

**Primary User Flows**

- Edit name, timezone, and locale
- Change password
- Enable or disable 2FA
- Configure notifications
- Manage devices and sessions
- Delete account
- Manage API access and preferences

**Key Screens And Components**

- Profile form
- Security settings
- Notification preferences
- Devices and sessions
- Data export and delete account
- Legal acknowledgments

**Core Data**

- User
- DeviceSession
- NotificationPreference
- TermsAcceptance

**API Endpoints**

- Existing
  - `GET /users/me`
  - `DELETE /users/me`
- Needed
  - `PATCH /users/me`
  - `GET /users/me/sessions`
  - `DELETE /users/me/sessions/:id`
  - `GET /users/me/preferences`
  - `PATCH /users/me/preferences`

**Permissions / Security**

- Authenticated
- Re-auth required for delete account, password reset, and key reveal

**Design Notes**

- Security actions should be grouped separately from appearance/preferences
- Dangerous actions belong in a dedicated danger zone panel

### 14. Additional Pages: Blog, About, Contact

**Purpose**

Support brand credibility, SEO, inbound acquisition, and direct contact.

**Status**

- Terms and privacy docs exist in `docs/`
- Dedicated blog/about/contact page system not built yet

**Primary User Flows**

- Read company story
- Explore updates and educational content
- Contact sales or support
- Discover compliance, privacy, and use-policy material

**Key Screens And Components**

- Blog index
- Blog article page
- About page
- Contact form
- Press / trust section

**Core Data**

- BlogPost
- BlogCategory
- ContactSubmission

**API Endpoints Needed**

- `GET /content/blog`
- `GET /content/blog/:slug`
- `POST /contact`

**Permissions / Security**

- Public read
- Contact form rate-limited and spam-protected

**Design Notes**

- Marketing pages should feel polished, not dashboard-derived
- Reuse brand but loosen density and increase narrative whitespace

### 15. API And Developer Tools

**Purpose**

Turn BurnerPoint into a programmable telecom platform with secure automation.

**Status**

- API key and developer webhook backend exists
- Web route exists
- Needs better testing, docs UX, and event visibility

**Primary User Flows**

- Create API key
- Copy key once
- Revoke key
- Register webhook
- Test webhook delivery
- View event history and failures

**Key Screens And Components**

- API overview
- Key management table
- Create-key modal
- Webhook registry
- Delivery logs
- Endpoint explorer / docs
- Code examples for JS, Python, curl

**Core Data**

- ApiKey
- DeveloperWebhook
- WebhookDeliveryAttempt

**API Endpoints**

- Existing
  - `POST /developer/keys`
  - `GET /developer/keys`
  - `POST /developer/webhooks`
  - `GET /developer/webhooks`
  - `DELETE /developer/webhooks/:id`
- Needed
  - `DELETE /developer/keys/:id`
  - `POST /developer/webhooks/:id/test`
  - `GET /developer/webhooks/:id/deliveries`

**Permissions / Security**

- Authenticated
- Keys displayed raw exactly once
- Delivery payloads should redact secrets
- Re-auth for sensitive actions

**Design Notes**

- This area should feel more technical and operator-grade
- Include event schemas, signature instructions, and sample payloads

## Mobile Versus Web Strategy

### Web Is Best For

- Search-heavy number discovery
- Pricing comparison
- Inbox power usage
- Billing and transaction history
- Support threads
- Developer tooling and API docs
- Enterprise workspace administration

### Mobile Is Best For

- OTP receipt and copy
- Quick number checks
- Renewals and top-ups
- Incoming call handling
- Push-driven action loops
- Support notifications

## Security And Compliance Requirements

- JWT access tokens with short TTL
- Refresh token revocation through Redis
- Step-up auth for sensitive actions
- Audit logs for enterprise and admin activity
- Webhook signature validation for all providers
- Abuse rate limits on auth, verification, and purchase flows
- Least-privilege API key scopes
- Consent records for terms and privacy acceptance
- Data retention settings by feature domain
- Explicit telecom compliance checklist for A2P, emergency address, identity verification, and country restrictions

## Recommended Information Architecture

### Marketing

- `/`
- `/pricing`
- `/about`
- `/blog`
- `/contact`
- `/download`
- `/faq`

### Auth

- `/auth/login`
- `/auth/register`
- `/auth/forgot-password`
- `/auth/reset-password`
- `/auth/2fa`
- `/auth/terms`

### App

- `/dashboard`
- `/dashboard/inbox`
- `/dashboard/numbers`
- `/dashboard/calls`
- `/dashboard/voicemail`
- `/dashboard/verification`
- `/dashboard/rentals`
- `/dashboard/esim`
- `/dashboard/proxies`
- `/dashboard/vpn`
- `/dashboard/credits`
- `/dashboard/support`
- `/dashboard/settings`
- `/dashboard/api`

## Current Repo Coverage Summary

### Present And Usable Foundation

- Auth core
- Phone OTP foundation
- Number search and provisioning foundation
- Webhook ingestion for Twilio and payments
- Billing and payment integrations
- Web dashboard shell
- Mobile dashboard shell
- Realtime inbound events
- API key and developer webhook base

### Present But Incomplete

- Landing page polish
- Inbox depth
- Verification catalog
- Rental commerce UX
- Support workflows
- Settings completeness
- API docs UX

### Planned / Missing

- OAuth suite
- Password reset
- Full 2FA settings
- eSIM commerce
- Proxies product
- VPN product
- Blog/about/contact CMS
- Enterprise admin UX

## Implementation Roadmap

### Phase 1: Go-Live Core

- Finalize landing page against approved design reference
- Finish auth basics, terms, and session management
- Stabilize number purchase, renew, release
- Complete credits purchase and receipts
- Harden Twilio and payment webhooks
- Build dashboard overview and numbers views

### Phase 2: Communications Core

- Complete inbox threads, send SMS, MMS support, call history, voicemail player
- Add contacts and message search
- Add active verification center
- Add notification center and push events

### Phase 3: Trust And Retention

- Add forgot password, reset password, 2FA setup, backup codes
- Add support tickets and Telegram bridge
- Add device/session management
- Add export and delete-account UX

### Phase 4: Developer And Enterprise

- Upgrade developer portal with delivery logs and webhook testing
- Expand workspace and RBAC controls
- Add audit log UI
- Add organization billing and seat management

### Phase 5: Expansion Products

- Launch eSIM
- Launch proxies
- Launch VPN
- Expand service catalog for verification marketplace

## Delivery Recommendations

- Treat web dashboard and mobile app as a shared product system, not separate projects
- Keep provider-specific complexity inside backend adapters
- Introduce typed domain contracts in `packages/shared` for every new product area
- Prefer feature flags for eSIM, proxies, and VPN until operational readiness exists
- Add a lightweight content layer for landing, blog, pricing, and FAQ instead of hardcoding marketing copy

## Final Product Direction

Yes, the BurnerPoint vision is coherent for a telecom, privacy, and verification company. The repo already supports that direction technically. The main gap is not product identity; it is moving from strong foundations into a more complete, production-grade experience across onboarding, inbox depth, developer tooling, support, and expansion products.
