import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  RevenueCatEvent,
  SubscriptionEntitlement,
  SubscriptionRecord,
} from '../../database/entities/subscription.entity';
import { User } from '../../database/entities/user.entity';
import { GatewayModule } from '../gateway/gateway.module';
import { RevenueCatController } from './revenuecat.controller';
import { RevenueCatService } from './revenuecat.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SubscriptionRecord,
      SubscriptionEntitlement,
      RevenueCatEvent,
      User,
    ]),
    GatewayModule,
  ],
  controllers: [RevenueCatController],
  providers: [RevenueCatService],
  exports: [RevenueCatService],
})
export class RevenueCatModule {}
