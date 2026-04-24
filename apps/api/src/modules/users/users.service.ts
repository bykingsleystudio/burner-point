import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { buildWalletPresentation, withWalletPresentation } from '../../config/money';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    private configService: ConfigService,
  ) {}

  async getProfile(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return withWalletPresentation(user, this.configService);
  }

  async updateProfile(userId: string, dto: Partial<{ firstName: string; lastName: string; timezone: string; country: string; preferences: Record<string, unknown> }>) {
    await this.userRepo.update(userId, dto);
    return this.getProfile(userId);
  }

  async getWalletBalance(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId }, select: ['id', 'walletBalanceKobo'] });
    if (!user) throw new NotFoundException('User not found');
    const wallet = buildWalletPresentation(Number(user.walletBalanceKobo), this.configService);
    return {
      balanceKobo: wallet.walletBalanceKobo,
      balanceNgn: wallet.walletBalanceNgn,
      balanceUsdCents: wallet.walletBalanceUsdCents,
      balanceUsd: wallet.walletBalanceUsd,
      displayCurrency: wallet.walletDisplayCurrency,
      fxRateNgnPerUsd: wallet.walletFxRateNgnPerUsd,
    };
  }

  async deleteAccount(userId: string) {
    await this.userRepo.update(userId, { deletedAt: new Date(), email: `deleted_${userId}@burnerpoint.app` });
    return { success: true };
  }

  async findById(id: string): Promise<User> {
    return this.userRepo.findOne({ where: { id } });
  }

  async creditWallet(userId: string, amountKobo: number): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    user.walletBalanceKobo = Number(user.walletBalanceKobo) + amountKobo;
    user.lifetimeSpendKobo = Number(user.lifetimeSpendKobo) + amountKobo;
    return this.userRepo.save(user);
  }

  async debitWallet(userId: string, amountKobo: number): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (Number(user.walletBalanceKobo) < amountKobo) {
      throw new BadRequestException('Insufficient wallet balance');
    }
    user.walletBalanceKobo = Number(user.walletBalanceKobo) - amountKobo;
    return this.userRepo.save(user);
  }
}
