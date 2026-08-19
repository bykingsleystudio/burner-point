# Burner Point Frontend Product Redesign Implementation Guide

## Executive Summary

The Burner Point web application has been comprehensively redesigned with a production-grade product interface that:

- **Maintains 100% API-first architecture** - Every page calls real backend services with proper error handling
- **Implements cohesive design language** - Consistent styling, spacing, animation, and interaction patterns across all product surfaces
- **Preserves existing functionality** - All integrations with billing, messaging, verification, rentals, eSIM, proxy, and VPN systems remain intact
- **Delivers mobile-first responsive layouts** - Desktop sidebar + mobile drawer navigation, responsive grids, touch-friendly interactions
- **Supports dark/light theme switching** - CSS variables enable seamless theme switching via data-theme selectors

## Architecture Overview

### Directory Structure

```
apps/web/src/
├── app/
│   ├── globals.css          # Brand theme, animations, design primitives
│   ├── dashboard/
│   │   ├── layout.tsx       # Auth guard, session sync, socket hookup
│   │   ├── page.tsx         # Dashboard overview (wallet, products, activity)
│   │   ├── inbox/
│   │   │   └── page.tsx     # BP Messenger threads, call credits, compose
│   │   ├── calls/
│   │   │   └── page.tsx     # Call keypad, history, active call tracking
│   │   ├── contacts/
│   │   │   └── page.tsx     # Shared messenger tabs
│   │   ├── verification/
│   │   │   └── page.tsx     # BP Verify Hub (tier, service, country, OTP)
│   │   ├── verify-hub/
│   │   │   └── page.tsx     # Alias for verification
│   │   ├── rentals/
│   │   │   └── page.tsx     # Number rental search and assignment
│   │   ├── esim/
│   │   │   └── page.tsx     # eSIM plan lookup and ordering
│   │   ├── proxies/
│   │   │   └── page.tsx     # Proxy order form and history
│   │   ├── vpn/
│   │   │   └── page.tsx     # Secure tunnel session request
│   │   ├── billing/
│   │   │   └── page.tsx     # Wallet, subscriptions, transactions
│   │   ├── settings/
│   │   │   └── page.tsx     # Profile, appearance, account controls
│   │   ├── profile/
│   │   │   └── page.tsx     # Profile editing (routed from settings)
│   │   ├── security/
│   │   │   └── page.tsx     # 2FA management (routed from settings)
│   │   ├── support/
│   │   │   └── page.tsx     # Support center (routed)
│   │   └── developer/
│   │       └── page.tsx     # Developer/API surface (redirects to /api)
│   └── ...
├── components/
│   ├── app-shell.tsx        # Main layout shell (sidebar + mobile nav)
│   ├── design-system.tsx    # Reusable UI components
│   ├── theme-provider.tsx   # Theme context and persistence
│   ├── dashboard/
│   │   ├── messenger-tabs.tsx # Shared messaging nav
│   │   └── ...
│   └── ...
├── lib/
│   ├── api.ts               # API client initialization
│   ├── auth-session-sync.ts # Session synchronization hooks
│   ├── money.ts             # Currency formatting
│   ├── supabase.ts          # Auth setup
│   └── ...
├── store/
│   └── index.ts             # Zustand auth store
└── tailwind.config.js       # Brand tokens and Tailwind setup
```

### Design System

#### Color Palette (apps/web/src/app/globals.css)

```css
--bp-cyber-green: #00FF9D (brand-green)
--bp-black: #000000
--bp-surface: Background surfaces with gradient
--bp-card: Card backgrounds with blend modes
--bp-border-subtle: Subtle dividers
--bp-foreground-muted: Muted text colors
```

#### Typography

- **Headlines**: `.bp-headline` - Font family brand, weight 900, uppercase
- **Labels**: `.bp-label` - Weight 600, uppercase with letter-spacing
- **Body**: Default Inter, 14px, 1.5 line-height
- **Mono**: `.font-mono` for codes, amounts, technical text

