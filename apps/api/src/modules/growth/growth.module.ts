import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GrowthController } from './growth.controller';
import { GrowthService } from './growth.service';
import { Referral } from '../../database/entities/extended-entities';
import { User } from '../../database/entities/user.entity';
import { UsersModule } from '../users/users.module';
import { BillingV2Module } from '../billing-v2/billing-v2.module';

@Module({
  imports: [TypeOrmModule.forFeature([Referral, User]), UsersModule, BillingV2Module],
  controllers: [GrowthController],
  providers: [GrowthService],
  exports: [GrowthService],
})
export class GrowthModule {}
