import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { PaymentSession, WalletTransaction } from '../../database/entities/extended-entities';
import { PhoneNumber } from '../../database/entities/phone-number.entity';
import { SubscriptionEntitlement, SubscriptionRecord } from '../../database/entities/subscription.entity';
import { User } from '../../database/entities/user.entity';
import { CreditsModule } from '../credits/credits.module';
import { RevenueCatModule } from '../revenuecat/revenuecat.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WalletTransaction,
      PaymentSession,
      PhoneNumber,
      SubscriptionRecord,
      SubscriptionEntitlement,
      User,
    ]),
    CreditsModule,
    RevenueCatModule,
  ],
  controllers: [BillingController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingV2Module {}
