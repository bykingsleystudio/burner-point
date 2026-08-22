const test = require('node:test');
const assert = require('node:assert/strict');
const axios = require('axios');
const { FxService } = require('../src/modules/global/fx.service.ts');

function makeConfig(values = {}) {
  return {
    get(key) {
      return values[key];
    },
  };
}

function makeRedis(initial = null) {
  let value = initial;
  return {
    async get() { return value; },
    async set(_key, next) { value = next; },
  };
}

test('country mapping uses ISO country data and USD remains the base currency', () => {
  const service = new FxService(makeConfig(), makeRedis());
  assert.equal(service.currencyForCountry('NG'), 'NGN');
  assert.equal(service.currencyForCountry('GB'), 'GBP');
  assert.equal(service.currencyForCountry('CA'), 'CAD');
  assert.equal(service.currencyForCountry('DE'), 'EUR');
  assert.equal(service.currencyForCountry('ZZ'), 'USD');
});

test('provider response exposes its timestamp and caches the USD rates payload', async () => {
  const originalGet = axios.get;
  axios.get = async () => ({ data: { base: 'USD', timestamp: 1700000000, rates: { NGN: 1500.1234 } } });
  try {
    const redis = makeRedis();
    const service = new FxService(makeConfig({ FOREXRATEAPI_API_KEY: 'server-only', FX_CACHE_TTL_SECONDS: 300 }), redis);
    const response = await service.getRate('NGN');
    assert.equal(response.baseCurrency, 'USD');
    assert.equal(response.quoteCurrency, 'NGN');
    assert.equal(response.rate, 1500.1234);
    assert.equal(response.providerTimestamp, '2023-11-14T22:13:20.000Z');
    assert.equal(response.provider, 'forexrateapi');
    assert.equal(response.cached, false);
  } finally {
    axios.get = originalGet;
  }
});

test('valid cached rates are reused and provider failure never fabricates a rate', async () => {
  const cached = JSON.stringify({
    base: 'USD',
    rates: { GBP: 0.79 },
    providerTimestamp: '2026-08-19T00:00:00.000Z',
    fetchedAt: '2026-08-19T00:01:00.000Z',
    expiresAt: '2099-08-19T00:01:00.000Z',
  });
  const service = new FxService(makeConfig(), makeRedis(cached));
  const cachedResponse = await service.getRate('GBP');
  assert.equal(cachedResponse.rate, 0.79);
  assert.equal(cachedResponse.cached, true);

  const unavailable = await service.getRate('JPY');
  assert.equal(unavailable.available, false);
  assert.equal(unavailable.rate, undefined);
});

test('USD conversion is an identity and does not alter the source amount', async () => {
  const service = new FxService(makeConfig(), makeRedis());
  const response = await service.convertUsdCentsToMinor(463, 'USD');
  assert.equal(response.amountMinor, 463);
  assert.equal(response.fx, null);
});

test('unsupported currencies are rejected', () => {
  const service = new FxService(makeConfig(), makeRedis());
  assert.throws(() => service.validateCurrency('BAD'), /Unsupported ISO 4217 currency/);
});
