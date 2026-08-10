import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionType } from '../../database/entities/extended-entities';
import { PhoneNumber, NumberStatus, NumberType, NumberProvider } from '../../database/entities/phone-number.entity';
import { ProviderName, ProviderService } from '../global/provider.service';
import { CreditsService } from '../credits/credits.service';
import {
  defaultNumberDurationDays,
  getNumberProductBasePriceUsdCents,
  normalizeNumberDurationDays,
  VERIFICATION_LOCK_TIMEOUT_MINUTES,
} from '../credits/product-credit-pricing';

@Injectable()
export class NumbersService {
  private readonly logger = new Logger(NumbersService.name);

  constructor(
    @InjectRepository(PhoneNumber) private numberRepo: Repository<PhoneNumber>,
    private providerService: ProviderService,
    private creditsService: CreditsService,
  ) {}

  async searchAvailable(countryCode: string, areaCode?: string, type?: NumberType) {
    const country = countryCode.toUpperCase();
    if (type !== NumberType.VERIFICATION && !['US', 'CA'].includes(country)) {
      throw new BadRequestException('Conversation numbers are available for US and Canada only');
    }
    return this.providerService.searchNumbers(country, areaCode);
  }

  async provision(
    userId: string,
    phoneNumber: string,
    type: NumberType,
    countryCode: string,
    durationDays?: number,
    idempotencyKey?: string,
  ) {
    const country = countryCode.toUpperCase();
    if (type !== NumberType.VERIFICATION && !['US', 'CA'].includes(country)) {
      throw new BadRequestException('Conversation rentals are available for US and Canada only');
    }

    const normalizedDurationDays = normalizeNumberDurationDays(type, durationDays);
    const priceUsdCents = getNumberProductBasePriceUsdCents(country, type, normalizedDurationDays);
    const relatedProduct = type === NumberType.VERIFICATION ? 'verify_hub' : 'rentals';

    const quote = await this.creditsService.quote({
      product: relatedProduct,
      countryCode: country,
      numberType: type,
      durationDays: normalizedDurationDays,
      basePriceUsdCents: priceUsdCents,
      relatedEntityId: phoneNumber,
    }, userId);

    const requestKey = idempotencyKey?.trim()
      || `number:${userId}:${type}:${country}:${phoneNumber}:${normalizedDurationDays}`;

    const lock = await this.creditsService.createWalletLock({
      userId,
      amountUsdCents: quote.usdValueCents,
      relatedProduct,
      relatedEntityId: phoneNumber,
      reason: type === NumberType.VERIFICATION
        ? 'Verification session wallet hold'
        : 'Rental assignment wallet hold',
      description: type === NumberType.VERIFICATION
        ? 'Locked wallet balance for verification routing'
        : 'Locked wallet balance for rental assignment',
      expiresAt: type === NumberType.VERIFICATION
        ? new Date(Date.now() + VERIFICATION_LOCK_TIMEOUT_MINUTES * 60 * 1000)
        : new Date(Date.now() + 15 * 60 * 1000),
      idempotencyKey: `number-lock:${requestKey}`,
      metadata: {
        quote,
        requestedNumber: phoneNumber,
        requestedDurationDays: normalizedDurationDays,
      },
    });

    try {
      const { sid, number, provider } = await this.providerService.purchaseNumber(phoneNumber, country);
      const expiresAt = type === NumberType.VERIFICATION
        ? new Date(Date.now() + VERIFICATION_LOCK_TIMEOUT_MINUTES * 60 * 1000)
        : normalizedDurationDays > 0
          ? new Date(Date.now() + normalizedDurationDays * 24 * 60 * 60 * 1000)
          : null;

      const num = this.numberRepo.create({
        number,
        status: NumberStatus.ACTIVE,
        type,
        provider: this.mapNumberProvider(provider),
        providerNumberSid: sid,
        countryCode: country,
        userId,
        assignedToUserId: userId,
        priceKobo: quote.usdValueCents,
        renewalPriceKobo: type === NumberType.VERIFICATION ? 0 : quote.usdValueCents,
        expiresAt,
        autoRenew: type === NumberType.RENTAL,
        capabilities: ['sms', 'mms', 'voice'],
        metadata: {
          walletLockId: lock.lock.id,
          quotedPriceUsdCents: quote.usdValueCents,
          requestedDurationDays: normalizedDurationDays,
          paymentMode: 'wallet',
        },
      });

      const saved = await this.numberRepo.save(num);
      await this.creditsService.rebindWalletLockEntity(userId, lock.lock.id, saved.id, relatedProduct);
      await this.numberRepo.update(saved.id, {
        metadata: {
          ...(saved.metadata ?? {}),
          walletLockId: lock.lock.id,
        },
      });

      if (type === NumberType.VERIFICATION) {
        return {
          ...saved,
          pricing: {
            walletAmountLockedUsdCents: quote.usdValueCents,
            usdValueCents: quote.usdValueCents,
            state: 'locked',
          },
        };
      }

      await this.creditsService.spendWalletLock({
        userId,
        lockId: lock.lock.id,
        type: TransactionType.NUMBER_PURCHASE,
        relatedProduct,
        relatedEntityId: saved.id,
        description: `Provisioned ${type} number ${number}`,
        idempotencyKey: `number-spend:${requestKey}`,
        metadata: {
          countryCode: country,
          requestedDurationDays: normalizedDurationDays,
        },
      });

      return {
        ...saved,
        pricing: {
          walletAmountSpentUsdCents: quote.usdValueCents,
          usdValueCents: quote.usdValueCents,
          state: 'spent',
        },
      };
    } catch (error) {
      await this.creditsService.releaseWalletLock({
        userId,
        lockId: lock.lock.id,
        description: `Released wallet hold after failed ${type} provision`,
        idempotencyKey: `number-release:${requestKey}`,
        metadata: {
          requestedNumber: phoneNumber,
          countryCode: country,
        },
      }).catch(() => null);
      throw error;
    }
  }

