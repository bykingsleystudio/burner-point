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
import { MessagingService, EmailOptions } from './messaging.service';

class SendEmailDto {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  from?: string;
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
  @HttpCode(HttpStatus.BAD_REQUEST)
  @ApiOperation({ summary: 'Send SMS (use phone-auth module instead)' })
  async sendSMS() {
    throw new Error('SMS sending should be handled through /phone-auth/send endpoint');
  }
}