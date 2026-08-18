const assert = require('node:assert/strict');

require('ts-node/register/transpile-only');

const {
  hasConfiguredEnv,
  isConfiguredValue,
  resolveApiOrigin,
  resolveApiUrl,
  resolveWebhookBaseUrl,
} = require('../src/config/runtime-env.ts');
const { validateProductionEnv } = require('../src/config/production-env.ts');

function test(name, fn) {
  try {
    fn();
    process.stdout.write(`PASS ${name}\n`);
  } catch (error) {
    process.stderr.write(`FAIL ${name}\n`);
    throw error;
  }
}

test('resolveApiOrigin prefers API_URL over an incorrectly set APP_URL', () => {
  const env = {
    API_URL: 'https://api.burnerpoint.com',
    APP_URL: 'https://burnerpoint.com',
  };

  assert.equal(resolveApiOrigin(env), 'https://api.burnerpoint.com');
  assert.equal(resolveApiUrl(env), 'https://api.burnerpoint.com/api');
  assert.equal(resolveWebhookBaseUrl(env), 'https://api.burnerpoint.com/api/webhooks');
});

test('resolveApiOrigin falls back to Railway public domains when API_URL is absent', () => {
  const env = {
    RAILWAY_PUBLIC_DOMAIN: 'burner-point-api-production.up.railway.app',
  };

  assert.equal(resolveApiOrigin(env), 'https://burner-point-api-production.up.railway.app');
});

test('resolveApiOrigin strips an accidental /api suffix from API_URL', () => {
  const env = {
    API_URL: 'https://api.burnerpoint.com/api',
  };

  assert.equal(resolveApiOrigin(env), 'https://api.burnerpoint.com');
  assert.equal(resolveApiUrl(env), 'https://api.burnerpoint.com/api');
});

test('resolveApiOrigin rejects APP_URL fallback in production', () => {
  const env = {
    NODE_ENV: 'production',
    APP_URL: 'https://burnerpoint.com',
  };

  assert.throws(() => resolveApiOrigin(env), /API_URL must be configured in production/);
});

test('hasConfiguredEnv treats Flutterwave webhook aliases as equivalent', () => {
  const env = {
    FLUTTERWAVE_WEBHOOK_HASH: 'live_webhook_hash',
  };

  assert.equal(hasConfiguredEnv('FLUTTERWAVE_WEBHOOK_SECRET', env), true);
  assert.equal(hasConfiguredEnv('FLUTTERWAVE_WEBHOOK_HASH', env), true);
});

test('hasConfiguredEnv treats Supabase publishable and secret key aliases as equivalent', () => {
  const env = {
    SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_live_value',
    SUPABASE_SECRET_KEY: 'sb_secret_live_value',
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_live_value',
    EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_live_value',
  };

  assert.equal(hasConfiguredEnv('SUPABASE_ANON_KEY', env), true);
  assert.equal(hasConfiguredEnv('SUPABASE_SERVICE_ROLE_KEY', env), true);
  assert.equal(hasConfiguredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', env), true);
  assert.equal(hasConfiguredEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY', env), true);
});

test('validateProductionEnv accepts canonical apex origin without requiring the www host', () => {
  const env = {
    NODE_ENV: 'production',
    APP_URL: 'https://burnerpoint.com',
    API_URL: 'https://api.burnerpoint.com',
    NEXT_PUBLIC_APP_URL: 'https://burnerpoint.com',
    NEXT_PUBLIC_API_URL: 'https://api.burnerpoint.com',
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_ANON_KEY: 'anon_key',
    SUPABASE_SERVICE_ROLE_KEY: 'service_role_key',
    JWT_SECRET: 'jwt_secret',
    JWT_REFRESH_SECRET: 'jwt_refresh_secret',
    ENCRYPTION_KEY: 'encryption_key',
    CORS_ALLOWED_ORIGINS: 'https://burnerpoint.com',
    INTERNAL_API_KEY: 'internal_api_key',
    WEBHOOK_SIGNING_SECRET: 'webhook_signing_secret',
    REDIS_URL: 'redis://localhost:6379',
    SUPABASE_STORAGE_USER_UPLOADS_BUCKET: 'bp-user-uploads',
    SUPABASE_STORAGE_MEDIA_BUCKET: 'bp-media',
    SUPABASE_STORAGE_VERIFICATION_ASSETS_BUCKET: 'bp-verification-assets',
    SUPABASE_STORAGE_DOCUMENTS_BUCKET: 'bp-documents',
    PADDLE_SANDBOX: 'false',
    NOWPAYMENTS_SANDBOX: 'false',
    SECONDARY_GATEWAYS_SANDBOX: 'false',
  };

  assert.doesNotThrow(() => validateProductionEnv(env));
});

test('isConfiguredValue rejects blank and placeholder values', () => {
  assert.equal(isConfiguredValue(''), false);
  assert.equal(isConfiguredValue('   '), false);
  assert.equal(isConfiguredValue('REPLACE_ME'), false);
  assert.equal(isConfiguredValue('whsec_real_value'), true);
});
