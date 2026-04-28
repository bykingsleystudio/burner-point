import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  WalletTransaction,
  SubscriptionPlan,
  UserSubscription,
  TransactionStatus,
  TransactionType,
  PaymentGateway,
} from '../../database/entities/extended-entities';
import { User } from '../../database/entities/user.entity';

@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(WalletTransaction) private txRepo: Repository<WalletTransaction>,
    @InjectRepository(SubscriptionPlan) private planRepo: Repository<SubscriptionPlan>,
    @InjectRepository(UserSubscription) private subRepo: Repository<UserSubscription>,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  async getLedger(userId: string, page = 1, limit = 20) {
    const [transactions, total] = await this.txRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { transactions, total, page, limit };
  }

  async getPlans() {
    return this.planRepo.find({ where: { isActive: true }, order: { sortOrder: 'ASC' } });
  }

  async getSubscription(userId: string) {
    return this.subRepo.findOne({
      where: { userId, status: 'active' },
      relations: ['plan'],
    } as any);
  }

  async recordWalletTransaction(input: {
    userId: string;
    type: TransactionType;
    amountKobo: number;
    balanceAfterKobo: number;
    description: string;
    referenceId?: string;
    externalReference?: string;
    gateway?: PaymentGateway;
    metadata?: Record<string, unknown>;
  }) {
    const amount = Number(input.amountKobo);
    const balanceAfter = Number(input.balanceAfterKobo);
    const balanceBefore = balanceAfter - amount;

    return this.txRepo.save(
      this.txRepo.create({
        userId: input.userId,
        type: input.type,
        status: TransactionStatus.COMPLETED,
        amountKobo: amount,
        balanceBeforeKobo: balanceBefore,
        balanceAfterKobo: balanceAfter,
        description: input.description,
        referenceId: input.referenceId,
        externalReference: input.externalReference,
        gateway: input.gateway,
        metadata: input.metadata || {},
      }),
    );
  }
}
