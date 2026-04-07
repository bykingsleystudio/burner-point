/**
 * apps/api/src/main.ts  — PATCH (single line change)
 *
 * Find this existing line:
 *   const app = await NestFactory.create(AppModule, {
 *     logger: ['error', 'warn', 'log'],
 *   });
 *
 * Replace with:
 *   const app = await NestFactory.create(AppModule, {
 *     logger: ['error', 'warn', 'log'],
 *     rawBody: true,   // required for Paddle + NOWPayments HMAC verification
 *   });
 *
 * ─── Why this matters ────────────────────────────────────────────────────────
 * Both Paddle and NOWPayments verify webhook authenticity by computing an HMAC
 * over the raw (unparsed) request body. Once Express/NestJS parses the JSON,
 * the original byte sequence is gone — whitespace and key order may differ,
 * making the computed HMAC not match the one sent in the header.
 * Setting rawBody: true tells NestJS to preserve the original Buffer alongside
 * the parsed body, accessible via req.rawBody in your controller.
 */

// Complete main.ts for reference — replace your existing file with this:
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
    rawBody: true,   // ← enables req.rawBody for Paddle + NOWPayments webhooks
  });

  // Security
  app.use(helmet());
  app.enableCors({
    origin: [
      process.env.WEB_URL || 'http://localhost:3000',
      process.env.MOBILE_DEEP_LINK_SCHEME || 'burnerpoint://',
    ],
    credentials: true,
  });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // WebSocket adapter
  app.useWebSocketAdapter(new IoAdapter(app));

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('BurnerPoint API')
    .setDescription('Privacy-first telecommunications platform API')
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication & authorization')
    .addTag('numbers', 'Phone number management')
    .addTag('payments', 'Payment processing')
    .addTag('admin', 'Admin operations')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.APP_PORT || 3001;
  await app.listen(port);
  console.log(`\n🔥 BurnerPoint API running on http://localhost:${port}`);
  console.log(`📚 Swagger: http://localhost:${port}/api/docs\n`);
}

bootstrap();
