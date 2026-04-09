<div align="center">
  <h1>🔒 BurnerPoint</h1>
  <p><strong>Privacy is not a feature. It is the foundation.</strong></p>
  <p>A production-grade, privacy-first telecommunications platform for provisioning and managing temporary phone numbers with SMS/call handling, OTP verification, multi-gateway payments, and enterprise features.</p>
</div>

---

## 🏗️ Architecture

```
burner-point/
├── apps/
│   ├── api/          # NestJS backend (Port 3001)
│   ├── web/          # Next.js 14 frontend (Port 3000)
│   └── mobile/       # React Native + Expo
├── packages/
│   ├── shared/       # Shared TypeScript types
│   └── sdk/
│       ├── js/       # JavaScript/TypeScript SDK
│       └── python/   # Python SDK
├── infra/
│   └── nginx/        # Reverse proxy config
└── scripts/
    └── setup.sh      # One-command setup
```

## 🚀 Quick Start

```bash
# Clone and setup
git clone https://github.com/yourorg/burner-point.git
cd burner-point

# One-command setup (installs deps, starts DB & Redis)
./scripts/setup.sh

# Fill in credentials
cp .env.example .env
# Edit .env with your Twilio, Paddle, Paystack etc keys

# Start all services
npm run dev
```

## 🔧 Environment Variables

All configuration is via environment variables. See `.env.example` for full reference.

**Required credentials:**
| Variable | Purpose |
|---|---|
| `TWILIO_ACCOUNT_SID` | SMS/call provider |
| `TWILIO_AUTH_TOKEN` | SMS/call provider |
| `TWILIO_VERIFY_SERVICE_SID` | Phone OTP |
| `PAYSTACK_SECRET_KEY` | Nigerian payments |
| `PADDLE_VENDOR_ID` | International payments |
| `JWT_ACCESS_SECRET` | Auth tokens (min 64 chars) |
| `JWT_REFRESH_SECRET` | Refresh tokens (min 64 chars) |
| `DATABASE_URL` | PostgreSQL connection |
| `REDIS_URL` | Redis connection |

## 🗄️ Database

Four SQL migration files run in sequence for a fresh database:

```bash
# Run all migrations
npm run db:migrate
```

- **001_initial_schema.sql** — Core tables (users, phone_numbers, messages, calls)
- **002_extensions.sql** — Billing, abuse, enterprise, API platform
- **003_payments_phone_auth.sql** — Payment sessions, phone OTP, credit packages
- **004_replace_gateways.sql** — Align payment gateway enum values with the current Paddle/NOWPayments code

## 📱 Features

### Backend (NestJS + TypeORM)
- ✅ JWT auth with 15-min access tokens + Redis-backed refresh revocation
- ✅ International phone OTP via Twilio Verify (NG/US/UK/CA prioritized)
- ✅ 7 payment gateways: Paddle, Paystack, Flutterwave, Squad, OPay, Korapay, NOWPayments
- ✅ Number lifecycle TTL engine (cron job, hourly expiry)
- ✅ AI message classification (OTP extraction, spam detection)
- ✅ Real-time WebSocket gateway (Socket.IO)
- ✅ Multi-provider number routing (Twilio primary, Telnyx fallback)
- ✅ Anti-abuse engine with velocity limits and risk scoring
- ✅ Enterprise workspaces with RBAC and audit logging
- ✅ Developer API platform (API keys, webhook delivery)
- ✅ Referral/growth engine
- ✅ Idempotent webhook processing (deduplication table)

### Web (Next.js 14)
- ✅ Login / registration with Zod validation
- ✅ Protected dashboard with sidebar + real-time WebSocket
- ✅ SMS inbox with AI OTP highlighting
- ✅ Number management (search, provision, renew, release)
- ✅ Credit purchasing with all 7 payment gateways
- ✅ API key management
- ✅ Zustand state management
- ✅ Auto JWT refresh

