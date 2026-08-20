import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID, Matches, MaxLength } from 'class-validator';
import { ApiKeyOrJwtGuard } from '../api-platform/api-key.guard';
import { ApiScopes } from '../api-platform/api-scopes.decorator';
import { VerificationHubService } from './verification-hub.service';

class CreateVerificationOrderDto {
  @IsIn(['sms', 'voice'])
  channel: 'sms' | 'voice';

  @IsString()
  @MaxLength(64)
  serviceCode: string;

  @IsString()
  @Matches(/^[A-Za-z]{2}$/)
  countryCode: string;

  @IsString()
  @Matches(/^\+[1-9]\d{6,14}$/)
  phoneNumber: string;

  @IsOptional()
  @IsString()
  @MaxLength(12)
  areaCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  carrier?: string;

  @IsIn(['premium', 'standard', 'economy'])
  tier: 'premium' | 'standard' | 'economy';

  @IsUUID()
  idempotencyKey: string;
}

@ApiTags('verify-hub')
@ApiBearerAuth()
@UseGuards(ApiKeyOrJwtGuard)
@Controller('verify-hub')
export class VerificationHubController {
  constructor(private readonly verificationHubService: VerificationHubService) {}

  @Get('services')
  @ApiScopes('verify:read')
  @ApiOperation({ summary: 'List active, operator-configured verification services' })
  listServices(@Query('country') country?: string) {
    return this.verificationHubService.listServices(country);
  }

  @Get('orders')
  @ApiScopes('verify:read')
  @ApiOperation({ summary: 'List the caller’s durable verification orders' })
  listOrders(@Req() req: { user: { id: string } }) {
    return this.verificationHubService.listOrders(req.user.id);
  }

  @Post('orders')
  @ApiScopes('verify:write')
  @ApiOperation({ summary: 'Provision a verified, wallet-locked OTP receive session' })
  createOrder(@Req() req: { user: { id: string } }, @Body() dto: CreateVerificationOrderDto) {
    return this.verificationHubService.createOrder(req.user.id, dto);
  }

  @Delete('orders/:id')
  @ApiScopes('verify:write')
  @ApiOperation({ summary: 'Cancel an active verification order and release its wallet hold when eligible' })
  cancelOrder(@Req() req: { user: { id: string } }, @Param('id') id: string) {
    return this.verificationHubService.cancelOrder(req.user.id, id);
  }
}
