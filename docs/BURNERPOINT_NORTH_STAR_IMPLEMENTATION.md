# Burner Point North-Star Implementation Document

Updated: 2026-04-17

This document is the consolidated product, design, engineering, security, payments, SEO, mobile, backend, and deployment blueprint for Burner Point. It covers Sections 1 through 22 and is written to be beginner-friendly while staying production-accurate.

Burner Point is a real privacy-first telecommunications and digital access platform. The north-star promise is:

Private by Design. Stay Anonymous. Stay Connected.

The product should feel premium, secure, minimal, controlled, high-trust, modern, dark-mode dominant, and telecom-grade. It should not feel like a generic SaaS template.

## Repository Alignment

The current codebase is a monorepo with these main surfaces:

| Surface | Path | Purpose |
| --- | --- | --- |
| Web | `apps/web` | Next.js public site, auth, dashboard, SEO, social metadata |
| API | `apps/api` | NestJS backend, auth bridge, OTP, numbers, payments, webhooks, integrations, security, readiness |
| Mobile | `apps/mobile` | Expo app for iOS and Android |
| Docs | `docs` | Architecture, security, SEO, integrations, payments, deployment, product direction |
| Scripts | `scripts` | Security scan and operational helpers |

Current implemented foundations include:

- Brand tokens in `apps/web/src/lib/brand.ts`.
- Public content, nav links, footer links, FAQ, blog, updates, careers, help, about, eSIM, proxies, security, terms, and privacy through `apps/web/src/lib/marketing-data.ts` and public routes.
- SEO registry, sitemap, robots, Open Graph image, Twitter image, IndexNow key route, noindex auth layout, and public metadata through `apps/web/src/lib/seo.ts`.
- Supabase Auth-oriented auth pages and onboarding routes.
- Dashboard routes for verification, rentals, numbers, inbox, calls, voicemail, eSIM, proxies, VPN, billing, support, API, webhooks, settings, profile, and security.
- Twilio OTP backend through `phone-auth` endpoints.
- Backend integration contracts for Twilio, Telnyx, Bandwidth, Tremil, OpenAI, Airalo, Oxylabs, Smartproxy, WireGuard, Paystack, Flutterwave, Squad, Korapay, OPay, Paddle, NOWPayments, RevenueCat, Resend, Supabase, Sentry, Railway, DBeaver, Supabase Storage, PostHog, and Expo.
- Payment architecture and provider adapters with core gateway posture.
- Security middleware, audit service, upload hardening, RLS migration, and secret scanning.
- Deployment readiness endpoint, GitHub CI, EAS environment separation, and deployment runbook.

## 1. Full Product Understanding and Implementation Strategy

### Product Definition

Burner Point gives users private access to telecommunications and digital identity tools without exposing their personal phone number or primary network identity.

The platform combines:

- Secure non-VoIP number access.
- SMS, OTP, and voice verification.
- Temporary and renewable number rentals.
- US/Canada conversation numbers for calls, voicemail, text, SMS, MMS, and photo messaging over WiFi or cellular data.
- eSIM purchase and management.
- Proxy purchase and management.
- Built-in WireGuard-based privacy protection inside Burner Point.
- Developer APIs.
- Credits, subscriptions, and one-time purchases.
- Support, audit, fraud, and abuse controls.

### Core Positioning

- Private by Design.
- Stay Anonymous.
- Stay Connected.

### Business Model

Burner Point revenue should come from:

- Verification purchases starting at `$0.99+`.
- Non-renewable rentals starting at `$5.99+`.
- Renewable monthly rentals and subscriptions starting at `$15.99+ / month`.
- eSIM plans.
- Proxy plans.
- Built-in VPN/privacy tier when activated.
- API usage for developers and teams.
- Future enterprise/workspace plans.

### Product Strategy

Build Burner Point as a modular product platform, not a pile of pages:

1. Public site converts visitors with clear privacy, telecom, pricing, and trust messaging.
2. Supabase Auth owns authentication and session security.
3. The dashboard becomes the private telecom control center.
4. The backend owns every provider integration and never exposes secrets to web or mobile.
5. Wallet, billing, ledger, webhooks, and audit logs become the revenue source of truth.
6. Mobile becomes the operational companion for fast OTP receipt, inbox checks, calls, notifications, renewals, and support.
7. Security, observability, abuse prevention, and deployment readiness are treated as product features, not cleanup tasks.

### Engineering Strategy

Use a modular monolith on Railway for launch:

- Faster iteration.
- Shared user, wallet, fraud, support, provider, and audit state.
- Easier debugging.
- Clean module boundaries allow future extraction when scale proves it.

Do not create microservices yet. Candidate future extractions are provider routing workers, billing reconciliation workers, VPN control plane, and analytics/event ingestion.

## 2. Information Architecture

### Public Information Architecture

