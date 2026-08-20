import { Controller, Get, Patch, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, UserStatus } from '../../database/entities/user.entity';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private service: AdminService) {}

  @Get('stats')
  stats() { return this.service.getDashboardStats(); }

  @Get('users')
  listUsers(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.service.listUsers(+page, +limit);
  }

  @Patch('users/:id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: UserStatus) {
    return this.service.updateUserStatus(id, status);
  }

  @Post('users/:id/credit')
  creditWallet(@Param('id') id: string, @Body('amountUsdCents') amountUsdCents: number) {
    return this.service.creditUserWallet(id, amountUsdCents);
  }
}
