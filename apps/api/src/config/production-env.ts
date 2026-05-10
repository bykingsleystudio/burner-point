type EnvMap = Record<string, string | undefined>;

const REQUIRED_PRODUCTION_ENV = [
  'APP_URL',
  'API_URL',
  'NEXT_PUBLIC_APP_URL',
  'DATABASE_URL',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'REDIS_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'ENCRYPTION_KEY',
  'CORS_ALLOWED_ORIGINS',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_VERIFY_SERVICE_SID',
  'PAYSTACK_SECRET_KEY',
  'PAYSTACK_PUBLIC_KEY',
  'PAYSTACK_WEBHOOK_SECRET',
  'INTERNAL_API_KEY',
  'WEBHOOK_SIGNING_SECRET',
  'SUPABASE_STORAGE_USER_UPLOADS_BUCKET',
  'SUPABASE_STORAGE_MEDIA_BUCKET',
  'SUPABASE_STORAGE_VERIFICATION_ASSETS_BUCKET',
  'SUPABASE_STORAGE_DOCUMENTS_BUCKET',
];

const LIVE_PREFIXES: Record<string, RegExp> = {
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
  if (!corsOrigins.includes('https://burnerpoint.com')) {
    failures.push('CORS_ALLOWED_ORIGINS must include https://burnerpoint.com');
  }
  if (!corsOrigins.includes('https://www.burnerpoint.com')) {
    failures.push('CORS_ALLOWED_ORIGINS should include https://www.burnerpoint.com');
  }

  for (const name of ['PADDLE_SANDBOX', 'OPAY_SANDBOX', 'NOWPAYMENTS_SANDBOX', 'SECONDARY_GATEWAYS_SANDBOX']) {
    if ((env[name] || '').trim().toLowerCase() === 'true') {
      failures.push(`${name} must be false or unset in production`);
    }
  }

  const hasSupabaseStorage = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_STORAGE_USER_UPLOADS_BUCKET',
    'SUPABASE_STORAGE_MEDIA_BUCKET',
    'SUPABASE_STORAGE_VERIFICATION_ASSETS_BUCKET',
    'SUPABASE_STORAGE_DOCUMENTS_BUCKET',
  ].every((name) => Boolean(env[name]?.trim()));
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
  if (!hasSupabaseStorage && !hasAwsS3 && !hasCloudflareR2) {
    failures.push('Configure Supabase Storage buckets or a complete S3/R2 storage credential set');
  }

  if (failures.length) {
    throw new Error(`Production environment validation failed:\n${failures.map((item) => `- ${item}`).join('\n')}`);
  }
}