| Route | Purpose | Status |
| --- | --- | --- |
| `/` | Landing page and conversion hub | Implemented |
| `/overview` | Product ecosystem explanation | Implemented through marketing route |
| `/verifications` | SMS, OTP, and voice verification | Implemented through marketing route |
| `/rentals` | Temporary and renewable numbers | Implemented through marketing route |
| `/numbers` | Number strategy and public entry | Implemented through marketing route |
| `/esim` | eSIM product page | Implemented through marketing route |
| `/proxies` | Proxies product page | Implemented through marketing route |
| `/security` | VPN/privacy and trust posture | Implemented through marketing route |
| `/api` | Developer API landing | Implemented |
| `/api/docs` | Developer API docs page | Implemented |
| `/pricing` | Pricing plans | Implemented through marketing route |
| `/blog` | Educational content | Implemented through marketing route |
| `/updates` | Product announcements | Implemented through marketing route |
| `/careers` | Mission and roles | Implemented through marketing route |
| `/faq` | FAQ | Implemented through marketing route |
| `/help` | Help Center | Implemented through marketing route |
| `/help-center` | Dedicated Help Center page | Implemented |
| `/about` | Mission and company story | Implemented through marketing route |
| `/contact` | Support and contact | Implemented through marketing route |
| `/support` | Support page | Implemented through marketing route |
| `/terms` | Terms | Implemented through marketing route |
| `/privacy` | Privacy Policy | Implemented through marketing route |
| `/privacy-policy` | Dedicated Privacy page | Implemented |

### Authentication IA

| Route | Purpose |
| --- | --- |
| `/auth/login` | Sign in with email, phone, OAuth, password, reset path |
| `/auth/signup` | Create account |
| `/auth/register` | Register alias route |
| `/auth/phone-verify` | Phone verification client |
| `/sso-callback` | OAuth callback |
| `/onboarding` | Post-auth onboarding |

### Dashboard IA

| Route | Purpose |
| --- | --- |
| `/dashboard` | Private telecom command center |
| `/dashboard/inbox` | Conversation inbox |
| `/dashboard/messages` | Message threads |
| `/dashboard/calls` | Calls |
| `/dashboard/voicemail` | Voicemail |
| `/dashboard/contacts` | Contacts |
| `/dashboard/verification` | OTP and phone verification |
| `/dashboard/rentals` | Rental purchase and management |
| `/dashboard/numbers` | Owned numbers, filters, lifecycle |
| `/dashboard/esim` | eSIM plans and active eSIMs |
| `/dashboard/proxies` | Proxy purchase and management |
| `/dashboard/vpn` | Built-in VPN status and controls |
| `/dashboard/credits` | Credits and wallet |
| `/dashboard/billing` | Billing overview |
| `/dashboard/subscriptions` | Subscription management |
| `/dashboard/support` | Support entry |
| `/dashboard/support/tickets` | Support tickets |
| `/dashboard/api` | API tools |
| `/dashboard/developer` | Developer controls |
| `/dashboard/webhooks` | Webhook management |
| `/dashboard/settings` | Settings |
| `/dashboard/profile` | Profile |
| `/dashboard/security` | Security settings |
| `/dashboard/payments/success` | Payment success return |
| `/dashboard/payments/cancel` | Payment cancel return |

### Backend IA

| Domain | Modules |
| --- | --- |
| Auth | `auth`, `phone-auth`, Supabase Auth exchange |
| Users | `users`, profile, wallet |
| Telecom | `numbers`, `messaging`, `webhooks`, `global/provider.service` |
| Payments | `payments`, `paddle`, `billing-v2` |
| Integrations | `integrations`, provider contracts |
| Platform readiness | `platform`, `deployment-registry` |
| Security | `security`, `security.middleware`, `abuse` |
| Realtime | `gateway` |
| AI | `ai` |
| Enterprise | `enterprise`, `api-platform`, `admin` |
| SEO | `seo` |

## 3. Web Page-by-Page Structure

### Landing Page

Primary goal: convert privacy-aware visitors into signups or product exploration.

Required structure:

1. Sticky header with logo, nav, Sign In, Get Started.
2. Hero:
   - Eyebrow: Private by Design.
   - Headline: Private by Design. Stay Anonymous. Stay Connected.
   - Core line: Do not want to give out your phone number? No problem. Use ours.
   - Body: Generate secure, non-VoIP numbers instantly and stay in control of your communication anytime, anywhere.
   - Trust line: Receive SMS, Voice, and OTP verifications from 900+ platforms worldwide.
   - CTAs: Get Started, Learn More, View API Docs.
3. Trust badges:
   - 256-bit AES Encryption.
   - No Logs Policy.
   - GDPR Compliant.
   - Real SIM Numbers.
4. How It Works:
   - Choose your number.
   - Use it for verification, calls, or messaging.
   - Receive SMS, OTP, or voice instantly.
   - Let it expire or keep it.
5. Product modules:
   - Phone Number Rentals and Verifications.
   - eSIM Purchase.
   - Proxies Purchase.
   - VPN Privacy and Protection.
6. Conversation section:
   - US/Canada calls, voicemail, text, SMS, MMS, photo messaging.
   - WiFi/data calling.
   - No roaming fees.
   - Cross-platform access.
7. Pricing preview.
8. Use cases.
9. Developer API preview.
10. FAQ preview.
11. Final CTA.
12. Footer with route groups, support contacts, socials, legal, and copyright.

### Overview

Purpose: explain Burner Point as one privacy telecom platform.

Sections:

- Product promise.
- Conversation vs verification distinction.
- Shared account, wallet, support, risk, API, and audit layers.
- Who it is for.
- CTA to pricing and signup.

