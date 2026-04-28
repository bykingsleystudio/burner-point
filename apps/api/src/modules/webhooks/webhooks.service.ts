import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHmac, timingSafeEqual } from 'crypto';
import { Repository } from 'typeorm';
import { verifyWebhook } from '@clerk/backend/webhooks';
import { Message, MessageDirection, MessageStatus, MessageType } from '../../database/entities/message.entity';
import { Call, CallDirection, CallStatus, WebhookDedup } from '../../database/entities/extended-entities';
import { PhoneNumber } from '../../database/entities/phone-number.entity';
import { EventsGateway } from '../gateway/events.gateway';
import { AiService } from '../ai/ai.service';
import { resolveClerkWebhookSigningSecret, resolveWebhookBaseUrl } from '../../config/runtime-env';

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
  ) {
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
    payload: Record<string, unknown>,
    headers: Record<string, string>,
    rawBody?: Buffer,
  ) {
    const result = await this.handleProviderWebhook('bandwidth', payload, headers, rawBody);
    const eventType = this.getProviderEventType(payload).toLowerCase();
    const from = this.asString(payload.from) || this.asString((payload.message as Record<string, unknown> | undefined)?.from);
    const to = this.asString(payload.to) || this.asString(payload.owner) || this.asString((payload.message as Record<string, unknown> | undefined)?.to);
    const body = this.asString(payload.text) || this.asString(payload.body) || this.asString((payload.message as Record<string, unknown> | undefined)?.text);

    if (eventType.includes('message') && from && to) {
      await this.persistInboundProviderSms({
        provider: 'bandwidth',
        eventId:
          this.asString(payload.messageId) ||
          this.asString((payload.message as Record<string, unknown> | undefined)?.id) ||
          `${Date.now()}`,
        from,
        to,
        body,
        payload,
      }).catch((error) => {
        this.logger.warn(`Bandwidth inbound message persistence failed: ${error instanceof Error ? error.message : String(error)}`);
      });
    }

    return result;
  }

  async handleBandwidthVoiceWebhook(
    payload: Record<string, unknown>,
    headers: Record<string, string>,
  ) {
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

  async handleClerkWebhook(
    payload: Record<string, unknown>,
    headers: Record<string, string>,
    rawBody: Buffer | undefined,
    url: string,
  ) {
    const secret = resolveClerkWebhookSigningSecret(this.configService);
    let verified = false;
    let verifiedPayload = payload;
    const isProduction = process.env.NODE_ENV === 'production';

    if (secret) {
      if (!rawBody) throw new BadRequestException('Missing raw body for Clerk webhook verification');

      try {
        const requestHeaders = new Headers();
        Object.entries(headers || {}).forEach(([key, value]) => {
          if (value !== undefined) requestHeaders.set(key, String(value));
        });
        const event = await verifyWebhook(
          new Request(url, {
            method: 'POST',
            headers: requestHeaders,
            body: rawBody.toString('utf8'),
          }),
          { signingSecret: secret },
        );
        verifiedPayload = event as unknown as Record<string, unknown>;
        verified = true;
      } catch (error) {
        this.logger.warn(`Clerk webhook verification failed: ${error instanceof Error ? error.message : String(error)}`);
        throw new BadRequestException('Invalid Clerk webhook signature');
      }
    } else {
      this.logger.warn('Clerk webhook rejected because CLERK_WEBHOOK_SIGNING_SECRET is not configured');
      if (isProduction) throw new BadRequestException('Webhook verification not configured');
    }

    const eventType = this.asString(verifiedPayload.type ?? verifiedPayload.event) || 'clerk.webhook';
    const data = verifiedPayload.data as Record<string, unknown> | undefined;
    const providerEventId =
      this.asString(verifiedPayload.id) ||
      this.asString(data?.id) ||
      this.headerValue(headers, 'svix-id') ||
      `${Date.now()}`;
    const eventId = `clerk:${providerEventId}:${eventType}`;
    const duplicate = await this.storeWebhookEvent(eventId, 'clerk', eventType, {
      ...verifiedPayload,
      verified,
    });

    return {
      success: true,
      source: 'clerk',
      eventId: providerEventId,
      eventType,
      duplicate,
      verified,
    };
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
