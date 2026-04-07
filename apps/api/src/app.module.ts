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

// ── Security middleware ───────────────────────────────────────────────────────
import { SecurityMiddleware } from './middleware/security.middleware';

@Module({
  imports: [
    // Config — must be first
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'production' ? '.env.production' : '.env',
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type: 'postgres',
        url: cfg.get<string>('DATABASE_URL'),
        synchronize: cfg.get<string>('DB_SYNCHRONIZE') === 'true',
        logging: cfg.get<string>('DB_LOGGING') === 'true',
        autoLoadEntities: true,
        ssl:
          cfg.get('NODE_ENV') === 'production'
            ? { rejectUnauthorized: false }
            : false,
        // Connection pool settings for production
        extra:
          cfg.get('NODE_ENV') === 'production'
            ? { max: 20, idleTimeoutMillis: 30000, connectionTimeoutMillis: 2000 }
            : {},
      }),
    }),

    // Cron jobs
    ScheduleModule.forRoot(),

    // Global infrastructure (Redis, ProviderService)
    GlobalModule,

    // Feature modules — all 10 services connected
    AuthModule,
    PhoneAuthModule,       // Twilio Verify OTP
    UsersModule,
    NumbersModule,         // Twilio + Telnyx number provisioning
    LifecycleModule,       // TTL expiry cron jobs
    WebhooksModule,        // Twilio SMS/call event receiver
    PaymentsModule,        // Flutterwave, Paystack, Squad, Korapay, OPay, NOWPayments
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
   * - Auth route lockout (5 attempts / 10 min)
   * - Payment throttling
   * - Body size enforcement
   */
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(SecurityMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
