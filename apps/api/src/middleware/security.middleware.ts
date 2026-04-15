/**
 * apps/api/src/middleware/security.middleware.ts
 *
 * Centralises all security middleware:
 * - Global rate limiting (Redis-backed, per IP + per user)
 * - Auth route lockout (5 attempts / 15 minutes)
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
import { createHash } from 'crypto';

// ─── Route classification ──────────────────────────────────────────────────
const AUTH_ROUTES = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/logout',
  '/auth/oauth',
  '/auth/clerk/exchange',
  '/phone-auth/send',
  '/phone-auth/verify',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/auth/logout',
  '/api/auth/oauth',
  '/api/auth/clerk/exchange',
  '/api/phone-auth/send',
  '/api/phone-auth/verify',
];

const PAYMENT_ROUTES = [
  '/payments/initialize',
  '/paddle/checkout',
  '/api/payments/initialize',
  '/api/paddle/checkout',
];

const WEBHOOK_ROUTES = [
  '/payments/webhook',
  '/api/payments/webhook',
  '/webhooks/twilio',
  '/webhooks/vonage',
  '/webhooks/infobip',
  '/api/webhooks/twilio',
  '/api/webhooks/vonage',
  '/api/webhooks/infobip',
  '/paddle/webhook',
  '/api/paddle/webhook',
];

// ─── Limits ────────────────────────────────────────────────────────────────
const LIMITS = {
  globalMax: 60,
  globalTtl: 60,          // 60 req/min per IP
  authMax: 5,
  authTtl: 900,           // 5 attempts / 15 minutes
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
    const isAuth = this.isAuthRoute(path);
    if (isAuth) {
      const routeBucket = this.getAuthRouteBucket(path);
      const blocked = await this.checkRateLimit(
        `auth:ip:${ip}:${routeBucket}`,
        LIMITS.authMax,
        LIMITS.authTtl,
        res,
        `Too many authentication attempts. Try again in 15 minutes.`,
      );
      if (blocked) return;

      const identifierHash = this.getAuthIdentifierHash(req);
      if (identifierHash) {
        const identityBlocked = await this.checkRateLimit(
          `auth:identity:${identifierHash}:${routeBucket}`,
          LIMITS.authMax,
          LIMITS.authTtl,
          res,
          `Too many authentication attempts for this account. Try again in 15 minutes.`,
        );
        if (identityBlocked) return;
      }

      await this.recordAuthRisk(ip, routeBucket, req);
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

  private isAuthRoute(path: string): boolean {
    return (
      AUTH_ROUTES.some((route) => path.startsWith(route)) ||
      path.startsWith('/auth/') ||
      path.startsWith('/api/auth/')
    );
  }

  private getAuthRouteBucket(path: string): string {
    return path
      .replace(/^\/api\//, '/')
      .split('/')
      .filter(Boolean)
      .slice(0, 3)
      .join(':') || 'auth';
  }

  private getAuthIdentifierHash(req: Request): string | null {
    const body = req.body as Record<string, unknown> | undefined;
    const raw =
      body?.identifier ||
      body?.email ||
      body?.phoneNumber ||
      body?.refreshToken ||
      body?.clerkToken;
    if (typeof raw !== 'string' || raw.trim().length < 3) return null;
    return createHash('sha256')
      .update(raw.trim().toLowerCase())
      .digest('hex')
      .slice(0, 32);
  }

  private async recordAuthRisk(ip: string, routeBucket: string, req: Request) {
    try {
      const riskKey = `auth:risk:${ip}:${routeBucket}`;
      const current = await this.redis.incr(riskKey);
      if (current === 1) {
        await this.redis.expire(riskKey, LIMITS.authTtl);
      }

      if (current >= Math.max(3, LIMITS.authMax - 1)) {
        const userAgent = req.headers['user-agent'] || 'unknown';
        this.logger.warn(
          `Suspicious auth velocity: ip=${ip} route=${routeBucket} attempts=${current} ua=${userAgent}`,
        );
      }
    } catch (err) {
      this.logger.error(`Auth risk check failed: ${err.message}`);
    }
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
