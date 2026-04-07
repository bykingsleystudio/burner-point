import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private userRepo: Repository<User>) {}

  async getProfile(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(userId: string, dto: Partial<{ firstName: string; lastName: string; timezone: string; country: string; preferences: Record<string, unknown> }>) {
    await this.userRepo.update(userId, dto);
    return this.getProfile(userId);
  }

  async getWalletBalance(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId }, select: ['id', 'walletBalanceKobo'] });
    return {
      balanceKobo: Number(user.walletBalanceKobo),
      balanceNgn: Number(user.walletBalanceKobo) / 100,
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
