import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { CreditsModule } from '../credits/credits.module';
import { RevenueCatModule } from '../revenuecat/revenuecat.module';
import { EsimOrder, ProxyOrder, VpnSession } from '../../database/entities/extended-entities';
import { CredentialCipherService } from './credential-cipher.service';

@Module({
  imports: [TypeOrmModule.forFeature([EsimOrder, ProxyOrder, VpnSession]), CreditsModule, RevenueCatModule],
  controllers: [IntegrationsController],
  providers: [IntegrationsService, CredentialCipherService],
  exports: [IntegrationsService],
})
export class IntegrationsModule {}
