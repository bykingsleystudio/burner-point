import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { WalletTransaction, SubscriptionPlan, UserSubscription } from '../../database/entities/extended-entities';
import { User } from '../../database/entities/user.entity';
import { RevenueCatModule } from '../revenuecat/revenuecat.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WalletTransaction, SubscriptionPlan, UserSubscription, User]),
    RevenueCatModule,
  ],
  controllers: [BillingController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingV2Module {}
