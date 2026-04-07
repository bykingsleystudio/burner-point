import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NumbersController } from './numbers.controller';
import { NumbersService } from './numbers.service';
import { PhoneNumber } from '../../database/entities/phone-number.entity';
import { User } from '../../database/entities/user.entity';
import { WalletTransaction } from '../../database/entities/extended-entities';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([PhoneNumber, User, WalletTransaction]), UsersModule],
  controllers: [NumbersController],
  providers: [NumbersService],
  exports: [NumbersService],
})
export class NumbersModule {}
