import { Controller, Get, Post, Delete, Param, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ApiPlatformService } from './api-platform.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('api-platform')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('developer')
export class ApiPlatformController {
  constructor(private service: ApiPlatformService) {}

  @Post('keys')
  createKey(@Body() dto: { name: string; scopes: string[] }, @Req() req) {
    return this.service.createApiKey(req.user.id, dto.name, dto.scopes || ['read']);
  }

  @Get('keys')
  listKeys(@Req() req) { return this.service.listApiKeys(req.user.id); }

  @Delete('keys/:id')
  revokeKey(@Param('id') id: string, @Req() req) {
    return this.service.revokeApiKey(id, req.user.id);
  }

  @Post('webhooks')
  createWebhook(@Body() dto: { name: string; url: string; events: string[] }, @Req() req) {
    return this.service.createWebhook(req.user.id, dto.name, dto.url, dto.events);
  }

  @Get('webhooks')
  listWebhooks(@Req() req) { return this.service.listWebhooks(req.user.id); }

  @Delete('webhooks/:id')
  deleteWebhook(@Param('id') id: string, @Req() req) {
    return this.service.deleteWebhook(id, req.user.id);
  }
}
