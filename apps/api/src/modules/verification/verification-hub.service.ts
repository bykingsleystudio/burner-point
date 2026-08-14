import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { VerificationOrder, VerificationService } from '../../database/entities/extended-entities';
import { Message, MessageDirection } from '../../database/entities/message.entity';
import { NumberType } from '../../database/entities/phone-number.entity';
import { CreditsService } from '../credits/credits.service';
import { NumbersService } from '../numbers/numbers.service';

export interface CreateVerificationOrderInput {
  serviceCode: string;
  countryCode: string;
  phoneNumber: string;
  idempotencyKey: string;
}

@Injectable()
export class VerificationHubService {
  constructor(
    @InjectRepository(VerificationService) private readonly serviceRepo: Repository<VerificationService>,
    @InjectRepository(VerificationOrder) private readonly orderRepo: Repository<VerificationOrder>,
    private readonly numbersService: NumbersService,
    private readonly creditsService: CreditsService,
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
      metadata: { serviceCode },
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
    const serviceIds = [...new Set(orders.map((order) => order.serviceId))];
    const services = serviceIds.length
      ? await this.serviceRepo.findBy({ id: In(serviceIds) })
      : [];
    const serviceById = new Map(services.map((service) => [service.id, service]));
    return orders.map((order) => this.getOrderView(order, true, serviceById.get(order.serviceId)));
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
