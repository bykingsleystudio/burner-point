import { Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('billing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('billing')
export class BillingController {
  constructor(private service: BillingService) {}

  @Get('ledger')
  ledger(@Req() req, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.service.getLedger(req.user.id, +page, +limit);
  }

  @Get('plans')
  plans() { return this.service.getPlans(); }

  @Get('subscription')
  subscription(@Req() req) { return this.service.getSubscription(req.user.id); }

  @Get('entitlements')
  entitlements(@Req() req) { return this.service.getEntitlements(req.user.id); }

  @Post('entitlements/refresh')
  refreshEntitlements(@Req() req) { return this.service.refreshEntitlements(req.user.id); }
}
