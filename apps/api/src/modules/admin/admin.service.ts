import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserStatus } from '../../database/entities/user.entity';
import { PhoneNumber } from '../../database/entities/phone-number.entity';
import { AbuseEvent, TransactionType } from '../../database/entities/extended-entities';
import { UsersService } from '../users/users.service';
import { BillingService } from '../billing-v2/billing.service';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(PhoneNumber) private numRepo: Repository<PhoneNumber>,
    @InjectRepository(AbuseEvent) private abuseRepo: Repository<AbuseEvent>,
    private usersService: UsersService,
    private billingService: BillingService,
  ) {}

  async getDashboardStats() {
    const [totalUsers, activeNumbers, flaggedEvents] = await Promise.all([
      this.userRepo.count(),
      this.numRepo.count({ where: { status: 'active' as any } }),
      this.abuseRepo.count({ where: { action: 'flag' as any } }),
    ]);
    return { totalUsers, activeNumbers, flaggedEvents };
  }

  async listUsers(page = 1, limit = 20) {
    const [users, total] = await this.userRepo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return { users, total, page, limit };
  }

  async updateUserStatus(userId: string, status: UserStatus) {
    await this.userRepo.update(userId, { status });
    return { success: true };
  }

  async creditUserWallet(userId: string, amountKobo: number) {
    const user = await this.usersService.creditWallet(userId, amountKobo);
    await this.billingService.recordWalletTransaction({
      userId,
      type: TransactionType.ADJUSTMENT,
      amountKobo: Number(amountKobo),
      balanceAfterKobo: Number(user.walletBalanceKobo),
      description: 'Admin wallet adjustment',
      metadata: { source: 'admin' },
    });
    return { success: true };
  }
}
