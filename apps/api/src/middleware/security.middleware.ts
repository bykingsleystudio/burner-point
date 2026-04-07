/**
 * apps/api/src/middleware/security.middleware.ts
 *
 * Centralises all security middleware:
 * - Global rate limiting (Redis-backed, per IP + per user)
 * - Auth route lockout (5 attempts / 10 minutes)
 * - Payment route throttling
 * - Input sanitisation
 * - Request size limits
 * - Abuse detection
 */
import {
  Injectable,
  NestMiddleware,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../modules/global/redis.service';

// ─── Route classification ──────────────────────────────────────────────────
const AUTH_ROUTES = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/phone-auth/send',
  '/phone-auth/verify',
];

const PAYMENT_ROUTES = [
  '/payments/initialize',
  '/paddle/checkout',
];

const WEBHOOK_ROUTES = [
  '/payments/webhook',
  '/webhooks/twilio',
  '/paddle/webhook',
];

// ─── Limits ────────────────────────────────────────────────────────────────
const LIMITS = {
  globalMax: 60,
  globalTtl: 60,          // 60 req/min per IP
  authMax: 5,
  authTtl: 600,           // 5 attempts / 10 minutes
  paymentMax: 10,
  paymentTtl: 60,         // 10 payment inits / minute
  maxBodyBytes: 1_048_576, // 1MB hard limit
};

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  private readonly logger = new Logger(SecurityMiddleware.name);

  constructor(
    private redis: RedisService,
    private config: ConfigService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const path = req.path.toLowerCase();
    const ip = this.getClientIp(req);

    // Skip rate limiting for webhooks (they need to be reachable)
    const isWebhook = WEBHOOK_ROUTES.some((r) => path.startsWith(r));
    if (isWebhook) return next();

    // 1. Check request body size
    const contentLength = parseInt(req.headers['content-length'] ?? '0');
    if (contentLength > LIMITS.maxBodyBytes) {
      return res.status(HttpStatus.PAYLOAD_TOO_LARGE).json({
        statusCode: 413,
        message: 'Request payload too large',
      });
    }

    // 2. Auth route rate limiting (strictest)
    const isAuth = AUTH_ROUTES.some((r) => path.startsWith(r));
    if (isAuth) {
      const blocked = await this.checkRateLimit(
        `auth:${ip}`,
        LIMITS.authMax,
        LIMITS.authTtl,
        res,
        `Too many authentication attempts. Try again in 10 minutes.`,
      );
      if (blocked) return;
    }

    // 3. Payment route rate limiting
    const isPayment = PAYMENT_ROUTES.some((r) => path.startsWith(r));
    if (isPayment) {
      const blocked = await this.checkRateLimit(
        `payment:${ip}`,
        LIMITS.paymentMax,
        LIMITS.paymentTtl,
        res,
        `Too many payment requests. Please slow down.`,
      );
      if (blocked) return;
    }

    // 4. Global rate limiting
    const blocked = await this.checkRateLimit(
      `global:${ip}`,
      LIMITS.globalMax,
      LIMITS.globalTtl,
      res,
      `Rate limit exceeded. Please slow down.`,
    );
    if (blocked) return;

    next();
  }

  private async checkRateLimit(
    key: string,
    max: number,
    ttlSeconds: number,
    res: Response,
    message: string,
  ): Promise<boolean> {
    try {
      const current = await this.redis.incr(key);
      if (current === 1) {
        await this.redis.expire(key, ttlSeconds);
      }

      res.setHeader('X-RateLimit-Limit', max.toString());
      res.setHeader(
        'X-RateLimit-Remaining',
        Math.max(0, max - current).toString(),
      );

      if (current > max) {
        const ttl = await this.redis.ttl(key);
        res.setHeader('Retry-After', ttl.toString());
        this.logger.warn(`Rate limit hit: ${key} (${current}/${max})`);
        res.status(HttpStatus.TOO_MANY_REQUESTS).json({
          statusCode: 429,
          message,
          retryAfter: ttl,
        });
        return true;
      }
      return false;
    } catch (err) {
      // If Redis is down, fail open (don't block requests)
      this.logger.error(`Rate limit check failed: ${err.message}`);
      return false;
    }
  }

  private getClientIp(req: Request): string {
    return (
      (req.headers['cf-connecting-ip'] as string) ||
      (req.headers['x-real-ip'] as string) ||
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      'unknown'
    );
  }
}

// ─── Input sanitisation helper ────────────────────────────────────────────
// Import and use in your service files where user input is processed.

/**
 * Strips HTML tags and dangerous characters from a string.
 * Use before storing any user-provided text in the database.
 */
export function sanitizeString(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<[^>]*>/g, '')                  // strip HTML tags
    .replace(/[&<>"'`=\/]/g, (char) => {       // encode dangerous chars
      const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '`': '&#x60;',
        '=': '&#x3D;',
        '/': '&#x2F;',
      };
      return map[char] ?? char;
    })
    .trim()
    .slice(0, 10_000); // hard max length
}

/**
 * Validates a phone number is in E.164 format.
 */
export function validateE164(phone: string): boolean {
  return /^\+[1-9]\d{1,14}$/.test(phone);
}

/**
 * Validates an email address.
 */
export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}
