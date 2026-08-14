import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VerificationOrder, VerificationService } from '../../database/entities/extended-entities';
import { ApiPlatformModule } from '../api-platform/api-platform.module';
import { CreditsModule } from '../credits/credits.module';
import { NumbersModule } from '../numbers/numbers.module';
import { VerificationHubController } from './verification-hub.controller';
import { VerificationHubService } from './verification-hub.service';

@Module({
  imports: [TypeOrmModule.forFeature([VerificationService, VerificationOrder]), CreditsModule, NumbersModule, ApiPlatformModule],
  controllers: [VerificationHubController],
  providers: [VerificationHubService],
  exports: [VerificationHubService],
})
export class VerificationHubModule {}
