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
import { SecurityAuditService } from '../modules/security/security-audit.service';
import { AbuseService } from '../modules/abuse/abuse.service';

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
  '/webhooks/telnyx',
  '/webhooks/airalo',
  '/webhooks/oxylabs',
  '/webhooks/smartproxy',
  '/webhooks/wireguard',
  '/webhooks/clerk',
  '/api/webhooks/twilio',
  '/api/webhooks/telnyx',
  '/api/webhooks/airalo',
  '/api/webhooks/oxylabs',
  '/api/webhooks/smartproxy',
  '/api/webhooks/wireguard',
  '/api/webhooks/clerk',
  '/paddle/webhook',
  '/api/paddle/webhook',
];

const STATE_CHANGING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const BLOCKED_METHODS = new Set(['TRACE', 'TRACK']);
const ALLOWED_BODY_TYPES = [
  'application/json',
  'application/x-www-form-urlencoded',
  'multipart/form-data',
  'text/plain',
  'application/octet-stream',
];
const DANGEROUS_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

// ─── Limits ────────────────────────────────────────────────────────────────
const LIMITS = {
  globalMax: 60,
  globalTtl: 60,          // 60 req/min per IP
  authMax: 5,
  authTtl: 900,           // 5 attempts / 15 minutes
  paymentMax: 10,
  paymentTtl: 60,         // 10 payment inits / minute
  webhookMax: 600,
  webhookTtl: 60,         // High enough for provider retries but still bounded
  maxBodyBytes: 1_048_576, // 1MB hard limit
  maxDepth: 10,
  maxObjectKeys: 100,
  maxArrayItems: 1000,
  maxStringBytes: 100_000,
};

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  private readonly logger = new Logger(SecurityMiddleware.name);

  constructor(
    private redis: RedisService,
    private config: ConfigService,
    private securityAudit: SecurityAuditService,
    private abuseService: AbuseService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const path = req.path.toLowerCase();
    const method = req.method.toUpperCase();
    const ip = this.getClientIp(req);

    if (BLOCKED_METHODS.has(method)) {
      await this.recordSecurityAudit(req, ip, 'security.method_blocked', {
        method,
        path,
      });
      return res.status(HttpStatus.METHOD_NOT_ALLOWED).json({
        statusCode: 405,
        message: 'HTTP method not allowed',
      });
    }

    const isWebhook = WEBHOOK_ROUTES.some((r) => path.startsWith(r));

    // 1. Check request body size
    const contentLength = parseInt(req.headers['content-length'] ?? '0');
    if (contentLength > LIMITS.maxBodyBytes) {
      await this.recordSecurityAudit(req, ip, 'security.payload_too_large', {
        path,
        contentLength,
        limit: LIMITS.maxBodyBytes,
      });
      return res.status(HttpStatus.PAYLOAD_TOO_LARGE).json({
        statusCode: 413,
        message: 'Request payload too large',
      });
    }

    if (!this.hasAllowedContentType(req)) {
      await this.recordSecurityAudit(req, ip, 'security.content_type_blocked', {
        path,
        method,
        contentType: req.headers['content-type'],
      });
      return res.status(HttpStatus.UNSUPPORTED_MEDIA_TYPE).json({
        statusCode: 415,
        message: 'Unsupported content type',
      });
    }

    const payloadViolation = this.inspectRequestPayload(req);
    if (payloadViolation) {
      await this.recordSecurityAudit(req, ip, 'security.malformed_payload', {
        path,
        reason: payloadViolation,
      });
      return res.status(HttpStatus.BAD_REQUEST).json({
        statusCode: 400,
        message: payloadViolation,
      });
    }

    // 2. Webhook route rate limiting (providers need reachability, not unlimited traffic)
    if (isWebhook) {
      const blocked = await this.checkRateLimit(
        `webhook:${ip}:${this.routeFamily(path)}`,
        this.limitFromEnv('WEBHOOK_RATE_LIMIT_MAX', LIMITS.webhookMax),
        this.limitFromEnv('WEBHOOK_RATE_LIMIT_TTL_SECONDS', LIMITS.webhookTtl),
        res,
        'Webhook rate limit exceeded.',
        req,
        ip,
        path,
      );
      if (blocked) return;
      return next();
    }

    // 3. Auth route rate limiting (strictest)
    const isAuth = this.isAuthRoute(path);
    if (isAuth) {
      const routeBucket = this.getAuthRouteBucket(path);
      const blocked = await this.checkRateLimit(
        `auth:ip:${ip}:${routeBucket}`,
        LIMITS.authMax,
        LIMITS.authTtl,
        res,
        `Too many authentication attempts. Try again in 15 minutes.`,
        req,
        ip,
        path,
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
          req,
          ip,
          path,
        );
        if (identityBlocked) return;
      }

      await this.recordAuthRisk(ip, routeBucket, req);
    }

    // 4. Payment route rate limiting
    const isPayment = PAYMENT_ROUTES.some((r) => path.startsWith(r));
    if (isPayment) {
      const blocked = await this.checkRateLimit(
        `payment:${ip}`,
        LIMITS.paymentMax,
        LIMITS.paymentTtl,
        res,
        `Too many payment requests. Please slow down.`,
        req,
        ip,
        path,
      );
      if (blocked) return;
    }

    // 5. Global rate limiting
    const blocked = await this.checkRateLimit(
      `global:${ip}`,
      this.limitFromEnv('GLOBAL_RATE_LIMIT_MAX', LIMITS.globalMax),
      this.limitFromEnv('GLOBAL_RATE_LIMIT_TTL_SECONDS', LIMITS.globalTtl),
      res,
      `Rate limit exceeded. Please slow down.`,
      req,
      ip,
      path,
    );
    if (blocked) return;

    const abuseBlocked = await this.checkAbuse(req, res, ip, path);
    if (abuseBlocked) return;

    next();
  }

  private async checkRateLimit(
    key: string,
    max: number,
    ttlSeconds: number,
    res: Response,
    message: string,
    req?: Request,
    ip?: string,
    path?: string,
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
        if (req && ip && path) {
          await this.recordSecurityAudit(req, ip, 'security.rate_limited', {
            path,
            key,
            current,
            max,
            retryAfter: ttl,
          });
        }
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

  private limitFromEnv(name: string, fallback: number): number {
    const parsed = parseInt(this.config.get<string>(name) || '', 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
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

  private routeFamily(path: string): string {
    return path
      .replace(/^\/api\//, '/')
      .split('/')
      .filter(Boolean)
      .slice(0, 3)
      .join(':') || 'root';
  }

  private hasAllowedContentType(req: Request): boolean {
    if (!STATE_CHANGING_METHODS.has(req.method.toUpperCase())) return true;
    const contentLength = parseInt(req.headers['content-length'] ?? '0', 10);
    if (!contentLength) return true;

    const contentType = String(req.headers['content-type'] || '').toLowerCase();
    if (!contentType) return false;
    return ALLOWED_BODY_TYPES.some((allowed) => contentType.includes(allowed));
  }

  private inspectRequestPayload(req: Request): string | null {
    return (
      this.inspectPayload(req.body, 'body', 0) ||
      this.inspectPayload(req.query, 'query', 0) ||
      this.inspectPayload(req.params, 'params', 0)
    );
  }

  private inspectPayload(value: unknown, location: string, depth: number): string | null {
    if (value === null || value === undefined) return null;
    if (depth > LIMITS.maxDepth) return `Malformed payload: ${location} is nested too deeply`;

    if (typeof value === 'string') {
      if (Buffer.byteLength(value, 'utf8') > LIMITS.maxStringBytes) {
        return `Malformed payload: ${location} string is too large`;
      }
      return null;
    }

    if (typeof value !== 'object') return null;

    if (Array.isArray(value)) {
      if (value.length > LIMITS.maxArrayItems) return `Malformed payload: ${location} has too many items`;
      for (let index = 0; index < value.length; index += 1) {
        const violation = this.inspectPayload(value[index], `${location}[${index}]`, depth + 1);
        if (violation) return violation;
      }
      return null;
    }

    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length > LIMITS.maxObjectKeys) return `Malformed payload: ${location} has too many keys`;

    for (const [key, nested] of entries) {
      if (DANGEROUS_KEYS.has(key)) {
        return `Malformed payload: ${location} contains a blocked key`;
      }
      const violation = this.inspectPayload(nested, `${location}.${key}`, depth + 1);
      if (violation) return violation;
    }

    return null;
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
        await this.recordSecurityAudit(req, ip, 'security.suspicious_auth_velocity', {
          route: routeBucket,
          attempts: current,
        });
      }
    } catch (err) {
      this.logger.error(`Auth risk check failed: ${err.message}`);
    }
  }

  private async checkAbuse(req: Request, res: Response, ip: string, path: string): Promise<boolean> {
    const action = this.abuseActionForPath(path);
    try {
      await this.abuseService.checkAndRecord({
        ipAddress: ip,
        deviceFingerprint: this.deviceFingerprint(req),
        action,
      });
      return false;
    } catch (error) {
      if (error instanceof HttpException && error.getStatus() === HttpStatus.FORBIDDEN) {
        await this.recordSecurityAudit(req, ip, 'security.abuse_blocked', {
          path,
          action,
        });
        res.status(HttpStatus.FORBIDDEN).json({
          statusCode: 403,
          message: 'Request blocked by abuse prevention system',
        });
        return true;
      }

      this.logger.warn(`Abuse check failed open: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  private abuseActionForPath(path: string): string {
    if (this.isAuthRoute(path)) return 'login_attempt';
    if (path.includes('/phone-auth/send') || path.includes('/messaging/sms/send')) return 'sms_send';
    if (path.includes('/numbers') || path.includes('/rentals') || path.includes('/payments/initialize')) {
      return 'number_purchase';
    }
    return 'api_request';
  }

  private deviceFingerprint(req: Request): string | undefined {
    const header = req.headers['x-device-fingerprint'] || req.headers['x-burner-device-id'];
    if (!header) return undefined;
    return createHash('sha256').update(String(header)).digest('hex').slice(0, 32);
  }

  private async recordSecurityAudit(
    req: Request,
    ip: string,
    action: string,
    details: Record<string, unknown>,
  ) {
    await this.securityAudit.record({
      action,
      resource: 'security.middleware',
      ipAddress: ip,
      userAgent: String(req.headers['user-agent'] || ''),
      newValue: {
        ...details,
        method: req.method,
      },
    });
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
