import { Controller, Post, Body, Headers, Req, Res, HttpCode, RawBodyRequest } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';
import { Request, Response } from 'express';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private service: WebhooksService) {}

  @Post('twilio/sms')
  @HttpCode(200)
  @ApiOperation({ summary: 'Receive inbound SMS from Twilio' })
  async twilioSms(@Body() body: Record<string, string>, @Res() res: Response) {
    await this.service.handleInboundSms(body);
    res.setHeader('Content-Type', 'text/xml');
    res.send('<Response/>');
  }

  @Post('twilio/voice')
  @HttpCode(200)
  @ApiOperation({ summary: 'Handle inbound call from Twilio' })
  async twilioVoice(@Body() body: Record<string, string>, @Res() res: Response) {
    const twiml = await this.service.handleInboundCall(body);
    res.setHeader('Content-Type', 'text/xml');
    res.send(twiml || '<Response/>');
  }

  @Post('twilio/status')
  @HttpCode(200)
  @ApiOperation({ summary: 'Twilio delivery status callback' })
  async twilioStatus(@Body() body: Record<string, string>) {
    return this.service.handleStatusUpdate(body);
  }

  @Post('twilio/recording')
  @HttpCode(200)
  @ApiOperation({ summary: 'Twilio recording status callback' })
  async twilioRecording(@Body() body: Record<string, string>) {
    return this.service.handleRecordingStatus(body);
  }

  @Post('twilio/verify')
  @HttpCode(200)
  @ApiOperation({ summary: 'Twilio Verify status callback' })
  async twilioVerify(@Body() body: Record<string, string>) {
    return this.service.handleVerifyStatus(body);
  }

  @Post('telnyx')
  @HttpCode(200)
  @ApiOperation({ summary: 'Telnyx webhook receiver' })
  async telnyxWebhook(@Body() body: Record<string, unknown>, @Headers() headers: Record<string, string>) {
    return this.service.handleTelnyxWebhook(body, headers);
  }

  @Post('bandwidth')
  @HttpCode(200)
  @ApiOperation({ summary: 'Bandwidth webhook receiver' })
  async bandwidthWebhook(
    @Body() body: Record<string, unknown>,
    @Headers() headers: Record<string, string>,
    @Req() req: RawBodyRequest<Request>,
  ) {
    return this.service.handleBandwidthWebhook(body, headers, req.rawBody);
  }

  @Post('bandwidth/voice')
  @HttpCode(200)
  @ApiOperation({ summary: 'Bandwidth voice callback responder' })
  async bandwidthVoice(
    @Body() body: Record<string, unknown>,
    @Headers() headers: Record<string, string>,
    @Res() res: Response,
  ) {
    const bxml = await this.service.handleBandwidthVoiceWebhook(body, headers);
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.send(bxml);
  }

  @Post('airalo')
  @HttpCode(200)
  @ApiOperation({ summary: 'Airalo webhook receiver' })
  async airaloWebhook(
    @Body() body: Record<string, unknown>,
    @Headers() headers: Record<string, string>,
    @Req() req: RawBodyRequest<Request>,
  ) {
    return this.service.handleProviderWebhook('airalo', body, headers, req.rawBody);
  }

  @Post('oxylabs')
  @HttpCode(200)
  @ApiOperation({ summary: 'Oxylabs webhook receiver' })
  async oxylabsWebhook(
    @Body() body: Record<string, unknown>,
    @Headers() headers: Record<string, string>,
    @Req() req: RawBodyRequest<Request>,
  ) {
    return this.service.handleProviderWebhook('oxylabs', body, headers, req.rawBody);
  }

  @Post('smartproxy')
  @HttpCode(200)
  @ApiOperation({ summary: 'Smartproxy webhook receiver' })
  async smartproxyWebhook(
    @Body() body: Record<string, unknown>,
    @Headers() headers: Record<string, string>,
    @Req() req: RawBodyRequest<Request>,
  ) {
    return this.service.handleProviderWebhook('smartproxy', body, headers, req.rawBody);
  }

  @Post('wireguard')
  @HttpCode(200)
  @ApiOperation({ summary: 'WireGuard control-plane webhook receiver' })
  async wireGuardWebhook(
    @Body() body: Record<string, unknown>,
    @Headers() headers: Record<string, string>,
    @Req() req: RawBodyRequest<Request>,
  ) {
    return this.service.handleProviderWebhook('wireguard', body, headers, req.rawBody);
  }

  @Post('clerk')
  @HttpCode(200)
  @ApiOperation({ summary: 'Clerk user/session webhook receiver' })
  async clerkWebhook(
    @Body() body: Record<string, unknown>,
    @Headers() headers: Record<string, string>,
    @Req() req: RawBodyRequest<Request>,
  ) {
    return this.service.handleClerkWebhook(body, headers, req.rawBody, this.requestUrl(req));
  }
  private requestUrl(req: Request): string {
    return `${req.protocol}://${req.get('host')}${req.originalUrl}`;
  }
}
