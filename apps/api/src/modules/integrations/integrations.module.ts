import { Module } from '@nestjs/common';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { CreditsModule } from '../credits/credits.module';
import { RevenueCatModule } from '../revenuecat/revenuecat.module';

@Module({
  imports: [CreditsModule, RevenueCatModule],
  controllers: [IntegrationsController],
  providers: [IntegrationsService],
  exports: [IntegrationsService],
})
export class IntegrationsModule {}
