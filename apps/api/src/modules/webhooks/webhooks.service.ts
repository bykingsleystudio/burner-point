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
}
