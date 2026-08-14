import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import {
  Message,
  MessageDirection,
  MessageStatus,
  MessageType,
} from '../../database/entities/message.entity';
import { NumberStatus, PhoneNumber } from '../../database/entities/phone-number.entity';
import { ProviderName, ProviderService } from '../global/provider.service';
import { EventsGateway } from '../gateway/events.gateway';
import { ApiPlatformService } from '../api-platform/api-platform.service';

export interface SendMessageInput {
  from: string;
  to: string;
  body: string;
  preferredProvider?: ProviderName;
}

export interface MessagePage {
  data: Message[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  unreadCount: number;
}

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message) private readonly messageRepo: Repository<Message>,
    @InjectRepository(PhoneNumber) private readonly numberRepo: Repository<PhoneNumber>,
    private readonly providerService: ProviderService,
    private readonly eventsGateway: EventsGateway,
    private readonly apiPlatformService: ApiPlatformService,
  ) {}

  async list(userId: string, phoneNumberId: string, page = 1, limit = 50): Promise<MessagePage> {
    await this.getOwnedNumber(userId, phoneNumberId);
    const safePage = Math.max(1, Number.isFinite(page) ? Math.floor(page) : 1);
    const safeLimit = Math.min(100, Math.max(1, Number.isFinite(limit) ? Math.floor(limit) : 50));
    const where = { userId, phoneNumberId };
    const [data, total] = await this.messageRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
    });
    const unreadCount = await this.messageRepo.count({
      where: { ...where, direction: MessageDirection.INBOUND, readAt: IsNull() },
    });

    return {
      data,
      pagination: { page: safePage, limit: safeLimit, total, totalPages: Math.max(1, Math.ceil(total / safeLimit)) },
      unreadCount,
    };
  }

  async getConversation(
    userId: string,
    phoneNumberId: string,
    counterpart: string,
    page = 1,
    limit = 50,
  ): Promise<MessagePage> {
    const number = await this.getOwnedNumber(userId, phoneNumberId);
    const safeCounterpart = this.requireE164(counterpart, 'Counterpart');
    const safePage = Math.max(1, Number.isFinite(page) ? Math.floor(page) : 1);
    const safeLimit = Math.min(100, Math.max(1, Number.isFinite(limit) ? Math.floor(limit) : 50));
    const baseWhere = { userId, phoneNumberId };
    const [data, total] = await this.messageRepo
      .createQueryBuilder('message')
      .where('message.user_id = :userId', { userId })
      .andWhere('message.phone_number_id = :phoneNumberId', { phoneNumberId })
      .andWhere('((message.from_number = :owned AND message.to_number = :counterpart) OR (message.from_number = :counterpart AND message.to_number = :owned))', {
        owned: number.number,
        counterpart: safeCounterpart,
      })
      .orderBy('message.created_at', 'DESC')
      .skip((safePage - 1) * safeLimit)
      .take(safeLimit)
      .getManyAndCount();
    const unreadCount = await this.messageRepo.count({
      where: { ...baseWhere, direction: MessageDirection.INBOUND, readAt: IsNull() },
    });
    return {
      data,
      pagination: { page: safePage, limit: safeLimit, total, totalPages: Math.max(1, Math.ceil(total / safeLimit)) },
      unreadCount,
    };
  }

  async send(userId: string, input: SendMessageInput): Promise<Message> {
    const from = this.requireE164(input.from, 'Sender');
    const to = this.requireE164(input.to, 'Recipient');
    const body = input.body?.trim();
    if (!body || body.length > 1600) {
      throw new BadRequestException('Message body must contain between 1 and 1600 characters');
    }
    const phoneNumber = await this.getOwnedNumberByNumber(userId, from);
    if (phoneNumber.status !== NumberStatus.ACTIVE) {
      throw new BadRequestException('The selected phone number is not active');
    }
    if (!phoneNumber.capabilities?.includes('sms')) {
      throw new BadRequestException('The selected phone number does not support SMS');
    }

    const result = await this.providerService.sendSms(to, from, body, {
      countryCode: phoneNumber.countryCode,
      preferredProvider: input.preferredProvider,
    });
    const message = await this.messageRepo.save(this.messageRepo.create({
      from,
      to,
      body,
      direction: MessageDirection.OUTBOUND,
      status: this.normalizeProviderStatus(result.status),
      type: MessageType.SMS,
      providerMessageSid: result.sid,
      phoneNumberId: phoneNumber.id,
      userId,
      numSegments: Math.max(1, Math.ceil(body.length / 160)),
      metadata: { provider: result.provider, routeLabel: result.routeLabel },
    }));
    await this.numberRepo.increment({ id: phoneNumber.id }, 'smsSent', 1);
    this.eventsGateway.emitToUser(userId, 'message.sent', message);
    await this.queueDeveloperWebhook(userId, 'message.sent', message, `message.sent:${message.id}`);
    return message;
  }

  async recordInbound(input: {
    provider: ProviderName;
    providerMessageId: string;
    from: string;
    to: string;
    body: string;
    mediaUrls?: string[];
    numSegments?: number;
  }): Promise<Message | null> {
    const phoneNumber = await this.numberRepo.findOne({ where: { number: input.to } });
    if (!phoneNumber?.userId) return null;
    const existing = await this.messageRepo.findOne({
      where: { providerMessageSid: input.providerMessageId },
    });
    if (existing) return existing;
    const message = await this.messageRepo.save(this.messageRepo.create({
      from: input.from,
      to: input.to,
      body: input.body,
      direction: MessageDirection.INBOUND,
      status: MessageStatus.RECEIVED,
      type: input.mediaUrls?.length ? MessageType.MMS : MessageType.SMS,
      providerMessageSid: input.providerMessageId,
      phoneNumberId: phoneNumber.id,
      userId: phoneNumber.userId,
      numSegments: input.numSegments ?? 1,
      mediaUrls: input.mediaUrls ?? [],
      metadata: { provider: input.provider },
    }));
    await this.numberRepo.increment({ id: phoneNumber.id }, 'smsReceived', 1);
    this.eventsGateway.emitToUser(phoneNumber.userId, 'message.received', message);
    await this.queueDeveloperWebhook(phoneNumber.userId, 'message.received', message, `message.received:${message.id}`);
    return message;
  }

  async updateDeliveryStatus(providerMessageId: string, status: string): Promise<Message | null> {
    const message = await this.messageRepo.findOne({ where: { providerMessageSid: providerMessageId } });
    if (!message) return null;
    const nextStatus = this.normalizeProviderStatus(status);
    if (message.status === nextStatus) return message;
    message.status = nextStatus;
    const saved = await this.messageRepo.save(message);
    if (saved.userId) this.eventsGateway.emitToUser(saved.userId, 'message.status', saved);
    if (saved.userId) await this.queueDeveloperWebhook(saved.userId, 'message.status', saved, `message.status:${saved.id}:${saved.status}`);
    return saved;
  }

  async markRead(userId: string, messageId: string): Promise<Message> {
    const message = await this.messageRepo.findOne({ where: { id: messageId, userId } });
    if (!message) throw new NotFoundException('Message not found');
    if (message.direction === MessageDirection.INBOUND && !message.readAt) {
      message.readAt = new Date();
      message.status = MessageStatus.READ;
      const saved = await this.messageRepo.save(message);
      this.eventsGateway.emitToUser(userId, 'message.read', saved);
      return saved;
    }
    return message;
  }

  private async getOwnedNumber(userId: string, phoneNumberId: string): Promise<PhoneNumber> {
    const number = await this.numberRepo.findOne({ where: { id: phoneNumberId, userId } });
    if (!number) throw new NotFoundException('Phone number not found');
    return number;
  }

  private async getOwnedNumberByNumber(userId: string, phoneNumber: string): Promise<PhoneNumber> {
    const number = await this.numberRepo.findOne({ where: { number: phoneNumber, userId } });
    if (!number) throw new NotFoundException('Phone number not found');
    return number;
  }

  private requireE164(value: string, label: string): string {
    if (!/^\+[1-9]\d{6,14}$/.test(value ?? '')) {
      throw new BadRequestException(`${label} must be an E.164 phone number`);
    }
    return value;
  }

  private normalizeProviderStatus(status: string): MessageStatus {
    switch (status.toLowerCase()) {
      case 'delivered': return MessageStatus.DELIVERED;
      case 'failed':
      case 'undelivered': return MessageStatus.FAILED;
      case 'received': return MessageStatus.RECEIVED;
      case 'sent': return MessageStatus.SENT;
      case 'accepted':
      case 'queued':
      case 'pending':
      default: return MessageStatus.QUEUED;
    }
  }

  private async queueDeveloperWebhook(
    userId: string,
    eventType: string,
    message: Message,
    idempotencyKey: string,
  ) {
    try {
      await this.apiPlatformService.enqueueDeveloperWebhookEvent(
        userId,
        eventType,
        {
          id: message.id,
          from: message.from,
          to: message.to,
          body: message.body,
          direction: message.direction,
          status: message.status,
          providerMessageId: message.providerMessageSid,
          phoneNumberId: message.phoneNumberId,
          createdAt: message.createdAt,
        },
        idempotencyKey,
      );
    } catch {
      // The message state is canonical. A delivery worker failure must not undo a
      // successfully persisted telecom event; the platform records it separately.
    }
  }
}
