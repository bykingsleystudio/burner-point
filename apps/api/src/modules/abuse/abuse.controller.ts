import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AbuseService } from './abuse.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('abuse')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('abuse')
export class AbuseController {
  constructor(private service: AbuseService) {}

  @Get('events')
  getEvents(@Query('userId') userId?: string) {
    return this.service.getRecentEvents(userId);
  }
}
