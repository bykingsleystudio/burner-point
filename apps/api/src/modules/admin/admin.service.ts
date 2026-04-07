import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserStatus } from '../../database/entities/user.entity';
import { PhoneNumber } from '../../database/entities/phone-number.entity';
import { AbuseEvent } from '../../database/entities/extended-entities';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(PhoneNumber) private numRepo: Repository<PhoneNumber>,
    @InjectRepository(AbuseEvent) private abuseRepo: Repository<AbuseEvent>,
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
    await this.userRepo.increment({ id: userId }, 'walletBalanceKobo', amountKobo);
    return { success: true };
  }
}
