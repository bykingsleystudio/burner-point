import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreditPackage, WalletTransaction } from '../../database/entities/extended-entities';
import {
  CreditAccount,
  CreditLock,
  CreditPricingLog,
  CreditPricingRule,
  CreditTransaction,
  Wallet,
  WalletLock,
} from '../../database/entities/financial-ledger.entity';
import { PhoneNumber } from '../../database/entities/phone-number.entity';
import { GatewayModule } from '../gateway/gateway.module';
import { UsersModule } from '../users/users.module';
import {
  CallCreditsController,
  InternalCallCreditsController,
  InternalWalletController,
  WalletController,
} from './credits.controller';
import { CreditsService } from './credits.service';
import { InternalApiKeyGuard } from './internal-api-key.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CreditPackage,
      CreditAccount,
      CreditTransaction,
      CreditLock,
      CreditPricingRule,
      CreditPricingLog,
      Wallet,
      WalletLock,
      WalletTransaction,
      PhoneNumber,
    ]),
    UsersModule,
    GatewayModule,
  ],
  controllers: [
    CallCreditsController,
    InternalCallCreditsController,
    WalletController,
    InternalWalletController,
  ],
  providers: [CreditsService, InternalApiKeyGuard],
  exports: [CreditsService],
})
export class CreditsModule {}
