/**
 * apps/api/src/modules/payments/payments.module.ts
 *
 * COMPLETE REPLACEMENT FILE
 * - Removed: Stripe import (no longer a dependency)
 * - Paddle and NOWPayments use plain axios — no SDK needed
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import {
  PaymentSession,
  WalletTransaction,
  CreditPackage,
  WebhookDedup,
  SubscriptionPlan,
  UserSubscription,
} from '../../database/entities/extended-entities';
import {
  PaddleEvent,
  SubscriptionEntitlement,
  SubscriptionRecord,
} from '../../database/entities/subscription.entity';
import { User } from '../../database/entities/user.entity';
import { UsersModule } from '../users/users.module';
import { NumbersModule } from '../numbers/numbers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PaymentSession,
      WalletTransaction,
      CreditPackage,
      WebhookDedup,
      SubscriptionPlan,
      UserSubscription,
      SubscriptionRecord,
      SubscriptionEntitlement,
      PaddleEvent,
      User,
    ]),
    UsersModule,
    NumbersModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
