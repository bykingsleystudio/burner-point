import { Injectable, NotFoundException } from '@nestjs/common';
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
}
