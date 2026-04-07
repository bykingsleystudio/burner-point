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

  async getWorkspace(id: string, userId: string) {
    const ws = await this.workspaceRepo.findOne({ where: { id } });
    if (!ws) throw new NotFoundException('Workspace not found');
    const member = await this.memberRepo.findOne({ where: { workspaceId: id, userId, isActive: true } });
    if (!member) throw new ForbiddenException('Not a workspace member');
    return ws;
  }

  async listMembers(workspaceId: string) {
    return this.memberRepo.find({ where: { workspaceId, isActive: true } });
  }

  async inviteMember(workspaceId: string, inviteeUserId: string, role: WorkspaceMemberRole) {
    const member = this.memberRepo.create({ workspaceId, userId: inviteeUserId, role });
    return this.memberRepo.save(member);
  }

  async removeMember(workspaceId: string, memberId: string) {
    await this.memberRepo.update({ id: memberId, workspaceId }, { isActive: false });
    return { success: true };
  }

  async getAuditLog(workspaceId: string, page = 1, limit = 50) {
    const [logs, total] = await this.auditRepo.findAndCount({
      where: { workspaceId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { logs, total };
  }

  async recordAudit(userId: string, workspaceId: string, action: string, resource: string, oldVal?: any, newVal?: any, ip?: string) {
    await this.auditRepo.save(this.auditRepo.create({
      userId, workspaceId, action, resource,
      oldValue: oldVal || {}, newValue: newVal || {}, ipAddress: ip,
    }));
  }
}
