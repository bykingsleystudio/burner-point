require('ts-node/register/transpile-only');
require('reflect-metadata');

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} = require('@nestjs/common');

function loadCallBilling() {
  return require('../src/modules/calls/call-billing.ts');
}

function loadCallsService() {
  return require('../src/modules/calls/calls.service.ts');
}

function loadVoiceEntities() {
  return {
    ...require('../src/database/entities/extended-entities.ts'),
    ...require('../src/database/entities/phone-number.entity.ts'),
    ...require('../src/modules/global/provider.service.ts'),
  };
}

function createRepo(seed = []) {
  const rows = seed.map((item) => ({ ...item }));

  const matchesWhere = (row, where) => {
    if (!where) return true;
    return Object.entries(where).every(([key, value]) => row[key] === value);
  };

  return {
    rows,
    create(input) {
      return { metadata: {}, ...input };
    },
    async save(input) {
      const entity = { ...input };
      if (!entity.id) {
        entity.id = `row-${rows.length + 1}`;
      }
      const index = rows.findIndex((row) => row.id === entity.id);
      if (index >= 0) {
        rows[index] = { ...rows[index], ...entity };
        return rows[index];
      }
      rows.push(entity);
      return entity;
    },
    async findOne({ where, order } = {}) {
      let matches = rows.filter((row) => matchesWhere(row, where));
      if (order) {
        const [[key, direction]] = Object.entries(order);
        matches = matches.sort((left, right) => {
          const leftValue = left[key];
          const rightValue = right[key];
          const modifier = String(direction).toUpperCase() === 'DESC' ? -1 : 1;
          if (leftValue === rightValue) return 0;
          return leftValue > rightValue ? modifier : -modifier;
        });
      }
      return matches[0] ?? null;
    },
    async findAndCount({ where, skip = 0, take = rows.length, order } = {}) {
      let matches = rows.filter((row) => matchesWhere(row, where));
      if (order) {
        const [[key, direction]] = Object.entries(order);
        matches = matches.sort((left, right) => {
          const leftValue = left[key];
          const rightValue = right[key];
          const modifier = String(direction).toUpperCase() === 'DESC' ? -1 : 1;
          if (leftValue === rightValue) return 0;
          return leftValue > rightValue ? modifier : -modifier;
        });
      }
      return [matches.slice(skip, skip + take), matches.length];
    },
    async count({ where } = {}) {
      return rows.filter((row) => matchesWhere(row, where)).length;
    },
  };
}

function createCallsServiceHarness(options = {}) {
  const {
    CallStatus,
    CallDirection,
    NumberStatus,
    NumberType,
    ProviderName,
  } = loadVoiceEntities();
  const { CallsService } = loadCallsService();

  const callRepo = createRepo(options.calls ?? []);
  const phoneRepo = createRepo(options.phoneNumbers ?? [{
    id: 'number-1',
    userId: 'user-1',
    number: '+14155550182',
    status: NumberStatus.ACTIVE,
    type: NumberType.BURNER,
    capabilities: ['voice', 'sms'],
    countryCode: 'US',
    provider: ProviderName.TWILIO,
  }]);

  const providerService = {
    startCallCalls: [],
    async startCall(to, from, countryCode, preferredProvider) {
      this.startCallCalls.push({ to, from, countryCode, preferredProvider });
      return {
        sid: 'provider-call-1',
        status: 'initiated',
        provider: preferredProvider ?? ProviderName.TWILIO,
        routeLabel: 'BP Messenger Route',
      };
    },
  };

  const creditsService = {
    createLockCalls: [],
    spendLockCalls: [],
    releaseLockCalls: [],
    balanceReads: [],
    async getBalance(userId) {
      this.balanceReads.push(userId);
      return {
        wallet: { balanceUsdCents: 5000, lockedBalanceUsdCents: 0, availableUsdCents: 5000 },
        credits: { balance: 1200, lockedBalance: 0, availableBalance: 1200 },
      };
    },
    async createLock(input) {
      this.createLockCalls.push(input);
      return {
        success: true,
        lock: { id: `lock-${this.createLockCalls.length}`, creditsAmount: input.creditsAmount },
        credits: { balance: 1200, lockedBalance: input.creditsAmount, availableBalance: 1200 - input.creditsAmount },
      };
    },
    async spendLock(input) {
      this.spendLockCalls.push(input);
      return {
        success: true,
        transaction: { id: `spend-${this.spendLockCalls.length}`, creditsAmount: input.creditsAmount },
        credits: { balance: 1200 - input.creditsAmount, lockedBalance: 0, availableBalance: 1200 - input.creditsAmount },
      };
    },
    async releaseLock(input) {
      this.releaseLockCalls.push(input);
      return {
        success: true,
        transaction: { id: `release-${this.releaseLockCalls.length}` },
        credits: { balance: 1200, lockedBalance: 0, availableBalance: 1200 },
      };
    },
  };

  const revenueCatService = {
    async hasAnyActiveEntitlement() {
      return true;
    },
    getEntitlementConfig() {
      return {
        messenger: 'bp_messenger_pro',
        premium: 'bp_premium',
      };
    },
  };

  const eventsGateway = {
    emitted: [],
    emitToUser(userId, event, payload) {
      this.emitted.push({ userId, event, payload });
    },
  };

  const callBillingService = {
    async resolveRateForDestination(destinationNumber) {
      return {
        destinationNumber,
        destinationCountry: 'NG',
        destinationPrefix: '+234',
        provider: ProviderName.TWILIO,
        creditsPerMinute: 15,
        usdCostPerMinuteCents: 15,
      };
    },
    calculateCallCost(args) {
      const { calculateCallCost } = loadCallBilling();
      return calculateCallCost(args);
    },
    estimateCreditsToLock(rate) {
      const { estimateCreditsToLock } = loadCallBilling();
      return estimateCreditsToLock(rate);
    },
  };

  const service = new CallsService(
    callRepo,
    phoneRepo,
    creditsService,
    revenueCatService,
    providerService,
    eventsGateway,
    callBillingService,
  );

  return {
    service,
    callRepo,
    phoneRepo,
    creditsService,
    providerService,
    revenueCatService,
    eventsGateway,
    callBillingService,
    enums: { CallStatus, CallDirection, NumberStatus, NumberType, ProviderName },
  };
}