### Verifications

Purpose: sell SMS, OTP, and voice verification.

Sections:

- Non-VoIP and SIM-backed positioning.
- SMS OTP and voice OTP.
- 900+ platforms.
- Country/service flow.
- Code receipt states.
- Abuse limits and delivery transparency.
- CTA: Get Verification.

### Rentals

Purpose: sell temporary and renewable number access.

Sections:

- Non-renewable rentals.
- Renewable monthly rentals.
- Expiry, renewal, and release rules.
- Conversation support where applicable.
- CTA: Rent A Number.

### Numbers

Purpose: explain the number catalog and lifecycle.

Sections:

- Verification numbers.
- Rental numbers.
- Conversation numbers.
- Search, filters, availability, price, type, region, lifecycle.

### eSIM

Purpose: sell global connectivity without physical SIM cards.

Sections:

- Destination-ready plans.
- Instant activation.
- Multi-country access.
- Usage tracking.
- Airalo provider abstraction.

### Proxies

Purpose: sell routing flexibility and privacy-enhanced browsing.

Sections:

- Residential proxies.
- Mobile proxies.
- Location selection.
- Credential masking.
- Rotation and session behavior.

### Security

Purpose: explain in-platform privacy protection.

Sections:

- WireGuard-based protection.
- Backend-only provider logic.
- No-logs posture.
- Reduced exposure.
- Secure routing.
- VPN is a feature inside Burner Point, not a standalone product.

### API and API Docs

Purpose: win developers.

Sections:

- API overview.
- API keys.
- Number provisioning.
- Verification lifecycle.
- Messaging.
- Webhooks.
- Idempotency.
- Signature verification.
- Sandbox and production notes.

### Pricing

Purpose: reduce purchase friction.

Pricing:

- Verification: `$0.99+ / verification`.
- Non-renewable rental: `$5.99+ / rental`.
- Renewable rental/subscription: `$15.99+ / month`.

Payment notes:

- Paystack for primary local card/bank flow.
- Paddle for international cards and subscriptions.
- NOWPayments for crypto where enabled.
- Flutterwave, Squad, Korapay, and OPay stay secondary until core revenue is stable.

### Blog

Launch posts:

- Why You Should Never Use Your Personal Number Online.
- How Burner Numbers Protect Your Identity.
- Understanding Non-VoIP Numbers.
- Privacy in the Digital Age: Anonymous and Connected.
- How Burner Point Handles Secure Communication.

### Updates

Launch updates:

- New country numbers added.
- API improvements.
- New eSIM regions.
- New proxy region and durability improvements.
- WiFi and cellular-data communication improvements for US/Canada.

### Careers

Sections:

- Mission.
- Why work at Burner Point.
- Remote opportunities.
- Example roles.
- Culture: privacy, telecommunications, product craftsmanship.

### FAQ

Must answer:

- What burner numbers are.
- How conversation inbox works.
- How verifications work.
- How rentals work.
- Renewable vs non-renewable numbers.
- eSIM.
- Proxies.
- VPN protection.
- Payments.
- Account setup.
- Refunds and billing.
- Privacy and data handling.

### Help Center

Categories:

- Getting Started.
- Verifications.
- Rentals.
- Payments.
- Security.
- API / Developer Tools.
- Account & Authentication.

Article structure:

- What this article covers.
- Before you begin.
- Steps.
- Troubleshooting.
- When to contact support.

## 4. Mobile App Screen-by-Screen Structure

Native app goal: make Burner Point usable as a private telecom companion on iOS and Android.

### Navigation

Use bottom tabs for:

- Dashboard.
- Messages.
- Verification.
- Numbers/Rentals.
- Settings/Profile.

Secondary routes:

- Calls.
- Voicemail.
- Contacts.
- Activity.
- eSIM.
- Proxies.
- VPN.
- Billing.
- Support.
- API/Developer.

### Onboarding

Screens:

1. Privacy promise.
2. Select primary need: verification, rental, conversation, eSIM, proxies, VPN.
3. Create account or sign in.
4. Verify email/phone.
5. Set privacy preferences.
6. Land on dashboard.

### Sign Up and Sign In

Use Supabase Auth with Expo:

- Email.
- Phone.
- Password.
- OAuth where enabled.
- Secure token cache.
- Native-safe session storage.

### Dashboard

Cards:

- Active numbers.
- Active verification.
- Wallet balance.
- Recent messages.
- VPN status.
- Support status.
- Quick actions.

### Conversation Inbox / Messages

Features:

- Thread list.
- SMS/MMS messages.
- Photo message preview.
- OTP extraction.
- Delivery status.
- Contact context.
- Quick copy.

### Calls / Voicemail

Features:

- Incoming call state.
- Active call screen.
- Call history.
- Voicemail playback.
- Missed call indicator.
- WiFi/data calling indicator.

### Verification

Flow:

1. Select country.
2. Select service.
3. See price.
4. Confirm purchase.
5. Receive number.
6. Wait for SMS/voice code.
7. Copy code.
8. Complete or retry.

### Rentals / Numbers

Features:

- Active rentals.
- Expiration timers.
- Renewable vs non-renewable labels.
- Search and filters.
- Renew.
- Release.
- Open inbox.

