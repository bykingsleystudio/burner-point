# Burner Point Frontend Design System

This document is the current source of truth for the Burner Point web product experience. It replaces any prior frontend, UI/UX, visual-system, or product-redesign guidance.

## Product feel

Burner Point is a private telecom workspace, not a marketing site wrapped around a dashboard. The interface is calm, compact, direct, and useful. Every visible element must help the user act, understand account state, or make a product decision.

The design is original to Burner Point. It does not copy another product's brand, assets, typography, illustration style, or exact layout.

## Brand tokens

- Cyber Green: `#00FF9D`
- Deep Green: `#013220`
- Black: `#000000`
- White: `#FFFFFF`
- Metallic range: `#9FA6B2` to `#E5E7EB`
- Secondary Neon: `#39FF14`, used sparingly

Use a light product canvas by default. Dark surfaces are reserved for navigation, strong status panels, and focused product moments. Preserve contrast in light, dark, and system appearance modes.

Typography uses Neue Haas Grotesk Display when a licensed project font is installed or supplied to the deployment. No licensed font asset is currently bundled, so the web fallback is Manrope followed by system sans-serif fallbacks; DM Mono remains reserved for compact labels, statuses, and technical values.

## Information architecture

Burner Point is one platform with six product workspaces: BP Messenger Pro, BP Verify Hub, BP Rental Hub, BP eSIM Store, BP Proxy Store, and BP Secure Tunnel VPN. These are product contexts inside the same account, not separate sites. Account identity, authentication, wallet eligibility, billing, notifications, orders, activity, support, settings, and security are shared surfaces.

The client never selects or calls a provider directly. Product actions use the existing Burner Point server controllers, which own provider routing, payment settlement, webhook processing, persistence, authorization, and error handling. Provider credentials and feature flags are deployment configuration; an absent or unverified configuration produces a truthful unavailable state.

Authenticated desktop navigation is grouped as:

- Burner Point: Home, Messenger Pro, Verify Hub, Rental Hub, eSIM Store, Proxy Store, Secure Tunnel VPN
- Manage: Wallet, Billing, Transactions, Orders, Notifications
- Developer: API Keys, API Docs, Webhooks
- Support: Tickets, Help Center
- Account: Profile, Settings, Security, Appearance

Mobile navigation is intentionally limited to Home, Messages, Hub, Store, VPN, and Activity. Secondary destinations belong in a drawer or sheet.

## Interaction rules

- Balance is always reachable from the authenticated header.
- `Add Funds` starts a backend payment session; the browser never fabricates a balance update.
- Wallet language is Balance, Add Funds, and Top Up Credits. There is no withdrawal, cash-out, payout, or withdrawal history experience.
- Products show real API data, loading states, actionable errors, or empty states. They do not use placeholder orders, messages, balances, provider availability, or VPN statistics.
- Provider routing, gateway secrets, webhook secrets, and private API keys remain server-side.
- Forms validate at the boundary and show understandable, actionable errors.
- Destructive account and security actions require explicit confirmation and backend enforcement.

## Component language

Prefer shared components and predictable layouts: AppShell, Sidebar, MobileBottomNav, Topbar, Search, BalanceWidget, AddFundsButton, ProductLauncher, ActivityList, NotificationCenter, TransactionList, OrderList, StatusBadge, EmptyState, LoadingState, ErrorState, Modal, Drawer, Sheet, Tabs, DataTable, MessageComposer, ConversationList, ConversationView, AttachmentMenu, and CallInterface.

Use short labels, visible focus states, semantic controls, and familiar symbols with accessible names. Do not use decorative cards or duplicate explanations. Repeated data belongs in lists or tables; framed cards are for genuinely independent items, dialogs, and focused tools.

## State requirements

Every data-backed view has these states:

- Loading: skeleton or lightweight progress indicator without fake values.
- Empty: what is empty, why it is empty, and the next useful action.
- Error: plain-language explanation, retry or recovery action, and technical detail only in developer contexts.
- Ready: data from the backend with status, timestamps, and relevant actions.
- Permission or session failure: preserve the user's work where possible and redirect through the existing authentication/session mechanism.

## Responsive behavior

The authenticated application must work on desktop, laptop, tablet, and mobile. Mobile is a separate composition, not a scaled desktop: use bottom navigation, drawers, sheets, full-width forms, compact headers, and native-feeling messaging composition.

Controls retain stable dimensions and readable text. No content may overlap, clip, or become unreachable at narrow widths. Respect reduced-motion preferences.

## Accessibility and performance

Use semantic HTML, keyboard navigation, visible focus, screen-reader labels, correct form associations, sufficient contrast, and accessible dialogs. Keep client components narrow, avoid duplicate requests, lazy-load heavy media, and preserve Next.js server rendering where it helps performance.

## Backend boundary

The frontend consumes existing NestJS, Supabase Auth, database, provider, payment, webhook, and storage contracts. It may add a small compatibility adapter only when an existing response is insufficient, preserving backwards compatibility. It must never move secrets to `NEXT_PUBLIC_*`, bypass authorization, or replace backend business rules.
