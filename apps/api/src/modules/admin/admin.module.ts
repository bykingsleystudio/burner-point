import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User } from '../../database/entities/user.entity';
import { PhoneNumber } from '../../database/entities/phone-number.entity';
import { AbuseEvent } from '../../database/entities/extended-entities';
import { UsersModule } from '../users/users.module';
import { BillingV2Module } from '../billing-v2/billing-v2.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, PhoneNumber, AbuseEvent]), UsersModule, BillingV2Module],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
