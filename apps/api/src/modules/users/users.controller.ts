import { Controller, Get, Patch, Delete, Body, Req, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private service: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  getProfile(@Req() req) { return this.service.getProfile(req.user.id); }

  @Patch('me')
  @ApiOperation({ summary: 'Update profile' })
  updateProfile(@Req() req, @Body() dto: any) { return this.service.updateProfile(req.user.id, dto); }

  @Get('me/wallet')
  @ApiOperation({ summary: 'Get wallet balance' })
  getWallet(@Req() req, @Query('currency') currency?: string) { return this.service.getWalletBalance(req.user.id, currency ?? 'USD'); }

  @Delete('me')
  @ApiOperation({ summary: 'Delete account' })
  deleteAccount(@Req() req) { return this.service.deleteAccount(req.user.id); }
}