#### Spacing Scale

```
--bp-space-2: 8px     --bp-space-8: 32px
--bp-space-4: 16px    --bp-space-10: 40px
--bp-space-6: 24px    --bp-space-12: 48px
```

#### Border Radius

```
--bp-radius-sm: 0.6rem     (for buttons, inputs)
--bp-radius-md: 0.95rem    (for small cards)
--bp-radius-lg: 1.5rem     (for product cards)
--bp-radius-xl: 1.7rem     (for section headers)
```

#### Animations

- **bp-reveal**: Entrance animation (700ms, slide up + blur)
- **bp-reveal-delay**: Staggered entrance (850ms, 120ms delay)
- **bp-button-glow**: Focus/hover glow effect
- **bp-loading-pulse**: Skeleton loading animation
- **bp-orbit-drift**: Floating background effect

### Component Library (design-system.tsx)

**296-line component file** with production-grade primitives:

```typescript
<BpButton variant="primary|secondary|ghost" />
<BpInput placeholder="..." />
<BpTextarea rows={...} />
<BpCard as="article|div" />
<BpTabs active={href} tabs={[]} />
<BpEmptyState title={...} text={...} action={...} />
<BpLoadingState />
<BpFeatureCard icon={Icon} title={...} text={...} />
```

All components:
- Follow Burner Point visual language
- Support dark mode via CSS variables
- Include proper accessibility attributes (labels, ARIA)
- Use `bp-input`, `bp-button`, `bp-card` CSS classes for consistent styling

## Product Surface Implementation

### 1. Dashboard Overview (`/dashboard/page.tsx`)

**Purpose**: Entry point showing account health, active products, and quick actions

**Key Sections**:
- Greeting personalization (morning/afternoon/evening)
- Wallet balance card with available USD balance
- Quick action buttons (Verify, Rent, eSIM, Proxy, VPN, Store)
- Active numbers grid showing status and counts
- Recent transactions display
- Open support tickets summary

**API Calls**:
```typescript
billingApi.overview()      // Wallet, subscriptions, transactions
numbersApi.list()          // Active numbers
supportApi.tickets()       // Open tickets count
```

**Data Flow**:
```
useEffect (on mount)
  → Promise.allSettled([billing, numbers, tickets])
  → setBilling, setNumbers, setTickets
  → useMemo calculate activeNumbers, transactions, openTickets
  → render with loading states
```

### 2. BP Messenger Inbox (`/dashboard/inbox/page.tsx`)

**Purpose**: Thread-based messaging with call credits management

**Key Features**:
- Number selector showing active Burner Point lines
- Thread list with latest message preview and unread indicator
- Message composer with recipient input
- Call credits balance and package purchase UI
- Calling rates for destination countries
- Recent call credit activity
- Contact info sidebar with quick actions (Call, Add Contact, Block/Report)

**Thread Management**:
```typescript
buildThreads(messages)
  → Group by counterpart (to/from number)
  → Sort by latest timestamp
  → Mark unread based on direction + status
  → Return as ConversationThread[]
```

**API Calls**:
```typescript
numbersApi.list()                    // Active numbers
messagesApi.list(numberId)           // Thread messages (10s poll)
callCreditsApi.balance()             // Balance and equivalentUsdCents
callCreditsApi.rates()               // Destination rates
callCreditsApi.transactions(1, 4)    // Last 4 transactions
callCreditsApi.packages()            // Available packages
messagesApi.send({from, to, body})   // Send message
callCreditsApi.purchase({...})       // Buy call credits
```

**State Management**:
```
selectedNumber (number ID)
  ↓
messages (refreshed every 10s)
  ↓
threads (useMemo from messages)
  ↓
selectedThread (filtered from threads)
  ↓
render thread messages + send UI
```

