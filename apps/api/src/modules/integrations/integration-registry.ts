export type BackendIntegrationId =
  | 'twilio'
  | 'infobip'
  | 'vonage'
  | 'bandwidth'
  | 'openai'
  | 'oneglobal'
  | 'brightdata'
  | 'wireguard'
  | 'paystack'
  | 'flutterwave'
  | 'squad'
  | 'korapay'
  | 'opay'
  | 'paddle'
  | 'nowpayments'
  | 'resend'
  | 'clerk'
  | 'neon'
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
    id: 'infobip',
    name: 'Infobip',
    category: 'telecom',
    backendOnly: true,
    secretEnv: ['INFOBIP_BASE_URL', 'INFOBIP_API_KEY'],
    optionalEnv: ['INFOBIP_SENDER_ID', 'INFOBIP_WEBHOOK_SECRET'],
    publicClientEnv: [],
    frontendRule: 'Use Burner Point messaging/verification routes; never call Infobip from clients.',
    endpoints: [
      { method: 'POST', path: '/messaging/sms/send', auth: 'user', purpose: 'Send routed SMS with Infobip fallback support' },
      { method: 'POST', path: '/webhooks/infobip/inbound', auth: 'provider-signature', purpose: 'Receive Infobip inbound messages' },
      { method: 'POST', path: '/webhooks/infobip/status', auth: 'provider-signature', purpose: 'Receive Infobip delivery status' },
    ],
  },
  {
    id: 'vonage',
    name: 'Vonage',
    category: 'telecom',
    backendOnly: true,
    secretEnv: ['VONAGE_API_KEY', 'VONAGE_API_SECRET'],
    optionalEnv: ['VONAGE_APPLICATION_ID', 'VONAGE_PRIVATE_KEY', 'VONAGE_WEBHOOK_SECRET'],
    publicClientEnv: [],
    frontendRule: 'Use Burner Point messaging/verification routes; Vonage stays a server-side fallback.',
    endpoints: [
      { method: 'POST', path: '/messaging/sms/send', auth: 'user', purpose: 'Send routed SMS with Vonage fallback support' },
      { method: 'ALL', path: '/webhooks/vonage/inbound', auth: 'provider-signature', purpose: 'Receive Vonage inbound SMS' },
      { method: 'ALL', path: '/webhooks/vonage/status', auth: 'provider-signature', purpose: 'Receive Vonage delivery status' },
    ],
  },
  {
    id: 'bandwidth',
    name: 'Bandwidth',
    category: 'telecom',
    backendOnly: true,
    secretEnv: ['BANDWIDTH_ACCOUNT_ID', 'BANDWIDTH_API_TOKEN'],
    optionalEnv: ['BANDWIDTH_APPLICATION_ID', 'BANDWIDTH_WEBHOOK_SECRET'],
    publicClientEnv: [],
    frontendRule: 'Use /numbers and /webhooks/bandwidth; Bandwidth credentials never leave Railway.',
    endpoints: [
      { method: 'GET', path: '/numbers/search', auth: 'user', purpose: 'Search numbers through backend number infrastructure' },
      { method: 'POST', path: '/webhooks/bandwidth', auth: 'provider-signature', purpose: 'Normalize Bandwidth callbacks' },
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
    id: 'oneglobal',
    name: '1GLOBAL',
    category: 'connectivity',
    backendOnly: true,
    secretEnv: ['ONEGLOBAL_API_KEY'],
    optionalEnv: ['ONEGLOBAL_BASE_URL', 'ONEGLOBAL_PLANS_PATH', 'ONEGLOBAL_ORDER_PATH', 'ONEGLOBAL_WEBHOOK_SECRET'],
    publicClientEnv: [],
    frontendRule: 'Use /integrations/esim routes; never call 1GLOBAL from clients.',
    endpoints: [
      { method: 'POST', path: '/integrations/esim/plans', auth: 'user', purpose: 'Query configured 1GLOBAL eSIM catalog endpoint' },
      { method: 'POST', path: '/integrations/esim/orders', auth: 'user', purpose: 'Create configured 1GLOBAL eSIM order' },
      { method: 'POST', path: '/webhooks/oneglobal', auth: 'provider-signature', purpose: 'Normalize 1GLOBAL webhook events' },
    ],
  },
  {
    id: 'brightdata',
    name: 'Bright Data',
    category: 'connectivity',
    backendOnly: true,
    secretEnv: ['BRIGHTDATA_API_KEY'],
    optionalEnv: ['BRIGHTDATA_BASE_URL', 'BRIGHTDATA_CUSTOMER_ID', 'BRIGHTDATA_ZONE', 'BRIGHTDATA_PROXY_ORDER_PATH', 'BRIGHTDATA_WEBHOOK_SECRET'],
    publicClientEnv: [],
    frontendRule: 'Use /integrations/proxies routes; Bright Data keys stay server-side.',
    endpoints: [
      { method: 'POST', path: '/integrations/proxies/orders', auth: 'user', purpose: 'Create configured Bright Data proxy order' },
      { method: 'POST', path: '/webhooks/brightdata', auth: 'provider-signature', purpose: 'Normalize Bright Data webhook events' },
    ],
  },
  {
    id: 'wireguard',
    name: 'WireGuard',
    category: 'privacy',
    backendOnly: true,
    secretEnv: ['WIREGUARD_PRIVATE_KEY', 'WIREGUARD_ENDPOINT'],
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
    optionalEnv: ['PAYSTACK_PUBLIC_KEY', 'PAYSTACK_WEBHOOK_SECRET', 'PAYMENT_USD_TO_NGN_RATE'],
    publicClientEnv: [],
    frontendRule: 'Use /payments/initialize; checkout URLs are created server-side.',
    endpoints: [
      { method: 'POST', path: '/payments/initialize', auth: 'user', purpose: 'Create Paystack checkout session' },
      { method: 'POST', path: '/payments/webhook/paystack', auth: 'provider-signature', purpose: 'Confirm payment and fulfill product' },
    ],
  },
  {
    id: 'flutterwave',
    name: 'Flutterwave',
    category: 'payments',
    backendOnly: true,
    secretEnv: ['FLUTTERWAVE_SECRET_KEY'],
    optionalEnv: ['FLUTTERWAVE_WEBHOOK_HASH', 'SECONDARY_GATEWAYS_ENABLED'],
    publicClientEnv: [],
    frontendRule: 'Deferred gateway; enable only after core revenue flow is stable.',
    endpoints: [
      { method: 'POST', path: '/payments/initialize', auth: 'user', purpose: 'Create Flutterwave checkout when secondary gateways are enabled' },
      { method: 'POST', path: '/payments/webhook/flutterwave', auth: 'provider-signature', purpose: 'Confirm payment and fulfill product' },
    ],
  },
  {
    id: 'squad',
    name: 'Squad by GTCO',
    category: 'payments',
    backendOnly: true,
    secretEnv: ['SQUAD_SECRET_KEY'],
    optionalEnv: ['SQUAD_BASE_URL', 'SQUAD_WEBHOOK_SECRET', 'SECONDARY_GATEWAYS_ENABLED'],
    publicClientEnv: [],
    frontendRule: 'Deferred gateway; enable only after core revenue flow is stable.',
    endpoints: [
      { method: 'POST', path: '/payments/initialize', auth: 'user', purpose: 'Create Squad checkout when secondary gateways are enabled' },
      { method: 'POST', path: '/payments/webhook/squad', auth: 'provider-signature', purpose: 'Confirm payment and fulfill product' },
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
      { method: 'POST', path: '/payments/webhook/korapay', auth: 'provider-signature', purpose: 'Confirm payment and fulfill product' },
    ],
  },
  {
    id: 'opay',
    name: 'OPay',
    category: 'payments',
    backendOnly: true,
    secretEnv: ['OPAY_MERCHANT_ID', 'OPAY_SECRET_KEY'],
    optionalEnv: ['OPAY_PUBLIC_KEY', 'OPAY_WEBHOOK_SECRET', 'SECONDARY_GATEWAYS_ENABLED'],
    publicClientEnv: [],
    frontendRule: 'Deferred gateway; enable only after core revenue flow is stable.',
    endpoints: [
      { method: 'POST', path: '/payments/initialize', auth: 'user', purpose: 'Create OPay checkout when secondary gateways are enabled' },
      { method: 'POST', path: '/payments/webhook/opay', auth: 'provider-signature', purpose: 'Confirm payment and fulfill product' },
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
    frontendRule: 'Use /payments/initialize or /paddle/checkout; API key and price IDs stay server-side.',
    endpoints: [
      { method: 'POST', path: '/payments/initialize', auth: 'user', purpose: 'Create Paddle checkout session' },
      { method: 'POST', path: '/payments/webhook/paddle', auth: 'provider-signature', purpose: 'Confirm transaction/subscription events' },
      { method: 'POST', path: '/paddle/webhook', auth: 'provider-signature', purpose: 'Legacy Paddle webhook receiver' },
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
    id: 'clerk',
    name: 'Clerk',
    category: 'auth',
    backendOnly: true,
    secretEnv: ['CLERK_SECRET_KEY'],
    optionalEnv: ['CLERK_WEBHOOK_SECRET'],
    publicClientEnv: ['NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', 'EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY'],
    frontendRule: 'Clients use Clerk publishable keys only; API exchanges Clerk sessions server-side.',
    endpoints: [
      { method: 'POST', path: '/auth/clerk/exchange', auth: 'public', purpose: 'Exchange Clerk token for Burner Point API session' },
      { method: 'POST', path: '/webhooks/clerk', auth: 'provider-signature', purpose: 'Normalize Clerk user/session webhooks' },
    ],
  },
  {
    id: 'neon',
    name: 'Neon Postgres',
    category: 'data',
    backendOnly: true,
    secretEnv: ['DATABASE_URL'],
    optionalEnv: ['DB_SSL', 'DB_SSL_REJECT_UNAUTHORIZED'],
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
    secretEnv: ['S3_BUCKET', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY'],
    optionalEnv: ['S3_ENDPOINT', 'S3_REGION'],
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
    secretEnv: ['POSTHOG_API_KEY'],
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
    publicClientEnv: ['EXPO_PUBLIC_API_URL', 'EXPO_PUBLIC_WEB_URL', 'EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY'],
    frontendRule: 'Expo public values identify app endpoints only; secrets stay on the API or EAS secret store.',
    endpoints: [
      { method: 'GET', path: '/integrations/catalog', auth: 'user', purpose: 'Expose mobile-safe backend integration contracts' },
    ],
  },
];