test('61-second calls round up to two full billable minutes', () => {
  const { calculateCallCost, CALL_BILLING_INTERVAL_SECONDS } = loadCallBilling();

  assert.equal(CALL_BILLING_INTERVAL_SECONDS, 60);

  const cost = calculateCallCost({
    durationSeconds: 61,
    creditsPerMinute: 15,
  });

  assert.equal(cost.billableSeconds, 120);
  assert.equal(cost.billableMinutes, 2);
  assert.equal(cost.finalCredits, 30);
});

test('insufficient Call Credits block outbound call start', async () => {
  const harness = createCallsServiceHarness();
  harness.creditsService.createLock = async () => {
    throw new BadRequestException('You need more Call Credits to call this destination.');
  };

  await assert.rejects(
    harness.service.startOutboundCall('user-1', {
      to: '+2348012345678',
      fromNumberId: 'number-1',
      idempotencyKey: 'call-start-1',
    }),
    /Call Credits/,
  );
});

test('successful outbound call start locks call credits and stores provider state', async () => {
  const harness = createCallsServiceHarness();

  const result = await harness.service.startOutboundCall('user-1', {
    to: '+2348012345678',
    fromNumberId: 'number-1',
    idempotencyKey: 'call-start-2',
  });

  assert.equal(harness.creditsService.createLockCalls.length, 1);
  assert.equal(harness.providerService.startCallCalls.length, 1);
  assert.equal(result.call.direction, 'outbound');
  assert.equal(result.call.providerCallId, 'provider-call-1');
  assert.equal(result.call.creditsLocked, 15);
  assert.equal(result.rate.creditsPerMinute, 15);
});

test('completed webhooks spend the correct call credits from actual duration', async () => {
  const harness = createCallsServiceHarness({
    calls: [{
      id: 'call-1',
      userId: 'user-1',
      from: '+14155550182',
      to: '+2348012345678',
      direction: 'outbound',
      status: 'initiated',
      provider: 'twilio',
      providerCallId: 'provider-call-1',
      durationSeconds: 0,
      billableSeconds: 0,
      creditsLocked: 30,
      creditsSpent: 0,
      metadata: {
        callCreditLockId: 'lock-1',
        rateSnapshot: {
          destinationCountry: 'NG',
          destinationPrefix: '+234',
          provider: 'twilio',
          creditsPerMinute: 15,
        },
      },
      createdAt: new Date('2026-05-13T10:00:00.000Z'),
    }],
  });

  const settled = await harness.service.handleProviderVoiceEvent({
    provider: 'twilio',
    providerCallId: 'provider-call-1',
    status: 'completed',
    fromNumber: '+14155550182',
    toNumber: '+2348012345678',
    durationSeconds: 61,
    completedAt: new Date('2026-05-13T10:02:10.000Z'),
    eventId: 'evt-1',
    eventTimestamp: '2026-05-13T10:02:10.000Z',
    signatureValid: true,
    rawEvent: { CallSid: 'provider-call-1' },
  });

  assert.equal(harness.creditsService.spendLockCalls.length, 1);
  assert.equal(harness.creditsService.spendLockCalls[0].creditsAmount, 30);
  assert.equal(settled.call.billableSeconds, 120);
  assert.equal(settled.call.creditsSpent, 30);
  assert.equal(settled.call.status, 'completed');
});

