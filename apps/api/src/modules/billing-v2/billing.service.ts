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
import { RevenueCatService } from '../revenuecat/revenuecat.service';

@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(WalletTransaction) private txRepo: Repository<WalletTransaction>,
    @InjectRepository(SubscriptionPlan) private planRepo: Repository<SubscriptionPlan>,
    @InjectRepository(UserSubscription) private subRepo: Repository<UserSubscription>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private revenueCatService: RevenueCatService,
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
    const [legacySubscription, revenueCatSnapshot] = await Promise.all([
      this.subRepo.findOne({
        where: { userId, status: 'active' },
        relations: ['plan'],
      } as any),
      this.revenueCatService.getEntitlementSnapshot(userId),
    ]);

    const revenueCatSubscription = revenueCatSnapshot.subscriptions.find((item) => item.isActive);
    if (revenueCatSubscription) {
      return {
        id: revenueCatSubscription.id,
        provider: 'revenuecat',
        source: 'revenuecat',
        status: revenueCatSubscription.status,
        billingCycle: 'store_managed',
        currentPeriodStart: revenueCatSubscription.currentPeriodStart,
        currentPeriodEnd: revenueCatSubscription.currentPeriodEnd,
        willRenew: revenueCatSubscription.willRenew,
        renewsAt: revenueCatSubscription.renewsAt,
        cancelledAt: revenueCatSubscription.cancelledAt,
        expiresAt: revenueCatSubscription.expiresAt,
        productId: revenueCatSubscription.productId,
        offeringId: revenueCatSubscription.offeringId,
        store: revenueCatSubscription.store,
        environment: revenueCatSubscription.environment,
        entitlements: revenueCatSnapshot.entitlements.filter((item) => item.active),
        plan: {
          id: revenueCatSubscription.id,
          slug: this.resolveRevenueCatPlanSlug(revenueCatSnapshot),
          name: this.resolveRevenueCatPlanName(revenueCatSnapshot),
          description: 'Managed through RevenueCat and the App Store or Google Play.',
        },
      };
    }

    return legacySubscription;
  }

  getEntitlements(userId: string) {
    return this.revenueCatService.getEntitlementSnapshot(userId);
  }

  refreshEntitlements(userId: string) {
    return this.revenueCatService.refreshCustomerForUser(userId);
  }

  private resolveRevenueCatPlanName(snapshot: Awaited<ReturnType<RevenueCatService['getEntitlementSnapshot']>>) {
    if (snapshot.summary.canAccessPremium) return 'BP Premium';
    if (snapshot.summary.canAccessMessenger) return 'BP Messenger Pro';
    if (snapshot.summary.canAccessSecureTunnel) return 'BP Secure Tunnel';
    return 'RevenueCat Subscription';
  }

  private resolveRevenueCatPlanSlug(snapshot: Awaited<ReturnType<RevenueCatService['getEntitlementSnapshot']>>) {
    if (snapshot.summary.canAccessPremium) return 'bp-premium';
    if (snapshot.summary.canAccessMessenger) return 'bp-messenger-pro';
    if (snapshot.summary.canAccessSecureTunnel) return 'bp-secure-tunnel';
    return 'revenuecat-subscription';
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
