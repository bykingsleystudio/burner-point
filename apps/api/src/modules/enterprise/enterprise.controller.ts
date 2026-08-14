import { Controller, Get, Post, Delete, Patch, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { EnterpriseService } from './enterprise.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceMemberRole } from '../../database/entities/extended-entities';

@ApiTags('enterprise')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('enterprise/workspaces')
export class EnterpriseController {
  constructor(private service: EnterpriseService) {}

  @Post()
  create(@Body() dto: { name: string; slug: string }, @Req() req) {
    return this.service.createWorkspace(req.user.id, dto.name, dto.slug);
  }

  @Get(':id')
  get(@Param('id') id: string, @Req() req) {
    return this.service.getWorkspace(id, req.user.id);
  }

  @Get(':id/members')
  members(@Param('id') id: string, @Req() req) { return this.service.listMembers(id, req.user.id); }

  @Post(':id/members')
  invite(@Param('id') id: string, @Body() dto: { userId: string; role: WorkspaceMemberRole }, @Req() req) {
    return this.service.inviteMember(id, req.user.id, dto.userId, dto.role, req.ip);
  }

  @Delete(':id/members/:memberId')
  removeMember(@Param('id') id: string, @Param('memberId') memberId: string, @Req() req) {
    return this.service.removeMember(id, req.user.id, memberId, req.ip);
  }

  @Patch(':id/members/:memberId/role')
  changeMemberRole(@Param('id') id: string, @Param('memberId') memberId: string, @Body('role') role: WorkspaceMemberRole, @Req() req) {
    return this.service.changeMemberRole(id, req.user.id, memberId, role, req.ip);
  }

  @Get(':id/audit-log')
  auditLog(@Param('id') id: string, @Query('page') page = 1, @Query('limit') limit = 50, @Req() req) {
    return this.service.getAuditLog(id, req.user.id, +page, +limit);
  }
}
