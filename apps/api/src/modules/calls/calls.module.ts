import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Call } from '../../database/entities/extended-entities';
import { CreditPricingRule } from '../../database/entities/financial-ledger.entity';
import { PhoneNumber } from '../../database/entities/phone-number.entity';
import { CreditsModule } from '../credits/credits.module';
import { GatewayModule } from '../gateway/gateway.module';
import { RevenueCatModule } from '../revenuecat/revenuecat.module';
import { CallBillingService } from './call-billing.service';
import { CallsController } from './calls.controller';
import { CallsService } from './calls.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Call,
      PhoneNumber,
      CreditPricingRule,
    ]),
    CreditsModule,
    RevenueCatModule,
    GatewayModule,
  ],
  controllers: [CallsController],
  providers: [CallBillingService, CallsService],
  exports: [CallBillingService, CallsService],
})
export class CallsModule {}
