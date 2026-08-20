import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsIn, IsInt, IsObject, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CaptureAnalyticsEventInput,
  EsimOrderInput,
  EsimPlansInput,
  IntegrationsService,
  ProxyOrderInput,
  UploadIntentInput,
  VpnSessionInput,
} from './integrations.service';

class CaptureAnalyticsEventDto implements CaptureAnalyticsEventInput {
  @IsString()
  @MaxLength(120)
  event: string;

  @IsOptional()
  @IsObject()
  properties?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  distinctId?: string;
}

class UploadIntentDto implements UploadIntentInput {
  @IsIn(['mms', 'voicemail', 'support_attachment', 'document', 'export'])
  purpose: UploadIntentInput['purpose'];

  @IsString()
  @MaxLength(160)
  fileName: string;

  @IsString()
  @MaxLength(120)
  contentType: string;

  @IsInt()
  @Min(1)
  @Max(50 * 1024 * 1024)
  byteSize: number;
}

class SignedReadUrlDto { @IsString() bucket: string; @IsString() @MaxLength(300) objectKey: string; }

class EsimPlansDto implements EsimPlansInput {
  @IsString()
  @Matches(/^[A-Z]{2}$/)
  countryCode: string;

  @IsOptional()
  @IsString()
  region?: string;
}

class EsimOrderDto implements EsimOrderInput {
  @IsString()
  @MaxLength(80)
  planId: string;

  @IsString()
  @Matches(/^[A-Z]{2}$/)
  countryCode: string;

  @IsOptional()
  @IsString()
  iccid?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  idempotencyKey?: string;
}

class ProxyOrderDto implements ProxyOrderInput {
  @IsString()
  @MaxLength(80)
  region: string;

  @IsIn(['residential', 'mobile'])
  type: ProxyOrderInput['type'];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  durationDays?: number;

  @IsOptional()
  @IsIn(['http', 'https', 'socks5'])
  protocol?: ProxyOrderInput['protocol'];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10000)
  bandwidthGb?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  ipCount?: number;

  @IsOptional()
  @IsIn(['rotating', 'sticky', 'static'])
  rotationMode?: ProxyOrderInput['rotationMode'];

  @IsOptional()
  @IsString()
  @MaxLength(180)
  idempotencyKey?: string;
}

class VpnSessionDto implements VpnSessionInput {
  @IsString()
  @MaxLength(80)
  deviceName: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  idempotencyKey?: string;
}

@ApiTags('integrations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get('catalog')
  @ApiOperation({ summary: 'Get backend-only integration catalog without secret values' })
  catalog() {
    return this.integrationsService.getCatalog();
  }

  @Get('contracts')
  @ApiOperation({ summary: 'Get documented backend endpoint contracts for all integrations' })
  contracts() {
    return this.integrationsService.getContracts();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one backend integration contract' })
  integration(@Param('id') id: string) {
    return this.integrationsService.getIntegration(id);
  }

  @Post('analytics/events')
  @ApiOperation({ summary: 'Capture a product analytics event through the backend' })
  captureEvent(@Req() req: { user: { id: string } }, @Body() dto: CaptureAnalyticsEventDto) {
    return this.integrationsService.captureAnalyticsEvent(req.user.id, dto);
  }

  @Post('storage/upload-intents')
  @ApiOperation({ summary: 'Create a backend-controlled private object upload intent' })
  uploadIntent(@Req() req: { user: { id: string } }, @Body() dto: UploadIntentDto) {
    return this.integrationsService.createUploadIntent(req.user.id, dto);
  }

  @Post('storage/signed-read-url')
  @ApiOperation({ summary: 'Create a short-lived private Supabase media URL owned by the caller' })
  signedReadUrl(@Req() req: { user: { id: string } }, @Body() dto: SignedReadUrlDto) {
    return this.integrationsService.createSignedReadUrl(req.user.id, dto.bucket, dto.objectKey);
  }

  @Post('esim/plans')
  @ApiOperation({ summary: 'Query configured Airalo eSIM plans through the backend' })
  esimPlans(@Req() req: { user: { id: string } }, @Body() dto: EsimPlansDto) {
    return this.integrationsService.requestEsimPlans(req.user.id, dto);
  }

  @Get('esim/orders')
  @ApiOperation({ summary: 'List the caller’s durable eSIM fulfillment records' })
  esimOrders(@Req() req: { user: { id: string } }) {
    return this.integrationsService.listEsimOrders(req.user.id);
  }

  @Post('esim/orders')
  @ApiOperation({ summary: 'Create configured Airalo eSIM order through the backend' })
  esimOrder(@Req() req: { user: { id: string } }, @Body() dto: EsimOrderDto) {
    return this.integrationsService.createEsimOrder(req.user.id, dto);
  }

  @Post('proxies/orders')
  @ApiOperation({ summary: 'Create configured Oxylabs or Smartproxy proxy order through the backend' })
  proxyOrder(@Req() req: { user: { id: string } }, @Body() dto: ProxyOrderDto) {
    return this.integrationsService.createProxyOrder(req.user.id, dto);
  }

  @Get('proxies/orders')
  @ApiOperation({ summary: 'List the caller’s durable proxy fulfillment records' })
  proxyOrders(@Req() req: { user: { id: string } }) {
    return this.integrationsService.listProxyOrders(req.user.id);
  }

  @Post('vpn/sessions')
  @ApiOperation({ summary: 'Create configured WireGuard VPN session through the backend' })
  vpnSession(@Req() req: { user: { id: string } }, @Body() dto: VpnSessionDto) {
    return this.integrationsService.createVpnSession(req.user.id, dto);
  }

  @Get('vpn/sessions')
  @ApiOperation({ summary: 'List the caller’s durable VPN session records' })
  vpnSessions(@Req() req: { user: { id: string } }) {
    return this.integrationsService.listVpnSessions(req.user.id);
  }
}
