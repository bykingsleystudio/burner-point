import { All, Controller, Post, Body, Headers, Req, Res, HttpCode, RawBodyRequest } from '@nestjs/common';
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
    return this.service.handleProviderWebhook('bandwidth', body, headers, req.rawBody);
  }

  @All('vonage/inbound')
  @HttpCode(200)
  @ApiOperation({ summary: 'Vonage inbound SMS webhook receiver' })
  async vonageInbound(@Req() req: Request) {
    return this.service.handleVonageInboundWebhook(this.mergeWebhookPayload(req));
  }

  @All('vonage/status')
  @HttpCode(200)
  @ApiOperation({ summary: 'Vonage delivery status webhook receiver' })
  async vonageStatus(@Req() req: Request) {
    return this.service.handleVonageStatusWebhook(this.mergeWebhookPayload(req));
  }

  @Post('infobip/inbound')
  @HttpCode(200)
  @ApiOperation({ summary: 'Infobip inbound SMS webhook receiver' })
  async infobipInbound(@Body() body: Record<string, unknown>, @Headers() headers: Record<string, string>) {
    return this.service.handleInfobipInboundWebhook(body, headers);
  }

  @Post('infobip/status')
  @HttpCode(200)
  @ApiOperation({ summary: 'Infobip delivery status webhook receiver' })
  async infobipStatus(@Body() body: Record<string, unknown>, @Headers() headers: Record<string, string>) {
    return this.service.handleInfobipDeliveryWebhook(body, headers);
  }

  @Post('oneglobal')
  @HttpCode(200)
  @ApiOperation({ summary: '1GLOBAL webhook receiver' })
  async oneGlobalWebhook(
    @Body() body: Record<string, unknown>,
    @Headers() headers: Record<string, string>,
    @Req() req: RawBodyRequest<Request>,
  ) {
    return this.service.handleProviderWebhook('oneglobal', body, headers, req.rawBody);
  }

  @Post('brightdata')
  @HttpCode(200)
  @ApiOperation({ summary: 'Bright Data webhook receiver' })
  async brightDataWebhook(
    @Body() body: Record<string, unknown>,
    @Headers() headers: Record<string, string>,
    @Req() req: RawBodyRequest<Request>,
  ) {
    return this.service.handleProviderWebhook('brightdata', body, headers, req.rawBody);
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

  private mergeWebhookPayload(req: Request): Record<string, unknown> {
    return {
      ...(req.query as Record<string, unknown>),
      ...((req.body ?? {}) as Record<string, unknown>),
    };
  }

  private requestUrl(req: Request): string {
    return `${req.protocol}://${req.get('host')}${req.originalUrl}`;
  }
}
