require('ts-node/register/transpile-only');
const test = require('node:test');
const assert = require('node:assert/strict');
const { ApiPlatformService } = require('../src/modules/api-platform/api-platform.service.ts');

test('developer webhook events are persisted only for opted-in active endpoints', async () => {
  const inserted = [];
  const webhooks = [
    { id: 'webhook-message', events: ['message.sent'] },
    { id: 'webhook-wildcard', events: ['*'] },
    { id: 'webhook-other', events: ['number.purchased'] },
  ];
  const service = new ApiPlatformService(
    {},
    { find: async () => webhooks },
    {
      create: (input) => input,
      insert: async (input) => inserted.push(input),
    },
  );

  const result = await service.enqueueDeveloperWebhookEvent(
    'user-1',
    'message.sent',
    { id: 'message-1', body: 'private but user-authorized event data' },
    'message.sent:message-1',
  );

  assert.equal(result.queued, 2);
  assert.equal(inserted.length, 2);
  assert.deepEqual(inserted.map((delivery) => delivery.webhookId), ['webhook-message', 'webhook-wildcard']);
  assert.ok(inserted.every((delivery) => delivery.status === 'pending'));
  assert.ok(inserted.every((delivery) => /^[a-f0-9]{64}$/.test(delivery.idempotencyKey)));
});

test('replayed idempotency keys do not create a duplicate delivery record', async () => {
  const service = new ApiPlatformService(
    {},
    { find: async () => [{ id: 'webhook-1', events: ['message.status'] }] },
    {
      create: (input) => input,
      insert: async () => {
        const error = new Error('duplicate');
        error.code = '23505';
        throw error;
      },
    },
  );

  const result = await service.enqueueDeveloperWebhookEvent(
    'user-1', 'message.status', { id: 'message-1' }, 'message.status:message-1:delivered',
  );

  assert.equal(result.queued, 0);
});
