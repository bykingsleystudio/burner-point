# Burner Point North-Star Product and Implementation Plan

This document is the production implementation blueprint for Burner Point across desktop web, mobile web, and native mobile. It is aligned to the current codebase direction, live deployment posture, brand system, and platform architecture.

It is intentionally practical: a beginner can follow it phase by phase, while the decisions remain suitable for a real privacy-first telecom startup.

## Specification Coverage Map

This document covers the requested Burner Point scope end-to-end and maps each requested section into implementation-ready product, UI, backend, security, SEO, and deployment work.

- Section 1: Core product understanding is covered in Product Understanding and Strategy.
- Section 2: Brand identity is covered in Design System and the landing page direction.
- Section 3: Existing product stack is covered in Backend Architecture, Integrations, and Deployment Order.
- Section 4: Required product modules are covered in Information Architecture, Web Page Structure, and Mobile App Structure.
- Section 5: Authentication is covered in Authentication Flow.
- Section 6: Landing page content is covered in Landing Page UX and Content Structure.
- Section 7: Clickable links are covered in Information Architecture and Web Page Structure.
- Section 8: Homepage feature expansion is covered in Landing Page UX and Feature Page Hierarchy.
- Section 9: Blog, updates, careers, FAQ, help, and about content are covered in Web Page Structure.
- Section 10: Desktop web UX is covered in Landing Page UX, Design System, and Quality Bar.
- Section 11: Mobile web UX is covered in Landing Page UX, Design System, and Quality Bar.
- Section 12: Native mobile requirements are covered in Mobile App Screen-by-Screen Structure.
- Section 13: Tokens and components are covered in Design System.
- Section 14: Design review is covered in Quality Bar.
- Section 15: Full product modules are covered in Information Architecture and Implementation Phases.
- Section 16: Twilio OTP is covered in Twilio OTP End-to-End Plan.
- Section 17: Payments are covered in Payment Architecture and Webhook Flow.
- Section 18: Backend integration rules are covered in Backend Architecture and Integrations.
- Section 19: Security is covered in Security Architecture and Audit Checklist.
- Section 20: SEO and indexing are covered in SEO, Indexing, and Discovery.
- Section 21: Deployment targets are covered in Deployment Order and Current External Blockers.
- Section 22: Beginner-friendly execution order is covered in Implementation Phases.

## 1. Product Understanding and Strategy

Burner Point is a privacy-first telecommunications and digital access platform. The core promise is simple:

Private by Design. Stay Anonymous. Stay Connected.

The platform gives users controlled access to communication infrastructure without exposing their personal phone number. It combines temporary numbers, real-SIM-backed verification, US/Canada conversation numbers, eSIM connectivity, proxies, built-in privacy protection, developer APIs, billing, and support.

The product must feel like telecom infrastructure, not a generic SaaS landing page. The emotional signal is controlled power: a dark, secure, premium system for users who care about identity separation and communication control.

### Core Product Pillars

- Privacy control: users can verify, communicate, and register without exposing their real number.
- Telecom reliability: real routes, provider fallbacks, webhook processing, and observable delivery health.
- User simplicity: one dashboard for numbers, messages, calls, verifications, billing, and support.
- Developer utility: API keys, webhooks, docs, and sandbox-ready flows.
- Revenue stability: credits, verification purchases, rentals, subscriptions, and compliant web-first checkout.

### Bounded Systems

- Conversation system: US/Canada only. Handles SMS, MMS, voice, voicemail, WebRTC/WiFi/mobile-data calling, contacts, and conversation history.
- Verification system: global. Handles SMS OTP and voice OTP for many countries and services, isolated from conversation inbox traffic.
- Shared platform: Clerk identity, wallet, billing, risk, audit logs, support, API keys, analytics, and observability.

## 2. Information Architecture

The public site should guide visitors from awareness to trust to action.

### Public Navigation

- `/` landing page
- `/overview`
- `/verifications`
- `/rentals`
- `/api`
- `/api/docs`
- `/pricing`
- `/blog`
- `/updates`
- `/careers`
- `/faq`
- `/help`
- `/about`
- `/contact`
- `/support`
- `/terms`
- `/privacy`
- `/security`
- `/esim`
- `/proxies`
- `/numbers`

