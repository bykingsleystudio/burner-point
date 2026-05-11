# Burner Point Platform Redesign Audit

Date: April 25, 2026

## Scope

This audit informed the redesign of Burner Point's landing page, authentication flow, and dashboard shell.

## Competitor Findings

### Burner

Source: https://www.burnerapp.com/

- Hero pattern: short, emotional privacy headline with a single high-clarity CTA.
- Positioning: privacy, anonymity, and personal-number separation are the core promise.
- Trust signals: strong press/logo row and user-review snippets.
- UX pattern worth adapting: lifestyle privacy language, simple benefit stacking, and fast path to action.
- Burner Point response: keep the hero direct and confident, but shift the visual language from consumer-app casual to premium telecom control.

### TextVerified

Source: https://www.textverified.com/

- Hero pattern: immediate utility statement focused on real mobile numbers, physical SIMs, and verification speed.
- Positioning: non-VoIP reliability, rentals, verification, crypto/card payments, and API access.
- Pricing pattern: highly productized cards with clear starting prices and action-oriented CTA labels.
- Trust signals: testimonials tied to concrete jobs-to-be-done, FAQ depth, and explicit feature lists.
- UX pattern worth adapting: product segmentation, operational clarity, and "get started now" urgency.
- Burner Point response: use strong pricing/product cards, operational language, and clearer routing between verification, rentals, messaging, eSIM, proxies, and security.

### TextNow

Sources:

- https://help.textnow.com/hc/en-us/articles/360043031633-Getting-started-with-TextNow
- https://help.textnow.com/hc/en-us/articles/360049928434-About-TextNow
- https://help.textnow.com/hc/en-us/articles/1500002893921-Does-TextNow-Support-Verification-Codes

- Product pattern: free or low-friction access, multi-device continuity, and broad convenience framing.
- UX pattern: account setup and usage are explained in a simple, operational way instead of dense telecom language.
- Trust pattern: clear explanation of where the number works, platform limitations, and device portability.
- Burner Point response: keep the flows calm and immediate, but position Burner Point around privacy-grade control and non-VoIP reliability rather than free consumer calling.

### TexPlug

Requested domain: `texplug.net`

- On April 25, 2026, I could not confidently verify a live official SMS-verification competitor experience for `texplug.net`.
- Search results surfaced unrelated or low-confidence references, including `texplug.com`, which appears to be unrelated.
- Burner Point response: do not borrow unknown patterns from an unverified source.

## Current Burner Point Screenshot Audit

Reviewed screenshots from `C:\Users\HP\Pictures\Screenshots\` dated April 24-25, 2026.

### What to remove

- The redundant "Log in or sign up" heading on auth surfaces.
- Duplicate social-auth blocks and repeated decision points.
- The hero robot / generic AI visual direction.
- Any rectangular logo framing and legacy visual remnants.
- Overly busy hero support panels and dropdown-like clutter that compete with the main CTA.

### What to keep and refine

- The dark cyber-green palette.
- The privacy-first messaging direction.
- The premium glass / metallic surface treatment when it is restrained.
- The product architecture already defined in the app: Verify Hub, Rentals, Messenger, eSIM, Proxy Store, Secure Tunnel.

## Redesign Principles

### Landing Page

- Use an immediate telecom privacy promise.
- Replace the hero illustration with a telecom-themed Spline surface or branded fallback.
- Present metrics, services, coverage, supported-platform identifiers, pricing, and testimonials in a strict conversion order.
- Keep CTAs visible at every major decision point.

### Authentication

- Remove redundant headings and duplicated provider blocks.
- Keep one provider order only: Google, Apple, Microsoft, Phone.
- Keep the forms essential and visually calm.
- Keep legal acceptance informational, not interactive.

### Dashboard

- Make the shell feel like a secure operating surface, not a collection of unrelated pages.
- Keep product naming strictly in Burner Point / BP language.
- Surface wallet, verification, messaging, rentals, and settings with clearer hierarchy and faster entry points.

## Burner Point Design Decisions

- Brand system: Deep Green `#013220`, Cyber Green `#00FF9D`, Neon Green `#39FF14`, Black `#000000`, Metallic `#9FA6B2 -> #E5E7EB`.
- Message hierarchy:
  - `Don't want to give out your phone number? No problem. Use ours.`
  - `Private by Design. Stay Anonymous. Stay Connected.`
- Navigation: simple, sticky, conversion-oriented.
- Pricing: productized cards with direct action labels.
- Footer: support-first, with full contact and social coverage.
- Auth: simplified branded entry flow tied directly to Supabase Auth and phone verification.
- Dashboard: unified shell with premium control-room styling and module-specific continuity.
