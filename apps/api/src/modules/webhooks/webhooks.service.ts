import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message, MessageDirection, MessageStatus, MessageType } from '../../database/entities/message.entity';
import { Call, CallDirection, CallStatus, WebhookDedup } from '../../database/entities/extended-entities';
import { PhoneNumber } from '../../database/entities/phone-number.entity';
import { EventsGateway } from '../gateway/events.gateway';
import { AiService } from '../ai/ai.service';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  private readonly apiWebhookBaseUrl =
    `${(process.env.APP_URL ?? '').replace(/\/$/, '')}/api/webhooks`;

  constructor(
    @InjectRepository(Message) private msgRepo: Repository<Message>,
    @InjectRepository(Call) private callRepo: Repository<Call>,
    @InjectRepository(PhoneNumber) private numRepo: Repository<PhoneNumber>,
    @InjectRepository(WebhookDedup) private dedupRepo: Repository<WebhookDedup>,
    private eventsGateway: EventsGateway,
    private aiService: AiService,
  ) {}

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

  async handleVonageInboundWebhook(payload: Record<string, unknown>) {
    const eventId = this.asString(payload.messageId ?? payload['message-id'] ?? payload.messageId);
    if (!eventId) return { success: true };

    const duplicate = await this.storeWebhookEvent(eventId, 'vonage', 'message.inbound', payload);
    if (duplicate) return { success: true };

    await this.persistInboundProviderSms({
      provider: 'vonage',
      eventId,
      from: this.normalizePhone(this.asString(payload.msisdn ?? payload.from)),
      to: this.normalizePhone(this.asString(payload.to)),
      body: this.asString(payload.text),
      payload,
    });

    return { success: true };
  }

  async handleVonageStatusWebhook(payload: Record<string, unknown>) {
    const eventId = this.asString(payload.messageId ?? payload['message-id'] ?? payload.messageId);
    if (!eventId) return { success: true };

    const webhookEventId = `${eventId}:${this.asString(payload.status) || 'status'}`;
    const duplicate = await this.storeWebhookEvent(webhookEventId, 'vonage', 'message.status', payload);
    if (duplicate) return { success: true };

    await this.msgRepo.update(
      { providerMessageSid: eventId },
      { status: this.mapVonageMessageStatus(this.asString(payload.status)) },
    );

    return { success: true };
  }

  async handleInfobipInboundWebhook(
    payload: Record<string, unknown>,
    headers: Record<string, string>,
  ) {
    const results = this.getWebhookResults(payload);

    for (const item of results) {
      const eventId = this.asString(item.messageId ?? item.messageID ?? headers['x-infobip-message-id']);
      if (!eventId) continue;

      const duplicate = await this.storeWebhookEvent(eventId, 'infobip', 'message.inbound', item);
      if (duplicate) continue;

      await this.persistInboundProviderSms({
        provider: 'infobip',
        eventId,
        from: this.normalizePhone(this.asString(item.from)),
        to: this.normalizePhone(this.asString(item.to)),
        body: this.asString(item.text ?? item.cleanText),
        payload: item,
      });
    }

    return { success: true };
  }

  async handleInfobipDeliveryWebhook(
    payload: Record<string, unknown>,
    headers: Record<string, string>,
  ) {
    const results = this.getWebhookResults(payload);

    for (const item of results) {
      const eventId = this.asString(item.messageId ?? item.messageID ?? headers['x-infobip-message-id']);
      if (!eventId) continue;

      const webhookEventId = `${eventId}:${this.asString((item.status as Record<string, unknown> | undefined)?.groupName ?? item.status) || 'status'}`;
      const duplicate = await this.storeWebhookEvent(webhookEventId, 'infobip', 'message.status', item);
      if (duplicate) continue;

      await this.msgRepo.update(
        { providerMessageSid: eventId },
        { status: this.mapInfobipMessageStatus(item.status) },
      );
    }

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

  private getWebhookResults(payload: Record<string, unknown>): Record<string, unknown>[] {
    const results = payload.results;
    if (Array.isArray(results)) {
      return results.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object');
    }
    return [payload];
  }

  private mapVonageMessageStatus(status: string): MessageStatus {
    const normalized = status.toLowerCase();
    if (['delivered'].includes(normalized)) return MessageStatus.DELIVERED;
    if (['accepted', 'buffered', 'sent'].includes(normalized)) return MessageStatus.SENT;
    if (['failed', 'expired', 'rejected', 'undeliverable'].includes(normalized)) return MessageStatus.FAILED;
    return MessageStatus.SENT;
  }

  private mapInfobipMessageStatus(status: unknown): MessageStatus {
    const value = typeof status === 'object' && status
      ? this.asString((status as Record<string, unknown>).groupName ?? (status as Record<string, unknown>).name)
      : this.asString(status);
    const normalized = value.toLowerCase();
    if (normalized.includes('delivered')) return MessageStatus.DELIVERED;
    if (normalized.includes('pending') || normalized.includes('sent')) return MessageStatus.SENT;
    if (normalized.includes('undeliverable') || normalized.includes('expired') || normalized.includes('rejected')) {
      return MessageStatus.FAILED;
    }
    return MessageStatus.SENT;
  }

  private normalizePhone(value: string): string {
    if (!value) return '';
    return value.startsWith('+') ? value : `+${value}`;
  }

  private asString(value: unknown): string {
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return '';
  }
}
