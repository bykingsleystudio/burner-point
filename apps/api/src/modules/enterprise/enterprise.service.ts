import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workspace, WorkspaceMember, AuditLog, WorkspaceMemberRole } from '../../database/entities/extended-entities';

@Injectable()
export class EnterpriseService {
  constructor(
    @InjectRepository(Workspace) private workspaceRepo: Repository<Workspace>,
    @InjectRepository(WorkspaceMember) private memberRepo: Repository<WorkspaceMember>,
    @InjectRepository(AuditLog) private auditRepo: Repository<AuditLog>,
  ) {}

  async createWorkspace(userId: string, name: string, slug: string) {
    const ws = this.workspaceRepo.create({ name, slug, ownerUserId: userId });
    const saved = await this.workspaceRepo.save(ws);
    // Add owner as member
    await this.memberRepo.save(this.memberRepo.create({
      workspaceId: saved.id, userId, role: WorkspaceMemberRole.OWNER,
    }));
    return saved;
  }

  async requireMembership(workspaceId: string, userId: string) {
    const member = await this.memberRepo.findOne({
      where: { workspaceId, userId, isActive: true },
    });
    if (!member) throw new ForbiddenException('Not a workspace member');
    return member;
  }

  async requireWorkspaceRole(
    workspaceId: string,
    userId: string,
    allowedRoles: WorkspaceMemberRole[],
  ) {
    const member = await this.requireMembership(workspaceId, userId);
    if (!allowedRoles.includes(member.role)) {
      throw new ForbiddenException('Insufficient workspace permissions');
    }
    return member;
  }

  async getWorkspace(id: string, userId: string) {
    const ws = await this.workspaceRepo.findOne({ where: { id } });
    if (!ws) throw new NotFoundException('Workspace not found');
    await this.requireMembership(id, userId);
    return ws;
  }

  async listMembers(workspaceId: string, userId: string) {
    await this.requireMembership(workspaceId, userId);
    return this.memberRepo.find({ where: { workspaceId, isActive: true } });
  }

  async inviteMember(
    workspaceId: string,
    actorUserId: string,
    inviteeUserId: string,
    role: WorkspaceMemberRole,
    ip?: string,
  ) {
    const actor = await this.requireWorkspaceRole(
      workspaceId,
      actorUserId,
      [WorkspaceMemberRole.OWNER, WorkspaceMemberRole.ADMIN],
    );
    if (actor.role === WorkspaceMemberRole.ADMIN && role !== WorkspaceMemberRole.MEMBER && role !== WorkspaceMemberRole.VIEWER) {
      throw new ForbiddenException('Workspace admins can only invite members or viewers');
    }
    if (role === WorkspaceMemberRole.OWNER) {
      throw new ForbiddenException('Workspace ownership transfer requires a dedicated workflow');
    }
    const member = this.memberRepo.create({ workspaceId, userId: inviteeUserId, role });
    const saved = await this.memberRepo.save(member);
    await this.recordAudit(
      actorUserId,
      workspaceId,
      'workspace.member.invited',
      'workspace_member',
      {},
      { userId: inviteeUserId, role },
      ip,
    );
    return saved;
  }

  async removeMember(workspaceId: string, actorUserId: string, memberId: string, ip?: string) {
    const actor = await this.requireWorkspaceRole(
      workspaceId,
      actorUserId,
      [WorkspaceMemberRole.OWNER, WorkspaceMemberRole.ADMIN],
    );
    const target = await this.memberRepo.findOne({ where: { id: memberId, workspaceId, isActive: true } });
    if (!target) throw new NotFoundException('Workspace member not found');
    if (target.role === WorkspaceMemberRole.OWNER) {
      throw new ForbiddenException('Workspace owners cannot be removed');
    }
    if (actor.role === WorkspaceMemberRole.ADMIN && target.role === WorkspaceMemberRole.ADMIN) {
      throw new ForbiddenException('Workspace admins cannot remove another admin');
    }
    await this.memberRepo.update({ id: memberId, workspaceId }, { isActive: false });
    await this.recordAudit(
      actorUserId,
      workspaceId,
      'workspace.member.removed',
      'workspace_member',
      { userId: target.userId, role: target.role, isActive: true },
      { userId: target.userId, role: target.role, isActive: false },
      ip,
    );
    return { success: true };
  }

  async changeMemberRole(
    workspaceId: string,
    actorUserId: string,
    memberId: string,
    role: WorkspaceMemberRole,
    ip?: string,
  ) {
    await this.requireWorkspaceRole(workspaceId, actorUserId, [WorkspaceMemberRole.OWNER]);
    if (role === WorkspaceMemberRole.OWNER) {
      throw new ForbiddenException('Workspace ownership transfer requires a dedicated workflow');
    }
    const target = await this.memberRepo.findOne({ where: { id: memberId, workspaceId, isActive: true } });
    if (!target) throw new NotFoundException('Workspace member not found');
    if (target.role === WorkspaceMemberRole.OWNER) {
      throw new ForbiddenException('Workspace owner role cannot be changed here');
    }
    await this.memberRepo.update({ id: memberId, workspaceId }, { role });
    await this.recordAudit(
      actorUserId,
      workspaceId,
      'workspace.member.role_changed',
      'workspace_member',
      { userId: target.userId, role: target.role },
      { userId: target.userId, role },
      ip,
    );
    return { success: true };
  }

  async getAuditLog(workspaceId: string, userId: string, page = 1, limit = 50) {
    await this.requireMembership(workspaceId, userId);
    const [logs, total] = await this.auditRepo.findAndCount({
      where: { workspaceId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { logs, total };
  }

  async recordAudit(userId: string, workspaceId: string, action: string, resource: string, oldVal?: Record<string, unknown>, newVal?: Record<string, unknown>, ip?: string) {
    await this.auditRepo.save(this.auditRepo.create({
      userId, workspaceId, action, resource,
      oldValue: oldVal || {}, newValue: newVal || {}, ipAddress: ip,
    }));
  }
}
