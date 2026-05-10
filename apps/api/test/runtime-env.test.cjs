const assert = require('node:assert/strict');

require('ts-node/register/transpile-only');

const {
  hasConfiguredEnv,
  isConfiguredValue,
  resolveApiOrigin,
  resolveApiUrl,
  resolveWebhookBaseUrl,
  resolveClerkWebhookSigningSecret,
} = require('../src/config/runtime-env.ts');

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

test('hasConfiguredEnv treats Clerk webhook secret aliases as equivalent', () => {
  const env = {
    CLERK_WEBHOOK_SECRET: 'whsec_legacy',
  };

  assert.equal(hasConfiguredEnv('CLERK_WEBHOOK_SIGNING_SECRET', env), true);
  assert.equal(hasConfiguredEnv('CLERK_WEBHOOK_SECRET', env), true);
  assert.equal(resolveClerkWebhookSigningSecret(env), 'whsec_legacy');
});

test('isConfiguredValue rejects blank and placeholder values', () => {
  assert.equal(isConfiguredValue(''), false);
  assert.equal(isConfiguredValue('   '), false);
  assert.equal(isConfiguredValue('REPLACE_ME'), false);
  assert.equal(isConfiguredValue('whsec_real_value'), true);
});
