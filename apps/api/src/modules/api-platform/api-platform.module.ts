import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiPlatformController } from './api-platform.controller';
import { ApiPlatformService } from './api-platform.service';
import { ApiKey, DeveloperWebhook, DeveloperWebhookDelivery } from '../../database/entities/extended-entities';
import { ApiKeyOrJwtGuard } from './api-key.guard';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ApiKey, DeveloperWebhook, DeveloperWebhookDelivery]),
    AuthModule,
  ],
  controllers: [ApiPlatformController],
  providers: [ApiPlatformService, ApiKeyOrJwtGuard],
  exports: [ApiPlatformService, ApiKeyOrJwtGuard],
})
export class ApiPlatformModule {}
