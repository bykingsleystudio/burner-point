import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PhoneAuthService } from './phone-auth.service';
import { IsString, IsMobilePhone, IsIn } from 'class-validator';

class SendOtpDto {
  @IsMobilePhone() phoneNumber: string;
  @IsString() @IsIn(['sms', 'call', 'whatsapp']) channel: 'sms' | 'call' | 'whatsapp';
}

class VerifyOtpDto {
  @IsMobilePhone() phoneNumber: string;
  @IsString() code: string;
}

@ApiTags('phone-auth')
@Controller('phone-auth')
export class PhoneAuthController {
  constructor(private service: PhoneAuthService) {}

  @Post('send')
  @ApiOperation({ summary: 'Send OTP to phone number via Twilio Verify' })
  send(@Body() dto: SendOtpDto, @Req() req) {
    return this.service.sendOtp(dto.phoneNumber, dto.channel, req.ip);
  }

  @Post('verify')
  @ApiOperation({ summary: 'Verify OTP code' })
  verify(@Body() dto: VerifyOtpDto) {
    return this.service.verifyOtp(dto.phoneNumber, dto.code);
  }
}
