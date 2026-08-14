import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import axios from 'axios';
import { createHash, createHmac, randomBytes, randomUUID } from 'crypto';
import { ApiKey, DeveloperWebhook, DeveloperWebhookDelivery } from '../../database/entities/extended-entities';

@Injectable()
export class ApiPlatformService {
  private readonly logger = new Logger(ApiPlatformService.name);
  private static readonly MAX_DELIVERY_ATTEMPTS = 6;

  constructor(
    @InjectRepository(ApiKey) private keyRepo: Repository<ApiKey>,
    @InjectRepository(DeveloperWebhook) private webhookRepo: Repository<DeveloperWebhook>,
    @InjectRepository(DeveloperWebhookDelivery) private deliveryRepo: Repository<DeveloperWebhookDelivery>,
  ) {}

  async createApiKey(userId: string, name: string, scopes: string[], expiresAt?: Date | null) {
    const rawKey = `bp_${randomBytes(32).toString('hex')}`;
    const keyHash = createHash('sha256').update(rawKey).digest('hex');
    const keyPrefix = rawKey.slice(0, 8);

    const key = this.keyRepo.create({ userId, name, keyHash, keyPrefix, scopes, expiresAt: expiresAt ?? null });
    await this.keyRepo.save(key);

    // Return raw key ONCE — never stored again
    return { id: key.id, name, keyPrefix, rawKey, scopes, createdAt: key.createdAt };
  }

  async listApiKeys(userId: string) {
    return this.keyRepo.find({ where: { userId, isActive: true }, select: ['id', 'name', 'keyPrefix', 'scopes', 'usageCount', 'lastUsedAt', 'expiresAt', 'createdAt'] });
  }

  async revokeApiKey(id: string, userId: string) {
    const result = await this.keyRepo.update({ id, userId }, { isActive: false });
    if (!result.affected) throw new BadRequestException('API key not found');
    return { success: true };
  }

  async rotateApiKey(id: string, userId: string) {
    const existing = await this.keyRepo.findOne({ where: { id, userId, isActive: true } });
    if (!existing) throw new BadRequestException('API key not found');
    await this.keyRepo.update(existing.id, { isActive: false });
    return this.createApiKey(userId, existing.name, existing.scopes, existing.expiresAt);
  }

  async validateApiKey(rawKey: string): Promise<ApiKey | null> {
    const keyHash = createHash('sha256').update(rawKey).digest('hex');
    const key = await this.keyRepo.findOne({ where: { keyHash, isActive: true } });
    if (!key) return null;
    if (key.expiresAt && key.expiresAt <= new Date()) {
      await this.keyRepo.update(key.id, { isActive: false });
      return null;
    }
    await this.keyRepo.increment({ id: key.id }, 'usageCount', 1);
    await this.keyRepo.update(key.id, { lastUsedAt: new Date() });
    return key;
  }

  async createWebhook(userId: string, name: string, url: string, events: string[]) {
    this.assertSafeWebhookUrl(url);
    const signingSecret = randomBytes(32).toString('hex');
    const wh = this.webhookRepo.create({ userId, name, url, events, signingSecret });
    await this.webhookRepo.save(wh);
    return { id: wh.id, name, url, events, signingSecret };
  }

  async listWebhooks(userId: string) {
    return this.webhookRepo.find({ where: { userId }, select: ['id', 'name', 'url', 'events', 'isActive', 'deliverySuccessCount', 'deliveryFailureCount', 'lastDeliveryAt', 'createdAt'] });
  }

  async deleteWebhook(id: string, userId: string) {
    await this.webhookRepo.delete({ id, userId });
    return { success: true };
  }

  /** Queues signed events for every opted-in active endpoint owned by a user. */
  async enqueueDeveloperWebhookEvent(
    userId: string,
    eventType: string,
    payload: Record<string, unknown>,
    idempotencyKey: string,
  ) {
    const webhooks = await this.webhookRepo.find({
      where: { userId, isActive: true },
      select: ['id', 'events'],
    });
    const eventId = randomUUID();
    let queued = 0;

    for (const webhook of webhooks) {
      if (!webhook.events?.includes('*') && !webhook.events?.includes(eventType)) continue;
      const delivery = this.deliveryRepo.create({
        webhookId: webhook.id,
        eventId,
        eventType,
        payload,
        idempotencyKey: createHash('sha256')
          .update(`${webhook.id}:${eventType}:${idempotencyKey}`)
          .digest('hex'),
        status: 'pending',
        nextAttemptAt: new Date(),
      });
      try {
        await this.deliveryRepo.insert(delivery);
        queued += 1;
      } catch (error) {
        if (!this.isUniqueViolation(error)) throw error;
      }
    }

    return { eventId, queued };
  }

