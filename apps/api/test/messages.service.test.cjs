require('ts-node/register/transpile-only');
const test = require('node:test');
const assert = require('node:assert/strict');
const { NotFoundException } = require('@nestjs/common');

const { MessagesService } = require('../src/modules/messages/messages.service');
const { MessageDirection, MessageStatus } = require('../src/database/entities/message.entity');

function createService({ ownedNumber = true, messages = [], unreadCount = 0 } = {}) {
  const emitted = [];
  const sent = [];
  let nextId = 1;
  const number = ownedNumber ? {
    id: 'number-1', userId: 'user-1', number: '+15555550100', countryCode: 'US', status: 'active', capabilities: ['sms'],
  } : null;
  const numberRepo = {
    findOne: async ({ where }) => number && Object.entries(where).every(([key, value]) => number[key] === value) ? number : null,
    increment: async () => undefined,
  };
  const messageRepo = {
    create: (input) => input,
    save: async (input) => ({ id: input.id || `message-${nextId++}`, createdAt: new Date('2026-08-13T10:00:00Z'), ...input }),
    findAndCount: async () => [messages, messages.length],
    count: async () => unreadCount,
    findOne: async ({ where }) => messages.find((message) => Object.entries(where).every(([key, value]) => message[key] === value)) || null,
  };
  const provider = {
    sendSms: async (to, from, body, options) => {
      sent.push({ to, from, body, options });
      return { sid: 'provider-message-1', status: 'queued', provider: 'twilio', routeLabel: 'BP Messenger Route' };
    },
  };
  const gateway = { emitToUser: (userId, event, payload) => emitted.push({ userId, event, payload }) };
  const developerWebhooks = { enqueueDeveloperWebhookEvent: async () => ({ queued: 0 }) };
  return { service: new MessagesService(messageRepo, numberRepo, provider, gateway, developerWebhooks), emitted, sent };
}

test('sending from an owned number persists a provider-addressable queued message and emits it privately', async () => {
  const { service, sent, emitted } = createService();

  const message = await service.send('user-1', {
    from: '+15555550100',
    to: '+15555550101',
    body: 'Hello from Burner Point',
  });

  assert.equal(message.status, MessageStatus.QUEUED);
  assert.equal(message.providerMessageSid, 'provider-message-1');
  assert.equal(message.phoneNumberId, 'number-1');
  assert.deepEqual(sent, [{
    to: '+15555550101', from: '+15555550100', body: 'Hello from Burner Point',
    options: { countryCode: 'US', preferredProvider: undefined },
  }]);
  assert.equal(emitted[0].userId, 'user-1');
  assert.equal(emitted[0].event, 'message.sent');
});

test('sending from a number the user does not own is rejected before a provider request', async () => {
  const { service, sent } = createService({ ownedNumber: false });

  await assert.rejects(
    () => service.send('user-1', { from: '+15555550100', to: '+15555550101', body: 'hello' }),
    NotFoundException,
  );
  assert.equal(sent.length, 0);
});

test('listing an owned number returns pagination and unread state without another users messages', async () => {
  const messages = [{ id: 'message-1', userId: 'user-1', phoneNumberId: 'number-1', direction: MessageDirection.INBOUND }];
  const { service } = createService({ messages, unreadCount: 1 });

  const page = await service.list('user-1', 'number-1', 2, 25);

  assert.deepEqual(page, {
    data: messages,
    pagination: { page: 2, limit: 25, total: 1, totalPages: 1 },
    unreadCount: 1,
  });
});

test('marking a message read changes only an owned inbound message', async () => {
  const inbound = { id: 'message-1', userId: 'user-1', phoneNumberId: 'number-1', direction: MessageDirection.INBOUND, readAt: null };
  const { service, emitted } = createService({ messages: [inbound] });

  const message = await service.markRead('user-1', 'message-1');

  assert.ok(message.readAt instanceof Date);
  assert.equal(emitted[0].event, 'message.read');
});

test('inbound persistence and later delivery updates use the provider message ID without fabricating a user', async () => {
  const existingOutbound = {
    id: 'message-outbound', userId: 'user-1', phoneNumberId: 'number-1',
    providerMessageSid: 'provider-outbound-1', status: MessageStatus.QUEUED,
  };
  const { service, emitted } = createService({ messages: [existingOutbound] });

  const inbound = await service.recordInbound({
    provider: 'twilio', providerMessageId: 'provider-inbound-1', from: '+15555550101',
    to: '+15555550100', body: '482991', numSegments: 1,
  });
  const updated = await service.updateDeliveryStatus('provider-outbound-1', 'delivered');

  assert.equal(inbound.userId, 'user-1');
  assert.equal(inbound.status, MessageStatus.RECEIVED);
  assert.equal(updated.status, MessageStatus.DELIVERED);
  assert.equal(emitted[0].event, 'message.received');
  assert.equal(emitted[1].event, 'message.status');
});
