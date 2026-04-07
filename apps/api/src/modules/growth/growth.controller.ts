import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { GrowthService } from './growth.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('growth')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('growth')
export class GrowthController {
  constructor(private service: GrowthService) {}

  @Get('referral/stats')
  stats(@Req() req) { return this.service.getReferralStats(req.user.id); }

  @Get('referral/leaderboard')
  leaderboard() { return this.service.getLeaderboard(); }
}