### 3. BP Messenger Calls (`/dashboard/calls/page.tsx`)

**Purpose**: Call dialing, history, and real-time call state

**Key Features**:
- Phone keypad (0-9, *, #)
- Destination input with international format normalization
- Active call state display with real-time updates
- Call history with filtering (all/incoming/outgoing/missed)
- Calling rates lookup
- Call credits balance display

**Call State Management**:
```
useEffect (on active call)
  → Poll callsApi.get(callId) every 5s
  → Update activeCall state
  → Listen for bp:call-updated events (socket)
  → Stop polling when call reaches terminal status
```

**Rate Matching Algorithm**:
```typescript
matchRate(destinationNumber, rates)
  → Sort rates by prefix length (longest first)
  → Find matching prefix
  → Fallback to GLOBAL rate
  → Return rate for creditsPerMinute calculation
```

**API Calls**:
```typescript
numbersApi.list()           // Select from number
callCreditsApi.balance()    // Check balance
callCreditsApi.rates()      // Available rates
callsApi.list(1, 20)       // Call history
callsApi.start({to, fromNumberId, idempotencyKey})  // Initiate call
callsApi.get(callId)       // Poll for updates
```

### 4. BP Verify Hub (`/dashboard/verification/page.tsx`)

**Purpose**: Tiered verification routing with live OTP feed

**Key Features**:
- Tier selector (Premium/Standard/Economy)
- Service selector (WhatsApp, Telegram, Google, etc.)
- Country dropdown with emoji flags
- Available numbers table (up to 8)
- Live OTP display panel
- Active verifications history table

**Number Assignment Flow**:
```
searchNumbers()
  → numbersApi.search(country, undefined, 'verification')
  → setAvailableNumbers (max 8)

assignNumber(phoneNumber)
  → numbersApi.provision({phoneNumber, type: 'verification', ...})
  → setSelectedNumber (starts message polling)
  → Add to history

Message Polling (10s interval)
  → messagesApi.list(numberId)
  → Find latest inbound message
  → Extract OTP from body
  → Update history with "Code received" status
```

**OTP Extraction**:
- Backend extracts `message.extractedOtp` from message body
- Display in large 4-digit format in panel
- Copy to clipboard button for quick use

**API Calls**:
```typescript
numbersApi.search(country, undefined, 'verification')  // Get inventory
numbersApi.provision({...})                             // Assign number
messagesApi.list(numberId)                              // Poll for OTP
```

### 5. BP Number Rentals (`/dashboard/rentals/page.tsx`)

**Purpose**: Search, assign, and manage rental numbers

**Key Features**:
- Country selector (US, CA)
- Number type selector (SMS burner / SMS+Voice rental)
- Duration selector (1w / 1m / 1y)
- Available numbers table with inventory
- Wallet-backed assignment button
- Active rentals management

**Rental Assignment**:
```
searchInventory()
  → numbersApi.search(country, undefined, numberType)
  → setAvailableNumbers

assignWalletRental(phoneNumber)
  → numbersApi.provision({phoneNumber, type, countryCode, durationDays})
  → Toast success
  → Refresh active rentals via refreshNumbers()
```

**Active Rentals Display**:
- Show all numbers with type 'burner' or 'rental'
- Display: number, country, type, expiresAt
- Release/renew actions

**API Calls**:
```typescript
numbersApi.search(country, undefined, numberType)   // Get inventory
numbersApi.provision({...})                         // Assign rental
numbersApi.list()                                   // Refresh active
```

### 6. BP eSIM Store (`/dashboard/esim/page.tsx`)

**Purpose**: eSIM plan lookup and purchasing

**Key Features**:
- Country selector
- Region text input (optional)
- Plan cards showing price, coverage, data, duration
- Order submission with wallet debit
- Order history from ledger

**Plan Normalization**:
```typescript
normalizePlans(payload, countryLabel)
  → Extract from nested response structure
  → Map to consistent PlanCard schema
  → Handle missing fields with fallbacks
```

**Order Flow**:
```
loadPlans()
  → integrationsApi.esimPlans({countryCode, region?})
  → normalizePlans(response.data)
  → setPlans

purchasePlan(planId)
  → integrationsApi.esimOrder({planId, countryCode, idempotencyKey})
  → Check response.status === 'submitted'
  → Display order summary (reference, charge)
```

**API Calls**:
```typescript
integrationsApi.catalog()               // Check channel status
integrationsApi.esimPlans({...})        // Search plans
integrationsApi.esimOrder({...})        // Submit order
billingApi.ledger(1, 20)                // Order history
```

### 7. BP Proxy Store (`/dashboard/proxies/page.tsx`)

**Purpose**: Proxy ordering and management

**Key Features**:
- Region input
- Proxy type selector (Residential / Mobile)
- Duration selector (7 / 30 / 90 days)
- Order summary display
- Channel status (primary vs. fallback)
- Order history

**Order Submission**:
```
submitOrder()
  → integrationsApi.proxyOrder({region, type, durationDays, idempotencyKey})
  → Check response.status === 'submitted'
  → Display order reference and charge
```

**API Calls**:
```typescript
integrationsApi.catalog()               // Channel status
integrationsApi.proxyOrder({...})       // Submit order
billingApi.ledger(1, 20)                // Order history
```

### 8. BP Secure Tunnel (`/dashboard/vpn/page.tsx`)

**Purpose**: VPN/WireGuard session request

**Key Features**:
- Device name input
- Preferred region input
- Session scope summary
- Control plane status
- Recent activity history

**Session Request**:
```
requestSession()
  → integrationsApi.vpnSession({deviceName, region?, idempotencyKey})
  → Check response.status === 'submitted'
  → Display reference and charge
```

**API Calls**:
```typescript
integrationsApi.catalog()               // Channel status
integrationsApi.vpnSession({...})       // Request session
billingApi.ledger(1, 20)                // Activity history
```

### 9. Billing Hub (`/dashboard/billing/page.tsx`)

**Purpose**: Financial overview and account management

**Key Sections**:
- Wallet available balance (USD)
- Local currency conversion (NGN, etc.)
- Call Credits balance and equivalence
- Wallet transactions history
- Call Credits transactions
- Subscriptions status
- Add funds button (link to wallet)

**Billing Model Display**:
```
Subscriptions = access (subscribed products)
Available Balance = purchases (wallet-backed)
Call Credits = Messenger calls (separate pool)
```

**API Calls**:
```typescript
billingApi.overview()  // All billing data in one call
```

**Local Currency Handling**:
```typescript
useLocalCurrency()
  → Detect from localDisplay object
  → Format USD amounts in local currency
  → Show FX rate if available
```

### 10. Settings Hub (`/dashboard/settings/page.tsx`)

**Purpose**: Account and preference management

**Tabs**:
- **Profile**: First/Last name, Email, Phone (read-only display)
- **Billing & Subscription**: Link to /dashboard/billing
- **Support**: Link to /dashboard/support
- **Account**: Appearance, notifications, sign out

**Appearance Theme**:
```typescript
const { preference, setPreference } = useTheme()
// Options: 'light' | 'dark' | 'system'
// Persisted to localStorage via theme-provider
// Applied via data-theme selector on html element
```

**Sign Out Flow**:
```
handleSignOut()
  → authApi.logout(refreshToken)  (best-effort)
  → clearAuth() (Zustand)
  → clearApiSession()
  → supabase.auth.signOut()
  → Redirect to home
```

**API Calls**:
```typescript
authApi.logout(refreshToken)  // Best-effort logout
```

## Navigation Architecture

### App Shell (`components/app-shell.tsx`)

**Desktop (≥1024px)**:
- Left sidebar (20rem width)
- Collapse/expand animation
- Active link highlighting
- User profile block at bottom

**Mobile (<1024px)**:
- Drawer menu (opened via hamburger)
- Fixed bottom navigation (6-8 items)
- Minimized on scroll via transform

**Navigation Groups**:
```typescript
MAIN_NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { href: '/dashboard/inbox', label: 'Messages', icon: MessageSquare },
  { href: '/dashboard/numbers', label: 'Numbers', icon: Phone },
  { href: '/dashboard/store', label: 'Store', icon: ShoppingBag },
]

MANAGE_NAV = [
  { href: '/dashboard/verification', label: 'Verify Hub', icon: ShieldCheck },
  { href: '/dashboard/rentals', label: 'Rentals', icon: RadioTower },
  { href: '/dashboard/esim', label: 'eSIM', icon: Smartphone },
  { href: '/dashboard/proxies', label: 'Proxies', icon: Globe },
  { href: '/dashboard/vpn', label: 'VPN', icon: Lock },
]

DEVELOPER_NAV = [
  { href: '/dashboard/developer', label: 'Developer', icon: Code },
]

ACCOUNT_NAV = [
  { href: '/dashboard/billing', label: 'Billing', icon: CreditCard },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  { href: '/dashboard/support', label: 'Support', icon: HelpCircle },
]
```

### Active Link Detection

```typescript
function isActive(href: string, pathname: string): boolean {
  if (href === '/dashboard') return pathname === '/dashboard'
  return pathname.startsWith(href)
}
```

## API Integration Patterns

### Error Handling

All pages follow this pattern:
```typescript
try {
  const response = await api.method({...})
  // Process response.data
} catch (error: unknown) {
  const message = (error as { response?: { data?: { message?: string } } })
    ?.response?.data?.message
  toast.error(message || 'Default error message')
}
```

### Idempotency Keys

All purchase/creation endpoints use:
```typescript
idempotencyKey: crypto.randomUUID()
```

### Loading States

Pattern across all pages:
```typescript
const [loading, setLoading] = useState(true)
const [data, setData] = useState<Type | null>(null)

useEffect(() => {
  let mounted = true
  loadData()
    .catch(() => toast.error('Unable to load...'))
    .finally(() => { if (mounted) setLoading(false) })
  return () => { mounted = false }
}, [])

// Render: loading ? <Skeleton /> : <Content />
```

### Real-Time Updates

**Polling Pattern** (Inbox, Calls, Verification):
```typescript
useEffect(() => {
  if (!activeId) return
  
  const interval = window.setInterval(() => {
    loadData(activeId)
  }, 10000)  // 10s for messages, 5s for active calls
  
  return () => window.clearInterval(interval)
}, [activeId])
```

**Socket Events** (Call updates):
```typescript
useEffect(() => {
  const handler = (event: Event) => {
    const detail = (event as CustomEvent<CallRecord>).detail
    setCalls(current => [..., detail])
  }
  
  window.addEventListener('bp:call-updated', handler as EventListener)
  return () => window.removeEventListener('bp:call-updated', handler as EventListener)
}, [])
```

### Form Handling Pattern

```typescript
const [form, setForm] = useState({ field1: '', field2: '' })
const [submitting, setSubmitting] = useState(false)

const handleSubmit = async () => {
  setSubmitting(true)
  try {
    const response = await api.create({...form})
    toast.success('Created!')
  } catch (error) {
    toast.error('Failed')
  } finally {
    setSubmitting(false)
  }
}
```

## Styling Guide

### Card Container
```jsx
<div className="rounded-[1.5rem] border border-white/8 bg-brand-card p-5">
  {/* content */}
</div>
```

### Button Hierarchy

**Primary Action** (Conversions):
```jsx
<button className="bg-brand-green text-black hover:bg-[#1cffac]">
  Action
</button>
```

**Secondary Action** (Context):
```jsx
<button className="border border-white/10 text-white/70 hover:border-brand-green/20 hover:text-brand-green">
  Action
</button>
```

**Ghost Action** (Tertiary):
```jsx
<button className="border border-transparent hover:border-brand-green/18 hover:bg-brand-green/6">
  Action
</button>
```

### Input Styling
```jsx
<input className="bp-input" placeholder="..." />
```

**Base State**:
- `min-height: 48px`
- `border: 1px solid rgba(255, 255, 255, 0.1)`
- `background: rgba(0, 0, 0, 0.35)`
- `border-radius: var(--bp-radius-md)`

**Focus State**:
- `border-color: rgba(0, 255, 157, 0.48)`
- `background: rgba(0, 0, 0, 0.48)`
- `box-shadow: 0 0 0 4px rgba(0, 255, 157, 0.08)`

### Grid Layouts

**Responsive Grid**:
```jsx
<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
```

**Specific 3-Column Layout** (Inbox):
```jsx
<div className="grid gap-4 xl:grid-cols-[18rem_minmax(0,1fr)_18rem]">
```

### Typography Classes

```css
.bp-headline     { font-family: brand; font-weight: 900; uppercase; }
.bp-label        { font-weight: 600; uppercase; letter-spacing: 0; }
.bp-metal-text   { color: var(--bp-metal-end); }
```

## Light Mode Support

All pages include light mode styling via:
```css
html[data-theme='light'] .bp-dashboard-shell {
  background-color: #FFFFFF;
  /* Overrides for light backgrounds */
}
```

Text contrast for light mode:
- Primary text: `text-gray-900` / `text-[#1a1a1a]`
- Secondary: `text-gray-600` / `text-[#666666]`
- Muted: `text-gray-400` / `text-[#999999]`

## Mobile Responsive Breakpoints

- **Mobile**: 0px - 640px
  - Single column layouts
  - Full-width cards
  - Stacked navigation
  
- **Tablet**: 641px - 1024px
  - 2-column grids
  - Drawer navigation
  
- **Desktop**: 1025px+
  - 3-4 column grids
  - Sidebar navigation
  - Multi-panel layouts

## Performance Considerations

1. **Code Splitting**: Each dashboard route is a separate chunk
2. **Image Optimization**: All icons from lucide-react (tree-shakeable)
3. **CSS Optimization**: Tailwind purges unused styles in production
4. **API Caching**: No built-in cache (each page loads fresh)
5. **Animation Performance**: Uses `transform: translateZ(0)` and `will-change` for GPU acceleration

## Deployment Checklist

- [ ] Environment variables configured (API_URL, SUPABASE_KEY, etc.)
- [ ] Build completes without warnings: `npm run verify:web`
- [ ] All 70 routes pre-rendered successfully
- [ ] .next artifacts generated and served
- [ ] Theme switching persists across page reloads
- [ ] Socket.io connection established for real-time updates
- [ ] API error handling tested (network, auth, validation)
- [ ] Mobile navigation tested on actual device (iOS/Android)
- [ ] Dark/light mode rendering verified
- [ ] Accessibility audit passed (contrast, labels, ARIA)

## Future Enhancements

1. **Offline Mode**: ServiceWorker for offline messaging queue
2. **Push Notifications**: Web Push API for calls/messages
3. **Analytics**: PostHog integration for user behavior tracking
4. **Internationalization**: Multi-language support via i18n
5. **Advanced Search**: Full-text search across messages/transactions
6. **Bulk Operations**: Select multiple items for batch actions
7. **Custom Shortcuts**: Keyboard shortcuts for power users
8. **Dark Mode Detection**: Automatic theme based on system preference
9. **Voice Input**: Dictation support for message composition
10. **Export Data**: Download billing/transaction history as CSV/PDF

---

**Last Updated**: 2024
**Version**: 1.0.0 - Production Release
**Compatibility**: Next.js 15+, React 18+, TypeScript 5+
