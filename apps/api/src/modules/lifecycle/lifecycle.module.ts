import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LifecycleService } from './lifecycle.service';
import { PhoneNumber } from '../../database/entities/phone-number.entity';
import { NumbersModule } from '../numbers/numbers.module';

@Module({
  imports: [TypeOrmModule.forFeature([PhoneNumber]), NumbersModule],
  providers: [LifecycleService],
})
export class LifecycleModule {}
