import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NumbersController } from './numbers.controller';
import { NumbersService } from './numbers.service';
import { PhoneNumber } from '../../database/entities/phone-number.entity';
import { UsersModule } from '../users/users.module';
import { CreditsModule } from '../credits/credits.module';
import { ApiPlatformModule } from '../api-platform/api-platform.module';

@Module({
  imports: [TypeOrmModule.forFeature([PhoneNumber]), UsersModule, CreditsModule, ApiPlatformModule],
  controllers: [NumbersController],
  providers: [NumbersService],
  exports: [NumbersService],
})
export class NumbersModule {}
