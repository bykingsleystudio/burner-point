/**
 * apps/api/src/modules/payments/payments.controller.ts
 *
 * Burner Point Payment Controller
 * - Credits: $0.99 per verification
 * - Rental: $5.99 per rental (1-14 days)
 * - Subscription: $15.99/month
 */
import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Headers,
  UseGuards,
  RawBodyRequest,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { PaymentsService, PaymentType } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaymentGateway } from '../../database/entities/extended-entities';
import { IsEnum, IsIn, IsInt, IsOptional, IsString, Matches, Max, Min } from 'class-validator';
import { NumberType } from '../../database/entities/phone-number.entity';

class InitPaymentDto {
  @IsOptional()
  @IsEnum(PaymentType)
  paymentType?: PaymentType;

  @IsOptional()
  @IsEnum(PaymentGateway)
  gateway?: PaymentGateway;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(14)
  rentalDays?: number; // Only for rental payments

  @IsOptional()
  @IsString()
  packageId?: string;

  @IsOptional()
  @IsString()
  planId?: string;

  @IsOptional()
  @Matches(/^\+[1-9]\d{6,14}$/)
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  countryCode?: string;

  @IsOptional()
  @IsEnum(NumberType)
  numberType?: NumberType;

  @IsOptional()
  @IsIn(['web', 'mobile'])
  clientPlatform?: 'web' | 'mobile';
}

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly service: PaymentsService) {}

  // ─── Authenticated endpoints ──────────────────────────────────────────────

  @Post('initialize')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Initialize a payment session' })
  initialize(@Body() dto: InitPaymentDto, @Req() req: { user: { id: string } }) {
    return this.service.initializePayment(
      req.user.id,
      dto.paymentType,
      dto.gateway,
      dto.rentalDays,
      dto.packageId,
      dto.clientPlatform,
      {
        planId: dto.planId,
        phoneNumber: dto.phoneNumber,
        countryCode: dto.countryCode,
        numberType: dto.numberType,
      },
    );
  }

  @Get('packages')
  @ApiOperation({ summary: 'Get active credit packages' })
  packages() {
    return this.service.getCreditPackages();
  }

  @Get('history')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get payment & transaction history' })
  history(@Req() req: { user: { id: string } }) {
    return this.service.getTransactionHistory(req.user.id);
  }

  // ─── Paddle Webhook ──────────────────────────────────────────────────────

  @Post('webhook/paddle')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Paddle payment webhook' })
  webhookPaddle(
    @Req() req: RawBodyRequest<Request>,
    @Headers('paddle-signature') signature: string,
  ) {
    return this.service.handlePaddleWebhook(req.rawBody, signature);
  }

  // ─── NOWPayments Webhook ─────────────────────────────────────────────────

  @Post('webhook/nowpayments')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'NOWPayments IPN webhook' })
  webhookNowPayments(
    @Body() body: Record<string, unknown>,
    @Headers() headers: Record<string, string>,
    @Req() req: RawBodyRequest<Request>,
  ) {
    return this.service.handleNowPaymentsWebhook(body, headers, req.rawBody);
  }

  // ─── Nigerian Gateway Webhooks ─────────────────────────────────────────

  @Post('webhook/flutterwave')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Flutterwave payment webhook' })
  webhookFlutterwave(
    @Body() body: Record<string, unknown>,
    @Headers() headers: Record<string, string>,
    @Req() req: RawBodyRequest<Request>,
  ) {
    return this.service.handleWebhook(PaymentGateway.FLUTTERWAVE, body, headers, req.rawBody);
  }

  @Post('webhook/paystack')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Paystack payment webhook' })
  webhookPaystack(
    @Body() body: Record<string, unknown>,
    @Headers() headers: Record<string, string>,
    @Req() req: RawBodyRequest<Request>,
  ) {
    return this.service.handleWebhook(PaymentGateway.PAYSTACK, body, headers, req.rawBody);
  }

  @Post('webhook/squad')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Squad by GTCO payment webhook' })
  webhookSquad(
    @Body() body: Record<string, unknown>,
    @Headers() headers: Record<string, string>,
    @Req() req: RawBodyRequest<Request>,
  ) {
    return this.service.handleWebhook(PaymentGateway.SQUAD, body, headers, req.rawBody);
  }

  @Post('webhook/korapay')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Korapay payment webhook' })
  webhookKorapay(
    @Body() body: Record<string, unknown>,
    @Headers() headers: Record<string, string>,
    @Req() req: RawBodyRequest<Request>,
  ) {
    return this.service.handleWebhook(PaymentGateway.KORAPAY, body, headers, req.rawBody);
  }

  @Post('webhook/opay')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'OPay payment webhook' })
  webhookOpay(
    @Body() body: Record<string, unknown>,
    @Headers() headers: Record<string, string>,
    @Req() req: RawBodyRequest<Request>,
  ) {
    return this.service.handleWebhook(PaymentGateway.OPAY, body, headers, req.rawBody);
  }
}