### Activity

Features:

- Payment events.
- Provider events.
- Verification attempts.
- Number lifecycle events.
- Support updates.

### eSIM

Features:

- Plan catalog.
- Country/region search.
- Active eSIM.
- Install instructions.
- Usage status.

### Proxies

Features:

- Proxy plans.
- Region selection.
- Active credentials.
- Masked secret display.
- Rotation controls.

### VPN

Features:

- Toggle.
- Server selection.
- Current status.
- Session timer.
- Disconnect.

### Billing

Features:

- Wallet balance.
- Credit packages.
- Transaction history.
- Subscription status.
- Web checkout handoff or store-compliant billing when required.

### Support

Features:

- Ticket list.
- New ticket.
- Email support.
- Telegram support.
- Help articles.

### Settings / Profile

Features:

- Profile.
- Security.
- Sessions.
- Notifications.
- App preferences.
- Sign out.
- Delete account.

## 5. Authentication Flow

### Auth Provider

Supabase Auth is the primary authentication provider. Burner Point backend exchanges Supabase sessions for internal API context, and Supabase remains the source of truth for sessions, OAuth, email verification, phone verification, password reset, and MFA.

### Required Account Fields

- First name.
- Last name.
- Email.
- Phone number.
- Password unless OAuth-only.
- Terms of Service checkbox.
- Privacy Policy checkbox.

### Create Account Flow

1. User opens `/auth/signup`.
2. Burner Point logo routes to `/`.
3. User enters first name, last name, email, phone, password.
4. User accepts Terms and Privacy Policy separately.
5. User chooses email/password or OAuth.
6. Supabase Auth creates the user.
7. Supabase Auth verifies email and/or phone based on dashboard configuration.
8. Backend stores or maps Burner Point profile context.
9. User is routed to onboarding or dashboard.

### Sign-In Flow

1. User opens `/auth/login`.
2. Header says Welcome Back.
3. Logo routes to `/`.
4. Identifier supports email or phone.
5. User enters password or chooses Google, Apple, or Microsoft.
6. Supabase Auth handles MFA when enabled.
7. Backend session bridge completes where needed.
8. User lands in `/dashboard`.

### Password Reset

Use Supabase Auth reset flows:

- Request reset.
- Receive email or code.
- Set new password.
- Revoke suspicious sessions.
- Audit the event.

### 2FA

Support:

- Email code.
- Phone code.
- TOTP for high-trust accounts/admins.
- Backup codes for recovery.

### Auth Rate Limits

All auth-sensitive routes require:

- 5 attempts per route per 10 to 15 minutes.
- IP and device tracking.
- Brute-force lockout.
- Suspicious login detection.
- Audit record on high-risk events.

## 6. Landing Page / Homepage UX and Content Structure

### Desktop UX

Design for 1440px to 1920px and above:

- Sticky navigation.
- 12-column grid.
- Large uppercase headline moments.
- Premium whitespace.
- Controlled density.
- High-contrast CTAs.
- Subtle glow interactions.
- Smooth scrolling.
- Section anchors.
- Telecom-grade console visuals.

Hero composition:

- Left: copy and CTAs.
- Right: dynamic product console with numbers, country rail, verification state, and privacy badges.
- Background: black/deep-green, subtle grid, controlled neon.

### Mobile Web UX

Design for 320px to 768px:

- Collapsible nav.
- Stacked sections.
- Minimum 44px tap targets.
- Short copy blocks.
- Mobile-friendly forms.
- Thumb-zone CTAs.
- Accordions for FAQ.
- Compact footer.
- Reduced motion support.

### Homepage Content Order

1. Header.
2. Hero.
3. Trust badges.
4. Country/number availability.
5. How It Works.
6. Phone Number Rentals and Verifications.
7. Conversation Feature.
8. eSIM.
9. Proxies.
10. VPN Privacy and Protection.
11. Why Burner Point.
12. Pricing.
13. Use Cases.
14. Developer API.
15. FAQ.
16. Final CTA.
17. Footer.

### Homepage Copy Foundation

Headline:

Private by Design. Stay Anonymous. Stay Connected.

Hero:

Do not want to give out your phone number? No problem. Use ours.

Generate secure, non-VoIP numbers instantly and stay in control of your communication anytime, anywhere.

Supporting line:

Receive SMS, Voice, and OTP verifications from 900+ platforms worldwide.

## 7. Feature Page Content and Hierarchy

### Phone Number Rentals and Verifications

Positioning:

Secure access to real mobile numbers.

Hierarchy:

1. Real mobile number access.
2. Non-VoIP/SIM-backed positioning.
3. SMS, OTP, and voice verification.
4. Short-term rentals.
5. Renewable rentals.
6. Multi-country access.
7. US/Canada conversation support.
8. CTA: Get Verification / Rent A Number.

### eSIM Purchase

Positioning:

Global connectivity without physical SIM cards.

Hierarchy:

1. Travel-ready data.
2. Instant activation.
3. Multi-country plans.
4. Usage visibility.
5. Airalo backend abstraction.
6. CTA: Get Your eSIM.

### Proxies Purchase

Positioning:

Secure access, routing flexibility, and privacy-enhanced browsing.

