import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbuseEvent, AbuseEventType, AbuseAction, VelocityCounter } from '../../database/entities/extended-entities';
import { RedisService } from '../global/redis.service';

export interface RiskContext {
  userId?: string;
  ipAddress?: string;
  deviceFingerprint?: string;
  action: string;
}

const VELOCITY_LIMITS: Record<string, Record<string, number>> = {
  sms_send:      { '1h': 20,  '24h': 100, '7d': 500 },
  number_purchase: { '1h': 3, '24h': 10,  '7d': 30  },
  login_attempt: { '1h': 10,  '24h': 30,  '7d': 100 },
  api_request:   { '1h': 1000,'24h': 5000,'7d': 20000 },
};

@Injectable()
export class AbuseService {
  private readonly logger = new Logger(AbuseService.name);

  constructor(
    @InjectRepository(AbuseEvent) private eventRepo: Repository<AbuseEvent>,
    @InjectRepository(VelocityCounter) private counterRepo: Repository<VelocityCounter>,
    private redisService: RedisService,
  ) {}

  async checkAndRecord(ctx: RiskContext): Promise<{ allowed: boolean; riskScore: number }> {
    const riskScore = await this.calculateRiskScore(ctx);

    if (riskScore >= 0.9) {
      await this.recordEvent(ctx, AbuseEventType.VELOCITY_BREACH, AbuseAction.BLOCK, riskScore);
      throw new ForbiddenException('Request blocked by abuse prevention system');
    }

    if (riskScore >= 0.7) {
      await this.recordEvent(ctx, AbuseEventType.VELOCITY_BREACH, AbuseAction.FLAG, riskScore);
    }

    await this.incrementVelocity(ctx);
    return { allowed: true, riskScore };
  }

  private async calculateRiskScore(ctx: RiskContext): Promise<number> {
    let score = 0;
    const limits = VELOCITY_LIMITS[ctx.action];
    if (!limits) return 0;

    // Check velocity across windows
    for (const [window, limit] of Object.entries(limits)) {
      const key = this.buildKey(ctx, window);
      const count = parseInt(await this.redisService.get(key) || '0');
      const ratio = count / limit;
      if (ratio >= 1) score = Math.max(score, 0.9);
      else if (ratio >= 0.8) score = Math.max(score, 0.7);
      else if (ratio >= 0.5) score = Math.max(score, 0.3);
    }

    return score;
  }

  private async incrementVelocity(ctx: RiskContext) {
    const windows: Record<string, number> = { '1h': 3600, '24h': 86400, '7d': 604800 };
    for (const [window, ttl] of Object.entries(windows)) {
      const key = this.buildKey(ctx, window);
      await this.redisService.incr(key);
      await this.redisService.expire(key, ttl);
    }
  }

  private buildKey(ctx: RiskContext, window: string): string {
    const dim = ctx.userId ? `user:${ctx.userId}` : `ip:${ctx.ipAddress}`;
    return `velocity:${dim}:${ctx.action}:${window}`;
  }

  private async recordEvent(
    ctx: RiskContext,
    type: AbuseEventType,
    action: AbuseAction,
    riskScore: number,
  ): Promise<void> {
    const details = Object.assign({}, ctx) as unknown as Record<string, unknown>;

    await this.eventRepo.save(
      this.eventRepo.create({
        userId: ctx.userId,
        ipAddress: ctx.ipAddress,
        deviceFingerprint: ctx.deviceFingerprint,
        eventType: type,
        action,
        riskScore,
        details,
      }),
    );
  }

  async getRecentEvents(userId?: string, limit = 20): Promise<AbuseEvent[]> {
    const qb = this.eventRepo.createQueryBuilder('e').orderBy('e.createdAt', 'DESC').take(limit);
    if (userId) qb.where('e.userId = :userId', { userId });
    return qb.getMany();
  }
}