  async assignPaidNumber(
    userId: string,
    phoneNumber: string,
    type: NumberType,
    countryCode: string,
    options: {
      durationDays?: number;
      paymentReference: string;
      priceKobo: number;
      autoRenew?: boolean;
    },
  ) {
    const country = countryCode.toUpperCase();
    if (type !== NumberType.VERIFICATION && !['US', 'CA'].includes(country)) {
      throw new BadRequestException('Conversation rentals are available for US and Canada only');
    }

    const { sid, number, provider } = await this.providerService.purchaseNumber(phoneNumber, country);
    const durationDays = options.durationDays ?? defaultNumberDurationDays(type);
    const expiresAt = durationDays > 0
      ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)
      : null;

    const paidNumber = this.numberRepo.create({
      number,
      status: NumberStatus.ACTIVE,
      type,
      provider: this.mapNumberProvider(provider),
      providerNumberSid: sid,
      countryCode: country,
      userId,
      assignedToUserId: userId,
      priceKobo: options.priceKobo,
      renewalPriceKobo: options.priceKobo,
      expiresAt,
      autoRenew: Boolean(options.autoRenew),
      capabilities: ['sms', 'mms', 'voice'],
      metadata: {
        paymentReference: options.paymentReference,
        assignmentSource: 'payment_webhook',
      },
    });