Hierarchy:

1. Residential/mobile proxy access.
2. Location flexibility.
3. Credentials managed through backend.
4. Rotation and durability.
5. Usage and abuse controls.
6. CTA: Get Proxies.

### VPN Privacy and Protection

Positioning:

In-built protection inside Burner Point.

Hierarchy:

1. WireGuard-powered privacy layer.
2. Server selection.
3. Session status.
4. Reduced exposure while using Burner Point.
5. Not a standalone VPN brand.
6. CTA: Learn More / See Security.

## 8. Full Navigation and Clickable Route Map

### Header

| Element | Route |
| --- | --- |
| Logo | `/` |
| Sign In | `/auth/login` |
| Get Started | `/auth/signup` |

### Main Navigation

| Label | Route |
| --- | --- |
| Overview | `/overview` |
| Verifications | `/verifications` |
| Rentals | `/rentals` |
| API | `/api` |
| Pricing | `/pricing` |
| Blog | `/blog` |
| FAQ | `/faq` |
| About | `/about` |
| Contact | `/contact` |

### Hero and CTA Routes

| CTA | Route |
| --- | --- |
| Get Started | `/auth/signup` |
| Learn More | `/overview` |
| View API Docs | `/api/docs` |
| Get Verification | `/verifications` |
| Rent A Number | `/rentals` |
| Start Monthly Plan | `/pricing` |
| Get Your Number | `/numbers` or `/rentals` depending on context |
| View Pricing | `/pricing` |
| Get Your eSIM | `/esim` |
| Get Proxies | `/proxies` |
| See Security | `/security` |

### Footer Product

| Label | Route |
| --- | --- |
| Overview | `/overview` |
| Verifications | `/verifications` |
| Rentals | `/rentals` |
| API | `/api` |
| Pricing | `/pricing` |

### Footer Company

| Label | Route |
| --- | --- |
| About | `/about` |
| Blog | `/blog` |
| Updates | `/updates` |
| Careers | `/careers` |

### Footer Support

| Label | Route |
| --- | --- |
| FAQ | `/faq` |
| Help Center | `/help` |
| Contact | `/contact` |

### Footer Legal

| Label | Route |
| --- | --- |
| Terms | `/terms` |
| Privacy Policy | `/privacy` |

### Support Contacts

| Contact | Link |
| --- | --- |
| Email | `mailto:info@burnerpoint.com` |
| Telegram support | `https://t.me/burnerpoint` |
| Telegram app channel | `https://t.me/burnerpointapp` |

### Social Routes

| Channel | Link |
| --- | --- |
| Instagram | `https://www.instagram.com/burnerpointapp` |
| Facebook | `https://www.facebook.com/burnerpointapp` |
| LinkedIn | `https://www.linkedin.com/company/burnerpointapp` |
| TikTok | `https://www.tiktok.com/@burnerpointapp` |
| Twitter/X | `https://x.com/burnerpointapp` |
| Telegram | `https://t.me/burnerpointapp` |
| YouTube | `https://www.youtube.com/@burnerpointapp` |

### Dashboard Route Map

| Label | Route |
| --- | --- |
| Dashboard | `/dashboard` |
| Inbox | `/dashboard/inbox` |
| Messages | `/dashboard/messages` |
| Calls | `/dashboard/calls` |
| Voicemail | `/dashboard/voicemail` |
| Contacts | `/dashboard/contacts` |
| Verification | `/dashboard/verification` |
| Rentals | `/dashboard/rentals` |
| Numbers | `/dashboard/numbers` |
| eSIM | `/dashboard/esim` |
| Proxies | `/dashboard/proxies` |
| VPN | `/dashboard/vpn` |
| Credits | `/dashboard/credits` |
| Billing | `/dashboard/billing` |
| Subscriptions | `/dashboard/subscriptions` |
| Support | `/dashboard/support` |
| Support Tickets | `/dashboard/support/tickets` |
| API | `/dashboard/api` |
| Developer | `/dashboard/developer` |
| Webhooks | `/dashboard/webhooks` |
| Settings | `/dashboard/settings` |
| Profile | `/dashboard/profile` |
| Security | `/dashboard/security` |

## 9. Design System and Component Architecture

### Tokens

Brand tokens live in `apps/web/src/lib/brand.ts`.

Colors:

- Deep Green: `#013220`.
- Black: `#000000`.
- Cyber Green: `#00FF9D`.
- Neon Green: `#39FF14`.
- Metallic start: `#9FA6B2`.
- Metallic end: `#E5E7EB`.
- Surface: `#07140F`.
- Border: `#123425`.

Typography:

- Primary: Neue Haas Grotesk Display.
- Current web fallback: Space Grotesk.
- Technical/OTP/data fallback: DM Mono.
- Headlines: bold/black.
- Labels: medium.
- Body: regular.

Spacing:

- Use an 8-point grid.
- 4px for micro gaps.
- 8px for tight spacing.
- 16px for component padding.
- 24px and 32px for groups.
- 64px and 96px for sections.

Radius:

- 8px small.
- 12px medium.
- 16px large.

Motion:

- 200ms to 300ms.
- Ease-in-out or custom expressive easing.
- Press scale around 0.97.
- Hover glow increase.
- Loading pulse.
- Respect reduced motion.

