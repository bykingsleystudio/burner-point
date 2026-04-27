import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PhoneAuthService } from './phone-auth.service';
import { IsString, IsIn, Matches, Length } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

class SendOtpDto {
  @Matches(/^\+[1-9]\d{6,14}$/, { message: 'Enter your phone number with country code.' })
  phoneNumber: string;

  @IsString()
  @IsIn(['sms', 'call'])
  channel: 'sms' | 'call';
}

class VerifyOtpDto {
  @Matches(/^\+[1-9]\d{6,14}$/, { message: 'Enter your phone number with country code.' })
  phoneNumber: string;

  @IsString()
  @Length(4, 10)
  code: string;
}

@ApiTags('phone-auth')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('phone-auth')
export class PhoneAuthController {
  constructor(private service: PhoneAuthService) {}

  @Post('send')
  @ApiOperation({ summary: 'Send OTP to phone number via Twilio Verify' })
  send(@Body() dto: SendOtpDto, @Req() req) {
    return this.service.sendOtp(req.user.id, dto.phoneNumber, dto.channel, req.ip);
  }

  @Post('verify')
  @ApiOperation({ summary: 'Verify OTP code' })
  verify(@Body() dto: VerifyOtpDto, @Req() req) {
    return this.service.verifyOtp(req.user.id, dto.phoneNumber, dto.code);
  }
}
