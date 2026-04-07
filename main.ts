/**
 * PATCH: Add health check endpoint to apps/api/src/main.ts
 *
 * Add this block BEFORE app.listen():
 *
 *   // Health check endpoint — Railway uses this to confirm the service is running
 *   app.getHttpAdapter().get('/health', (req, res) => {
 *     res.status(200).json({
 *       status: 'ok',
 *       timestamp: new Date().toISOString(),
 *       uptime: process.uptime(),
 *       environment: process.env.NODE_ENV,
 *     });
 *   });
 *
 * Your complete main.ts should look like this:
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
    rawBody: true,
  });

  const isProduction = process.env.NODE_ENV === 'production';

  // Security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", 'https://cdn.paddle.com'],
        frameSrc: ['https://checkout.paddle.com'],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: isProduction ? [] : null,
      },
    },
    hsts: isProduction
      ? { maxAge: 31536000, includeSubDomains: true, preload: true }
      : false,
    crossOriginEmbedderPolicy: false,
  }));

  // CORS
  const allowedOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.length === 0) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      if (!isProduction) return callback(null, true); // Allow all in dev
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Request size limits
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // WebSocket
  app.useWebSocketAdapter(new IoAdapter(app));

  // ── Health check endpoint ────────────────────────────────────────
  // Railway uses this to confirm the service started successfully.
  // Must respond 200 before Railway marks the deployment as healthy.
  app.getHttpAdapter().get('/health', (_req: any, res: any) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
      environment: process.env.NODE_ENV ?? 'development',
    });
  });

  // Swagger (dev only)
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
    logger.log(`📚 Swagger: http://localhost:${process.env.APP_PORT ?? 3001}/api/docs`);
  }

  const port = parseInt(process.env.APP_PORT ?? process.env.PORT ?? '3001');
  await app.listen(port, '0.0.0.0');
  logger.log(`🔥 BurnerPoint API running on port ${port} [${process.env.NODE_ENV ?? 'development'}]`);
}

bootstrap().catch((err) => {
  console.error('Fatal bootstrap error:', err);
  process.exit(1);
});
