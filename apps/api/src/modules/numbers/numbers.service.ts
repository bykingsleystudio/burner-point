import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PhoneNumber, NumberStatus, NumberType, NumberProvider } from '../../database/entities/phone-number.entity';
import { WalletTransaction, TransactionType, TransactionStatus } from '../../database/entities/extended-entities';
import { User } from '../../database/entities/user.entity';
import { ProviderName, ProviderService } from '../global/provider.service';
import { UsersService } from '../users/users.service';

const NUMBER_PRICING_KOBO: Record<string, Record<string, number>> = {
  US: { burner: 160000, rental: 480000, verification: 40000 },
  GB: { burner: 200000, rental: 600000, verification: 48000 },
  CA: { burner: 160000, rental: 480000, verification: 40000 },
  NG: { burner: 80000,  rental: 240000, verification: 20000 },
  default: { burner: 160000, rental: 480000, verification: 40000 },
};

const NUMBER_DURATION_DAYS: Record<string, number> = {
  burner: 1, rental: 30, verification: 0, // verification = no expiry, single use
};

@Injectable()
export class NumbersService {
  private readonly logger = new Logger(NumbersService.name);

  constructor(
    @InjectRepository(PhoneNumber) private numberRepo: Repository<PhoneNumber>,
    @InjectRepository(WalletTransaction) private txRepo: Repository<WalletTransaction>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private providerService: ProviderService,
    private usersService: UsersService,
  ) {}

  async searchAvailable(countryCode: string, areaCode?: string) {
    const country = countryCode.toUpperCase();
    if (!['US', 'CA'].includes(country)) {
      throw new BadRequestException('Conversation numbers are available for US and Canada only');
    }
    return this.providerService.searchNumbers(country, areaCode);
  }

  async provision(userId: string, phoneNumber: string, type: NumberType, countryCode: string) {
    const country = countryCode.toUpperCase();
    if (type !== NumberType.VERIFICATION && !['US', 'CA'].includes(country)) {
      throw new BadRequestException('Conversation rentals are available for US and Canada only');
    }

    const pricing = NUMBER_PRICING_KOBO[country] || NUMBER_PRICING_KOBO.default;
    const priceKobo = pricing[type] || pricing.burner;

    // Debit wallet
    await this.usersService.debitWallet(userId, priceKobo);

    // Purchase from provider
    const { sid, number, provider } = await this.providerService.purchaseNumber(phoneNumber, country);

    // Calculate expiry
    const durationDays = NUMBER_DURATION_DAYS[type] || 1;
    const expiresAt = durationDays > 0
      ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)
      : null;

    const num = this.numberRepo.create({
      number,
      status: NumberStatus.ACTIVE,
      type,
      provider: this.mapNumberProvider(provider),
      providerNumberSid: sid,
      countryCode: country,
      userId,
      priceKobo,
      renewalPriceKobo: priceKobo,
      expiresAt,
      capabilities: ['sms', 'mms', 'voice'],
    });

    const saved = await this.numberRepo.save(num);

    // Record wallet transaction
    const user = await this.userRepo.findOne({ where: { id: userId } });
    await this.txRepo.save(this.txRepo.create({
      userId,
      type: TransactionType.NUMBER_PURCHASE,
      status: TransactionStatus.COMPLETED,
      amountKobo: -priceKobo,
      balanceBeforeKobo: Number(user.walletBalanceKobo) + priceKobo,
      balanceAfterKobo: Number(user.walletBalanceKobo),
      description: `Provisioned ${type} number ${number}`,
      referenceId: saved.id,
    }));

    return saved;
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
    const durationDays = options.durationDays ?? NUMBER_DURATION_DAYS[type] ?? 1;
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

    const saved = await this.numberRepo.save(paidNumber);
    const user = await this.userRepo.findOne({ where: { id: userId } });
    const balance = Number(user?.walletBalanceKobo ?? 0);

    await this.txRepo.save(this.txRepo.create({
      userId,
      type: TransactionType.NUMBER_PURCHASE,
      status: TransactionStatus.COMPLETED,
      amountKobo: 0,
      balanceBeforeKobo: balance,
      balanceAfterKobo: balance,
      description: `Assigned paid ${type} number ${number}`,
      referenceId: saved.id,
      externalReference: options.paymentReference,
      metadata: {
        chargeKobo: options.priceKobo,
        paymentReference: options.paymentReference,
      },
    }));

    return saved;
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
      try { await this.providerService.releaseNumber(num.providerNumberSid, num.provider as unknown as ProviderName); }
      catch (e) { this.logger.warn(`Provider release failed for ${num.number}: ${e.message}`); }
    }

    await this.numberRepo.update(id, { status: NumberStatus.RELEASED });
    return { success: true };
  }

  async renew(id: string, userId: string) {
    const num = await this.getNumber(id, userId);
    await this.usersService.debitWallet(userId, num.renewalPriceKobo);

    const newExpiry = new Date((num.expiresAt || new Date()).getTime() + 30 * 24 * 60 * 60 * 1000);
    await this.numberRepo.update(id, {
      expiresAt: newExpiry,
      status: NumberStatus.ACTIVE,
    });

    return this.numberRepo.findOne({ where: { id } });
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
