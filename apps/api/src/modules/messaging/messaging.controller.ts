import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MessagingService } from './messaging.service';
import { ProviderName, RouteProduct } from '../global/provider.service';
import { IsEnum, IsOptional, IsString } from 'class-validator';

class SendEmailDto {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  from?: string;
}

class SendSmsDto {
  @IsString()
  to: string;

  @IsString()
  body: string;

  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  countryCode?: string;

  @IsOptional()
  @IsEnum(RouteProduct)
  product?: RouteProduct;

  @IsOptional()
  @IsEnum(ProviderName)
  preferredProvider?: ProviderName;
}

@ApiTags('messaging')
@Controller('messaging')
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  // ─── Email Endpoints ─────────────────────────────────────────────────────

  @Post('email/send')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Send an email via Resend' })
  async sendEmail(@Body() dto: SendEmailDto) {
    return this.messagingService.sendEmail(dto);
  }

  @Post('email/welcome')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Send welcome email to user' })
  async sendWelcomeEmail(@Body() body: { email: string; firstName: string }) {
    await this.messagingService.sendWelcomeEmail(body.email, body.firstName);
    return { sent: true };
  }

  @Post('email/payment-confirmation')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Send payment confirmation email' })
  async sendPaymentConfirmation(@Body() body: { email: string; amount: number; reference: string }) {
    await this.messagingService.sendPaymentConfirmation(body.email, body.amount, body.reference);
    return { sent: true };
  }

  @Post('email/otp')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Send OTP via email' })
  async sendOTPEmail(@Body() body: { email: string; otp: string }) {
    await this.messagingService.sendOTPEmail(body.email, body.otp);
    return { sent: true };
  }

  // ─── SMS Endpoints (redirect to phone-auth) ─────────────────────────────

  @Post('sms/send')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Send SMS through provider routing (Twilio primary, Telnyx fallback, Tremil economy route)' })
  async sendSMS(@Body() dto: SendSmsDto) {
    return this.messagingService.sendSMS(dto);
  }
}