### Auth Navigation

- `/auth/login`
- `/auth/signup`
- `/auth/register`
- `/sso-callback`
- `/onboarding`
- `/dashboard`

### Authenticated Navigation

- `/dashboard`
- `/dashboard/inbox`
- `/dashboard/calls`
- `/dashboard/voicemail`
- `/dashboard/verification`
- `/dashboard/rentals`
- `/dashboard/numbers`
- `/dashboard/esim`
- `/dashboard/proxies`
- `/dashboard/vpn`
- `/dashboard/credits`
- `/dashboard/support`
- `/dashboard/api`
- settings/profile route when available

### Global Header Routes

- Logo icon -> `/`
- Sign In -> `/auth/login`
- Get Started -> `/auth/signup`
- Overview -> `/overview`
- Verifications -> `/verifications`
- Rentals -> `/rentals`
- API -> `/api`
- Pricing -> `/pricing`
- Blog -> `/blog`
- FAQ -> `/faq`
- About -> `/about`
- Contact -> `/contact`
- View API Docs -> `/api/docs`

### CTA Route Map

- Learn More -> `/overview`
- View API Docs -> `/api/docs`
- Get Verification -> `/verifications`
- Rent A Number -> `/rentals`
- Start Monthly Plan -> `/pricing`
- Get Your Number -> `/rentals` for public pages, then `/dashboard/numbers` after auth
- View Pricing -> `/pricing`
- Get Your eSIM -> `/esim`
- Get Proxies -> `/proxies`
- See Security -> `/security`

## 3. Web Page-by-Page Structure

### Landing Page

Purpose: conversion and trust.

Hero hierarchy:

- Eyebrow: Private by Design.
- Support line: Stay Anonymous. Stay Connected.
- Main headline: Do not want to give out your phone number? No problem. Use ours.
- Body: Generate secure, non-VoIP numbers instantly and stay in control of your communication anytime, anywhere.
- Trust line: Receive SMS, voice, and OTP verifications from 900+ platforms worldwide.

Hero CTAs:

- Primary: Get Started -> `/auth/signup`
- Secondary: Learn More -> `/overview`
- Utility: View API Docs -> `/api/docs`

Required sections:

- Animated country and number coverage rail with real flag colors and dial codes.
- How it works in four steps.
- Phone numbers and verifications.
- Conversation system for US/Canada calls, SMS, MMS, voicemail, and photo sharing.
- eSIM purchase.
- Proxies purchase.
- Built-in VPN privacy and protection.
- Why Burner Point.
- Pricing cards.
- Developer API preview.
- FAQ preview.
- Final CTA.
- Footer with trust badges, social links, Telegram, email, legal links, and copyright.

Design direction:

- Dark cinematic background using Deep Green and Black.
- Cyber Green primary buttons.
- Neon Green only for subtle signal/glow states.
- Metallic gradient for premium brand text and accents.
- Avoid cluttered gradients and excessive motion.

### Overview

Purpose: explain the product ecosystem.

Sections:

- What Burner Point is.
- Conversation vs Verification distinction.
- Shared wallet, billing, auth, risk, and support layers.
- Use cases: marketplace, dating, business, travel, developer workflows, personal privacy.
- CTA to pricing and signup.

### Verifications

Purpose: sell one-time and repeated OTP delivery.

Sections:

- SMS OTP and voice OTP.
- 900+ service support.
- Country/service selector model.
- Price and availability messaging.
- Active verification lifecycle.
- History and audit trail.
- CTA to create account.

### Rentals

Purpose: sell non-renewable and renewable number access.

Sections:

- Non-renewable rentals at `$5.99+`.
- Renewable rentals at `$15.99+ / month`.
- Rental expiration, grace period, renewal, and release model.
- US/Canada conversation support where applicable.
- CTA to pricing and signup.

### API and API Docs

Purpose: win developers and business buyers.

Sections:

