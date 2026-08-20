import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from '../../database/entities/message.entity';
import { PhoneNumber } from '../../database/entities/phone-number.entity';
import { GatewayModule } from '../gateway/gateway.module';
import { GlobalModule } from '../global/global.module';
import { ApiPlatformModule } from '../api-platform/api-platform.module';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { RevenueCatModule } from '../revenuecat/revenuecat.module';

@Module({
  imports: [TypeOrmModule.forFeature([Message, PhoneNumber]), GatewayModule, GlobalModule, ApiPlatformModule, RevenueCatModule],
  controllers: [MessagesController],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}
