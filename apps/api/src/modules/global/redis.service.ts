import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;

  constructor(private configService: ConfigService) {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    const redisHost = this.configService.get<string>('REDIS_HOST');
    const redisPort = this.configService.get<string>('REDIS_PORT');

    const redisOptions = {
      retryStrategy: (times: number) => {
        if (times > 3) {
          this.logger.error('Redis: max retries reached — giving up');
          return null;
        }
        return Math.min(times * 500, 2000);
      },
      lazyConnect: false,
      maxRetriesPerRequest: 1,
    };

    if (redisUrl) {
      this.client = new Redis(redisUrl, redisOptions);
    } else if (redisHost) {
      const port = parseInt(redisPort ?? '6379', 10);
      this.client = new Redis({ host: redisHost, port, ...redisOptions });
    } else {
      this.logger.warn(
        'REDIS_URL / REDIS_HOST not set — Redis features disabled. Rate limiting will not work.',
      );
      return;
    }

    this.client.on('error', (err) => this.logger.error(`Redis error: ${err.message}`));
    this.client.on('connect', () => this.logger.log('Redis connected'));
  }

  async get(key: string): Promise<string | null> {
    if (!this.client) return null;
    try { return await this.client.get(key); } catch { return null; }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.client) return;
    try {
      if (ttlSeconds) await this.client.setex(key, ttlSeconds, value);
      else await this.client.set(key, value);
    } catch { }
  }

  async del(key: string): Promise<void> {
    if (!this.client) return;
    try { await this.client.del(key); } catch { }
  }

  async incr(key: string): Promise<number> {
    if (!this.client) return 0;
    try { return await this.client.incr(key); } catch { return 0; }
  }

  async expire(key: string, seconds: number): Promise<void> {
    if (!this.client) return;
    try { await this.client.expire(key, seconds); } catch { }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.client) return false;
    try { return (await this.client.exists(key)) === 1; } catch { return false; }
  }

  async ttl(key: string): Promise<number> {
    if (!this.client) return -1;
    try { return await this.client.ttl(key); } catch { return -1; }
  }

  async hset(key: string, field: string, value: string): Promise<void> {
    if (!this.client) return;
    try { await this.client.hset(key, field, value); } catch { }
  }

  async hget(key: string, field: string): Promise<string | null> {
    if (!this.client) return null;
    try { return await this.client.hget(key, field); } catch { return null; }
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    if (!this.client) return {};
    try { return await this.client.hgetall(key); } catch { return {}; }
  }

  async publish(channel: string, message: string): Promise<void> {
    if (!this.client) return;
    try { await this.client.publish(channel, message); } catch { }
  }

  async keys(pattern: string): Promise<string[]> {
    if (!this.client) return [];
    try { return await this.client.keys(pattern); } catch { return []; }
  }

  onModuleDestroy() {
    this.client?.disconnect();
  }
}