- API overview.
- API key management.
- Number provisioning.
- Verification lifecycle.
- Messaging and callback webhooks.
- Webhook idempotency.
- Sandbox and production notes.
- SDK roadmap.

### Pricing

Purpose: reduce decision friction.

Plans:

- Verification: `$0.99+ / verification`
- Non-renewable rental: `$5.99+ / rental`
- Monthly plan: `$15.99+ / month`

Payment messaging:

- Paystack for primary local web checkout.
- Paddle for international card/subscription scenarios.
- NOWPayments for crypto when strategically enabled.
- Flutterwave, Squad, Korapay, and OPay are secondary gateways after core revenue stability.

### Blog

Five launch posts:

- Why You Should Never Use Your Personal Number Online
- How Burner Numbers Protect Your Identity
- Understanding Non-VoIP Numbers
- Privacy in the Digital Age: Anonymous and Connected
- How Burner Point Handles Secure Communication

Each card needs:

- Category
- Reading time
- Anchor ID
- Summary
- CTA to read

### Updates

Five launch updates:

- New country numbers added.
- API webhook and documentation improvements.
- New eSIM regions.
- New proxy region and durability improvements.
- WiFi and cellular-data communication improvements for US/Canada.

### Careers

Sections:

- Mission: build private communication infrastructure.
- Why work at Burner Point.
- Remote-first opportunities.
- Example roles: product designer, full-stack engineer, telecom integrations engineer, risk/fraud analyst, support operations lead.
- Culture: privacy, craft, reliability, calm execution.

### FAQ

Required topics:

- What burner numbers are.
- How conversation inbox works for US/Canada calls, voicemail, texts, SMS, MMS, and photos.
- How verification works.
- How rentals work.
- Renewable vs non-renewable numbers.
- eSIM.
- Proxies.
- Built-in VPN protection.
- Payments.
- Account setup.
- Refunds and billing.
- Privacy and data handling.

### Help Center

Categories:

- Getting Started
- Verifications
- Rentals
- Payments
- Security
- API / Developer Tools
- Account & Authentication

Article framework:

- Overview
- Before you begin
- Steps
- Troubleshooting
- When to contact support

### About

Core story:

Burner Point exists to give users control over communication without exposing identity. The product serves privacy-conscious individuals, builders, operators, travelers, and businesses that need reliable telecom access with reduced personal exposure.

## 4. Mobile App Screen-by-Screen Structure

Native mobile should feel like an operations console, not a web page squeezed into a phone.

### Navigation

Bottom tabs:

- Dashboard
- Messages
- Verify
- Numbers
- Settings

Secondary routes:

- Calls
- Voicemail
- Rentals
- eSIM
- Proxies
- VPN
- Billing
- Support
- API Keys

### Onboarding

Screens:

- Private by Design.
- Choose what you need: verification, rental, conversation, eSIM, proxies, VPN.
- Create account with Clerk.
- Verify email and phone.
- Set privacy preferences.
- Land in dashboard.

### Dashboard

Cards:

- Active numbers.
- Active verifications.
- Wallet/credits.
- Recent messages.
- VPN status.
- Support status.

### Conversation Inbox

US/Canada only.

Features:

- Conversation threads.
- SMS/MMS.
- Photo sharing.
- Call button.
- Voicemail badge.
- Contact details.
- Message delivery status.

### Calls and Voicemail

Features:

- Dialer or call action.
- Active call screen.
- WiFi/data calling indicator.
- Call history.
- Voicemail playback.
- Missed call status.

### Verification

Flow:

- Select service.
- Select country.
- View price.
- Confirm purchase.
- Receive number.
- Wait for code.
- Display code and history.
- Retry/fallback state.

### Rentals and Numbers

Features:

- Active rentals.
- Expiration timers.
- Renewable vs non-renewable labels.
- Search and filters.
- Renewal CTA.
- Release number action.

### eSIM

Features:

- Plans by country/region.
- Data amount and duration.
- Purchase flow.
- Activation QR or installation instructions.
- Usage tracking.

### Proxies

Features:

