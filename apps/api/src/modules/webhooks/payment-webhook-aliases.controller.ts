import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { PaymentGateway } from '../../database/entities/extended-entities';
import { PaymentsService } from '../payments/payments.service';

@ApiTags('webhooks')
@Controller('webhooks')
export class PaymentWebhookAliasesController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('paystack')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Paystack payment webhook alias' })
  paystack(
    @Body() body: Record<string, unknown>,
    @Headers() headers: Record<string, string>,
    @Req() req: RawBodyRequest<Request>,
  ) {
    return this.paymentsService.handleWebhook(PaymentGateway.PAYSTACK, body, headers, req.rawBody);
  }

  @Post('flutterwave')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Flutterwave payment webhook alias' })
  flutterwave(
    @Body() body: Record<string, unknown>,
    @Headers() headers: Record<string, string>,
    @Req() req: RawBodyRequest<Request>,
  ) {
    return this.paymentsService.handleWebhook(PaymentGateway.FLUTTERWAVE, body, headers, req.rawBody);
  }

  @Post('squad')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Squad payment webhook alias' })
  squad(
    @Body() body: Record<string, unknown>,
    @Headers() headers: Record<string, string>,
    @Req() req: RawBodyRequest<Request>,
  ) {
    return this.paymentsService.handleWebhook(PaymentGateway.SQUAD, body, headers, req.rawBody);
  }

  @Post('korapay')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Korapay payment webhook alias' })
  korapay(
    @Body() body: Record<string, unknown>,
    @Headers() headers: Record<string, string>,
    @Req() req: RawBodyRequest<Request>,
  ) {
    return this.paymentsService.handleWebhook(PaymentGateway.KORAPAY, body, headers, req.rawBody);
  }

  @Post('opay')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'OPay payment webhook alias' })
  opay(
    @Body() body: Record<string, unknown>,
    @Headers() headers: Record<string, string>,
    @Req() req: RawBodyRequest<Request>,
  ) {
    return this.paymentsService.handleWebhook(PaymentGateway.OPAY, body, headers, req.rawBody);
  }

  @Post('paddle')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Paddle payment webhook alias' })
  paddle(
    @Req() req: RawBodyRequest<Request>,
    @Headers('paddle-signature') signature: string,
  ) {
    return this.paymentsService.handlePaddleWebhook(req.rawBody, signature);
  }

  @Post('nowpayments')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'NOWPayments webhook alias' })
  nowpayments(
    @Body() body: Record<string, unknown>,
    @Headers() headers: Record<string, string>,
    @Req() req: RawBodyRequest<Request>,
  ) {
    return this.paymentsService.handleNowPaymentsWebhook(body, headers, req.rawBody);
  }
}
