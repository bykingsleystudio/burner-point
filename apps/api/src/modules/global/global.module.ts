import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisService } from './redis.service';
import { ProviderService } from './provider.service';
import { PhoneNumber } from '../../database/entities/phone-number.entity';
import { Message } from '../../database/entities/message.entity';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([PhoneNumber, Message])],
  providers: [RedisService, ProviderService],
  exports: [RedisService, ProviderService],
})
export class GlobalModule {}