- Residential, mobile, datacenter, SOCKS5 options.
- Region selection.
- Active/inactive status.
- Credential display with masked values.
- Rotation controls.

### VPN

Feature positioning:

- Built-in protection inside Burner Point.
- Not sold as a standalone VPN product.

Screen:

- Toggle.
- Server/region selection.
- Status indicator.
- Recent protection activity.

### Billing

Features:

- Balance.
- Add credits.
- Transaction history.
- Payment method entry points.
- Subscription status.

### Support

Features:

- Ticket creation.
- Open/closed tickets.
- Telegram support links.
- Email support.
- Help Center article search.

## 5. Authentication Flow

Clerk is the primary authentication authority.

### Required Sign-Up Fields

- First name.
- Last name.
- Email.
- Phone number.
- Password, unless using OAuth where Clerk handles identity proof.
- Terms acceptance.
- Privacy Policy acceptance.

### Web Sign-Up Flow

1. User lands on `/auth/signup`.
2. Burner Point logo links to `/`.
3. User enters first name, last name, email, phone, password.
4. User accepts Terms and Privacy Policy.
5. User chooses native auth or OAuth.
6. Clerk verifies email and/or phone depending on dashboard settings.
7. App exchanges Clerk identity with Burner Point API context if needed.
8. User lands on `/onboarding` or `/dashboard`.

### Web Sign-In Flow

1. User lands on `/auth/login`.
2. Header says Welcome Back.
3. Logo links to `/`.
4. Identifier accepts email or phone.
5. User enters password or chooses Google, Apple, or Microsoft.
6. Clerk handles session and MFA when enabled.
7. User lands on dashboard.

### Forgot and Reset Password

Use Clerk-owned reset flows for web first. Native mobile should add a dedicated reset-password screen using Clerk Expo APIs.

### 2FA

Support:

- Email code.
- Phone code.
- Optional TOTP for admins and high-risk accounts.

### Rate Limiting

Auth-sensitive endpoints must use:

- 5 attempts per route per 10 to 15 minutes.
- Device/IP scoring.
- Suspicious login flagging.
- Lockout/challenge states.

## 6. Landing Page UX and Content Structure

### Hero Layout

Desktop:

- Left column: messaging and CTAs.
- Right column: animated telecom console with country flags, live-looking number cards, and privacy signals.
- Background: subtle grid, cinematic green radial lighting.

Mobile:

- Single column.
- Main headline first.
- Primary CTA always visible above the fold.
- Country selector becomes a horizontal swipe rail.

### Motion Rules

- Reveal sections with 600 to 850ms ease-out.
- Hover glow increases on primary CTAs.
- Tap/click scale: 0.97.
- Marquee rails pause on hover where possible.
- Respect `prefers-reduced-motion`.

### Country and Region Selector

Required fields:

- Flag.
- Country.
- ISO code.
- Dial code.
- Sample number.
- Use case label.

Example countries:

- US +1.
- CA +1.
- GB +44.
- FR +33.
- DE +49.
- JP +81.
- IN +91.
- NG +234.
- ZA +27.
- BR +55.

## 7. Feature Page Content and Hierarchy

### Phone Number Rentals and Verifications

Message:

Secure access to real mobile numbers for SMS, OTP, voice verification, and US/Canada communication.

Key points:

- Real SIM-backed positioning.
- Non-VoIP value.
- SMS/OTP/voice.
- Conversation feature supports calls, voicemail, text, SMS, MMS, and photo sharing for US/Canada.
- Short-term and renewable rentals.

### eSIM Purchase

Message:

Global connectivity without physical SIM cards.

Key points:

- 1GLOBAL API model.
- Instant activation.
- Travel-ready plans.
- Usage tracking.

### Proxies Purchase

Message:

Privacy-enhanced routing and location control.

Key points:

- Bright Data provider abstraction.
- Residential, mobile, datacenter, SOCKS5.
- Rotation and region controls.

### VPN Privacy and Protection

Message:

Protection built into Burner Point.

Key points:

- WireGuard self-hosted control plane.
- Toggle and status indicator.
- Feature-level protection, not a standalone VPN storefront.

