const test = require('node:test');
const assert = require('node:assert/strict');

const { ProviderService, ProviderName } = require('../src/modules/global/provider.service.ts');

function makeConfig(overrides = {}) {
  const values = {
    TWILIO_ACCOUNT_SID: 'sid',
    TWILIO_AUTH_TOKEN: 'token',
    ...overrides,
  };

  return {
    get(key) {
      return values[key] ?? undefined;
    },
  };
}

const redis = {
  async get() {
    return null;
  },
  async set() {
    return true;
  },
};

test('verified providers are recognized in the route enum while blocked providers remain disabled', () => {
  assert.equal(ProviderName.JUICYSMS, 'juicysms');
  assert.equal(ProviderName.TEXTVERIFIED, 'textverified');
  assert.equal(ProviderName.SMSPOOL, 'smspool');
  assert.equal(ProviderName.TIGERSMS, 'tigersms');
  assert.equal(ProviderName.QUACKR, 'quackr');

  const service = new ProviderService(makeConfig(), redis);
  const route = service.selectVerificationRoute('US', undefined, ProviderName.JUICYSMS);
  assert.equal(route.primaryProvider, ProviderName.JUICYSMS);
  assert.equal(route.fallbackProviders.includes(ProviderName.SMSPOOL), false);
  assert.equal(route.fallbackProviders.includes(ProviderName.TIGERSMS), false);
  assert.equal(route.fallbackProviders.includes(ProviderName.QUACKR), false);
});
