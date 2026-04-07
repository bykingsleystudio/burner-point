/**
 * apps/api/src/modules/paddle/paddle.controller.ts
 *
 * ALL Paddle endpoints are backend-only.
 * Frontend receives only a checkoutUrl and opens it in browser/WebView.
 * API key never leaves the server.
 */
import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Headers,
  UseGuards,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { IsEnum, IsOptional, IsObject } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaddleService, PaddlePaymentType } from './paddle.service';

class CreateCheckoutDto {
  @IsEnum(PaddlePaymentType)
  type: PaddlePaymentType;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

@ApiTags('paddle')
@Controller('paddle')
export class PaddleController {
  constructor(private readonly paddleService: PaddleService) {}

  /**
   * Create a Paddle checkout session.
   * Returns a checkoutUrl — frontend opens this URL, never touches Paddle directly.
   * Frontend has zero visibility into Paddle API keys or product IDs.
   */
  @Post('checkout')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Create Paddle checkout (credits, rental, or subscription)',
  })
  async createCheckout(
    @Body() dto: CreateCheckoutDto,
    @Req() req: { user: { id: string } },
  ) {
    return this.paddleService.createCheckout(req.user.id, dto.type, dto.metadata);
  }

  /**
   * Get current subscription status for authenticated user.
   */
  @Get('subscription')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current subscription status' })
  async getSubscription(@Req() req: { user: { id: string } }) {
    return this.paddleService.getSubscription(req.user.id);
  }

  /**
   * Cancel active subscription at end of current billing period.
   */
  @Post('subscription/cancel')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Cancel subscription (effective end of period)' })
  async cancelSubscription(@Req() req: { user: { id: string } }) {
    return this.paddleService.cancelSubscription(req.user.id);
  }

  /**
   * Paddle webhook receiver.
   * Raw body required for HMAC-SHA256 signature verification.
   * Returns 200 immediately regardless of processing result
   * (Paddle retries on non-2xx responses — we handle idempotency internally).
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Paddle webhook endpoint (internal)' })
  async webhook(
    @Headers() headers: Record<string, string>,
    @Req() req: Request & { rawBody?: Buffer },
  ) {
    return this.paddleService.handleWebhook(headers, req.rawBody ?? Buffer.from(''));
  }
}