## 8. Design System

### Color Tokens

- `--color-black`: `#000000`
- `--color-deep-green`: `#013220`
- `--color-cyber-green`: `#00FF9D`
- `--color-neon-green`: `#39FF14`
- `--color-metal-start`: `#9FA6B2`
- `--color-metal-end`: `#E5E7EB`
- `--color-card`: `#07140F`
- `--color-border`: `#123425`

### Typography

Preferred typeface:

- Neue Haas Grotesk Display.

Current practical web fallback:

- Space Grotesk for display/UI.
- DM Mono for technical labels.

Implementation note:

If licensed Neue Haas assets are available, self-host them and replace the current Google font stack. Until then, Space Grotesk is an acceptable high-contrast fallback.

### Spacing

Use an 8-point system:

- 4px micro.
- 8px base.
- 16px component padding.
- 24px card spacing.
- 32px section spacing.
- 64px large blocks.
- 96px to 128px hero/section rhythm on desktop.

### Radius

- 8px: small pills and badges.
- 12px: buttons and inputs.
- 16px: cards.
- 24px to 32px: hero panels and high-emphasis surfaces.

### Components

- Primary button: Cyber Green fill, black text, glow.
- Secondary button: dark surface, border, white text.
- Ghost button: transparent, green/white text.
- Inputs: dark background, high contrast labels, 48px minimum height.
- Cards: dark green/black gradients, subtle border, premium shadow.
- Modals: centered, focus-trapped, escape-close, mobile full-screen if needed.
- Accordions: accessible button headers, animated height where safe.
- Pricing cards: plan, price, inclusions, CTA, recommended state.
- Trust badges: short text, icon, link.
- Support widget: email, Telegram, ticket CTA.

### State System

- Loading: pulse or skeleton.
- Empty: explain state and next action.
- Error: clear reason and next step.
- Success: short confirmation and route forward.
- Warning: use Neon Green sparingly for attention, not decoration.

## 9. Backend Architecture and Integrations

### Architecture Style

Launch as a modular monolith on Railway. Keep clear modules and provider adapters. Extract services later only when scale proves the need.

Modules:

- Auth and Clerk exchange.
- Users and profiles.
- Phone auth.
- Conversation.
- Verification.
- Rentals/numbers.
- Provider routing.
- Payments.
- Webhooks.
- Messaging/email.
- AI.
- Risk/fraud.
- Audit/events.
- Support.
- API keys/developer tools.

### Provider Abstraction

Frontend must never call provider APIs directly. The web and mobile apps call Burner Point API only.

Adapters:

- Twilio adapter.
- Vonage adapter.
- Infobip adapter.
- Paystack adapter.
- Flutterwave adapter.
- Squad adapter.
- Korapay adapter.
- OPay adapter.
- Paddle adapter.
- NOWPayments adapter.
- Resend SMTP/email adapter.
- OpenAI service wrapper.
- Future 1GLOBAL adapter.
- Future Bright Data adapter.
- Future WireGuard control-plane adapter.

### Webhook Rules

Every webhook endpoint must:

- Verify signature where provider supports it.
- Store raw payload.
- Use idempotency keys.
- Return quickly.
- Enqueue heavy processing.
- Update domain state in a transaction.
- Log audit events.

## 10. Twilio OTP End-to-End Plan

### Frontend

Form fields:

- Phone number with country code.
- Channel: SMS or voice.
- Code entry.

States:

- Idle.
- Sending.
- Code sent.
- Verifying.
- Verified.
- Failed.
- Rate limited.

Validation:

- Require E.164 phone format.
- Disable repeated submit while pending.
- Show friendly retry timers.

### Backend Endpoints

Recommended:

- `POST /phone-auth/send`
- `POST /phone-auth/verify`

Server-side only:

- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_VERIFY_SERVICE_SID`

### Flow

1. Frontend submits phone to Burner Point API.
2. API validates input and rate limit.
3. API calls Twilio Verify.
4. API stores session metadata.
5. User submits code.
6. API verifies with Twilio.
7. API updates user phone verification state.
8. Clerk/Burner Point auth context is synced.
9. User continues to onboarding or dashboard.

### Abuse Controls

- 5 attempts per 10 to 15 minutes.
- IP and device fingerprint rate limits.
- Phone velocity limit.
- Country risk scoring.
- Provider failure monitoring.

## 11. Payment Architecture and Webhook Flow

### Web Checkout

Primary:

- Paystack.

Strategic:

- Paddle for international merchant-of-record/subscriptions.
- NOWPayments for crypto if product strategy requires it.

Secondary after core stability:

- Flutterwave.
- Squad by GTCO.
- Korapay.
- OPay.

### Mobile Payment Posture

Mobile apps should be account-management and consumption-first unless store-compliant billing is implemented. Apple and Google policies are strict around in-app purchases of digital goods, credits, subscriptions, and virtual access. Use web checkout or store billing where required.

Sources:

- Apple App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Google Play Payments Policy: https://support.google.com/googleplay/android-developer/answer/9858738

### Payment Flow

1. User selects credits, verification, rental, or subscription.
2. Frontend calls Burner Point API.
3. Backend creates payment session.
4. Backend returns checkout URL or gateway session.
5. User pays.
6. Gateway sends webhook.
7. Backend verifies webhook.
8. Backend records transaction.
9. Backend updates wallet/subscription/rental entitlement.
10. User sees updated dashboard state.

### Reconciliation

Required:

- Payment sessions table.
- Wallet transactions.
- Gateway reference.
- Webhook deduplication.
- Manual review state.
- Refund/chargeback state.

## 12. Security Architecture and Audit Checklist

### Non-Negotiables

- Never expose provider secrets in frontend bundles.
- Never commit `.env` files.
- Use environment variables in Railway, Vercel, EAS, Clerk, Sentry, and local ignored files.
- Validate every request body.
- Limit payload sizes.
- Lock down CORS.
- Use HTTPS-only deployed URLs.
- Set secure headers with Helmet or equivalent.
- Hash API keys before storage.
- Verify webhooks.
- Use idempotency for webhooks and payments.
- Add audit logs for sensitive actions.
- Add abuse scoring for telecom actions.
- Add AI kill switch.
- Keep mobile tokens in secure storage.
- Rotate exposed credentials before production.

### Hardcoded Secret Scan

Run before every release:

- Search for `sk_`, `pk_live`, `sk_live`, `AC...`, `re_`, `whsec_`, `Bearer `, and full provider URLs with embedded credentials.
- Confirm only placeholder examples are tracked.
- Confirm `.env`, `.env.local`, `.env.sentry-build-plugin`, and app env files are ignored.

### Sensitive Data

If Burner Point ever handles IDs, licenses, SSNs, or documents:

- Use object storage with private buckets.
- Use signed URLs.
- Encrypt at rest.
- Keep access logs.
- Store only metadata in Postgres.
- Add retention and deletion policies.

## 13. SEO, Indexing, and Discovery

Required:

- Sitemap.
- Robots.
- Google Search Console.
- Bing Webmaster Tools.
- IndexNow if configured.
- Open Graph title, description, image, URL.
- Structured data for organization, software application, FAQ, and article pages where appropriate.
- Canonical URLs.
- Metadata for every public page.

Current improvement included:

- Web metadata now includes favicon icon references and Open Graph basics.

Next SEO tasks:

- Add `app/sitemap.ts`.
- Add `app/robots.ts`.
- Add OG image asset.
- Add per-page metadata from marketing data.
- Add JSON-LD for FAQ and organization.

## 14. Deployment Order

### Phase 1: Local Safety

1. Check `git status -sb`.
2. Confirm ignored secret files are not staged.
3. Run web build.
4. Run API build.
5. Run mobile type check or build lint.
6. Scan for hardcoded secrets.

### Phase 2: GitHub

1. Stage only intended tracked files.
2. Commit with a clear message.
3. Fetch origin.
4. Rebase if needed.
5. Push `main` or open a PR depending on release policy.

### Phase 3: Neon

1. Confirm `DATABASE_URL` points to Neon.
2. Use DBeaver to inspect the target database.
3. Apply migrations only after checking idempotency and backups.
4. Never run destructive SQL blindly.

### Phase 4: Railway

1. Deploy API from `apps/api`.
2. Confirm deployment success.
3. Check `/health`.
4. Inspect logs for boot errors.

### Phase 5: Vercel

1. Deploy web from `apps/web`.
2. Confirm alias to `burnerpoint.vercel.app`.
3. Check HTTP 200.
4. Test auth pages and dashboard.

### Phase 6: Expo Android

1. Run production EAS Android build.
2. Confirm AAB artifact.
3. Upload to Google Play Console.
4. Complete store listing and privacy forms.

### Phase 7: Expo iOS

1. Run interactive Apple credential setup.
2. Complete browser login and 2FA.
3. Validate distribution certificate.
4. Run production iOS build.
5. Upload to TestFlight/App Store Connect.

Commands:

```powershell
cd C:\Users\HP\projects\burner-point\burner-point\apps\mobile
eas credentials:configure-build --platform ios --profile production
eas build --platform ios --profile production
```

## 15. Implementation Phases

### Phase A: Polish the Public Site

- Finalize hero hierarchy.
- Add homepage scrollytelling sections.
- Ensure every CTA route is live.
- Add sitemap and robots.
- Add OG image and structured metadata.
- Improve blog/update/help content depth.

### Phase B: Complete Auth

- Confirm Clerk dashboard has email, phone, password, Google, Apple, and Microsoft enabled.
- Enforce first name, last name, email, phone, Terms, and Privacy.
- Complete forgot/reset password on web and native mobile.
- Add phone verification handling on mobile if Clerk requires phone verification.

### Phase C: Complete Dashboard Core

- Active numbers overview.
- Conversation inbox.
- Verification purchase flow.
- Rentals.
- Billing and transaction history.
- Support tickets.

### Phase D: Provider Integrations

- Stabilize Twilio.
- Add Vonage fallback.
- Add Infobip global routing.
- Add provider health records.
- Add routing rules and circuit breakers.

### Phase E: Billing and Webhooks

- Harden Paystack.
- Complete Paddle subscription model.
- Complete NOWPayments status flow.
- Keep secondary gateways behind feature flags.

### Phase F: Observability and Abuse Controls

- Add Sentry DSNs.
- Add Sentry auth token for source maps only when ready.
- Add PostHog or equivalent.
- Add audit logs.
- Add rate limits.
- Add risk scoring.

### Phase G: Mobile Store Readiness

- Complete native forgot/reset password.
- Complete iOS credentials.
- Build Android and iOS.
- Prepare app screenshots.
- Complete privacy disclosures and app review notes.

## 16. Quality Bar

Every major screen should score at least 9 out of 10:

- Visual polish: dark premium, coherent brand, no generic SaaS blocks.
- UX clarity: one obvious next action per screen.
- Conversion: CTA rhythm is visible but not desperate.
- Accessibility: readable contrast, semantic controls, 44px mobile targets.
- Performance: no heavy animations on mobile, reduced motion respected.
- Trust: privacy, support, legal, and provider language is clear.

## 17. Current External Blockers

### Apple iOS

iOS builds need validated Apple credentials. Browser login and 2FA must be completed by the Apple Developer account owner. This cannot be safely bypassed from a non-interactive terminal.

### Clerk

Real production success requires a Clerk application with:

- Email enabled.
- Phone enabled.
- Password enabled if using password auth.
- Google OAuth.
- Apple OAuth.
- Microsoft OAuth.
- Legal acceptance if Clerk should enforce Terms and Privacy directly.

### Sentry

Runtime error reporting requires DSNs. `SENTRY_AUTH_TOKEN` is optional and only needed for source-map upload and release metadata during builds.

## 18. Favicon and Brand Icon

The web app should expose:

- `/icon.svg` for App Router favicon support.
- Metadata icon declarations.
- Existing `/assets/logo-mark.svg` retained for brand usage.

This ensures the browser tab and URL surface show a Burner Point icon instead of a generic default.
