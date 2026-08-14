require('ts-node/register/transpile-only');

const test = require('node:test');
const assert = require('node:assert/strict');
const { ConfigService } = require('@nestjs/config');
const { CredentialCipherService } = require('../src/modules/integrations/credential-cipher.service.ts');
const { IntegrationsService } = require('../src/modules/integrations/integrations.service.ts');

function createService(overrides = {}) {
  const config = new ConfigService({
    ENCRYPTION_KEY: 'a'.repeat(64),
    ...overrides.config,
  });
  const updates = [];
  const esimOrder = {
    id: 'esim-1', userId: 'user-1', provider: 'airalo', providerOrderId: 'airalo-order-1',
    status: 'provisioning', metadata: {}, activationDataEncrypted: null, iccid: null,
  };
  const esimRepo = {
    findOne: async ({ where }) => where.providerOrderId === 'airalo-order-1' ? esimOrder : null,
    update: async (id, value) => updates.push({ id, value }),
  };
  const noopRepo = { findOne: async () => null, update: async () => null };
  const service = new IntegrationsService(
    config,
    {},
    { getEntitlementConfig() {}, hasAnyActiveEntitlement: async () => false },
    esimRepo,
    noopRepo,
    noopRepo,
    new CredentialCipherService(config),
  );
  return { service, updates };
}

test('connectivity credentials are AES-GCM encrypted before persistence', () => {
  const config = new ConfigService({ ENCRYPTION_KEY: 'a'.repeat(64) });
  const cipher = new CredentialCipherService(config);
  const encrypted = cipher.encrypt({ private_key: 'do-not-store-plaintext' });

  assert.match(encrypted, /^v1:[A-Za-z0-9_-]+:[A-Za-z0-9_-]+:[A-Za-z0-9_-]+$/);
  assert.equal(encrypted.includes('do-not-store-plaintext'), false);
});

test('verified Airalo lifecycle events update an existing provider order without persisting activation plaintext', async () => {
  const { service, updates } = createService();

  const applied = await service.applyProviderLifecycleEvent('airalo', {
    order_id: 'airalo-order-1',
    status: 'active',
    activation_code: 'LPA:1$activation-material',
    iccid: '8901000000000000000',
  });

  assert.equal(applied, true);
  assert.equal(updates.length, 1);
  assert.equal(updates[0].value.status, 'active');
  assert.match(updates[0].value.activationDataEncrypted, /^v1:/);
  assert.equal(updates[0].value.activationDataEncrypted.includes('activation-material'), false);
  assert.equal(JSON.stringify(updates[0].value.metadata).includes('activation-material'), false);
});

test('unmatched provider lifecycle events make no state change', async () => {
  const { service, updates } = createService();
  const applied = await service.applyProviderLifecycleEvent('airalo', {
    order_id: 'unknown-order',
    status: 'active',
  });

  assert.equal(applied, false);
  assert.equal(updates.length, 0);
});
