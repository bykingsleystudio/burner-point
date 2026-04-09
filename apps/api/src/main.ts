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
import helmet from 'helmet';
import * as express from 'express';

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
      if (req.headers['x-forwarded-proto'] !== 'https') {
        return res.redirect(301, `https://${req.headers.host}${req.url}`);
      }
      next();
    });
  }

  // ── CORS ──────────────────────────────────────────────────────────────────
  const allowedOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow server-to-server requests (no origin header)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
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

  // Railway healthcheck (railway.toml healthcheckPath = "/health")
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/health', (_req: unknown, res: { status: (code: number) => { json: (body: object) => void } }) => {
    res.status(200).json({ status: 'ok', ts: new Date().toISOString() });
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
