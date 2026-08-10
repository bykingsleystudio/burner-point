import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NumbersController } from './numbers.controller';
import { NumbersService } from './numbers.service';
import { PhoneNumber } from '../../database/entities/phone-number.entity';
import { UsersModule } from '../users/users.module';
import { CreditsModule } from '../credits/credits.module';

@Module({
  imports: [TypeOrmModule.forFeature([PhoneNumber]), UsersModule, CreditsModule],
  controllers: [NumbersController],
  providers: [NumbersService],
  exports: [NumbersService],
})
export class NumbersModule {}
