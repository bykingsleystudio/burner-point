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
    API_URL: 'https://burner-point-api-production.up.railway.app/api',
    APP_URL: 'https://burnerpoint.vercel.app',
  };

  assert.equal(resolveApiOrigin(env), 'https://burner-point-api-production.up.railway.app');
  assert.equal(resolveApiUrl(env), 'https://burner-point-api-production.up.railway.app/api');
  assert.equal(resolveWebhookBaseUrl(env), 'https://burner-point-api-production.up.railway.app/api/webhooks');
});

test('resolveApiOrigin falls back to Railway public domains when API_URL is absent', () => {
  const env = {
    RAILWAY_PUBLIC_DOMAIN: 'burner-point-api-production.up.railway.app',
  };

  assert.equal(resolveApiOrigin(env), 'https://burner-point-api-production.up.railway.app');
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
