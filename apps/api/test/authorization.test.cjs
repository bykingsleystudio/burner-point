require('reflect-metadata');
require('ts-node/register/transpile-only');
const test = require('node:test');
const assert = require('node:assert/strict');
const { ForbiddenException } = require('@nestjs/common');

const { Roles } = require('../src/modules/auth/decorators/roles.decorator');
const { RolesGuard } = require('../src/modules/auth/guards/roles.guard');
const { UserRole } = require('../src/database/entities/user.entity');

function contextFor(role) {
  const handler = () => undefined;
  return {
    getHandler: () => handler,
    getClass: () => class TestController {},
    switchToHttp: () => ({ getRequest: () => ({ user: role ? { role } : undefined }) }),
  };
}

test('roles decorator attaches the explicit required role metadata', () => {
  const handler = () => undefined;
  Roles(UserRole.ADMIN)(undefined, undefined, { value: handler });

  assert.deepEqual(Reflect.getMetadata('roles', handler), [UserRole.ADMIN]);
});

test('roles guard denies a guarded route with no explicit role metadata', () => {
  const reflector = { getAllAndOverride: () => undefined };
  const guard = new RolesGuard(reflector);

  assert.throws(() => guard.canActivate(contextFor(UserRole.USER)), ForbiddenException);
});

test('roles guard denies a regular user from an admin route', () => {
  const reflector = { getAllAndOverride: () => [UserRole.ADMIN] };
  const guard = new RolesGuard(reflector);

  assert.throws(() => guard.canActivate(contextFor(UserRole.USER)), ForbiddenException);
});

test('roles guard permits an administrator on an explicitly admin route', () => {
  const reflector = { getAllAndOverride: () => [UserRole.ADMIN] };
  const guard = new RolesGuard(reflector);

  assert.equal(guard.canActivate(contextFor(UserRole.ADMIN)), true);
});
