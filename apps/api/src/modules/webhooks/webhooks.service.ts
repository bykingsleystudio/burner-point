import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHmac, createPublicKey, timingSafeEqual, verify as verifySignature } from 'crypto';
import { Repository } from 'typeorm';
import twilio from 'twilio';
import { Request } from 'express';
import { Message, MessageDirection, MessageStatus, MessageType } from '../../database/entities/message.entity';
import { Call, CallDirection, CallStatus, WebhookDedup } from '../../database/entities/extended-entities';
import { PhoneNumber } from '../../database/entities/phone-number.entity';
import { EventsGateway } from '../gateway/events.gateway';
import { AiService } from '../ai/ai.service';
import { resolveWebhookBaseUrl } from '../../config/runtime-env';

type ProviderWebhookSource = 'airalo' | 'bandwidth' | 'oxylabs' | 'smartproxy' | 'wireguard';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    @InjectRepository(Message) private msgRepo: Repository<Message>,
    @InjectRepository(Call) private callRepo: Repository<Call>,
    @InjectRepository(PhoneNumber) private numRepo: Repository<PhoneNumber>,
    @InjectRepository(WebhookDedup) private dedupRepo: Repository<WebhookDedup>,
    private eventsGateway: EventsGateway,
    private aiService: AiService,
    private configService: ConfigService,
  ) {}

  private get apiWebhookBaseUrl(): string {
    return resolveWebhookBaseUrl(this.configService);
  }

  assertTwilioRequest(req: Request) {
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    const signature = this.headerValue(req.headers as Record<string, string>, 'x-twilio-signature');
    const isProduction = process.env.NODE_ENV === 'production';

    if (!authToken || !signature) {
      this.logger.warn('Twilio webhook rejected because signature verification is not configured');
      if (isProduction) throw new BadRequestException('Invalid Twilio signature');
      return;
    }

    const body = req.body as Record<string, string>;
    const urlCandidates = this.twilioRequestUrlCandidates(req);
    const valid = urlCandidates.some((url) => twilio.validateRequest(authToken, signature, url, body));
    if (!valid) throw new BadRequestException('Invalid Twilio signature');
  }

  async handleInboundSms(payload: Record<string, string>) {
    const eventId = payload.MessageSid;
    if (!eventId) return;

    // Idempotency: skip if already processed
    const existing = await this.dedupRepo.findOne({ where: { eventId } });
    if (existing) { this.logger.debug(`Duplicate webhook: ${eventId}`); return; }
    await this.dedupRepo.save(this.dedupRepo.create({ eventId, source: 'twilio', eventType: 'message.inbound', payload }));

    const to = payload.To;
    const from = payload.From;
    const body = payload.Body || '';

    // Find the phone number record
    const phoneNum = await this.numRepo.findOne({ where: { number: to } });

    // Run AI classification asynchronously
    const aiResult = await this.aiService.classifyMessage(body).catch(() => null);

    const msg = this.msgRepo.create({
      from,
      to,
      body,
      direction: MessageDirection.INBOUND,
      status: MessageStatus.RECEIVED,
      type: payload.NumMedia > '0' ? MessageType.MMS : MessageType.SMS,
      providerMessageSid: eventId,
      numSegments: parseInt(payload.NumSegments || '1'),
      phoneNumberId: phoneNum?.id,
      userId: phoneNum?.userId,
      aiClassification: aiResult?.classification,
      extractedOtp: aiResult?.otp,
      spamScore: aiResult?.spamScore || 0,
      isSpam: (aiResult?.spamScore || 0) > 0.7,
    });

    const saved = await this.msgRepo.save(msg);

    // Update number stats
    if (phoneNum) {
      await this.numRepo.increment({ id: phoneNum.id }, 'smsReceived', 1);
    }

    // Broadcast real-time event
    if (phoneNum?.userId) {
      this.eventsGateway.emitToUser(phoneNum.userId, 'message.received', {
        messageId: saved.id,
        from,
        to,
        body: msg.isSpam ? '[Spam filtered]' : body,
        otp: aiResult?.otp,
        classification: aiResult?.classification,
        receivedAt: saved.createdAt,
      });
    }

    return { success: true };
  }

  async handleInboundCall(payload: Record<string, string>) {
    const eventId = payload.CallSid;
    if (!eventId) return;

    const existing = await this.dedupRepo.findOne({ where: { eventId } });
    if (existing) return;
    await this.dedupRepo.save(this.dedupRepo.create({ eventId, source: 'twilio', eventType: 'call.inbound', payload }));

    const to = payload.To;
    const phoneNum = await this.numRepo.findOne({ where: { number: to } });

    const call = this.callRepo.create({
      from: payload.From,
      to,
      direction: CallDirection.INBOUND,
      status: CallStatus.RINGING,
      providerCallSid: eventId,
      phoneNumberId: phoneNum?.id,
      userId: phoneNum?.userId,
    });

    const saved = await this.callRepo.save(call);

    if (phoneNum?.userId) {
      this.eventsGateway.emitToUser(phoneNum.userId, 'call.incoming', {
        callId: saved.id,
        from: payload.From,
        to,
      });
    }

    // Return TwiML to handle the call (goes to voicemail by default)
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">You have reached a BurnerPoint number. Please leave a message.</Say>
  <Record maxLength="60" recordingStatusCallback="${this.apiWebhookBaseUrl}/twilio/recording"/>
</Response>`;
  }

  async handleStatusUpdate(payload: Record<string, string>) {
    const sid = payload.MessageSid || payload.CallSid;
    if (!sid) return;

    if (payload.MessageSid) {
      const statusMap: Record<string, MessageStatus> = {
        queued: MessageStatus.QUEUED,
        sent: MessageStatus.SENT,
        delivered: MessageStatus.DELIVERED,
        failed: MessageStatus.FAILED,
      };
      const status = statusMap[payload.MessageStatus] || MessageStatus.SENT;
      await this.msgRepo.update({ providerMessageSid: sid }, { status });
    }
    return { success: true };
  }

  async handleRecordingStatus(payload: Record<string, string>) {
    const callSid = payload.CallSid;
    if (!callSid) return { success: true };

    await this.callRepo.update(
      { providerCallSid: callSid },
      {
        recordingUrl: payload.RecordingUrl,
        voicemailUrl: payload.RecordingUrl,
        durationSeconds: parseInt(payload.RecordingDuration || '0', 10),
        status: payload.RecordingStatus === 'completed' ? CallStatus.COMPLETED : CallStatus.RINGING,
        metadata: payload,
      },
    );

    return { success: true };
  }

  async handleVerifyStatus(payload: Record<string, string>) {
    const sid = payload.VerificationSid || payload.sid || 'unknown';
    this.logger.log(`Twilio Verify callback received: ${sid}`);
    return { success: true };
  }

  async handleTelnyxWebhook(
    payload: Record<string, unknown>,
    headers: Record<string, string>,
    rawBody?: Buffer,
  ) {
    this.assertTelnyxSignature(headers, rawBody);

    const eventId =
      (headers['telnyx-event-id'] as string | undefined) ||
      ((payload.data as Record<string, unknown> | undefined)?.id as string | undefined) ||
      ((payload.meta as Record<string, unknown> | undefined)?.id as string | undefined);

    if (eventId) {
      const existing = await this.dedupRepo.findOne({ where: { eventId } });
      if (existing) {
        this.logger.debug(`Duplicate Telnyx webhook: ${eventId}`);
        return { success: true };
      }

      await this.dedupRepo.save(
        this.dedupRepo.create({
          eventId,
          source: 'telnyx',
          eventType: String(payload.event_type ?? 'unknown'),
          payload,
        }),
      );
    }

    this.logger.log(`Telnyx webhook received: ${String(payload.event_type ?? 'unknown')}`);
    return { success: true };
  }

  async handleBandwidthWebhook(
    payload: Record<string, unknown> | Array<Record<string, unknown>>,
    headers: Record<string, string>,
    rawBody?: Buffer,
  ) {
    this.assertBandwidthWebhookAuth(headers, rawBody);

    const events = Array.isArray(payload) ? payload : [payload];
    for (const event of events) {
      const eventId = this.getProviderEventId(event, headers) || `bandwidth:${Date.now()}:${Math.random().toString(36).slice(2)}`;
      const eventType = this.getProviderEventType(event);
      const duplicate = await this.storeWebhookEvent(`bandwidth:${eventId}`, 'bandwidth', eventType, event);
      if (duplicate) continue;

      const message = event.message as Record<string, unknown> | undefined;
      const messageTo = message?.to;
      const firstRecipient = Array.isArray(messageTo) ? messageTo[0] : messageTo;
      const from = this.asString(event.from) || this.asString(message?.from);
      const to = this.asString(event.to) || this.asString(event.owner) || this.asString(firstRecipient) || this.asString(message?.owner);
      const body = this.asString(event.text) || this.asString(event.body) || this.asString(message?.text);

      if (eventType.toLowerCase().includes('message') && from && to) {
        await this.persistInboundProviderSms({
          provider: 'bandwidth',
          eventId:
            this.asString(event.messageId) ||
            this.asString(message?.id) ||
            eventId,
          from,
          to,
          body,
          payload: event,
        }).catch((error) => {
          this.logger.warn(`Bandwidth inbound message persistence failed: ${error instanceof Error ? error.message : String(error)}`);
        });
      }
    }

    return { success: true };
  }

  async handleBandwidthVoiceWebhook(
    payload: Record<string, unknown>,
    headers: Record<string, string>,
    rawBody?: Buffer,
  ) {
    this.assertBandwidthWebhookAuth(headers, rawBody);
    await this.storeWebhookEvent(
      `bandwidth-voice:${this.getProviderEventId(payload, headers) || Date.now()}`,
      'bandwidth',
      this.getProviderEventType(payload),
      payload,
    );

    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <SpeakSentence voice="julie">You have reached a Burner Point number. Please leave a message.</SpeakSentence>
  <Record />
</Response>`;
  }

  async handleProviderWebhook(
    source: ProviderWebhookSource,
    payload: Record<string, unknown>,
    headers: Record<string, string>,
    rawBody?: Buffer,
  ) {
    const secretEnv = this.getProviderWebhookSecretEnv(source);
    const secret = this.configuredSecret(secretEnv);
    const isProduction = process.env.NODE_ENV === 'production';
    if (!secret) {
      this.logger.warn(`${source} webhook rejected because ${secretEnv} is not configured`);
      if (isProduction) throw new BadRequestException('Webhook verification not configured');
    }
    const verified = secret ? this.verifyGenericSignature(source, headers, rawBody, secret) : false;

    const eventType = this.getProviderEventType(payload);
    const providerEventId = this.getProviderEventId(payload, headers) || `${Date.now()}`;
    const eventId = `${source}:${providerEventId}:${eventType}`;
    const duplicate = await this.storeWebhookEvent(eventId, source, eventType, {
      ...payload,
      verified,
    });

    this.logger.log(`${source} webhook ${duplicate ? 'deduplicated' : 'stored'}: ${eventType}`);
    return {
      success: true,
      source,
      eventId: providerEventId,
      eventType,
      duplicate,
      verified,
    };
  }

  private twilioRequestUrlCandidates(req: Request): string[] {
    const forwardedProto = this.headerValue(req.headers as Record<string, string>, 'x-forwarded-proto');
    const proto = forwardedProto || req.protocol || 'https';
    const host = req.get('host') || this.headerValue(req.headers as Record<string, string>, 'host');
    const originalUrl = req.originalUrl || req.url;
    const directUrl = host ? `${proto}://${host}${originalUrl}` : '';
    const configuredApiUrl = (this.configService.get<string>('API_URL') || '').replace(/\/+$/, '');
    const configuredWebhookBase = this.apiWebhookBaseUrl.replace(/\/+$/, '');
    const routeSuffix = originalUrl.replace(/^\/api\/webhooks\/?/, '').replace(/^\/webhooks\/?/, '');

    return Array.from(new Set([
      directUrl,
      configuredApiUrl ? `${configuredApiUrl}/webhooks/${routeSuffix}` : '',
      `${configuredWebhookBase}/${routeSuffix}`,
    ].filter(Boolean)));
  }

  private assertTelnyxSignature(headers: Record<string, string>, rawBody?: Buffer) {
    const publicKey = this.configService.get<string>('TELNYX_PUBLIC_KEY');
    const isProduction = process.env.NODE_ENV === 'production';

    if (!publicKey) {
      this.logger.warn('Telnyx webhook rejected because TELNYX_PUBLIC_KEY is not configured');
      if (isProduction) throw new BadRequestException('Telnyx webhook verification not configured');
      return;
    }

    if (!rawBody) throw new BadRequestException('Missing raw body for Telnyx webhook verification');

    const signature = this.headerValue(headers, 'telnyx-signature-ed25519');
    const timestamp = this.headerValue(headers, 'telnyx-timestamp');
    if (!signature || !timestamp) throw new BadRequestException('Missing Telnyx signature headers');

    const timestampMs = Number(timestamp) * 1000;
    if (!Number.isFinite(timestampMs) || Math.abs(Date.now() - timestampMs) > 5 * 60 * 1000) {
      throw new BadRequestException('Stale Telnyx webhook timestamp');
    }

    const signedPayload = Buffer.from(`${timestamp}|${rawBody.toString('utf8')}`);
    const signatureBytes = Buffer.from(signature, 'base64');
    const keyObject = publicKey.includes('BEGIN PUBLIC KEY')
      ? createPublicKey(publicKey)
      : createPublicKey({
          key: Buffer.concat([
            Buffer.from('302a300506032b6570032100', 'hex'),
            Buffer.from(publicKey, 'base64'),
          ]),
          format: 'der',
          type: 'spki',
        });

    if (!verifySignature(null, signedPayload, keyObject, signatureBytes)) {
      throw new BadRequestException('Invalid Telnyx signature');
    }
  }

  private async persistInboundProviderSms(params: {
    provider: string;
    eventId: string;
    from: string;
    to: string;
    body: string;
    payload: Record<string, unknown>;
  }) {
    const phoneNum = await this.numRepo.findOne({ where: { number: params.to } });
    const aiResult = await this.aiService.classifyMessage(params.body).catch(() => null);

    const msg = this.msgRepo.create({
      from: params.from,
      to: params.to,
      body: params.body,
      direction: MessageDirection.INBOUND,
      status: MessageStatus.RECEIVED,
      type: MessageType.SMS,
      providerMessageSid: params.eventId,
      numSegments: 1,
      phoneNumberId: phoneNum?.id,
      userId: phoneNum?.userId,
      aiClassification: aiResult?.classification,
      extractedOtp: aiResult?.otp,
      spamScore: aiResult?.spamScore || 0,
      isSpam: (aiResult?.spamScore || 0) > 0.7,
      metadata: { provider: params.provider, raw: params.payload },
    });

    const saved = await this.msgRepo.save(msg);

    if (phoneNum) {
      await this.numRepo.increment({ id: phoneNum.id }, 'smsReceived', 1);
    }

    if (phoneNum?.userId) {
      this.eventsGateway.emitToUser(phoneNum.userId, 'message.received', {
        messageId: saved.id,
        provider: params.provider,
        from: params.from,
        to: params.to,
        body: msg.isSpam ? '[Spam filtered]' : params.body,
        otp: aiResult?.otp,
        classification: aiResult?.classification,
        receivedAt: saved.createdAt,
      });
    }

    this.logger.log(`${params.provider} inbound SMS stored: ${params.eventId}`);
  }

  private async storeWebhookEvent(
    eventId: string,
    source: string,
    eventType: string,
    payload: Record<string, unknown>,
  ) {
    const existing = await this.dedupRepo.findOne({ where: { eventId } });
    if (existing) {
      this.logger.debug(`Duplicate ${source} webhook: ${eventId}`);
      return true;
    }

    await this.dedupRepo.save(this.dedupRepo.create({ eventId, source, eventType, payload }));
    return false;
  }

  private getProviderWebhookSecretEnv(source: ProviderWebhookSource): string {
    const env: Record<ProviderWebhookSource, string> = {
      airalo: 'AIRALO_WEBHOOK_SECRET',
      bandwidth: 'BANDWIDTH_WEBHOOK_SECRET',
      oxylabs: 'OXYLABS_WEBHOOK_SECRET',
      smartproxy: 'SMARTPROXY_WEBHOOK_SECRET',
      wireguard: 'WIREGUARD_WEBHOOK_SECRET',
    };
    return env[source];
  }

  private configuredSecret(name: string): string | undefined {
    const value = this.configService.get<string>(name);
    if (!value) return undefined;
    const normalized = value.trim().toLowerCase();
    if (normalized === 'replace_me' || normalized.includes('replace_me')) return undefined;
    return value;
  }

  private assertBandwidthWebhookAuth(headers: Record<string, string>, rawBody?: Buffer) {
    const username = this.configService.get<string>('BANDWIDTH_WEBHOOK_USERNAME');
    const password = this.configService.get<string>('BANDWIDTH_WEBHOOK_PASSWORD');
    if (username && password) {
      const authorization = this.headerValue(headers, 'authorization');
      if (!authorization.toLowerCase().startsWith('basic ')) {
        throw new BadRequestException('Missing Bandwidth webhook basic authorization');
      }
      const decoded = Buffer.from(authorization.slice(6), 'base64').toString('utf8');
      const separator = decoded.indexOf(':');
      const receivedUsername = separator >= 0 ? decoded.slice(0, separator) : '';
      const receivedPassword = separator >= 0 ? decoded.slice(separator + 1) : '';
      if (!this.safeCompare(username, receivedUsername) || !this.safeCompare(password, receivedPassword)) {
        throw new BadRequestException('Invalid Bandwidth webhook authorization');
      }
      return;
    }

    const fallbackSecret = this.configuredSecret('BANDWIDTH_WEBHOOK_SECRET');
    if (fallbackSecret) {
      this.verifyGenericSignature('bandwidth', headers, rawBody, fallbackSecret);
      return;
    }

    if (process.env.NODE_ENV === 'production') {
      throw new BadRequestException('Bandwidth webhook authentication is not configured');
    }
    this.logger.warn('Bandwidth webhook authentication is not configured; accepting request outside production');
  }

  private verifyGenericSignature(
    source: ProviderWebhookSource,
    headers: Record<string, string>,
    rawBody: Buffer | undefined,
    secret: string,
  ): boolean {
    if (!rawBody) throw new BadRequestException(`Missing raw body for ${source} webhook verification`);

    const signature = this.readSignatureHeader(source, headers);
    if (!signature) throw new BadRequestException(`Missing ${source} webhook signature`);

    const body = rawBody.toString('utf8');
    const sha256 = createHmac('sha256', secret).update(body).digest('hex');
    const sha512 = createHmac('sha512', secret).update(body).digest('hex');
    const candidates = [sha256, `sha256=${sha256}`, sha512, `sha512=${sha512}`];
    const normalizedSignature = this.extractSignatureValue(signature);
    const verified = candidates.some((candidate) => this.safeCompare(candidate, normalizedSignature));

    if (!verified) throw new BadRequestException(`Invalid ${source} webhook signature`);
    return true;
  }

  private readSignatureHeader(source: ProviderWebhookSource, headers: Record<string, string>): string {
    const names = [
      'x-burnerpoint-signature',
      'x-signature',
      'x-webhook-signature',
      `x-${source}-signature`,
      'x-airalo-signature',
      'x-bandwidth-signature',
      'x-oxylabs-signature',
      'x-smartproxy-signature',
      'x-wireguard-signature',
    ];
    for (const name of names) {
      const value = this.headerValue(headers, name);
      if (value) return value;
    }
    return '';
  }

  private extractSignatureValue(signature: string): string {
    const value = signature.trim();
    const versioned = value
      .split(',')
      .map((part) => part.trim())
      .find((part) => part.startsWith('v1=') || part.startsWith('sha256=') || part.startsWith('sha512='));
    if (!versioned) return value;
    return versioned.startsWith('v1=') ? versioned.slice(3) : versioned;
  }

  private safeCompare(expected: string, actual: string): boolean {
    const expectedBuffer = Buffer.from(expected);
    const actualBuffer = Buffer.from(actual);
    if (expectedBuffer.length !== actualBuffer.length) return false;
    return timingSafeEqual(expectedBuffer, actualBuffer);
  }

  private getProviderEventId(payload: Record<string, unknown>, headers: Record<string, string>): string {
    return (
      this.headerValue(headers, 'x-event-id') ||
      this.headerValue(headers, 'x-request-id') ||
      this.headerValue(headers, 'x-webhook-id') ||
      this.asString(payload.id) ||
      this.asString(payload.eventId) ||
      this.asString(payload.event_id) ||
      this.asString(payload.messageId) ||
      this.asString(payload.message_id) ||
      this.asString(payload.payment_id)
    );
  }

  private getProviderEventType(payload: Record<string, unknown>): string {
    return (
      this.asString(payload.type) ||
      this.asString(payload.event) ||
      this.asString(payload.eventType) ||
      this.asString(payload.event_type) ||
      this.asString(payload.status) ||
      'provider.webhook'
    );
  }

  private headerValue(headers: Record<string, string>, name: string): string {
    const direct = headers[name] || headers[name.toLowerCase()] || headers[name.toUpperCase()];
    if (direct) return String(direct);
    const found = Object.entries(headers || {}).find(([key]) => key.toLowerCase() === name.toLowerCase());
    return found ? String(found[1]) : '';
  }

  private asString(value: unknown): string {
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return '';
  }
}
