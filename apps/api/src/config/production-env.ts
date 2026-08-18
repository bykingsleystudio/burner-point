import { resolveConfiguredEnv } from './runtime-env';

type EnvMap = Record<string, string | undefined>;

const REQUIRED_PRODUCTION_ENV = [
  'APP_URL',
  'API_URL',
  'NEXT_PUBLIC_APP_URL',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'ENCRYPTION_KEY',
  'CORS_ALLOWED_ORIGINS',
  'INTERNAL_API_KEY',
  'WEBHOOK_SIGNING_SECRET',
  'REDIS_URL',
  'SUPABASE_STORAGE_USER_UPLOADS_BUCKET',
  'SUPABASE_STORAGE_MEDIA_BUCKET',
  'SUPABASE_STORAGE_VERIFICATION_ASSETS_BUCKET',
  'SUPABASE_STORAGE_DOCUMENTS_BUCKET',
];

const BLOCKED_VALUE_PATTERN =
  /(^|[_:/.\-])(test|sandbox|demo|example|placeholder|dummy|fake|changeme|xxx|replace_me)([_:/.\-]|$)|your_|localhost|127\.0\.0\.1/i;

export function validateProductionEnv(env: EnvMap) {
  if (env.NODE_ENV !== 'production') return;

  const failures: string[] = [];

  for (const name of REQUIRED_PRODUCTION_ENV) {
    const value = resolveConfiguredEnv(name, env)?.trim();
    if (!value) {
      failures.push(`${name} is missing`);
      continue;
    }
    if (BLOCKED_VALUE_PATTERN.test(value)) failures.push(`${name} is not a live production value`);
  }

  const corsOrigins = (env.CORS_ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean);
  const additionalAllowedOrigins = [
    env.APP_URL,
    env.NEXT_PUBLIC_APP_URL,
    env.WEB_URL,
    env.WEB_APP_URL,
    env.FRONTEND_URL,
  ]
    .filter((origin): origin is string => Boolean(origin?.trim()))
    .map((origin) => origin.trim().replace(/\/+$/, ''));
  const allowVercelPreviews = (env.CORS_ALLOW_VERCEL_PREVIEWS || '').trim().toLowerCase() === 'true';
  if (!corsOrigins.includes('https://burnerpoint.com')) {
    failures.push('CORS_ALLOWED_ORIGINS must include https://burnerpoint.com');
  }
  const allowedProductionOrigins = new Set([
    'https://burnerpoint.com',
    ...additionalAllowedOrigins,
  ]);
  const unexpectedOrigins = corsOrigins.filter(
    (origin) => !allowedProductionOrigins.has(origin) && !(allowVercelPreviews && isVercelPreviewOrigin(origin)),
  );
  if (unexpectedOrigins.length) {
    failures.push(`CORS_ALLOWED_ORIGINS contains non-production origins: ${unexpectedOrigins.join(', ')}`);
  }

  for (const name of ['PADDLE_SANDBOX', 'NOWPAYMENTS_SANDBOX', 'SECONDARY_GATEWAYS_SANDBOX']) {
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
  ].every((name) => Boolean(resolveConfiguredEnv(name, env)?.trim()));
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

function isVercelPreviewOrigin(origin: string) {
  try {
    const { protocol, hostname } = new URL(origin);
    return protocol === 'https:' && hostname.endsWith('.vercel.app');
  } catch {
    return false;
  }
}
