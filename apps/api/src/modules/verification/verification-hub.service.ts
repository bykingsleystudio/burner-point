import { BadRequestException, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { VerificationOrder, VerificationService } from '../../database/entities/extended-entities';
import { Message, MessageDirection } from '../../database/entities/message.entity';
import { NumberType } from '../../database/entities/phone-number.entity';
import { CreditsService } from '../credits/credits.service';
import { NumbersService } from '../numbers/numbers.service';
import { ProviderService, ProviderName } from '../global/provider.service';
import { JuicySmsAdapter } from '../providers/juicysms.adapter';
import { TextVerifiedAdapter } from '../providers/textverified.adapter';

export interface CreateVerificationOrderInput {
  channel: 'sms' | 'voice';
  serviceCode: string;
  countryCode: string;
  phoneNumber: string;
  areaCode?: string;
  carrier?: string;
  tier: 'premium' | 'standard' | 'economy';
  idempotencyKey: string;
}

@Injectable()
export class VerificationHubService {
  private readonly logger = new Logger(VerificationHubService.name);

  constructor(
    @InjectRepository(VerificationService) private readonly serviceRepo: Repository<VerificationService>,
    @InjectRepository(VerificationOrder) private readonly orderRepo: Repository<VerificationOrder>,
    private readonly numbersService: NumbersService,
    private readonly creditsService: CreditsService,
    private readonly providerService: ProviderService,
  ) {}

  async listServices(countryCode?: string) {
    const country = countryCode?.trim().toUpperCase();
    const services = await this.serviceRepo.find({
      where: { isActive: true },
      order: { displayName: 'ASC' },
    });
    return services
      .filter((service) => !country || !service.countries.length || service.countries.includes(country))
      .map((service) => this.toPublicService(service));
  }

  async createOrder(userId: string, input: CreateVerificationOrderInput) {
    const serviceCode = this.requireServiceCode(input.serviceCode);
    const countryCode = this.requireCountry(input.countryCode);
    const phoneNumber = this.requireE164(input.phoneNumber);
    const idempotencyKey = input.idempotencyKey.trim();
    if (!idempotencyKey || idempotencyKey.length > 180) {
      throw new BadRequestException('A valid idempotency key is required');
    }

    const existing = await this.orderRepo.findOne({ where: { userId, idempotencyKey } });
    if (existing) return this.getOrderView(existing, true);

    const activeOrder = await this.orderRepo.findOne({
      where: { userId, status: In(['pending', 'provisioning', 'active', 'waiting_for_code']) },
      order: { createdAt: 'DESC' },
    });
    if (activeOrder) {
      throw new BadRequestException('You already have an active verification. Use it or cancel it before requesting another.');
    }

    const service = await this.serviceRepo.findOne({ where: { serviceCode, isActive: true } });
    if (!service) throw new BadRequestException('The requested verification service is not configured or active');
    if (service.countries.length && !service.countries.includes(countryCode)) {
      throw new BadRequestException('The requested service is not available in this country');
    }

    const priceUsdCents = Number(service.basePriceUsdCents) + Number(service.marginUsdCents);
    const order = await this.orderRepo.save(this.orderRepo.create({
      userId,
      serviceId: service.id,
      provider: 'pending',
      countryCode,
      priceUsdCents,
      idempotencyKey,
      status: 'provisioning',
      metadata: {
        serviceCode,
        tier: input.tier,
        channel: input.channel,
        areaCode: input.areaCode?.trim() || null,
        carrier: input.carrier?.trim() || null,
      },
    }));

    try {
      const provisioned = await this.numbersService.provision(
        userId,
        phoneNumber,
        NumberType.VERIFICATION,
        countryCode,
        undefined,
        `verify-order:${idempotencyKey}`,
      );
      const lockId = this.readMetadataString(provisioned.metadata, 'walletLockId');
      await this.orderRepo.update(order.id, {
        phoneNumberId: provisioned.id,
        phoneNumber: provisioned.number,
        provider: provisioned.provider,
        providerOrderId: provisioned.providerNumberSid,
        walletLockId: lockId ?? null,
        status: 'waiting_for_code',
        expiresAt: provisioned.expiresAt,
        metadata: {
          serviceCode,
          tier: input.tier,
          channel: input.channel,
          areaCode: input.areaCode?.trim() || null,
          carrier: input.carrier?.trim() || null,
          numberId: provisioned.id,
          provider: provisioned.provider,
          pricing: provisioned.pricing,
        },
      });
    } catch (error) {
      await this.orderRepo.update(order.id, {
        status: 'failed',
        failureReason: this.errorMessage(error),
      });
      throw error;
    }

    return this.getOrderView(await this.orderRepo.findOneByOrFail({ id: order.id }), true);
  }

  async listOrders(userId: string) {
    const orders = await this.orderRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 100,
    });
    const serviceIds = [...new Set(orders.map((order) => String(order.serviceId)))];
    const services = serviceIds.length
      ? await this.serviceRepo.findBy({ id: In(serviceIds) })
      : [];
    const serviceById = new Map(services.map((service) => [service.id, service]));
    return orders.map((order) => this.getOrderView(order, true, serviceById.get(String(order.serviceId))));
  }

  async cancelOrder(userId: string, orderId: string) {
    const order = await this.orderRepo.findOne({ where: { id: orderId, userId } });
    if (!order) throw new NotFoundException('Verification order not found');
    if (!['pending', 'provisioning', 'active', 'waiting_for_code', 'code_received'].includes(order.status)) {
      throw new BadRequestException('This verification order can no longer be cancelled');
    }

    if (order.phoneNumberId) {
      await this.numbersService.release(order.phoneNumberId, userId);
    } else if (order.walletLockId) {
      await this.creditsService.releaseWalletLock({
        userId,
        lockId: order.walletLockId,
        description: 'Released cancelled verification order wallet hold',
        idempotencyKey: `verify-order-cancel:${order.id}`,
      });
    }

    await this.orderRepo.update(order.id, {
      status: 'cancelled',
      cancelledAt: new Date(),
      refundedAt: new Date(),
    });
    return this.getOrderView(await this.orderRepo.findOneByOrFail({ id: order.id }), true);
  }

  async recordInboundMessage(message: Message) {
    if (message.direction !== MessageDirection.INBOUND || !message.phoneNumberId || !message.userId) return;
    const order = await this.orderRepo.findOne({
      where: {
        userId: message.userId,
        phoneNumberId: message.phoneNumberId,
        status: In(['waiting_for_code', 'active']),
      },
      order: { createdAt: 'DESC' },
    });
    if (!order) return;

    const otpCode = message.extractedOtp?.trim() || this.extractOtp(message.body);
    await this.orderRepo.update(order.id, {
      status: otpCode ? 'code_received' : 'active',
      otpCode: otpCode || null,
      completedAt: otpCode ? new Date() : null,
      metadata: {
        ...(order.metadata ?? {}),
        lastInboundMessageId: message.id,
        lastInboundAt: message.createdAt?.toISOString?.() ?? new Date().toISOString(),
      },
    });
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async expireOrders() {
    const now = new Date();
    const orders = await this.orderRepo.find({
      where: { status: In(['pending', 'provisioning', 'active', 'waiting_for_code', 'code_received']) },
      take: 200,
    });
    for (const order of orders) {
      if (!order.expiresAt || order.expiresAt > now) continue;
      await this.orderRepo.update(order.id, { status: 'expired', failureReason: 'Verification session expired' });
      if (order.phoneNumberId) {
        await this.creditsService.releaseExpiredVerificationWalletLock(
          order.phoneNumberId,
          order.userId,
          'Verification order expired',
        ).catch(() => null);
      }
    }
  }

  /**
   * Poll SMS messages from verification providers (JuicySMS, TextVerified).
   * This runs every 30 seconds to check for inbound SMS on active verification orders.
   */
  @Cron('*/30 * * * * *')
  async pollVerificationMessages() {
    try {
      const orders = await this.orderRepo.find({
        where: {
          status: In(['waiting_for_code', 'active']),
          provider: In([ProviderName.JUICYSMS, ProviderName.TEXTVERIFIED]),
        },
        take: 50,
      });

      for (const order of orders) {
        if (!order.providerOrderId) continue;
        try {
          await this.pollOrderMessages(order);
        } catch (error) {
          this.logger.error(
            `Failed to poll messages for order ${order.id}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
    } catch (error) {
      this.logger.error(`Verification polling job failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Poll messages from a specific verification order.
   * Extracts OTP code and updates order status when message is received.
   */
  private async pollOrderMessages(order: VerificationOrder) {
    if (order.status !== 'waiting_for_code' && order.status !== 'active') return;
    if (!order.providerOrderId) return;

    let messages: Array<{ body: string; timestamp?: string }> = [];

    try {
      if (order.provider === ProviderName.JUICYSMS) {
        const adapter = new JuicySmsAdapter(this.providerService.getConfigService());
        const result = await adapter.getOrderMessages(Number(order.providerOrderId));
        const payload = result as Record<string, any>;
        messages = Array.isArray(payload.messages) ? payload.messages : [];
      } else if (order.provider === ProviderName.TEXTVERIFIED) {
        const adapter = new TextVerifiedAdapter(this.providerService.getConfigService());
        const result = await adapter.getVerificationSms(String(order.providerOrderId));
        const payload = result as Record<string, any>;
        messages = Array.isArray(payload.messages)
          ? payload.messages
          : Array.isArray(payload.sms)
            ? payload.sms.map((item: any) => ({ body: item?.text ?? item?.body ?? '', timestamp: item?.receivedAt ?? item?.timestamp }))
            : [];
      }
    } catch (error) {
      this.logger.warn(
        `Could not poll ${order.provider} order ${order.providerOrderId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return;
    }

    if (!messages.length) return;

    // Process first message with OTP
    const firstMessage = messages[0];
    if (!firstMessage || !firstMessage.body) return;

    const otpCode = this.extractOtp(firstMessage.body);
    if (!otpCode) return;

    // Update order with received code
    await this.orderRepo.update(order.id, {
      status: 'code_received',
      otpCode,
      completedAt: new Date(),
      metadata: {
        ...(order.metadata ?? {}),
        messageReceivedAt: new Date().toISOString(),
        messageBody: firstMessage.body,
      },
    });

    this.logger.log(`Verification order ${order.id} completed with OTP code`);
  }

  /**
   * Create a verification order using new provider-specific adapters (JuicySMS, TextVerified).
   * This integrates with the BP Verify Hub feature gate.
   */
  private async createVerificationOrderViaAdapter(
    order: VerificationOrder,
    service: VerificationService,
    countryCode: string,
  ) {
    // Check if Verify Hub feature is enabled
    const verifyHubEnabled = Boolean(this.providerService.getConfigService().get('VERIFY_HUB_ENABLED'));
    if (!verifyHubEnabled) {
      this.logger.log(`Verify Hub disabled; falling back to legacy provider routing`);
      return null;
    }

    // Get ordered list of enabled verification providers
    const routeDecision = this.providerService.selectVerificationRoute(countryCode);
    if (!routeDecision.primaryProvider) {
      this.logger.warn(`No verification providers available for ${countryCode}`);
      return null;
    }

    // Try providers in order: primary first, then fallbacks
    const providerChain = [routeDecision.primaryProvider, ...(routeDecision.fallbackProviders || [])];
    for (const provider of providerChain) {
      try {
        if (provider === ProviderName.JUICYSMS) {
          const adapter = new JuicySmsAdapter(this.providerService.getConfigService());
          const result = await adapter.createVerificationOrder(
            Number(service.serviceCode) || 0,
            countryCode,
          );
          return {
            provider: ProviderName.JUICYSMS,
            orderId: String(result.id),
            phoneNumber: result.phone_number,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
          };
        } else if (provider === ProviderName.TEXTVERIFIED) {
          const adapter = new TextVerifiedAdapter(this.providerService.getConfigService());
          const result = await adapter.createVerification(
            service.serviceCode,
            'US',
          );
          return {
            provider: ProviderName.TEXTVERIFIED,
            orderId: String(result.id),
            phoneNumber: result.phoneNumber,
            expiresAt: result.expiresAt ? new Date(result.expiresAt) : new Date(Date.now() + 10 * 60 * 1000),
          };
        }
      } catch (error) {
        this.logger.warn(
          `Verification order creation failed with ${provider}: ${error instanceof Error ? error.message : String(error)}`,
        );
        // Continue to next provider
      }
    }

    this.logger.error(`All verification providers failed for order ${order.id}`);
    return null;
  }

  private toPublicService(service: VerificationService) {
    return {
      code: service.serviceCode,
      name: service.displayName,
      countries: service.countries,
      supportedProviders: service.supportedProviders,
      priceUsdCents: Number(service.basePriceUsdCents) + Number(service.marginUsdCents),
    };
  }

  private getOrderView(order: VerificationOrder, includeCode: boolean, service?: VerificationService) {
    return {
      id: order.id,
      serviceCode: service?.serviceCode ?? this.readMetadataString(order.metadata, 'serviceCode') ?? null,
      serviceName: service?.displayName ?? null,
      tier: this.readMetadataString(order.metadata, 'tier') ?? 'standard',
      channel: this.readMetadataString(order.metadata, 'channel') ?? 'sms',
      areaCode: this.readMetadataString(order.metadata, 'areaCode') ?? null,
      carrier: this.readMetadataString(order.metadata, 'carrier') ?? null,
      countryCode: order.countryCode,
      provider: order.provider,
      phoneNumber: order.phoneNumber,
      priceUsdCents: Number(order.priceUsdCents),
      status: order.status,
      otpCode: includeCode && order.status === 'code_received' ? order.otpCode ?? null : null,
      failureReason: order.failureReason,
      expiresAt: order.expiresAt,
      cancelledAt: order.cancelledAt,
      completedAt: order.completedAt,
      refundedAt: order.refundedAt,
      createdAt: order.createdAt,
    };
  }

  private requireCountry(value: string) {
    const country = value?.trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(country)) throw new BadRequestException('Country must be an ISO 3166-1 alpha-2 code');
    return country;
  }

  private requireServiceCode(value: string) {
    const serviceCode = value?.trim().toLowerCase();
    if (!/^[a-z0-9][a-z0-9_-]{1,62}$/.test(serviceCode)) {
      throw new BadRequestException('Invalid verification service code');
    }
    return serviceCode;
  }

  private requireE164(value: string) {
    const phoneNumber = value?.trim();
    if (!/^\+[1-9]\d{6,14}$/.test(phoneNumber)) {
      throw new BadRequestException('Phone number must be in E.164 format');
    }
    return phoneNumber;
  }

  private extractOtp(body: string) {
    return body?.match(/\b(\d{4,10})\b/)?.[1];
  }

  private readMetadataString(metadata: Record<string, unknown> | undefined, key: string) {
    const value = metadata?.[key];
    return typeof value === 'string' && value.trim() ? value : undefined;
  }

  private errorMessage(error: unknown) {
    return (error instanceof Error ? error.message : String(error)).slice(0, 500);
  }
}
