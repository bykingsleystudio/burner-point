import { Controller, Get, Post, Delete, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
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
  members(@Param('id') id: string) { return this.service.listMembers(id); }

  @Post(':id/members')
  invite(@Param('id') id: string, @Body() dto: { userId: string; role: WorkspaceMemberRole }) {
    return this.service.inviteMember(id, dto.userId, dto.role);
  }

  @Delete(':id/members/:memberId')
  removeMember(@Param('id') id: string, @Param('memberId') memberId: string) {
    return this.service.removeMember(id, memberId);
  }

  @Get(':id/audit-log')
  auditLog(@Param('id') id: string, @Query('page') page = 1, @Query('limit') limit = 50) {
    return this.service.getAuditLog(id, +page, +limit);
  }
}
