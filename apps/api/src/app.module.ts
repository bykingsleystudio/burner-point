/**
 * apps/api/src/app.module.ts
 *
 * Root module with:
 * - All 10 service integrations registered
 * - Security middleware applied globally
 * - AI kill switch support
 */
import { Module, MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

// ── Feature modules ──────────────────────────────────────────────────────────
import { AuthModule } from './modules/auth/auth.module';
import { PhoneAuthModule } from './modules/phone-auth/phone-auth.module';
import { UsersModule } from './modules/users/users.module';
import { NumbersModule } from './modules/numbers/numbers.module';
import { LifecycleModule } from './modules/lifecycle/lifecycle.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { PaddleModule } from './modules/paddle/paddle.module';
import { BillingV2Module } from './modules/billing-v2/billing-v2.module';
import { AbuseModule } from './modules/abuse/abuse.module';
import { AiModule } from './modules/ai/ai.module';
import { GatewayModule } from './modules/gateway/gateway.module';
import { AdminModule } from './modules/admin/admin.module';
import { ApiPlatformModule } from './modules/api-platform/api-platform.module';
import { EnterpriseModule } from './modules/enterprise/enterprise.module';
import { GrowthModule } from './modules/growth/growth.module';
import { GlobalModule } from './modules/global/global.module';
import { SeoModule } from './modules/seo/seo.module';
import { MessagingModule } from './modules/messaging/messaging.module';
import { PlatformModule } from './modules/platform/platform.module';

// ── Security middleware ───────────────────────────────────────────────────────
import { SecurityMiddleware } from './middleware/security.middleware';

@Module({
  imports: [
    // Config — must be first (Railway injects env in production; no .env file on disk)
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      ignoreEnvFile: process.env.NODE_ENV === 'production',
    }),

    // Database - Neon Postgres via DATABASE_URL, with DB_* fallbacks for local tooling.
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => {
        const databaseUrl = cfg.get<string>('DATABASE_URL');
        const isProduction = cfg.get<string>('NODE_ENV') === 'production';
        const databaseHost = cfg.get<string>('DB_HOST') ?? '';
        const requiresSsl =
          isProduction ||
          cfg.get<string>('DB_SSL') === 'true' ||
          databaseUrl?.includes('sslmode=require') ||
          databaseUrl?.includes('.neon.tech') ||
          databaseHost.includes('.neon.tech');
        const ssl = requiresSsl
          ? { rejectUnauthorized: cfg.get<string>('DB_SSL_REJECT_UNAUTHORIZED') === 'true' }
          : false;

        const base = {
          type: 'postgres' as const,
          synchronize: cfg.get<string>('DB_SYNCHRONIZE') === 'true',
          logging: cfg.get<string>('DB_LOGGING') === 'true',
          autoLoadEntities: true,
          retryAttempts: 20,
          retryDelay: 3000,
          extra: isProduction
            ? { max: 20, idleTimeoutMillis: 30000, connectionTimeoutMillis: 10000 }
            : {},
        };

        if (databaseUrl) {
          return {
            ...base,
            url: databaseUrl,
            ssl,
          };
        }

        return {
          ...base,
          host: cfg.get<string>('DB_HOST'),
          port: parseInt(cfg.get<string>('DB_PORT') ?? '5432', 10),
          username: cfg.get<string>('DB_USER') ?? cfg.get<string>('DB_USERNAME'),
          password: cfg.get<string>('DB_PASS') ?? cfg.get<string>('DB_PASSWORD'),
          database: cfg.get<string>('DB_NAME') ?? cfg.get<string>('DB_DATABASE'),
          ssl,
        };
      },
    }),

    // Cron jobs
    ScheduleModule.forRoot(),

    // Global infrastructure (Redis, ProviderService)
    GlobalModule,
    PlatformModule,        // Safe stack registry + readiness status

    // Feature modules — all 10 services connected
    AuthModule,
    PhoneAuthModule,       // Twilio Verify OTP
    UsersModule,
    NumbersModule,         // Twilio now, Bandwidth-backed number infrastructure target
    LifecycleModule,       // TTL expiry cron jobs
    WebhooksModule,        // Twilio SMS/call event receiver
    PaymentsModule,        // Paystack, Paddle, NOWPayments core; secondary gateways gated
    PaddleModule,          // Paddle: credits, rentals, subscriptions
    BillingV2Module,       // Wallet ledger + subscription plans
    AbuseModule,           // Velocity limits + risk engine
    AiModule,              // OpenAI GPT-4o-mini (with kill switch)
    GatewayModule,         // Socket.IO real-time events
    AdminModule,           // Admin panel endpoints
    ApiPlatformModule,     // Developer API keys + webhooks
    EnterpriseModule,      // Workspaces, RBAC, audit logs
    GrowthModule,          // Referrals + rewards
    SeoModule,             // SEO: sitemap, robots.txt, structured data
    MessagingModule,       // Email: Resend SMTP (welcome, payment, OTP)
  ],
})
export class AppModule implements NestModule {
  /**
   * Apply SecurityMiddleware to all routes.
   * This handles:
   * - Per-IP rate limiting
   * - Auth route lockout (5 attempts / 15 min)
   * - Payment throttling
   * - Body size enforcement
   */
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(SecurityMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
