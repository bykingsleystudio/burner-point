export type BackendIntegrationId =
  | 'revenuecat'
  | 'twilio'
  | 'telnyx'
  | 'bandwidth'
  | 'openai'
  | 'airalo'
  | 'oxylabs'
  | 'smartproxy'
  | 'wireguard'
  | 'paystack'
  | 'flutterwave'
  | 'korapay'
  | 'paddle'
  | 'nowpayments'
  | 'resend'
  | 'supabase-auth'
  | 'supabase-postgres'
  | 'sentry'
  | 'railway'
  | 'dbeaver'
  | 's3'
  | 'posthog'
  | 'expo';

export interface BackendEndpointContract {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'ALL';
  path: string;
  auth: 'public' | 'user' | 'admin' | 'provider-signature';
  purpose: string;
}

export interface BackendIntegrationContract {
  id: BackendIntegrationId;
  name: string;
  category: 'telecom' | 'ai' | 'connectivity' | 'privacy' | 'payments' | 'email' | 'auth' | 'data' | 'observability' | 'operations' | 'mobile';
  backendOnly: true;
  secretEnv: string[];
  optionalEnv: string[];
  publicClientEnv: string[];
  frontendRule: string;
  endpoints: BackendEndpointContract[];
}

export const BACKEND_INTEGRATION_CONTRACTS: BackendIntegrationContract[] = [
  {
    id: 'revenuecat',
    name: 'RevenueCat',
    category: 'payments',
    backendOnly: true,
    secretEnv: ['REVENUECAT_SECRET_API_KEY', 'REVENUECAT_PROJECT_ID'],
    optionalEnv: [
      'REVENUECAT_WEBHOOK_AUTHORIZATION',
      'REVENUECAT_WEBHOOK_SECRET',
      'REVENUECAT_ENTITLEMENT_BP_MESSENGER',
      'REVENUECAT_ENTITLEMENT_BP_SECURE_TUNNEL',
      'REVENUECAT_ENTITLEMENT_BP_PREMIUM',
      'REVENUECAT_OFFERING_DEFAULT',
      'REVENUECAT_OFFERING_MESSENGER',
      'REVENUECAT_OFFERING_VPN',
    ],
    publicClientEnv: [
      'EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY',
      'EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY',
      'NEXT_PUBLIC_REVENUECAT_WEB_API_KEY',
    ],
    frontendRule: 'Use RevenueCat public SDK keys on mobile only; the Burner Point backend verifies webhooks and syncs entitlements into Supabase-backed tables.',
    endpoints: [
      { method: 'POST', path: '/webhooks/revenuecat', auth: 'provider-signature', purpose: 'Receive RevenueCat subscription lifecycle webhooks' },
      { method: 'GET', path: '/billing/entitlements', auth: 'user', purpose: 'Return the user entitlement snapshot synced from RevenueCat' },
      { method: 'POST', path: '/billing/entitlements/refresh', auth: 'user', purpose: 'Force a backend RevenueCat resync after purchase or restore' },
    ],
  },
  {
    id: 'twilio',
    name: 'Twilio',
    category: 'telecom',
    backendOnly: true,
    secretEnv: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_VERIFY_SERVICE_SID'],
    optionalEnv: ['TWILIO_API_KEY', 'TWILIO_API_SECRET', 'TWILIO_DEFAULT_FROM', 'TWILIO_WEBHOOK_SECRET'],
    publicClientEnv: [],
    frontendRule: 'Use /phone-auth, /numbers, /messages, and /webhooks/twilio routes only.',
    endpoints: [
      { method: 'POST', path: '/phone-auth/send', auth: 'user', purpose: 'Send Twilio Verify OTP server-side' },
      { method: 'POST', path: '/phone-auth/verify', auth: 'user', purpose: 'Verify Twilio OTP server-side' },
      { method: 'POST', path: '/webhooks/twilio/sms', auth: 'provider-signature', purpose: 'Receive Twilio inbound SMS/MMS' },
      { method: 'POST', path: '/webhooks/twilio/voice', auth: 'provider-signature', purpose: 'Receive Twilio voice calls' },
      { method: 'POST', path: '/webhooks/twilio/status', auth: 'provider-signature', purpose: 'Receive Twilio delivery status' },
    ],
  },
  {
    id: 'telnyx',
    name: 'Telnyx',
    category: 'telecom',
    backendOnly: true,
    secretEnv: ['TELNYX_API_KEY'],
    optionalEnv: ['TELNYX_MESSAGING_PROFILE_ID', 'TELNYX_CONNECTION_ID', 'TELNYX_WEBHOOK_SECRET'],
    publicClientEnv: [],
    frontendRule: 'Use Burner Point messaging, verification, and number routes; never call Telnyx from clients.',
    endpoints: [
      { method: 'POST', path: '/messaging/sms/send', auth: 'user', purpose: 'Send routed SMS through Telnyx fallback infrastructure' },
      { method: 'GET', path: '/numbers/search', auth: 'user', purpose: 'Search Telnyx-backed conversation inventory through the backend' },
      { method: 'POST', path: '/webhooks/telnyx', auth: 'provider-signature', purpose: 'Receive Telnyx messaging and number lifecycle events' },
    ],
  },
  {
    id: 'bandwidth',
    name: 'Bandwidth',
    category: 'telecom',
    backendOnly: true,
    secretEnv: ['BANDWIDTH_ACCOUNT_ID', 'BANDWIDTH_USERNAME', 'BANDWIDTH_PASSWORD'],
    optionalEnv: [
      'BANDWIDTH_API_TOKEN',
      'BANDWIDTH_MESSAGING_APPLICATION_ID',
      'BANDWIDTH_VOICE_APPLICATION_ID',
      'BANDWIDTH_SITE_ID',
      'BANDWIDTH_SIPPEER_ID',
      'BANDWIDTH_WEBHOOK_SECRET',
    ],
    publicClientEnv: [],
    frontendRule: 'Use Burner Point messaging, calling, numbers, and verification flows only; Bandwidth remains server-side.',
    endpoints: [
      { method: 'POST', path: '/messaging/sms/send', auth: 'user', purpose: 'Send routed SMS through Bandwidth when selected by provider routing' },
      { method: 'GET', path: '/numbers/search', auth: 'user', purpose: 'Search Bandwidth-backed North America inventory through the backend' },
      { method: 'POST', path: '/webhooks/bandwidth', auth: 'provider-signature', purpose: 'Receive Bandwidth messaging and delivery events' },
      { method: 'POST', path: '/webhooks/bandwidth/voice', auth: 'provider-signature', purpose: 'Respond to Bandwidth voice callbacks with BXML' },
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    category: 'ai',
    backendOnly: true,
    secretEnv: ['OPENAI_API_KEY'],
    optionalEnv: ['OPENAI_MODEL', 'AI_KILL_SWITCH'],
    publicClientEnv: [],
    frontendRule: 'Use backend AI/messaging routes only; OpenAI key is never exposed.',
    endpoints: [
      { method: 'POST', path: '/webhooks/twilio/sms', auth: 'provider-signature', purpose: 'Classify inbound messages asynchronously' },
      { method: 'GET', path: '/platform/readiness', auth: 'public', purpose: 'Expose AI kill-switch state without secrets' },
    ],
  },
  {
    id: 'airalo',
    name: 'Airalo',
    category: 'connectivity',
    backendOnly: true,
    secretEnv: ['AIRALO_API_KEY', 'AIRALO_API_SECRET'],
    optionalEnv: ['AIRALO_BASE_URL', 'AIRALO_PLANS_PATH', 'AIRALO_ORDER_PATH', 'AIRALO_WEBHOOK_SECRET'],
    publicClientEnv: [],
    frontendRule: 'Use /integrations/esim routes; never call Airalo directly from clients.',
    endpoints: [
      { method: 'POST', path: '/integrations/esim/plans', auth: 'user', purpose: 'Query configured Airalo eSIM catalog endpoint' },
      { method: 'POST', path: '/integrations/esim/orders', auth: 'user', purpose: 'Create configured Airalo eSIM order' },
      { method: 'POST', path: '/webhooks/airalo', auth: 'provider-signature', purpose: 'Normalize Airalo webhook events' },
    ],
  },
  {
    id: 'oxylabs',
    name: 'Oxylabs',
    category: 'connectivity',
    backendOnly: true,
    secretEnv: ['OXYLABS_USERNAME', 'OXYLABS_PASSWORD'],
    optionalEnv: ['OXYLABS_BASE_URL', 'OXYLABS_PROXY_ORDER_PATH', 'OXYLABS_WEBHOOK_SECRET'],
    publicClientEnv: [],
    frontendRule: 'Use /integrations/proxies routes; Oxylabs credentials stay server-side.',
    endpoints: [
      { method: 'POST', path: '/integrations/proxies/orders', auth: 'user', purpose: 'Create configured Oxylabs proxy order' },
      { method: 'POST', path: '/webhooks/oxylabs', auth: 'provider-signature', purpose: 'Normalize Oxylabs webhook events' },
    ],
  },
  {
    id: 'smartproxy',
    name: 'Smartproxy',
    category: 'connectivity',
    backendOnly: true,
    secretEnv: ['SMARTPROXY_API_KEY'],
    optionalEnv: ['SMARTPROXY_BASE_URL', 'SMARTPROXY_PROXY_ORDER_PATH', 'SMARTPROXY_WEBHOOK_SECRET'],
    publicClientEnv: [],
    frontendRule: 'Use /integrations/proxies routes; Smartproxy stays a backend fallback for proxy fulfillment.',
    endpoints: [
      { method: 'POST', path: '/integrations/proxies/orders', auth: 'user', purpose: 'Fallback proxy order path when Smartproxy is selected by backend routing' },
      { method: 'POST', path: '/webhooks/smartproxy', auth: 'provider-signature', purpose: 'Normalize Smartproxy webhook events' },
    ],
  },
  {
    id: 'wireguard',
    name: 'WireGuard',
    category: 'privacy',
    backendOnly: true,
    secretEnv: ['WIREGUARD_PRIVATE_KEY', 'WIREGUARD_SERVER_ENDPOINT'],
    optionalEnv: ['WIREGUARD_CONTROL_BASE_URL', 'WIREGUARD_CONTROL_API_KEY', 'WIREGUARD_SESSION_PATH', 'WIREGUARD_WEBHOOK_SECRET'],
    publicClientEnv: [],
    frontendRule: 'Use /integrations/vpn routes; server private keys never enter clients.',
    endpoints: [
      { method: 'POST', path: '/integrations/vpn/sessions', auth: 'user', purpose: 'Request backend-generated VPN session/config lifecycle' },
      { method: 'POST', path: '/webhooks/wireguard', auth: 'provider-signature', purpose: 'Normalize WireGuard control-plane events' },
    ],
  },
  {
    id: 'paystack',
    name: 'Paystack',
    category: 'payments',
    backendOnly: true,
    secretEnv: ['PAYSTACK_SECRET_KEY'],
    optionalEnv: ['PAYSTACK_PUBLIC_KEY', 'PAYSTACK_WEBHOOK_SECRET', 'OPEN_EXCHANGE_RATES_APP_ID'],
    publicClientEnv: [],
    frontendRule: 'Use /payments/initialize; checkout URLs are created server-side.',
    endpoints: [
      { method: 'POST', path: '/payments/initialize', auth: 'user', purpose: 'Create Paystack checkout session' },
      { method: 'POST', path: '/webhooks/paystack', auth: 'provider-signature', purpose: 'Recommended Paystack webhook alias for provider dashboards' },
      { method: 'POST', path: '/payments/webhook/paystack', auth: 'provider-signature', purpose: 'Confirm payment and fulfill product' },
    ],
  },
  {
    id: 'flutterwave',
    name: 'Flutterwave',
    category: 'payments',
    backendOnly: true,
    secretEnv: ['FLUTTERWAVE_SECRET_KEY'],
    optionalEnv: ['FLUTTERWAVE_WEBHOOK_SECRET', 'SECONDARY_GATEWAYS_ENABLED'],
    publicClientEnv: [],
    frontendRule: 'Deferred gateway; enable only after core revenue flow is stable.',
    endpoints: [
      { method: 'POST', path: '/payments/initialize', auth: 'user', purpose: 'Create Flutterwave checkout when secondary gateways are enabled' },
      { method: 'POST', path: '/webhooks/flutterwave', auth: 'provider-signature', purpose: 'Recommended Flutterwave webhook alias for provider dashboards' },
      { method: 'POST', path: '/payments/webhook/flutterwave', auth: 'provider-signature', purpose: 'Confirm payment and fulfill product' },
    ],
  },
  {
    id: 'korapay',
    name: 'Korapay',
    category: 'payments',
    backendOnly: true,
    secretEnv: ['KORAPAY_SECRET_KEY'],
    optionalEnv: ['KORAPAY_WEBHOOK_SECRET', 'SECONDARY_GATEWAYS_ENABLED'],
    publicClientEnv: [],
    frontendRule: 'Deferred gateway; enable only after core revenue flow is stable.',
    endpoints: [
      { method: 'POST', path: '/payments/initialize', auth: 'user', purpose: 'Create Korapay checkout when secondary gateways are enabled' },
      { method: 'POST', path: '/webhooks/korapay', auth: 'provider-signature', purpose: 'Recommended Korapay webhook alias for provider dashboards' },
      { method: 'POST', path: '/payments/webhook/korapay', auth: 'provider-signature', purpose: 'Confirm payment and fulfill product' },
    ],
  },
  {
    id: 'paddle',
    name: 'Paddle',
    category: 'payments',
    backendOnly: true,
    secretEnv: ['PADDLE_API_KEY', 'PADDLE_WEBHOOK_SECRET'],
    optionalEnv: ['PADDLE_PRICE_VERIFICATION', 'PADDLE_PRICE_RENTAL', 'PADDLE_PRICE_SUB_MONTHLY', 'PADDLE_CLIENT_TOKEN'],
    publicClientEnv: ['NEXT_PUBLIC_PADDLE_CLIENT_TOKEN'],
    frontendRule: 'Use /payments/initialize; API key and price IDs stay server-side.',
    endpoints: [
      { method: 'POST', path: '/payments/initialize', auth: 'user', purpose: 'Create Paddle checkout session' },
      { method: 'POST', path: '/webhooks/paddle', auth: 'provider-signature', purpose: 'Recommended Paddle webhook alias for provider dashboards' },
      { method: 'POST', path: '/payments/webhook/paddle', auth: 'provider-signature', purpose: 'Confirm transaction/subscription events' },
    ],
  },
  {
    id: 'nowpayments',
    name: 'NOWPayments',
    category: 'payments',
    backendOnly: true,
    secretEnv: ['NOWPAYMENTS_API_KEY', 'NOWPAYMENTS_IPN_SECRET'],
    optionalEnv: [],
    publicClientEnv: [],
    frontendRule: 'Use /payments/initialize; crypto invoices are created server-side.',
    endpoints: [
      { method: 'POST', path: '/payments/initialize', auth: 'user', purpose: 'Create crypto invoice' },
      { method: 'POST', path: '/webhooks/nowpayments', auth: 'provider-signature', purpose: 'Recommended NOWPayments webhook alias for provider dashboards' },
      { method: 'POST', path: '/payments/webhook/nowpayments', auth: 'provider-signature', purpose: 'Confirm crypto settlement' },
    ],
  },
  {
    id: 'resend',
    name: 'Resend',
    category: 'email',
    backendOnly: true,
    secretEnv: ['RESEND_API_KEY'],
    optionalEnv: ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM', 'EMAIL_FROM'],
    publicClientEnv: [],
    frontendRule: 'Use /messaging/email routes; email providers stay server-side.',
    endpoints: [
      { method: 'POST', path: '/messaging/email/send', auth: 'user', purpose: 'Send transactional email' },
    ],
  },
  {
    id: 'supabase-auth',
    name: 'Supabase Auth',
    category: 'auth',
    backendOnly: true,
    secretEnv: ['SUPABASE_SERVICE_ROLE_KEY'],
    optionalEnv: ['SUPABASE_URL', 'SUPABASE_ANON_KEY'],
    publicClientEnv: ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'EXPO_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_ANON_KEY'],
    frontendRule: 'Clients authenticate with Supabase public keys only; API exchanges Supabase sessions server-side.',
    endpoints: [
      { method: 'POST', path: '/auth/supabase/exchange', auth: 'public', purpose: 'Exchange Supabase session token for Burner Point API session' },
      { method: 'POST', path: '/auth/password/reset', auth: 'public', purpose: 'Trigger Supabase password reset flow through the API' },
      { method: 'POST', path: '/phone-auth/send', auth: 'user', purpose: 'Initiate Twilio-backed phone verification tied to a Supabase-authenticated user' },
    ],
  },
  {
    id: 'supabase-postgres',
    name: 'Supabase Postgres',
    category: 'data',
    backendOnly: true,
    secretEnv: ['DATABASE_URL', 'DIRECT_DATABASE_URL'],
    optionalEnv: ['POOLER_URL', 'DB_SSL', 'DB_SSL_REJECT_UNAUTHORIZED'],
    publicClientEnv: [],
    frontendRule: 'Clients never connect to the database.',
    endpoints: [
      { method: 'GET', path: '/platform/readiness', auth: 'public', purpose: 'Expose database configuration status without connection string' },
    ],
  },
  {
    id: 'sentry',
    name: 'Sentry',
    category: 'observability',
    backendOnly: true,
    secretEnv: ['SENTRY_DSN'],
    optionalEnv: ['SENTRY_AUTH_TOKEN', 'SENTRY_ORG', 'SENTRY_PROJECT'],
    publicClientEnv: ['NEXT_PUBLIC_SENTRY_DSN', 'EXPO_PUBLIC_SENTRY_DSN'],
    frontendRule: 'Runtime DSNs may be public; auth token and release metadata stay in server/CI env.',
    endpoints: [
      { method: 'GET', path: '/platform/readiness', auth: 'public', purpose: 'Expose Sentry readiness without secrets' },
    ],
  },
  {
    id: 'railway',
    name: 'Railway',
    category: 'operations',
    backendOnly: true,
    secretEnv: ['RAILWAY_ENVIRONMENT'],
    optionalEnv: ['API_URL', 'APP_URL'],
    publicClientEnv: [],
    frontendRule: 'Clients call the deployed Burner Point API URL, never Railway internals.',
    endpoints: [
      { method: 'GET', path: '/health', auth: 'public', purpose: 'Railway health check' },
    ],
  },
  {
    id: 'dbeaver',
    name: 'DBeaver',
    category: 'operations',
    backendOnly: true,
    secretEnv: ['DATABASE_CLIENT'],
    optionalEnv: [],
    publicClientEnv: [],
    frontendRule: 'DBeaver is operator tooling only and has no client endpoint.',
    endpoints: [
      { method: 'GET', path: '/platform/readiness', auth: 'public', purpose: 'Expose operator-tooling status without credentials' },
    ],
  },
  {
    id: 's3',
    name: 'S3-compatible object storage',
    category: 'data',
    backendOnly: true,
    secretEnv: ['AWS_BUCKET', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'],
    optionalEnv: ['AWS_REGION', 'R2_BUCKET', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_PUBLIC_URL'],
    publicClientEnv: [],
    frontendRule: 'Use /integrations/storage/upload-intents; access keys never leave the API.',
    endpoints: [
      { method: 'POST', path: '/integrations/storage/upload-intents', auth: 'user', purpose: 'Create backend-controlled upload intent' },
    ],
  },
  {
    id: 'posthog',
    name: 'PostHog',
    category: 'observability',
    backendOnly: true,
    secretEnv: ['POSTHOG_KEY'],
    optionalEnv: ['POSTHOG_HOST'],
    publicClientEnv: ['NEXT_PUBLIC_POSTHOG_KEY'],
    frontendRule: 'Use /integrations/analytics/events for sensitive events; public product analytics may use the public key.',
    endpoints: [
      { method: 'POST', path: '/integrations/analytics/events', auth: 'user', purpose: 'Capture product event server-side' },
    ],
  },
  {
    id: 'expo',
    name: 'Expo / EAS',
    category: 'mobile',
    backendOnly: true,
    secretEnv: ['EXPO_PROJECT_ID'],
    optionalEnv: ['EXPO_PUBLIC_API_URL', 'EXPO_PUBLIC_WEB_URL'],
    publicClientEnv: ['EXPO_PUBLIC_API_URL', 'EXPO_PUBLIC_WEB_URL', 'EXPO_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_ANON_KEY'],
    frontendRule: 'Expo public values identify app endpoints only; secrets stay on the API or EAS secret store.',
    endpoints: [
      { method: 'GET', path: '/integrations/catalog', auth: 'user', purpose: 'Expose mobile-safe backend integration contracts' },
    ],
  },
];