### Components

Buttons:

- Primary: Cyber Green background, black text.
- Secondary: bordered dark button.
- Ghost: minimal text-first action.

Inputs:

- Dark background.
- Clear label.
- Validation text.
- 44px or taller tap target.
- Mobile keyboard/autofill types.

Cards:

- Use for repeated items, pricing plans, feature blocks, dashboard tiles, modals, and functional tools.
- Do not nest cards inside cards.

Accordions:

- FAQ and Help Center.
- Accessible button header.
- Keyboard support.

Navigation:

- Sticky desktop nav.
- Collapsible mobile nav.
- Dashboard sidebar or tabbed navigation.
- Native bottom tabs on mobile.

States:

- Empty: explain and offer next action.
- Loading: skeleton/pulse.
- Error: clear cause and next step.
- Success: short confirmation and route forward.

### Quality Rules

- No generic templates.
- No noisy animation.
- No fake privacy claims.
- No frontend provider secrets.
- Text must fit on 320px mobile.
- Tap targets must be at least 44px.
- Motion must not block performance.

## 10. Backend Architecture and Service Integration Plan

### Backend Shape

Burner Point uses NestJS on Railway with Supabase Postgres, Railway Redis, and backend-only provider adapters.

Core modules:

- `auth`.
- `phone-auth`.
- `users`.
- `numbers`.
- `messaging`.
- `webhooks`.
- `payments`.
- `paddle`.
- `billing-v2`.
- `abuse`.
- `ai`.
- `api-platform`.
- `integrations`.
- `platform`.
- `security`.
- `seo`.
- `gateway`.
- `enterprise`.
- `growth`.

### Provider Rule

The frontend and mobile apps only call Burner Point backend endpoints. Provider secrets live server-side only.

Backend-only providers:

- Twilio.
- Telnyx.
- Tremil.
- Bandwidth.
- OpenAI.
- Airalo.
- Oxylabs.
- WireGuard.
- Paystack.
- Flutterwave.
- Squad.
- Korapay.
- OPay.
- Paddle.
- NOWPayments.
- Resend.
- Supabase service-role and JWT secrets.
- Supabase Postgres.
- Sentry auth token.
- S3 credentials.
- Private PostHog capture.

### Public Client Env Allowed

Allowed public values only:

