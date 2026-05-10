import { Module } from '@nestjs/common';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { UsersModule } from '../users/users.module';
import { BillingV2Module } from '../billing-v2/billing-v2.module';
import { RevenueCatModule } from '../revenuecat/revenuecat.module';

@Module({
  imports: [UsersModule, BillingV2Module, RevenueCatModule],
  controllers: [IntegrationsController],
  providers: [IntegrationsService],
  exports: [IntegrationsService],
})
export class IntegrationsModule {}
