import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash, randomBytes } from 'crypto';
import { ApiKey, DeveloperWebhook } from '../../database/entities/extended-entities';

@Injectable()
export class ApiPlatformService {
  constructor(
    @InjectRepository(ApiKey) private keyRepo: Repository<ApiKey>,
    @InjectRepository(DeveloperWebhook) private webhookRepo: Repository<DeveloperWebhook>,
  ) {}

  async createApiKey(userId: string, name: string, scopes: string[]) {
    const rawKey = `bp_${randomBytes(32).toString('hex')}`;
    const keyHash = createHash('sha256').update(rawKey).digest('hex');
    const keyPrefix = rawKey.slice(0, 8);

    const key = this.keyRepo.create({ userId, name, keyHash, keyPrefix, scopes });
    await this.keyRepo.save(key);

    // Return raw key ONCE — never stored again
    return { id: key.id, name, keyPrefix, rawKey, scopes, createdAt: key.createdAt };
  }

  async listApiKeys(userId: string) {
    return this.keyRepo.find({ where: { userId, isActive: true }, select: ['id', 'name', 'keyPrefix', 'scopes', 'usageCount', 'lastUsedAt', 'expiresAt', 'createdAt'] });
  }

  async revokeApiKey(id: string, userId: string) {
    await this.keyRepo.update({ id, userId }, { isActive: false });
    return { success: true };
  }

  async validateApiKey(rawKey: string): Promise<ApiKey | null> {
    const keyHash = createHash('sha256').update(rawKey).digest('hex');
    const key = await this.keyRepo.findOne({ where: { keyHash, isActive: true } });
    if (!key) return null;
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
