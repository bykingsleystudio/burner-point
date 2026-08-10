import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebhooksController } from './webhooks.controller';
import { PaymentWebhookAliasesController } from './payment-webhook-aliases.controller';
import { WebhooksService } from './webhooks.service';
import { Message } from '../../database/entities/message.entity';
import { Call } from '../../database/entities/extended-entities';
import { PhoneNumber } from '../../database/entities/phone-number.entity';
import { WebhookDedup } from '../../database/entities/extended-entities';
import { GatewayModule } from '../gateway/gateway.module';
import { AiModule } from '../ai/ai.module';
import { PaymentsModule } from '../payments/payments.module';
import { CreditsModule } from '../credits/credits.module';
import { CallsModule } from '../calls/calls.module';

@Module({
  imports: [TypeOrmModule.forFeature([Message, Call, PhoneNumber, WebhookDedup]), GatewayModule, AiModule, PaymentsModule, CreditsModule, CallsModule],
  controllers: [WebhooksController, PaymentWebhookAliasesController],
  providers: [WebhooksService],
})
export class WebhooksModule {}
