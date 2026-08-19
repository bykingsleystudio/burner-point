import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisService } from './redis.service';
import { ProviderService } from './provider.service';
import { PhoneNumber } from '../../database/entities/phone-number.entity';
import { Message } from '../../database/entities/message.entity';
import { FxService } from './fx.service';
import { FxController } from './fx.controller';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([PhoneNumber, Message])],
  controllers: [FxController],
  providers: [RedisService, ProviderService, FxService],
  exports: [RedisService, ProviderService, FxService],
})
export class GlobalModule {}
