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
} from '../../database/entities/extended-entities';
import { User } from '../../database/entities/user.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PaymentSession,
      WalletTransaction,
      CreditPackage,
      WebhookDedup,
      User,
    ]),
    UsersModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
