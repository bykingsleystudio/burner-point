# BurnerPoint Payment Gateway Migration Checklist
# Stripe + Coinbase → Paddle + NOWPayments

## Before You Start

```powershell
# Make sure Docker is running and dev server is stopped
docker compose ps  # postgres and redis should show "healthy"
# Press Ctrl+C in any terminal running npm run dev
```

---

## Step 1 — Update environment variables

Open `burner-point/.env` and make these changes:

### DELETE these lines entirely:
```
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
STRIPE_PUBLISHABLE_KEY=...
CRYPTO_COINBASE_API_KEY=...
CRYPTO_COINBASE_WEBHOOK_SECRET=...
```

### ADD these lines:
```env
# Paddle
PADDLE_VENDOR_ID=your_paddle_vendor_id
PADDLE_API_KEY=your_paddle_api_key
PADDLE_PUBLIC_KEY=your_paddle_public_key
PADDLE_WEBHOOK_SECRET=your_paddle_webhook_secret
PADDLE_SANDBOX=true
PADDLE_PRICE_STARTER=pri_xxxxxxxxxxxxxxxx
PADDLE_PRICE_BASIC=pri_xxxxxxxxxxxxxxxx
PADDLE_PRICE_VALUE=pri_xxxxxxxxxxxxxxxx
PADDLE_PRICE_PRO=pri_xxxxxxxxxxxxxxxx
PADDLE_PRICE_POWER=pri_xxxxxxxxxxxxxxxx
PADDLE_PRICE_BUSINESS=pri_xxxxxxxxxxxxxxxx

# NOWPayments
NOWPAYMENTS_API_KEY=your_nowpayments_api_key
NOWPAYMENTS_IPN_SECRET=your_nowpayments_ipn_secret
NOWPAYMENTS_SANDBOX=true
```

---

## Step 2 — Run the database migration

```powershell
cd C:\Users\HP\projects\burner-point\burner-point

# Connect to the running Postgres container and run migration 004
docker compose exec postgres psql -U burnerpoint -d burnerpoint -f /dev/stdin < apps/api/src/database/migrations/004_replace_gateways.sql
```

If the above doesn't work on Windows, use:
```powershell
Get-Content apps/api/src/database/migrations/004_replace_gateways.sql | docker compose exec -T postgres psql -U burnerpoint -d burnerpoint
```

Expected output: multiple ALTER TYPE, UPDATE lines, no ERRORs.

---

## Step 3 — Replace backend files

Copy these files from the migration bundle to your project:

| Source (from bundle)                                   | Destination (in your project)                                      |
|-------------------------------------------------------|--------------------------------------------------------------------|
| `api/modules/payments/payments.service.ts`            | `apps/api/src/modules/payments/payments.service.ts`                |
| `api/modules/payments/payments.controller.ts`         | `apps/api/src/modules/payments/payments.controller.ts`             |
| `api/modules/payments/payments.module.ts`             | `apps/api/src/modules/payments/payments.module.ts`                 |
| `api/main.ts`                                         | `apps/api/src/main.ts`                                             |

**PowerShell commands:**
```powershell
$base = "C:\Users\HP\projects\burner-point\burner-point"
$bundle = "PATH_TO_BUNDLE_FOLDER"  # update this to wherever you extracted the bundle

Copy-Item "$bundle\api\modules\payments\payments.service.ts" "$base\apps\api\src\modules\payments\payments.service.ts"
Copy-Item "$bundle\api\modules\payments\payments.controller.ts" "$base\apps\api\src\modules\payments\payments.controller.ts"
Copy-Item "$bundle\api\modules\payments\payments.module.ts" "$base\apps\api\src\modules\payments\payments.module.ts"
Copy-Item "$bundle\api\main.ts" "$base\apps\api\src\main.ts"
```

---

## Step 4 — Update the PaymentGateway enum

Open `apps/api/src/database/entities/extended-entities.ts`.

Find:
```typescript
export enum PaymentGateway {
  STRIPE = 'stripe',
  PAYSTACK = 'paystack',
  FLUTTERWAVE = 'flutterwave',
  SQUAD = 'squad',
  OPAY = 'opay',
  KORAPAY = 'korapay',
  CRYPTO = 'crypto'
}
```

Replace with:
```typescript
export enum PaymentGateway {
  FLUTTERWAVE  = 'flutterwave',
  PAYSTACK     = 'paystack',
  SQUAD        = 'squad',
  KORAPAY      = 'korapay',
  OPAY         = 'opay',
  PADDLE       = 'paddle',
  NOWPAYMENTS  = 'nowpayments',
}
```

---

## Step 5 — Update the package.json dependencies

```powershell
cd C:\Users\HP\projects\burner-point\burner-point\apps\api

# Remove Stripe SDK (no longer needed)
npm uninstall stripe

# Axios is already installed — Paddle and NOWPayments use it directly
# No new dependencies required
```

---

## Step 6 — Replace frontend credits page

```powershell
$base = "C:\Users\HP\projects\burner-point\burner-point"
$bundle = "PATH_TO_BUNDLE_FOLDER"

Copy-Item "$bundle\web\credits\page.tsx" "$base\apps\web\src\app\dashboard\credits\page.tsx"
Copy-Item "$bundle\web\credits\mobile-credits.tsx" "$base\apps\mobile\src\app\(tabs)\credits.tsx"
```

---

## Step 7 — Update lib/api.ts (web)

Open `apps/web/src/lib/api.ts`.

