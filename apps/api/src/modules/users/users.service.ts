import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { Wallet } from '../../database/entities/financial-ledger.entity';
import { buildWalletPresentation, withWalletPresentation } from '../../config/money';
import { FxRateService } from '../fx/fx.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Wallet) private walletRepo: Repository<Wallet>,
    private configService: ConfigService,
    private fxRateService: FxRateService,
  ) {}

  async getProfile(userId: string) {
    const [user, wallet] = await Promise.all([
      this.userRepo.findOne({ where: { id: userId } }),
      this.walletRepo.findOne({ where: { userId } }),
    ]);
    if (!user) throw new NotFoundException('User not found');
    return withWalletPresentation(
      {
        ...user,
        walletBalanceUsdCents: Number(wallet?.balanceUsdCents ?? 0),
      },
      this.configService,
    );
  }

  async updateProfile(userId: string, dto: Partial<{ firstName: string; lastName: string; timezone: string; country: string; avatarUrl: string; preferences: Record<string, unknown> }>) {
    await this.userRepo.update(userId, dto);
    return this.getProfile(userId);
  }

  async getWalletBalance(userId: string, displayCurrency = 'USD') {
    const user = await this.userRepo.findOne({ where: { id: userId }, select: ['id'] });
    if (!user) throw new NotFoundException('User not found');
    const walletRecord = await this.ensureWalletRecord(userId);
    const wallet = buildWalletPresentation(Number(walletRecord.balanceUsdCents), this.configService);
    const response = {
      balanceUsdCents: wallet.walletBalanceUsdCents,
      balanceUsd: wallet.walletBalanceUsd,
      displayCurrency: wallet.walletDisplayCurrency,
      lockedBalanceUsdCents: Number(walletRecord.lockedBalanceUsdCents ?? 0),
    };
    if (displayCurrency.toUpperCase() === 'USD') return response;
    const fxRate = await this.fxRateService.getUsdToLocalRate(displayCurrency);
    return {
      ...response,
      localDisplay: {
        currency: fxRate.quoteCurrency,
        amount: wallet.walletBalanceUsd * fxRate.rate,
        rate: fxRate.rate,
        provider: fxRate.provider,
        timestamp: fxRate.timestamp,
      },
    };
  }

  async deleteAccount(userId: string) {
    await this.userRepo.update(userId, { deletedAt: new Date(), email: `deleted_${userId}@burnerpoint.com` });
    return { success: true };
  }

  async findById(id: string): Promise<User> {
    return this.userRepo.findOne({ where: { id } });
  }

  // This operation is transactional and row-locked to prevent race conditions.
  async creditWallet(userId: string, amountUsdCents: number): Promise<User> {
    const deltaUsdCents = Number(amountUsdCents);
    if (!Number.isFinite(deltaUsdCents) || deltaUsdCents <= 0) {
      throw new BadRequestException('Invalid wallet credit amount');
    }

    return this.userRepo.manager.transaction(async (manager) => {
      const user = await manager.findOne(User, {
        where: { id: userId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!user) throw new NotFoundException('User not found');

      const wallet = await this.findOrCreateWalletWithManager(manager, userId);
      wallet.balanceUsdCents = Number(wallet.balanceUsdCents) + deltaUsdCents;
      user.walletBalanceUsdCents = Number(wallet.balanceUsdCents);
      // lifetimeSpend tracks debits only (spend), not credits.
      await manager.save(wallet);
      return manager.save(user);
    });
  }

  async debitWallet(userId: string, amountUsdCents: number): Promise<User> {
    const deltaUsdCents = Number(amountUsdCents);
    if (!Number.isFinite(deltaUsdCents) || deltaUsdCents <= 0) {
      throw new BadRequestException('Invalid wallet debit amount');
    }

    return this.userRepo.manager.transaction(async (manager) => {
      const user = await manager.findOne(User, {
        where: { id: userId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!user) throw new NotFoundException('User not found');
      const wallet = await this.findOrCreateWalletWithManager(manager, userId);
      const availableBalance = Number(wallet.balanceUsdCents) - Number(wallet.lockedBalanceUsdCents ?? 0);
      if (availableBalance < deltaUsdCents) {
        throw new BadRequestException('Insufficient wallet balance');
      }

      wallet.balanceUsdCents = Number(wallet.balanceUsdCents) - deltaUsdCents;
      user.walletBalanceUsdCents = Number(wallet.balanceUsdCents);
      user.lifetimeSpendUsdCents = Number(user.lifetimeSpendUsdCents) + deltaUsdCents;
      await manager.save(wallet);
      return manager.save(user);
    });
  }

  private async ensureWalletRecord(userId: string) {
    const existing = await this.walletRepo.findOne({ where: { userId } });
    if (existing) return existing;

    return this.walletRepo.save(this.walletRepo.create({
      userId,
      balanceUsdCents: 0,
      lockedBalanceUsdCents: 0,
    }));
  }

  private async findOrCreateWalletWithManager(manager: Repository<User>['manager'], userId: string) {
    const existing = await manager.findOne(Wallet, {
      where: { userId },
      lock: { mode: 'pessimistic_write' },
    });
    if (existing) return existing;

    const wallet = manager.create(Wallet, {
      userId,
      balanceUsdCents: 0,
      lockedBalanceUsdCents: 0,
    });
    return manager.save(wallet);
  }
}
