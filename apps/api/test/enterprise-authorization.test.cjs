require('ts-node/register/transpile-only');
const test = require('node:test');
const assert = require('node:assert/strict');
const { ForbiddenException } = require('@nestjs/common');

const { EnterpriseService } = require('../src/modules/enterprise/enterprise.service');
const { WorkspaceMemberRole } = require('../src/database/entities/extended-entities');

function createService({ actorRole, targetRole = WorkspaceMemberRole.MEMBER } = {}) {
  const savedAudit = [];
  const savedMembers = [];
  const memberRepo = {
    findOne: async ({ where }) => {
      if (where.userId === 'actor') {
        return actorRole ? { id: 'actor-member', workspaceId: where.workspaceId, userId: 'actor', role: actorRole, isActive: true } : null;
      }
      if (where.id === 'target-member') {
        return { id: 'target-member', workspaceId: where.workspaceId, userId: 'target', role: targetRole, isActive: true };
      }
      return null;
    },
    find: async () => [{ id: 'member-1', userId: 'actor' }],
    create: (input) => input,
    save: async (input) => { savedMembers.push(input); return { id: 'member-new', ...input }; },
    update: async () => ({ affected: 1 }),
  };
  const workspaceRepo = {
    findOne: async ({ where }) => where.id === 'workspace-1' ? { id: 'workspace-1', ownerUserId: 'owner' } : null,
    create: (input) => input,
    save: async (input) => ({ id: 'workspace-new', ...input }),
  };
  const auditRepo = {
    create: (input) => input,
    save: async (input) => { savedAudit.push(input); return input; },
    findAndCount: async () => [[], 0],
  };
  return { service: new EnterpriseService(workspaceRepo, memberRepo, auditRepo), savedAudit, savedMembers };
}

test('non-members cannot read a workspace member list', async () => {
  const { service } = createService();

  await assert.rejects(() => service.listMembers('workspace-1', 'actor'), ForbiddenException);
});

test('workspace members cannot invite another user', async () => {
  const { service } = createService({ actorRole: WorkspaceMemberRole.MEMBER });

  await assert.rejects(
    () => service.inviteMember('workspace-1', 'actor', 'invitee', WorkspaceMemberRole.MEMBER),
    ForbiddenException,
  );
});

test('workspace admins can invite a member and receive an audit record', async () => {
  const { service, savedAudit, savedMembers } = createService({ actorRole: WorkspaceMemberRole.ADMIN });

  const created = await service.inviteMember('workspace-1', 'actor', 'invitee', WorkspaceMemberRole.MEMBER, '127.0.0.1');

  assert.equal(created.userId, 'invitee');
  assert.equal(savedMembers.length, 1);
  assert.deepEqual(savedAudit[0], {
    userId: 'actor',
    workspaceId: 'workspace-1',
    action: 'workspace.member.invited',
    resource: 'workspace_member',
    oldValue: {},
    newValue: { userId: 'invitee', role: WorkspaceMemberRole.MEMBER },
    ipAddress: '127.0.0.1',
  });
});

test('workspace admins cannot remove owners or other admins', async () => {
  const { service } = createService({ actorRole: WorkspaceMemberRole.ADMIN, targetRole: WorkspaceMemberRole.OWNER });

  await assert.rejects(() => service.removeMember('workspace-1', 'actor', 'target-member'), ForbiddenException);
});
