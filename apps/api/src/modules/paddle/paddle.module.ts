/**
 * apps/api/src/modules/paddle/paddle.module.ts
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaddleController } from './paddle.controller';
import { PaddleService } from './paddle.service';
import { User } from '../../database/entities/user.entity';
import { PhoneNumber } from '../../database/entities/phone-number.entity';
import { WalletTransaction } from '../../database/entities/extended-entities';

@Module({
  imports: [TypeOrmModule.forFeature([User, PhoneNumber, WalletTransaction])],
  controllers: [PaddleController],
  providers: [PaddleService],
  exports: [PaddleService],
})
export class PaddleModule {}