test('failed webhooks release locked call credits without charging the user', async () => {
  const harness = createCallsServiceHarness({
    calls: [{
      id: 'call-2',
      userId: 'user-1',
      from: '+14155550182',
      to: '+2348012345678',
      direction: 'outbound',
      status: 'initiated',
      provider: 'twilio',
      providerCallId: 'provider-call-2',
      durationSeconds: 0,
      billableSeconds: 0,
      creditsLocked: 15,
      creditsSpent: 0,
      metadata: {
        callCreditLockId: 'lock-2',
        rateSnapshot: {
          destinationCountry: 'NG',
          destinationPrefix: '+234',
          provider: 'twilio',
          creditsPerMinute: 15,
        },
      },
      createdAt: new Date('2026-05-13T10:00:00.000Z'),
    }],
  });

  const settled = await harness.service.handleProviderVoiceEvent({
    provider: 'twilio',
    providerCallId: 'provider-call-2',
    status: 'no-answer',
    fromNumber: '+14155550182',
    toNumber: '+2348012345678',
    durationSeconds: 0,
    completedAt: new Date('2026-05-13T10:01:10.000Z'),
    eventId: 'evt-2',
    eventTimestamp: '2026-05-13T10:01:10.000Z',
    signatureValid: true,
    rawEvent: { CallSid: 'provider-call-2' },
  });

  assert.equal(harness.creditsService.releaseLockCalls.length, 1);
  assert.equal(harness.creditsService.spendLockCalls.length, 0);
  assert.equal(settled.call.status, 'no-answer');
  assert.equal(settled.call.creditsSpent, 0);
});

test('duplicate provider completion webhooks do not double-charge', async () => {
  const harness = createCallsServiceHarness({
    calls: [{
      id: 'call-3',
      userId: 'user-1',
      from: '+14155550182',
      to: '+2348012345678',
      direction: 'outbound',
      status: 'completed',
      provider: 'twilio',
      providerCallId: 'provider-call-3',
      durationSeconds: 61,
      billableSeconds: 120,
      creditsLocked: 30,
      creditsSpent: 30,
      metadata: {
        callCreditLockId: 'lock-3',
        processedVoiceEvents: ['twilio:provider-call-3:completed:evt-3'],
        rateSnapshot: {
          destinationCountry: 'NG',
          destinationPrefix: '+234',
          provider: 'twilio',
          creditsPerMinute: 15,
        },
      },
      createdAt: new Date('2026-05-13T10:00:00.000Z'),
    }],
  });

  const settled = await harness.service.handleProviderVoiceEvent({
    provider: 'twilio',
    providerCallId: 'provider-call-3',
    status: 'completed',
    fromNumber: '+14155550182',
    toNumber: '+2348012345678',
    durationSeconds: 61,
    completedAt: new Date('2026-05-13T10:02:10.000Z'),
    eventId: 'evt-3',
    eventTimestamp: '2026-05-13T10:02:10.000Z',
    signatureValid: true,
    rawEvent: { CallSid: 'provider-call-3' },
  });

  assert.equal(settled.duplicate, true);
  assert.equal(harness.creditsService.spendLockCalls.length, 0);
  assert.equal(harness.creditsService.releaseLockCalls.length, 0);
});

test('users cannot access another user’s call history entry', async () => {
  const harness = createCallsServiceHarness({
    calls: [{
      id: 'call-4',
      userId: 'user-1',
      from: '+14155550182',
      to: '+2348012345678',
      direction: 'outbound',
      status: 'completed',
      provider: 'twilio',
      providerCallId: 'provider-call-4',
      durationSeconds: 61,
      billableSeconds: 120,
      creditsLocked: 30,
      creditsSpent: 30,
      metadata: {},
      createdAt: new Date('2026-05-13T10:00:00.000Z'),
    }],
  });

  await assert.rejects(
    harness.service.getCall('user-2', 'call-4'),
    (error) => error instanceof NotFoundException || error instanceof ForbiddenException,
  );
});

test('webhook idempotency key is stable across duplicate voice events', () => {
  const { buildVoiceWebhookIdempotencyKey } = loadCallBilling();

  assert.equal(
    buildVoiceWebhookIdempotencyKey({
      provider: 'twilio',
      providerCallId: 'CA123',
      status: 'completed',
      eventId: 'evt-voice-1',
      eventTimestamp: '2026-05-13T10:02:10.000Z',
    }),
    'twilio:CA123:completed:evt-voice-1',
  );
});

test('invalid webhook signatures are rejected before voice events are processed', async () => {
  const { WebhooksService } = require('../src/modules/webhooks/webhooks.service.ts');
  const { ConfigService } = require('@nestjs/config');

  const config = new ConfigService({
    BANDWIDTH_WEBHOOK_SECRET: 'shared-secret',
  });

  const service = new WebhooksService(
    { findOne: async () => null, save: async () => null, update: async () => null, increment: async () => null },
    { findOne: async () => null, save: async () => null, update: async () => null },
    { findOne: async () => null, increment: async () => null, update: async () => null },
    { findOne: async () => null, save: async () => null },
    { emitToUser() {} },
    { classifyMessage: async () => null },
    { settleVerificationWalletDelivery: async () => null },
    { handleProviderVoiceEvent: async () => ({ success: true }) },
    { recordInbound: async () => null, updateProviderStatus: async () => null },
    { applyProviderLifecycleEvent: async () => false },
    config,
  );

  await assert.rejects(
    service.handleBandwidthVoiceWebhook(
      { eventType: 'disconnect' },
      { 'x-bandwidth-signature': 'sha256=not-valid' },
      Buffer.from('{"eventType":"disconnect"}'),
    ),
    BadRequestException,
  );
});