  async listWebhookDeliveries(userId: string, webhookId: string) {
    const webhook = await this.webhookRepo.findOne({ where: { id: webhookId, userId } });
    if (!webhook) throw new BadRequestException('Webhook not found');
    return this.deliveryRepo.find({
      where: { webhookId },
      order: { createdAt: 'DESC' },
      take: 100,
      select: [
        'id', 'eventId', 'eventType', 'idempotencyKey', 'attemptCount', 'status',
        'responseStatus', 'lastError', 'nextAttemptAt', 'deliveredAt', 'createdAt',
      ],
    });
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async processDueDeveloperWebhookDeliveries() {
    const now = new Date();
    const pending = await this.deliveryRepo.find({
      where: { status: 'pending', nextAttemptAt: LessThanOrEqual(now) },
      order: { createdAt: 'ASC' },
      take: 100,
    });

    for (const delivery of pending) {
      try {
        await this.deliverWebhook(delivery);
      } catch (error) {
        this.logger.error(`Developer webhook delivery ${delivery.id} failed unexpectedly: ${this.errorMessage(error)}`);
      }
    }
  }

  private async deliverWebhook(delivery: DeveloperWebhookDelivery) {
    const claim = await this.deliveryRepo.update(
      { id: delivery.id, status: 'pending' },
      { status: 'delivering' },
    );
    if (!claim.affected) return;

    const webhook = await this.webhookRepo.findOne({
      where: { id: delivery.webhookId, isActive: true },
      select: ['id', 'url', 'signingSecret', 'isActive'],
    });
    if (!webhook?.signingSecret) {
      await this.deliveryRepo.update(delivery.id, {
        status: 'disabled',
        lastError: 'Webhook endpoint is disabled or missing its signing secret',
      });
      return;
    }

    try {
      this.assertSafeWebhookUrl(webhook.url);
      const timestamp = new Date().toISOString();
      const envelope = {
        id: delivery.eventId,
        type: delivery.eventType,
        createdAt: timestamp,
        data: delivery.payload,
      };
      const serialized = JSON.stringify(envelope);
      const signature = createHmac('sha256', webhook.signingSecret).update(serialized).digest('hex');
      const response = await axios.post(webhook.url, envelope, {
        timeout: 10000,
        maxRedirects: 0,
        validateStatus: () => true,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Burner-Point-Webhooks/1.0',
          'X-Burner-Point-Event': delivery.eventType,
          'X-Burner-Point-Event-Id': delivery.eventId,
          'X-Burner-Point-Timestamp': timestamp,
          'X-Burner-Point-Signature': `sha256=${signature}`,
          'Idempotency-Key': delivery.idempotencyKey,
        },
      });

      if (response.status < 200 || response.status >= 300) {
        throw new Error(`Endpoint returned HTTP ${response.status}`);
      }

      await this.deliveryRepo.update(delivery.id, {
        status: 'delivered',
        attemptCount: delivery.attemptCount + 1,
        responseStatus: response.status,
        responseBody: this.responseSnippet(response.data),
        deliveredAt: new Date(),
        nextAttemptAt: null,
        lastError: null,
      });
      await this.webhookRepo.increment({ id: webhook.id }, 'deliverySuccessCount', 1);
      await this.webhookRepo.update(webhook.id, { lastDeliveryAt: new Date() });
    } catch (error) {
      const attemptCount = delivery.attemptCount + 1;
      const terminal = attemptCount >= ApiPlatformService.MAX_DELIVERY_ATTEMPTS;
      const nextAttemptAt = terminal
        ? null
        : new Date(Date.now() + Math.min(3600, 2 ** attemptCount * 30) * 1000);
      await this.deliveryRepo.update(delivery.id, {
        status: terminal ? 'failed' : 'pending',
        attemptCount,
        lastError: this.errorMessage(error),
        nextAttemptAt,
      });
      await this.webhookRepo.increment({ id: webhook.id }, 'deliveryFailureCount', 1);
    }
  }

  private isUniqueViolation(error: unknown) {
    return (error as { code?: string }).code === '23505';
  }

  private errorMessage(error: unknown) {
    return (error instanceof Error ? error.message : String(error)).slice(0, 1000);
  }

  private responseSnippet(value: unknown) {
    if (typeof value === 'string') return value.slice(0, 2000);
    try {
      return JSON.stringify(value).slice(0, 2000);
    } catch {
      return '[unserializable response]';
    }
  }

  private assertSafeWebhookUrl(value: string) {
    let parsed: URL;
    try {
      parsed = new URL(value);
    } catch {
      throw new BadRequestException('Webhook URL must be a valid URL');
    }

    if (parsed.protocol !== 'https:') {
      throw new BadRequestException('Webhook URL must use HTTPS');
    }

    const hostname = parsed.hostname.toLowerCase();
    const blockedHostnames = new Set(['localhost', 'metadata.google.internal']);
    if (
      blockedHostnames.has(hostname) ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal') ||
      this.isPrivateIp(hostname)
    ) {
      throw new BadRequestException('Webhook URL cannot target local or private network hosts');
    }
  }

  private isPrivateIp(hostname: string): boolean {
    const ipv4 = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ipv4) {
      const [a, b] = ipv4.slice(1).map(Number);
      return (
        a === 10 ||
        a === 127 ||
        (a === 169 && b === 254) ||
        (a === 172 && b >= 16 && b <= 31) ||
        (a === 192 && b === 168) ||
        a === 0
      );
    }
    return hostname === '::1' || hostname.startsWith('fc') || hostname.startsWith('fd') || hostname.startsWith('fe80');
  }
}
