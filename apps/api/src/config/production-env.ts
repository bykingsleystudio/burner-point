type EnvMap = Record<string, string | undefined>;

const REQUIRED_PRODUCTION_ENV = [
  'APP_URL',
  'API_URL',
  'NEXT_PUBLIC_APP_URL',
  'DATABASE_URL',
  'REDIS_URL',
  'JWT_SECRET',
  'ENCRYPTION_KEY',
  'CORS_ALLOWED_ORIGINS',
  'CLERK_SECRET_KEY',
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_WEBHOOK_SECRET',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_VERIFY_SERVICE_SID',
  'PAYSTACK_SECRET_KEY',
  'PAYSTACK_PUBLIC_KEY',
  'PAYSTACK_WEBHOOK_SECRET',
  'FLUTTERWAVE_SECRET_KEY',
  'FLUTTERWAVE_PUBLIC_KEY',
  'FLUTTERWAVE_WEBHOOK_SECRET',
  'PADDLE_API_KEY',
  'PADDLE_WEBHOOK_SECRET',
  'PADDLE_PRICE_VERIFICATION',
  'PADDLE_PRICE_RENTAL',
  'PADDLE_PRICE_SUB_MONTHLY',
  'NOWPAYMENTS_API_KEY',
  'NOWPAYMENTS_IPN_SECRET',
  'SQUAD_SECRET_KEY',
  'SQUAD_PUBLIC_KEY',
  'SQUAD_WEBHOOK_SECRET',
  'SQUAD_BASE_URL',
  'KORAPAY_SECRET_KEY',
  'KORAPAY_PUBLIC_KEY',
  'KORAPAY_WEBHOOK_SECRET',
  'OPAY_MERCHANT_ID',
  'OPAY_PUBLIC_KEY',
  'OPAY_PRIVATE_KEY',
  'OPAY_WEBHOOK_SECRET',
  'TELNYX_API_KEY',
  'TELNYX_PUBLIC_KEY',
  'TELNYX_MESSAGING_PROFILE_ID',
  'TELNYX_CONNECTION_ID',
  'TREMIL_API_KEY',
  'TREMIL_API_SECRET',
  'TREMIL_BASE_URL',
  'BANDWIDTH_ACCOUNT_ID',
  'BANDWIDTH_USERNAME',
  'BANDWIDTH_PASSWORD',
  'BANDWIDTH_MESSAGING_APPLICATION_ID',
  'BANDWIDTH_VOICE_APPLICATION_ID',
  'BANDWIDTH_SITE_ID',
  'BANDWIDTH_SIPPEER_ID',
  'BANDWIDTH_WEBHOOK_USERNAME',
  'BANDWIDTH_WEBHOOK_PASSWORD',
  'AIRALO_API_KEY',
  'AIRALO_API_SECRET',
  'AIRALO_BASE_URL',
  'AIRALO_PLANS_PATH',
  'AIRALO_ORDER_PATH',
  'OXYLABS_USERNAME',
  'OXYLABS_PASSWORD',
  'OXYLABS_BASE_URL',
  'OXYLABS_PROXY_ORDER_PATH',
  'SMARTPROXY_API_KEY',
  'SMARTPROXY_BASE_URL',
  'SMARTPROXY_PROXY_ORDER_PATH',
  'WIREGUARD_PRIVATE_KEY',
  'WIREGUARD_PUBLIC_KEY',
  'WIREGUARD_DNS',
  'WIREGUARD_ALLOWED_IPS',
  'WIREGUARD_SERVER_ENDPOINT',
  'WIREGUARD_CONTROL_BASE_URL',
  'WIREGUARD_SESSION_PATH',
  'WIREGUARD_CONTROL_API_KEY',
  'RESEND_API_KEY',
  'SENTRY_DSN',
  'SENTRY_AUTH_TOKEN',
  'POSTHOG_KEY',
  'OPENAI_API_KEY',
  'INTERNAL_API_KEY',
  'WEBHOOK_SIGNING_SECRET',
];

const LIVE_PREFIXES: Record<string, RegExp> = {
  CLERK_SECRET_KEY: /^sk_live_/,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: /^pk_live_/,
  PAYSTACK_SECRET_KEY: /^sk_live_/,
  PAYSTACK_PUBLIC_KEY: /^pk_live_/,
  FLUTTERWAVE_SECRET_KEY: /^FLWSECK_LIVE-/,
  FLUTTERWAVE_PUBLIC_KEY: /^FLWPUBK_LIVE-/,
  PADDLE_API_KEY: /^pdl_live_apikey_/,
};

const BLOCKED_VALUE_PATTERN =
  /(^|[_:/.\-])(test|sandbox|demo|example|placeholder|dummy|fake|changeme|xxx|replace_me)([_:/.\-]|$)|your_|localhost|127\.0\.0\.1/i;

export function validateProductionEnv(env: EnvMap) {
  if (env.NODE_ENV !== 'production') return;

  const failures: string[] = [];

  for (const name of REQUIRED_PRODUCTION_ENV) {
    const value = env[name]?.trim();
    if (!value) {
      failures.push(`${name} is missing`);
      continue;
    }
    if (BLOCKED_VALUE_PATTERN.test(value)) failures.push(`${name} is not a live production value`);
  }

  for (const [name, pattern] of Object.entries(LIVE_PREFIXES)) {
    const value = env[name]?.trim();
    if (value && !pattern.test(value)) failures.push(`${name} must use a live key prefix`);
  }

  const corsOrigins = (env.CORS_ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean);
  if (!corsOrigins.includes('https://burnerpoint.vercel.app')) {
    failures.push('CORS_ALLOWED_ORIGINS must include https://burnerpoint.vercel.app');
  }

  for (const name of ['PADDLE_SANDBOX', 'OPAY_SANDBOX', 'NOWPAYMENTS_SANDBOX', 'SECONDARY_GATEWAYS_SANDBOX']) {
    if ((env[name] || '').trim().toLowerCase() === 'true') {
      failures.push(`${name} must be false or unset in production`);
    }
  }

  const hasAwsS3 = [
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_BUCKET',
    'AWS_REGION',
  ].every((name) => Boolean(env[name]?.trim()));
  const hasCloudflareR2 = [
    'R2_ACCOUNT_ID',
    'R2_ACCESS_KEY_ID',
    'R2_SECRET_ACCESS_KEY',
    'R2_BUCKET',
  ].every((name) => Boolean(env[name]?.trim()));
  if (!hasAwsS3 && !hasCloudflareR2) {
    failures.push('Configure either a complete AWS S3 credential set or a complete Cloudflare R2 credential set');
  }

  if (failures.length) {
    throw new Error(`Production environment validation failed:\n${failures.map((item) => `- ${item}`).join('\n')}`);
  }
}
