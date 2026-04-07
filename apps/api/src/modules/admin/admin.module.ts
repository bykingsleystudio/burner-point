import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User } from '../../database/entities/user.entity';
import { PhoneNumber } from '../../database/entities/phone-number.entity';
import { AbuseEvent } from '../../database/entities/extended-entities';

@Module({
  imports: [TypeOrmModule.forFeature([User, PhoneNumber, AbuseEvent])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
