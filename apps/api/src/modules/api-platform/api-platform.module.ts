import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiPlatformController } from './api-platform.controller';
import { ApiPlatformService } from './api-platform.service';
import { ApiKey, DeveloperWebhook } from '../../database/entities/extended-entities';

@Module({
  imports: [TypeOrmModule.forFeature([ApiKey, DeveloperWebhook])],
  controllers: [ApiPlatformController],
  providers: [ApiPlatformService],
  exports: [ApiPlatformService],
})
export class ApiPlatformModule {}