- `NEXT_PUBLIC_API_URL`.
- `NEXT_PUBLIC_APP_URL`.
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- `NEXT_PUBLIC_SENTRY_DSN`.
- `NEXT_PUBLIC_POSTHOG_KEY` where public analytics is intended.
- `EXPO_PUBLIC_API_URL`.
- `EXPO_PUBLIC_WEB_URL`.
- `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, and RevenueCat public mobile keys.
- `EXPO_PUBLIC_SENTRY_DSN`.

### Webhook Strategy

Every webhook must:

1. Verify signature where available.
2. Store event and idempotency key.
3. Return quickly.
4. Process state changes safely.
5. Emit realtime updates where needed.
6. Update audit/provider health metrics.

Webhook receivers include:

- Twilio SMS, voice, status, recording, verify.
- Telnyx inbound and status.
- Tremil inbound and status where enabled.
- Bandwidth.
- Airalo.
- Oxylabs.
- WireGuard.
- Supabase Auth.
- Paystack.
- Paddle.
- NOWPayments.
- Secondary payment gateways when enabled.

## 11. Twilio OTP End-to-End Implementation Plan

### Frontend Flow

1. User opens verification or phone verification UI.
2. User enters phone number in E.164 format.
3. User chooses SMS or voice where supported.
4. Frontend validates basic phone format.
5. Frontend calls Burner Point API, not Twilio.
6. UI shows sending state.
7. UI shows code entry state.
8. User submits code.
9. UI shows success, failure, retry, or rate-limited state.
10. User redirects to onboarding or dashboard.

### Backend Flow

Endpoints:

- `POST /phone-auth/send`.
- `POST /phone-auth/verify`.

Server env:

- `TWILIO_ACCOUNT_SID`.
- `TWILIO_AUTH_TOKEN`.
- `TWILIO_VERIFY_SERVICE_SID`.

Backend steps:

1. Validate phone number.
2. Apply rate limit.
3. Create or update OTP session.
4. Call Twilio Verify server-side.
5. Store session metadata and expiration.
6. Verify submitted code with Twilio.
7. Mark phone as verified or reject.
8. Audit result.
9. Redirect client flow.

### Error States

- Invalid phone.
- Unsupported country.
- Too many attempts.
- Provider unavailable.
- Code expired.
- Incorrect code.
- Network error.

### Abuse Controls

- 5 sends per route per 10 to 15 minutes.
- Invalid code attempt limit.
- IP/device velocity.
- Phone velocity.
- Provider health fallback.
- Audit every blocked attempt.

### Smoke Test

1. Confirm Vercel calls Railway API URL.
2. Confirm CORS allows production web origin.
3. Confirm Twilio env exists in Railway.
4. Send OTP to test phone.
5. Verify code.
6. Confirm dashboard redirect.
7. Confirm no Twilio key appears in frontend bundle.

## 12. Payment Architecture and Webhook Flow

### Products

One-time:

- Verification credits.
- Rentals.

Recurring:

- Monthly subscription / renewable rental.

### Gateways

Core:

- Paystack.
- Paddle.
- NOWPayments.

Deferred:

- Flutterwave.
- Squad.
- Korapay.
- OPay.

### Payment Flow

1. User chooses product.
2. Frontend calls Burner Point backend.
3. Backend validates user, product, amount, region, and gateway.
4. Backend creates payment session.
5. Backend calls gateway server-side.
6. Backend returns checkout URL/session data.
7. User completes checkout.
8. Gateway sends webhook.
9. Backend verifies webhook signature.
10. Backend deduplicates webhook.
11. Backend updates payment session.
12. Backend writes wallet/ledger transaction.
13. Backend assigns credits, rental, number, or subscription entitlement.
14. User sees success page and updated dashboard.

### Reconciliation Requirements

- Payment session table.
- Gateway reference.
- Idempotency key.
- Ledger event.
- Product entitlement.
- Webhook raw payload hash.
- Refund/chargeback state.
- Manual review state.

### Mobile Payment Caution

Native mobile must respect Apple and Google billing requirements for digital goods, credits, subscriptions, and app features. The safest launch posture is:

- Web checkout for purchases.
- Mobile app consumes entitlements.
- If in-app purchases are added later, map store purchases into the same wallet and ledger system.

## 13. Security Architecture and Audit Checklist

### Current Security Foundations

- Security middleware.
- CORS allowlist.
- HTTPS redirect in production.
- Helmet security headers.
- Global validation pipe.
- Payload size limits.
- Webhook rate limits.
- Auth route lockout.
- Secret scanner script.
- Security audit service.
- Upload intent hardening.
- Private object key strategy.
- RLS migration for sensitive uploads.
- Mobile secure token storage.

### Security Checklist

Before every release:

- Run `npm run security:scan`.
- Run `git diff --check`.
- Confirm `.env` files are not staged.
- Confirm no provider keys are in frontend code.
- Confirm web bundle does not contain private env values.
- Confirm CORS origins match production domains.
- Confirm webhooks verify signatures.
- Confirm auth routes are rate-limited.
- Confirm payment webhooks are idempotent.
- Confirm upload URLs are private and short-lived.
- Confirm AI kill switch works.
- Confirm Sentry does not capture secrets.
- Confirm PostHog does not capture sensitive message bodies or OTPs.
- Confirm mobile tokens use secure storage.

### Sensitive Upload Policy

For IDs, licenses, SSNs, documents, support attachments, MMS, voicemail, and exports:

- Store in private S3-compatible storage.
- Use signed URLs.
- Use randomized user-sharded keys.
- Enforce content type and size limits.
- Audit access.
- Never expose public bucket URLs.
- Add retention and deletion policy.

### Remaining Security Work

- Finalize production RLS policies after schema stabilizes.
- Add provider-specific signature verification where provider formats are final.
- Add admin 2FA enforcement.
- Add device/session management UI.
- Add data retention policy values.
- Add formal incident runbook.

## 14. Deployment Order From Zero to Production

### Step 1: Local Setup

1. Install Node 20.
2. Install dependencies at root and inside apps as needed.
3. Copy `.env.example` to local ignored env files.
4. Fill only sandbox/test credentials locally.
5. Do not commit `.env`.

### Step 2: Verify Locally

Run:

```bash
npm run release:verify
```

This runs:

- Secret scan.
- API build.
- Web build.
- Mobile typecheck.

### Step 3: GitHub

1. Create feature branch.
2. Commit with clear scope.
3. Open PR to `main`.
4. Let GitHub Actions run.
5. Review security, env, migrations, and webhooks.
6. Merge only when clean.

### Step 4: Supabase Postgres

1. Create development, staging, and production databases or branches.
2. Enable SSL.
3. Set `DATABASE_URL` in Railway only.
4. Apply migrations to staging.
5. Back up production before risky changes.
6. Apply production migrations only after staging passes.

### Step 5: Railway API

1. Create staging service.
2. Set staging env.
3. Deploy API.
4. Check `/health`.
5. Check `/api/platform/readiness`.
6. Check `/api/platform/deployment-readiness`.
7. Test auth, OTP, payments, webhooks.
8. Promote same commit to production.

### Step 6: Vercel Web

1. Set preview env.
2. Deploy preview.
3. Test public pages, auth, dashboard, SEO.
4. Set production env.
5. Deploy production.
6. Check `/`, `/sitemap.xml`, `/robots.txt`, `/opengraph-image`, `/auth/login`, `/dashboard`.

### Step 7: Supabase Auth

1. Configure production app.
2. Enable email, phone, Google, Apple, Microsoft.
3. Add web redirects.
4. Add mobile redirects.
5. Add webhook URL to Railway.
6. Store secret key in Railway.
7. Store publishable keys in Vercel and EAS.

### Step 8: Sentry and PostHog

1. Create separate projects for web, API, mobile.
2. Set DSNs in Vercel, Railway, EAS.
3. Set source-map auth token only if uploading source maps.
4. Configure PostHog server-side capture.
5. Confirm release events and product events arrive.

### Step 9: Providers

Configure and smoke test:

- Twilio.
- Telnyx.
- Tremil.
- Bandwidth.
- Airalo.
- Oxylabs.
- WireGuard.
- Resend.
- S3.

### Step 10: Payments

1. Configure Paystack.
2. Configure Paddle.
3. Configure NOWPayments.
4. Verify webhooks.
5. Verify ledger fulfillment.
6. Keep secondary gateways disabled until core payment reconciliation is stable.

### Step 11: Expo / EAS

1. Set EAS preview env.
2. Build preview iOS and Android.
3. Test auth, API, dashboard, messages, verification, billing handoff.
4. Set EAS production env.
5. Build production artifacts.
6. Submit to App Store and Google Play when store metadata is complete.

### Step 12: Launch Monitoring

Monitor:

- Sentry.
- Railway logs.
- Vercel logs.
- Supabase database metrics.
- PostHog funnels.
- Provider dashboards.
- Payment dashboards.
- Support tickets.

## 15. Clear Implementation Phases for Beginners

### Phase 1: Understand the Product

Read:

- This document.
- `docs/BURNERPOINT_TECHNICAL_ARCHITECTURE.md`.
- `docs/BACKEND_INTEGRATION_CONTRACTS.md`.
- `docs/PAYMENT_SYSTEM_ARCHITECTURE.md`.
- `docs/SECURITY_AUDIT.md`.
- `docs/SEO_SEARCH_DISCOVERY.md`.
- `docs/DEPLOYMENT_RUNBOOK.md`.

Goal:

Understand what Burner Point is before changing code.

### Phase 2: Run the Project Locally

1. Install dependencies.
2. Set local env.
3. Run API.
4. Run web.
5. Run mobile if needed.
6. Confirm routes open.

Goal:

See the current product before editing it.

### Phase 3: Verify Safety

Run:

```bash
npm run security:scan
npm run release:verify
```

Goal:

Know the repo builds and no high-confidence secrets are tracked.

### Phase 4: Polish Public Web

Work on:

- Homepage.
- Public pages.
- FAQ.
- Help.
- Blog.
- Updates.
- Careers.
- SEO metadata.
- Open Graph image.

Goal:

Make the public product feel premium, secure, and conversion-ready.

### Phase 5: Complete Auth

Work on:

- Supabase Auth dashboard settings.
- Sign-up validation.
- Sign-in with email/phone.
- OAuth.
- Password reset.
- 2FA.
- Onboarding.
- Session handling.

Goal:

Make account creation and login production-safe.

### Phase 6: Complete Dashboard Core

Work on:

- Dashboard overview.
- Verification purchase flow.
- Rentals.
- Numbers.
- Inbox.
- Calls.
- Voicemail.
- Credits.
- Support.

Goal:

Make the authenticated product useful every day.

### Phase 7: Stabilize Telecom

Work on:

- Twilio OTP.
- Twilio SMS/MMS/voice.
- Bandwidth number infrastructure.
- Telnyx global route.
- Tremil fallback where enabled.
- Provider health and circuit breakers.

Goal:

Make telecom delivery reliable and observable.

### Phase 8: Stabilize Payments

Work on:

- Paystack.
- Paddle.
- NOWPayments.
- Webhooks.
- Ledger.
- Reconciliation.
- Success/cancel return pages.

Goal:

Make revenue flows safe and auditable.

### Phase 9: Add Expansion Products

Work on:

- eSIM with Airalo.
- Proxies with Oxylabs and Smartproxy.
- VPN with WireGuard.
- S3 media/document storage.

Goal:

Expand beyond numbers without compromising security.

### Phase 10: Harden Security

Work on:

- RLS.
- Audit logs.
- Upload controls.
- Provider signatures.
- Abuse/fraud controls.
- AI kill switch.
- Mobile secure storage.

Goal:

Reduce platform, user, provider, and payment risk.

### Phase 11: Prepare Deployment

Work on:

- GitHub CI.
- Vercel env.
- Railway env.
- Supabase migrations.
- Supabase production project.
- Sentry/PostHog.
- EAS env.
- Store metadata.

Goal:

Be ready to ship without surprises.

### Phase 12: Release and Monitor

1. Run `npm run release:verify`.
2. Deploy staging.
3. Smoke test.
4. Deploy production.
5. Monitor errors.
6. Watch payment and telecom webhooks.
7. Track support.
8. Roll back or hotfix if needed.

Goal:

Launch carefully and keep control.

## Final North-Star Standard

Burner Point should feel like a telecom-grade privacy platform with a premium dark interface, clear lifecycle states, secure backend-only integrations, real conversion paths, and visible operational trust.

The product is successful when a beginner can:

1. Understand what Burner Point does.
2. Create an account.
3. Get a verification number.
4. Rent a number.
5. Use calls/messages/voicemail where supported.
6. Buy credits safely.
7. Contact support.
8. Manage privacy settings.
9. Understand billing and expiration.
10. Trust that provider secrets and sensitive data are not exposed.

The engineering system is successful when a developer can:

1. Run the project.
2. Read the route map.
3. Follow the docs.
4. Add a provider safely.
5. Verify builds.
6. Scan for secrets.
7. Deploy through staging.
8. Monitor production.
9. Roll back safely.
10. Keep Burner Point private by design.