    return this.numberRepo.save(paidNumber);
  }

  async getUserNumbers(userId: string) {
    return this.numberRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getNumber(id: string, userId: string) {
    const num = await this.numberRepo.findOne({ where: { id, userId } });
    if (!num) throw new NotFoundException('Number not found');
    return num;
  }

  async release(id: string, userId: string) {
    const num = await this.getNumber(id, userId);
    if (num.status !== NumberStatus.ACTIVE) throw new BadRequestException('Number is not active');

    // Release from provider
    if (num.providerNumberSid) {
      try { await this.providerService.releaseNumber(num.providerNumberSid, num.provider as unknown as ProviderName, num.number); }
      catch (e) { this.logger.warn(`Provider release failed for ${num.number}: ${e.message}`); }
    }

    await this.numberRepo.update(id, { status: NumberStatus.RELEASED });

    if (num.type === NumberType.VERIFICATION) {
      await this.creditsService.releaseExpiredVerificationWalletLock(id, userId, 'Verification session released by user').catch(() => null);
    }
    return { success: true };
  }

  async renew(id: string, userId: string) {
    const num = await this.getNumber(id, userId);
    const quote = await this.creditsService.quote({
      product: 'rentals',
      countryCode: num.countryCode || 'US',
      numberType: num.type,
      durationDays: 30,
      basePriceUsdCents: num.renewalPriceKobo,
      relatedEntityId: num.id,
    }, userId);

    const lock = await this.creditsService.createWalletLock({
      userId,
      amountUsdCents: quote.usdValueCents,
      relatedProduct: 'rentals',
      relatedEntityId: num.id,
      reason: 'Rental renewal wallet hold',
      description: `Locked wallet balance to renew ${num.number}`,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      idempotencyKey: `number-renew-lock:${num.id}:${num.expiresAt?.toISOString() || 'na'}`,
      metadata: {
        renewalPriceUsdCents: num.renewalPriceKobo,
      },
    });

    try {
      const newExpiry = new Date((num.expiresAt || new Date()).getTime() + 30 * 24 * 60 * 60 * 1000);
      await this.numberRepo.update(id, {
        expiresAt: newExpiry,
        status: NumberStatus.ACTIVE,
        metadata: {
          ...(num.metadata ?? {}),
          paymentStatus: 'paid',
          renewedAt: new Date().toISOString(),
        },
      });

      await this.creditsService.spendWalletLock({
        userId,
        lockId: lock.lock.id,
        type: TransactionType.NUMBER_RENEWAL,
        relatedProduct: 'rentals',
        relatedEntityId: num.id,
        description: `Renewed rental ${num.number}`,
        idempotencyKey: `number-renew-spend:${num.id}:${newExpiry.toISOString()}`,
      });

      return this.numberRepo.findOne({ where: { id } });
    } catch (error) {
      await this.numberRepo.update(id, {
        metadata: {
          ...(num.metadata ?? {}),
          paymentStatus: 'payment_failed',
          paymentFailedAt: new Date().toISOString(),
        },
      });
      await this.creditsService.releaseWalletLock({
        userId,
        lockId: lock.lock.id,
        description: `Released renewal wallet hold for ${num.number}`,
        idempotencyKey: `number-renew-release:${lock.lock.id}`,
      }).catch(() => null);
      throw error;
    }
  }

  async expireNumbers(ids: string[]) {
    if (!ids.length) return;
    await this.numberRepo.update(ids, { status: NumberStatus.EXPIRED });
    this.logger.log(`Expired ${ids.length} numbers`);
  }

  async findExpiring(beforeDate: Date): Promise<PhoneNumber[]> {
    return this.numberRepo
      .createQueryBuilder('pn')
      .where('pn.expiresAt <= :date', { date: beforeDate })
      .andWhere('pn.status = :status', { status: NumberStatus.ACTIVE })
      .getMany();
  }

  private mapNumberProvider(provider: ProviderName): NumberProvider {
    switch (provider) {
      case ProviderName.TELNYX:
        return NumberProvider.TELNYX;
      case ProviderName.BANDWIDTH:
        return NumberProvider.BANDWIDTH;
      case ProviderName.TREMIL:
        return NumberProvider.TREMIL;
      case ProviderName.PLIVO:
        return NumberProvider.PLIVO;
      case ProviderName.TERMII:
        return NumberProvider.TERMII;
      case ProviderName.TWILIO:
      default:
        return NumberProvider.TWILIO;
    }
  }
}
