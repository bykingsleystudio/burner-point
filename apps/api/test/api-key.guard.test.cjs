require('reflect-metadata');
require('ts-node/register/transpile-only');
const test = require('node:test');
const assert = require('node:assert/strict');
const { ForbiddenException } = require('@nestjs/common');

const { ApiKeyOrJwtGuard } = require('../src/modules/api-platform/api-key.guard');
const { ApiScopes } = require('../src/modules/api-platform/api-scopes.decorator');

function context({ headers = {}, scopes = ['messages:read'], user } = {}) {
  const handler = () => undefined;
  ApiScopes(...scopes)(undefined, undefined, { value: handler });
  const request = { headers, user };
  return {
    getHandler: () => handler,
    getClass: () => class TestController {},
    switchToHttp: () => ({ getRequest: () => request }),
    request,
  };
}

test('an API key with the requested scope becomes only its owner identity', async () => {
  const apiPlatform = {
    validateApiKey: async () => ({ id: 'key-1', userId: 'owner-1', scopes: ['messages:read'] }),
  };
  const reflector = { getAllAndOverride: () => ['messages:read'] };
  const jwt = { verify: () => { throw new Error('not used'); } };
  const guard = new ApiKeyOrJwtGuard(apiPlatform, reflector, jwt, { get: () => 'test-secret' });
  const ctx = context({ headers: { 'x-api-key': 'bp_live_valid' } });

  assert.equal(await guard.canActivate(ctx), true);
  assert.deepEqual(ctx.request.user, { id: 'owner-1', authType: 'api_key', apiKeyId: 'key-1', apiKeyScopes: ['messages:read'] });
});

test('an API key without the requested scope is rejected', async () => {
  const apiPlatform = {
    validateApiKey: async () => ({ id: 'key-1', userId: 'owner-1', scopes: ['numbers:read'] }),
  };
  const guard = new ApiKeyOrJwtGuard(apiPlatform, { getAllAndOverride: () => ['messages:write'] }, { verify: () => ({}) }, { get: () => 'test-secret' });

  await assert.rejects(() => guard.canActivate(context({ headers: { 'x-api-key': 'bp_live_valid' } })), ForbiddenException);
});

test('a revoked or unknown API key is rejected', async () => {
  const apiPlatform = { validateApiKey: async () => null };
  const guard = new ApiKeyOrJwtGuard(apiPlatform, { getAllAndOverride: () => ['messages:read'] }, { verify: () => ({}) }, { get: () => 'test-secret' });

  await assert.rejects(() => guard.canActivate(context({ headers: { 'x-api-key': 'bp_live_revoked' } })), ForbiddenException);
});

test('a valid bearer JWT retains JWT identity without API-key scope checks', async () => {
  const guard = new ApiKeyOrJwtGuard(
    { validateApiKey: async () => { throw new Error('not used'); } },
    { getAllAndOverride: () => ['messages:read'] },
    { verify: () => ({ sub: 'user-1', role: 'user' }) },
    { get: () => 'test-secret' },
  );
  const ctx = context({ headers: { authorization: 'Bearer token' } });

  assert.equal(await guard.canActivate(ctx), true);
  assert.deepEqual(ctx.request.user, { id: 'user-1', role: 'user', authType: 'jwt' });
});
