# Burner Point RevenueCat Setup

RevenueCat is Burner Point's mobile subscription entitlement system. It does not replace wallet funding, Paystack, Flutterwave, Paddle, or NOWPayments. It manages App Store and Google Play subscriptions for:

- BP Messenger Pro
- BP Secure Tunnel
- BP Premium

## Environment Variables

Server-only:

```env
REVENUECAT_SECRET_API_KEY=
REVENUECAT_WEBHOOK_AUTHORIZATION=
REVENUECAT_WEBHOOK_SECRET=
REVENUECAT_PROJECT_ID=
REVENUECAT_ENTITLEMENT_BP_MESSENGER=bp_messenger_pro
REVENUECAT_ENTITLEMENT_BP_SECURE_TUNNEL=bp_secure_tunnel
REVENUECAT_ENTITLEMENT_BP_PREMIUM=bp_premium
REVENUECAT_OFFERING_DEFAULT=default
REVENUECAT_OFFERING_MESSENGER=bp_messenger
REVENUECAT_OFFERING_VPN=bp_secure_tunnel
```

Public mobile SDK keys:

```env
EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY=
EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY=
```

Optional future web billing:

```env
NEXT_PUBLIC_REVENUECAT_WEB_API_KEY=
```

## Dashboard Setup

1. Create or open the Burner Point RevenueCat project.
2. Add iOS and Android apps under the same project.
3. Copy the public Apple and Google SDK keys into Expo public env.
4. Create a v2 secret API key with customer read access for customer state and active entitlements.
5. Create entitlements:
   - `bp_messenger_pro`
   - `bp_secure_tunnel`
   - `bp_premium`
6. Create offerings:
   - `default`
   - `bp_messenger`
   - `bp_secure_tunnel`
7. Map App Store and Google Play products to the correct entitlements and packages.

## Webhook Setup

Configure a RevenueCat webhook with:

- URL: `https://api.burnerpoint.com/api/webhooks/revenuecat`
- Authorization header value: the exact value stored in `REVENUECAT_WEBHOOK_AUTHORIZATION`

Burner Point verifies that header, deduplicates by RevenueCat event `id`, fetches the latest customer state from RevenueCat API v2, and syncs:

- `subscriptions`
- `subscription_entitlements`
- `revenuecat_events`

## Burner Point Runtime Flow

1. Mobile app signs in with Supabase Auth.
2. Mobile app configures RevenueCat with the platform public SDK key.
3. Mobile app logs into RevenueCat with the Supabase user ID as the App User ID.
4. Mobile app fetches offerings and displays store packages.
5. After purchase or restore, mobile app calls `POST /api/billing/entitlements/refresh`.
6. RevenueCat webhook independently syncs the latest entitlement state into Supabase-backed tables.
7. API and mobile UI check active entitlements before opening premium surfaces.

## Entitlement Rules

- `bp_messenger_pro`: required for BP Messenger premium access.
- `bp_secure_tunnel`: required for BP Secure Tunnel subscription access.
- `bp_premium`: may unlock both messenger and secure tunnel premium access.

## Supabase Migrations

Apply:

1. `supabase/migrations/0001_initial_schema.sql`
2. `supabase/migrations/0002_rls_policies.sql`
3. `supabase/migrations/0003_revenuecat_subscriptions.sql`

## Testing Checklist

Sandbox or staged test:

1. Install a native iOS build and a native Android build. RevenueCat purchases are not fully testable with web-only or OTA-only flows.
2. Sign in with a Supabase-backed user.
3. Open mobile billing and confirm offerings load.
4. Purchase a BP Messenger package and verify:
   - RevenueCat purchase succeeds
   - `GET /api/billing/entitlements` shows `bp_messenger_pro`
   - inbox and messages premium access unlock
5. Purchase or restore a BP Secure Tunnel package and verify:
   - RevenueCat purchase or restore succeeds
   - `GET /api/billing/entitlements` shows `bp_secure_tunnel`
   - secure tunnel product access unlocks
6. Trigger a dashboard test webhook in RevenueCat and verify the API accepts it with the configured authorization header.
7. Confirm duplicate webhook deliveries do not create duplicate rows or inconsistent entitlement state.
8. Confirm App User ID in RevenueCat matches the Supabase user ID.
9. Confirm Railway logs never expose the RevenueCat secret key or raw authorization header value.

Production launch checks:

1. RevenueCat project uses live App Store Connect and Google Play products, not test-only products.
2. Railway has live `REVENUECAT_SECRET_API_KEY`, `REVENUECAT_PROJECT_ID`, and webhook auth env.
3. Expo production env has the correct live public iOS and Android SDK keys.
4. App Store and Google Play subscription products are approved and available to the release tracks being tested.
5. At least one real renewal, restore, and cancellation flow is verified before broad rollout.
