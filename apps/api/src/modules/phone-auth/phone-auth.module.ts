import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PhoneAuthController } from './phone-auth.controller';
import { PhoneAuthService } from './phone-auth.service';
import { PhoneOtpSession } from '../../database/entities/extended-entities';
import { User } from '../../database/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PhoneOtpSession, User])],
  controllers: [PhoneAuthController],
  providers: [PhoneAuthService],
  exports: [PhoneAuthService],
})
export class PhoneAuthModule {}