Find the `paymentsApi` export and replace it with:
```typescript
export type PaymentGatewayId =
  | 'flutterwave'
  | 'paystack'
  | 'squad'
  | 'korapay'
  | 'opay'
  | 'paddle'
  | 'nowpayments';

export interface InitPaymentParams {
  packageId: string;
  gateway: PaymentGatewayId;
}

export const paymentsApi = {
  packages: () => api.get('/payments/packages'),
  initialize: (data: InitPaymentParams) =>
    api.post('/payments/initialize', data),
  history: () => api.get('/payments/history'),
};
```

---

## Step 8 — Update credit_packages seeder

Open `apps/api/src/database/migrations/003_payments_phone_auth.sql`.

Find the INSERT for credit_packages and update the `available_gateways` array to remove `stripe`/`crypto` and add `paddle`/`nowpayments`:

```sql
-- Update the available_gateways values (replace existing INSERT or run UPDATE)
UPDATE credit_packages SET available_gateways = 
  '{flutterwave,paystack,squad,korapay,opay,paddle,nowpayments}';
```

Run this directly:
```powershell
$sql = "UPDATE credit_packages SET available_gateways = '{flutterwave,paystack,squad,korapay,opay,paddle,nowpayments}';"
echo $sql | docker compose exec -T postgres psql -U burnerpoint -d burnerpoint
```

---

## Step 9 — Place SVG brand assets

```powershell
# Create the assets folder
New-Item -ItemType Directory -Force -Path "C:\Users\HP\projects\burner-point\burner-point\apps\web\public\assets"
```

Then copy your three SVG files into that folder:
- `logo.svg`       — full horizontal brand logo
- `logo-mark.svg`  — icon/mark only
- `icon.svg`       — small favicon version

See `SVG_PLACEMENT_GUIDE.md` for detailed component integration instructions.

---

## Step 10 — Verify TypeScript compiles

```powershell
cd C:\Users\HP\projects\burner-point\burner-point\apps\api
npx tsc --noEmit
# Expected: silence (zero errors)
```

---

## Step 11 — Start the dev server and test

```powershell
cd C:\Users\HP\projects\burner-point\burner-point
npm run dev
```

Open `http://localhost:3000/dashboard/credits` and verify:
1. ✅ All 7 payment methods appear
2. ✅ Nigerian gateways (Flutterwave, Paystack, Squad, Korapay, OPay) are at the top
3. ✅ Paddle and NOWPayments are in the "International" section below
4. ✅ No mention of Stripe or Coinbase anywhere in the UI
5. ✅ Crypto info box appears when NOWPayments is selected
6. ✅ International cards info box appears when Paddle is selected

---

## Step 12 — Register webhooks (after Railway deploy)

Once deployed, register these webhook URLs in each provider dashboard:

| Provider     | Webhook URL                                         |
|-------------|-----------------------------------------------------|
| Paddle       | `https://api.yourdomain.com/payments/webhook/paddle` |
| NOWPayments  | `https://api.yourdomain.com/payments/webhook/nowpayments` |
| Flutterwave  | `https://api.yourdomain.com/payments/webhook/flutterwave` (unchanged) |
| Paystack     | `https://api.yourdomain.com/payments/webhook/paystack` (unchanged) |

**Paddle webhook setup:**
1. vendors.paddle.com → Developer Tools → Notifications → Add destination
2. URL: `https://api.yourdomain.com/payments/webhook/paddle`
3. Events: `transaction.completed`, `transaction.payment_failed`
4. Copy the "Secret Key" → `PADDLE_WEBHOOK_SECRET` in Railway

**NOWPayments IPN setup:**
1. nowpayments.io → My Account → IPN Settings
2. IPN callback URL: `https://api.yourdomain.com/payments/webhook/nowpayments`
3. Copy the IPN secret key → `NOWPAYMENTS_IPN_SECRET` in Railway

---

## Step 13 — Paddle product setup (required before Paddle payments work)

Paddle requires pre-created products and prices in the dashboard:

1. vendors.paddle.com → Catalog → Products → New Product
   - Create one product: "BurnerPoint Credits"
2. Catalog → Prices → New Price (create 6, one per credit package)
   - Type: One-time
   - Amount: use USD equivalent of each package (₦500 ≈ $0.31, ₦5000 ≈ $3.13, etc.)
3. Copy each Price ID (starts with `pri_`) into `.env`:
   - PADDLE_PRICE_STARTER, PADDLE_PRICE_BASIC, etc.
   - Order matches sortOrder in credit_packages table (0=Starter, 1=Basic, etc.)

---

## Verification Checklist

```
[ ] .env updated — Stripe/Coinbase keys removed, Paddle/NOWPayments added
[ ] Migration 004 ran — no SQL errors
[ ] PaymentGateway enum updated in extended-entities.ts
[ ] stripe package uninstalled from apps/api
[ ] payments.service.ts replaced
[ ] payments.controller.ts replaced
[ ] payments.module.ts replaced
[ ] main.ts has rawBody: true
[ ] credits/page.tsx replaced (web)
[ ] credits.tsx replaced (mobile)
[ ] lib/api.ts paymentsApi updated
[ ] credit_packages.available_gateways updated in DB
[ ] SVG files placed in apps/web/public/assets/
[ ] npx tsc --noEmit passes with 0 errors
[ ] Dev server starts without errors
[ ] Credits page shows 7 gateways in correct order
[ ] No "Stripe" or "Coinbase" text appears anywhere in the UI
[ ] Paddle products and price IDs configured in dashboard
[ ] NOWPayments IPN URL registered
[ ] Railway env vars updated with Paddle/NOWPayments keys
[ ] Paddle webhook registered in Paddle dashboard
[ ] NOWPayments IPN registered in NOWPayments dashboard
```