### Mobile (React Native + Expo)
- ✅ Biometric authentication (Face ID / fingerprint)
- ✅ Push notifications via Expo
- ✅ Custom tab bar navigation
- ✅ Home screen with wallet and quick actions
- ✅ Active call screen with timer and controls
- ✅ Space Grotesk + DM Mono typography

## 💳 Payment Gateways

All gateways are fully integrated with webhook verification:

| Gateway | Currency | Use Case |
|---|---|---|
| Paystack | NGN | Primary Nigerian payments |
| Flutterwave | NGN/USD/etc | Pan-African |
| Squad (GTCO) | NGN | Fast local payments |
| OPay | NGN | Mobile money |
| Korapay | NGN | Modern Nigerian payments |
| Paddle | USD/EUR/GBP | International cards |
| NOWPayments | BTC/ETH/USDT | Crypto |

## 🔐 Security

- bcrypt password hashing (rounds=12)
- JWT access tokens (15 min) + Redis-backed refresh revocation
- Twilio webhook signature validation
- Helmet security headers
- CORS allowlist
- Environment-variable-only credentials
- DB_SYNCHRONIZE=false enforced
- Account lockout after 5 failed attempts

## 📊 Tech Stack

| Layer | Technology |
|---|---|
| API Runtime | Node.js 20 + NestJS 10 |
| Database | PostgreSQL 16 + TypeORM |
| Cache / Sessions | Redis 7 |
| SMS / Voice | Twilio (primary), Telnyx (fallback) |
| AI Classification | OpenAI GPT-4o-mini |
| Real-time | Socket.IO |
| Frontend | Next.js 14 + Tailwind CSS |
| Mobile | React Native + Expo 51 |
| Auth | Passport.js + JWT |
| Payments | Paddle SDK + Axios (others) |
| Infra | Docker + Nginx |
| Monorepo | Turborepo |

## 🌐 API Documentation

Swagger UI available at `http://localhost:3001/api/docs` when running locally.

### Key Endpoints

```
POST /auth/register          Register new account
POST /auth/login             Login
POST /auth/refresh           Refresh tokens
POST /phone-auth/send        Send OTP via Twilio Verify
POST /phone-auth/verify      Verify OTP code

GET  /numbers/search         Search available numbers
POST /numbers/provision      Provision a number
GET  /numbers                List my numbers
POST /numbers/:id/renew      Renew a number
DELETE /numbers/:id          Release a number

GET  /messages               List messages
POST /messages               Send SMS

GET  /payments/packages      Credit packages
POST /payments/initialize    Start payment
POST /payments/webhook/:gw   Payment webhook

GET  /users/me               My profile
GET  /users/me/wallet        Wallet balance

POST /developer/keys         Create API key
GET  /developer/keys         List API keys
POST /developer/webhooks     Register webhook

POST /enterprise/workspaces  Create workspace
GET  /enterprise/workspaces/:id/members  List members
```

## 📦 SDKs

### JavaScript / TypeScript

```typescript
import BurnerPoint from '@burner-point/sdk';

const bp = new BurnerPoint({ apiKey: 'bp_your_key' });

// Search and provision a number
const available = await bp.numbers.search('US');
const number = await bp.numbers.provision(available[0].number, 'burner', 'US');

// List messages
const messages = await bp.messages.list(number.id);
```

### Python

```python
from burnerpoint import BurnerPoint

with BurnerPoint(api_key="bp_your_key") as bp:
    # Provision a Nigerian number
    numbers = bp.numbers.search("NG")
    number = bp.numbers.provision(numbers[0]["number"], "burner", "NG")
    print(f"Got: {number['number']}")
```

## 🏢 Brand Identity

- **Colors:** Deep Black `#0A0A0A` · Cyber Green `#00FF9D`
- **Typography:** Space Grotesk (headings) · DM Mono (numbers/code)
- **Tagline:** *Privacy is not a feature. It is the foundation.*

## 📄 License

MIT © BurnerPoint
