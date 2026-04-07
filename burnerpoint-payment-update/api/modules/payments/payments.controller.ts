/**
 * apps/api/src/modules/payments/payments.controller.ts
 *
 * COMPLETE REPLACEMENT FILE
 * - Removed: /payments/webhook/stripe, /payments/webhook/crypto routes
 * - Added:   /payments/webhook/paddle, /payments/webhook/nowpayments routes
 * - All Nigerian webhook routes preserved exactly as before
 */
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  Headers,
  UseGuards,
  RawBodyRequest,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaymentGateway } from '../../database/entities/extended-entities';

class InitPaymentDto {
  packageId: string;
  gateway: PaymentGateway;
}

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly service: PaymentsService) {}

  // ─── Public endpoints ────────────────────────────────────────────────────

  @Get('packages')
  @ApiOperation({ summary: 'List available credit packages' })
  getPackages() {
    return this.service.getPackages();
  }

  // ─── Authenticated endpoints ──────────────────────────────────────────────

  @Post('initialize')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Initialize a payment session' })
  initialize(@Body() dto: InitPaymentDto, @Req() req: { user: { id: string } }) {
    return this.service.initializePayment(req.user.id, dto.packageId, dto.gateway);
  }

  @Get('history')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get payment & transaction history' })
  history(@Req() req: { user: { id: string } }) {
    return this.service.getTransactionHistory(req.user.id);
  }

  // ─── Nigerian Gateway Webhooks (all unchanged) ───────────────────────────

  @Post('webhook/flutterwave')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Flutterwave payment webhook' })
  webhookFlutterwave(
    @Body() body: Record<string, unknown>,
    @Headers() headers: Record<string, string>,
  ) {
    return this.service.handleWebhook(PaymentGateway.FLUTTERWAVE, body, headers);
  }

  @Post('webhook/paystack')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Paystack payment webhook' })
  webhookPaystack(
    @Body() body: Record<string, unknown>,
    @Headers() headers: Record<string, string>,
  ) {
    return this.service.handleWebhook(PaymentGateway.PAYSTACK, body, headers);
  }

  @Post('webhook/squad')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Squad by GTCO payment webhook' })
  webhookSquad(
    @Body() body: Record<string, unknown>,
    @Headers() headers: Record<string, string>,
  ) {
    return this.service.handleWebhook(PaymentGateway.SQUAD, body, headers);
  }

  @Post('webhook/korapay')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Korapay payment webhook' })
  webhookKorapay(
    @Body() body: Record<string, unknown>,
    @Headers() headers: Record<string, string>,
  ) {
    return this.service.handleWebhook(PaymentGateway.KORAPAY, body, headers);
  }

  @Post('webhook/opay')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'OPay Merchant payment webhook' })
  webhookOpay(
    @Body() body: Record<string, unknown>,
    @Headers() headers: Record<string, string>,
  ) {
    return this.service.handleWebhook(PaymentGateway.OPAY, body, headers);
  }

  // ─── Paddle Webhook ───────────────────────────────────────────────────────
  // Paddle requires the raw request body for HMAC verification.
  // NestJS provides rawBody when `rawBody: true` is set in main.ts (see note).

  @Post('webhook/paddle')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Paddle payment webhook' })
  webhookPaddle(
    @Body() body: Record<string, unknown>,
    @Headers() headers: Record<string, string>,
    @Req() req: RawBodyRequest<Request>,
  ) {
    return this.service.handleWebhook(
      PaymentGateway.PADDLE,
      body,
      headers,
      req.rawBody,
    );
  }

  // ─── NOWPayments Webhook ──────────────────────────────────────────────────
  // NOWPayments IPN also requires raw body for HMAC-SHA512 verification.

  @Post('webhook/nowpayments')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'NOWPayments crypto IPN webhook' })
  webhookNowpayments(
    @Body() body: Record<string, unknown>,
    @Headers() headers: Record<string, string>,
    @Req() req: RawBodyRequest<Request>,
  ) {
    return this.service.handleWebhook(
      PaymentGateway.NOWPAYMENTS,
      body,
      headers,
      req.rawBody,
    );
  }
}

/**
 * ─── IMPORTANT: Enable rawBody in main.ts ────────────────────────────────────
 *
 * For Paddle and NOWPayments webhook verification, NestJS must be bootstrapped
 * with rawBody: true so req.rawBody is populated.
 *
 * In apps/api/src/main.ts, update NestFactory.create():
 *
 *   const app = await NestFactory.create(AppModule, {
 *     logger: ['error', 'warn', 'log'],
 *     rawBody: true,   // ← ADD THIS LINE
 *   });
 *
 * This does NOT affect any other route — it just makes the raw buffer
 * available alongside the parsed JSON body.
 */
