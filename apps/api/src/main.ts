/**
 * apps/api/src/main.ts
 *
 * Production-hardened entry point:
 * - rawBody: true (Paddle + NOWPayments webhook verification)
 * - Helmet security headers
 * - CORS allowlist
 * - HTTPS redirect in production
 * - Request size limits
 * - Global validation pipe with whitelist
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { DataSource } from 'typeorm';
import helmet from 'helmet';
import * as express from 'express';
import { hasConfiguredEnv } from './config/runtime-env';
import { RedisService } from './modules/global/redis.service';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
    rawBody: true, // Required for Paddle + NOWPayments HMAC webhook verification
  });

  const isProduction = process.env.NODE_ENV === 'production';

  // ── Security Headers (Helmet) ─────────────────────────────────────────────
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", 'https://cdn.paddle.com'],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'", 'wss:', 'https:'],
          frameSrc: ['https://checkout.paddle.com'],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: isProduction ? [] : null,
        },
      },
      hsts: isProduction
        ? { maxAge: 31536000, includeSubDomains: true, preload: true }
        : false,
      crossOriginEmbedderPolicy: false, // Allow Paddle iframe
    }),
  );

  // ── HTTPS redirect in production ──────────────────────────────────────────
  if (isProduction) {
    app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
      if (req.path === '/health' || req.path.startsWith('/health/')) {
        return next();
      }
      if (req.headers['x-forwarded-proto'] !== 'https') {
        return res.redirect(301, `https://${req.headers.host}${req.url}`);
      }
      next();
    });
  }

  // ── CORS ──────────────────────────────────────────────────────────────────
  const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS ?? process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter((origin) => Boolean(origin) && origin !== '*');
  const derivedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.WEB_URL,
    process.env.WEB_APP_URL,
    process.env.FRONTEND_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, '')}` : null,
  ].filter((origin): origin is string => Boolean(origin));
  const corsOrigins = Array.from(new Set([...allowedOrigins, ...derivedOrigins].map((origin) => origin.replace(/\/+$/, ''))));
  const allowVercelPreviews = process.env.CORS_ALLOW_VERCEL_PREVIEWS === 'true';

  if (isProduction && !corsOrigins.length) {
    logger.warn(
      'CORS_ALLOWED_ORIGINS is empty in production. Browser clients will be rejected until an explicit origin is configured.',
    );
  }
  if (isProduction && !hasConfiguredEnv('CLERK_WEBHOOK_SIGNING_SECRET', process.env)) {
    logger.warn('CLERK_WEBHOOK_SIGNING_SECRET is missing in production. Clerk webhook verification is disabled.');
  }

  app.enableCors({
    origin: (origin, callback) => {
      // Allow server-to-server requests (no origin header)
      if (!origin) return callback(null, true);
      const normalizedOrigin = origin.replace(/\/+$/, '');
      if (corsOrigins.includes(normalizedOrigin)) return callback(null, true);
      if (allowVercelPreviews && isVercelPreviewOrigin(normalizedOrigin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // ── Request size limits ───────────────────────────────────────────────────
  // 1MB for JSON, 5MB for file uploads (handled separately in upload endpoints)
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // ── Global Validation Pipe ────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,             // Strip undeclared properties
      forbidNonWhitelisted: true,  // Reject requests with undeclared properties
      transform: true,             // Auto-transform types
      transformOptions: { enableImplicitConversion: true },
      disableErrorMessages: isProduction, // Hide validation details in prod
    }),
  );

  // ── WebSocket ────────────────────────────────────────────────────────────
  app.useWebSocketAdapter(new IoAdapter(app));

  // Global prefix — keep /health outside prefixed routes for Railway checks
  app.setGlobalPrefix('api', { exclude: ['health'] });

  // ── Swagger (dev only) ────────────────────────────────────────────────────
  if (!isProduction) {
    const config = new DocumentBuilder()
      .setTitle('BurnerPoint API')
      .setDescription('Privacy-first telecommunications platform')
      .setVersion('1.0.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
    logger.log(`📚 Swagger: http://localhost:${process.env.PORT ?? process.env.APP_PORT ?? 3001}/api/docs`);
  }

  const dataSource = app.get(DataSource);
  const redisService = app.get(RedisService);

  // Railway healthcheck (railway.toml healthcheckPath = "/health")
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/health', (_req: unknown, res: { status: (code: number) => { json: (body: object) => void } }) => {
    res.status(200).json({
      status: 'ok',
      service: 'api',
      environment: process.env.NODE_ENV ?? 'development',
      ts: new Date().toISOString(),
    });
  });

  httpAdapter.get('/health/db', async (_req: unknown, res: { status: (code: number) => { json: (body: object) => void } }) => {
    try {
      await dataSource.query('SELECT 1');
      res.status(200).json({ status: 'ok', dependency: 'database', ts: new Date().toISOString() });
    } catch {
      res.status(503).json({ status: 'error', dependency: 'database', ts: new Date().toISOString() });
    }
  });

  httpAdapter.get('/health/queue', async (_req: unknown, res: { status: (code: number) => { json: (body: object) => void } }) => {
    try {
      const probeKey = `health:queue:${Date.now()}`;
      await redisService.set(probeKey, '1', 30);
      const roundTrip = await redisService.get(probeKey);
      res.status(roundTrip === '1' ? 200 : 503).json({
        status: roundTrip === '1' ? 'ok' : 'error',
        dependency: 'queue',
        ts: new Date().toISOString(),
      });
    } catch {
      res.status(503).json({ status: 'error', dependency: 'queue', ts: new Date().toISOString() });
    }
  });

  httpAdapter.get('/health/storage', (_req: unknown, res: { status: (code: number) => { json: (body: object) => void } }) => {
    const storageConfigured = Boolean(
      (process.env.AWS_BUCKET && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)
      || (process.env.R2_BUCKET && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY),
    );

    res.status(storageConfigured ? 200 : 503).json({
      status: storageConfigured ? 'ok' : 'error',
      dependency: 'storage',
      ts: new Date().toISOString(),
    });
  });

  const port = parseInt(process.env.PORT ?? process.env.APP_PORT ?? '3001', 10);
  await app.listen(port, '0.0.0.0');
  logger.log(`🔥 BurnerPoint API running on port ${port} [${process.env.NODE_ENV}]`);
}

bootstrap().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error('Fatal bootstrap error:', message);
  process.exit(1);
});

function isVercelPreviewOrigin(origin: string) {
  try {
    const { protocol, hostname } = new URL(origin);
    return protocol === 'https:' && hostname.endsWith('.vercel.app');
  } catch {
    return false;
  }
}
