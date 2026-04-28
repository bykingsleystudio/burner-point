import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProviderName, RouteProduct } from '../global/provider.service';
import { MessagingService } from './messaging.service';

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

class SupportContactDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name: string;

  @IsEmail()
  @MaxLength(254)
  email: string;

  @IsString()
  @MinLength(10)
  @MaxLength(4000)
  message: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  product?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  reference?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  source?: string;
}

@ApiTags('messaging')
@Controller('messaging')
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

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

  @Post('support/contact')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Send a support request to Burner Point support' })
  async contactSupport(@Body() dto: SupportContactDto) {
    await this.messagingService.sendSupportIntake(dto);
    return { accepted: true };
  }

  @Post('sms/send')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Send SMS through provider routing' })
  async sendSMS(@Body() dto: SendSmsDto) {
    return this.messagingService.sendSMS(dto);
  }
}
