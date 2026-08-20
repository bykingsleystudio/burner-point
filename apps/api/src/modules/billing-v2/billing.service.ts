import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { In, Repository } from 'typeorm';
import {
  PaymentGateway,
  PaymentSession,
  TransactionStatus,
  TransactionType,
  WalletTransaction,
} from '../../database/entities/extended-entities';
import { PhoneNumber } from '../../database/entities/phone-number.entity';
import {
  SubscriptionEntitlement,
} from '../../database/entities/subscription.entity';
import { User } from '../../database/entities/user.entity';
import { RevenueCatService } from '../revenuecat/revenuecat.service';
import {
  BILLING_SUBSCRIPTION_PLANS,
  WALLET_FUNDING_METHODS,
  type BillingSubscriptionPlan,
} from './billing-config';
import { CreditsService } from '../credits/credits.service';

@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(WalletTransaction) private readonly txRepo: Repository<WalletTransaction>,
    @InjectRepository(PaymentSession) private readonly sessionRepo: Repository<PaymentSession>,
    @InjectRepository(PhoneNumber) private readonly numberRepo: Repository<PhoneNumber>,
    @InjectRepository(SubscriptionEntitlement) private readonly entitlementRepo: Repository<SubscriptionEntitlement>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly configService: ConfigService,
    private readonly revenueCatService: RevenueCatService,
    private readonly creditsService: CreditsService,
  ) {}

  async getOverview(userId: string) {
    const [user, walletTransactions, paymentSessions, snapshot, numbers, creditBalance, callCreditPackages, callCreditTransactions] = await Promise.all([
      this.userRepo.findOne({ where: { id: userId }, select: ['id', 'walletBalanceUsdCents'] }),
      this.txRepo.find({
        where: { userId },
        order: { createdAt: 'DESC' },
        take: 12,
      }),
      this.sessionRepo.find({
        where: { userId },
        order: { createdAt: 'DESC' },
        take: 20,
      }),
      this.revenueCatService.getEntitlementSnapshot(userId),
      this.numberRepo.find({
        where: { userId },
        order: { expiresAt: 'ASC', createdAt: 'DESC' },
        take: 12,
      }),
      this.creditsService.getBalance(userId),
      this.creditsService.getPackages(),
      this.creditsService.listTransactions(userId, 1, 12),
    ]);

    if (!user) {
      throw new NotFoundException('User not found');
    }
    const subscriptionSessions = paymentSessions.filter((session) => session.metadata?.paymentType === 'subscription');
    const walletFundingSessions = paymentSessions.filter(
      (session) => session.metadata?.paymentType === 'wallet' || session.metadata?.paymentType === 'credits',
    );
    const numberRenewals = numbers
      .filter((item) => Boolean(item.expiresAt))
      .map((item) => ({
        id: item.id,
        number: item.number,
        type: item.type,
        status: item.status,
        autoRenew: item.autoRenew,
        autoRenewAt: item.autoRenewAt?.toISOString() ?? null,
        expiresAt: item.expiresAt?.toISOString() ?? null,
        renewalPriceUsdCents: Number(item.renewalPriceUsdCents ?? 0),
        countryCode: item.countryCode ?? null,
        provider: item.provider,
      }));

    return {
      wallet: {
        balanceUsdCents: creditBalance.wallet.balanceUsdCents,
        balanceUsd: creditBalance.wallet.balanceUsdCents / 100,
        lockedBalanceUsdCents: creditBalance.wallet.lockedBalanceUsdCents,
        displayCurrency: 'USD',
        fundingMethods: WALLET_FUNDING_METHODS,
      },
      callCredits: {
        balance: creditBalance.credits.balance,
        lockedBalance: creditBalance.credits.lockedBalance,
        availableBalance: creditBalance.credits.availableBalance,
        equivalentUsdCents: creditBalance.credits.equivalentUsdCents,
        lifetimePurchased: creditBalance.credits.lifetimePurchased,
        lifetimeSpent: creditBalance.credits.lifetimeSpent,
      },
      subscriptions: snapshot.subscriptions,
      entitlements: {
        provider: 'revenuecat',
        configured: snapshot.enabled,
        lastSyncedAt: snapshot.lastSyncedAt,
        items: snapshot.entitlements,
        summary: {
          ...snapshot.summary,
          adsDisabledInPremium: snapshot.summary.canAccessPremium,
          adsDisabledInSubscribedProducts: snapshot.summary.activeEntitlements.length > 0,
        },
      },
      access: {
        messenger: snapshot.summary.canAccessMessenger,
        secureTunnel: snapshot.summary.canAccessSecureTunnel,
        premium: snapshot.summary.canAccessPremium,
        adsDisabledPlatformWide: snapshot.summary.canAccessPremium,
      },
      walletTransactions: walletTransactions.map((item) => ({
        id: item.id,
        type: item.type,
        status: item.status,
        amountUsdCents: Number(item.amountUsdCents ?? 0),
        balanceAfterUsdCents: Number(item.balanceAfterUsdCents ?? 0),
        description: item.description,
        gateway: item.gateway,
        referenceId: item.referenceId,
        externalReference: item.externalReference,
        createdAt: item.createdAt?.toISOString() ?? null,
        metadata: item.metadata ?? {},
      })),
      subscriptionBillingHistory: subscriptionSessions.map((session) => this.toPaymentSessionView(session)),
      walletFundingHistory: walletFundingSessions.map((session) => this.toPaymentSessionView(session)),
      callCreditTransactions: callCreditTransactions.transactions,
      callCreditPackages,
      numberRenewals,
      catalog: this.getPlans(),
      notes: {
        mobileSubscriptions: 'Subscriptions are billed separately through Apple App Store or Google Play.',
        webSubscriptions: 'Subscriptions are billed separately through Paddle.',
        walletSeparation: 'Your Burner Point wallet is stored in USD and is used for verifications, rentals, eSIMs, proxies, and pay-as-you-go purchases.',
        callCreditsUsage: 'Call Credits are used only for BP Messenger international calls and premium voice routes.',
        subscriptionsSeparation: 'Subscriptions are billed separately and are not paid from wallet balance or Call Credits.',
        walletRules: [
          'Wallet balance is stored in USD and shown in local currency dynamically.',
          'Wallet is credited only after verified webhook confirmation.',
          'Frontend payment success is never treated as proof of credit.',
        ],
      },
    };
  }

  async getLedger(userId: string, page = 1, limit = 20) {
    const [transactions, total] = await this.txRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { transactions, total, page, limit };
  }

  getPlans() {
    return this.groupPlansByProduct(BILLING_SUBSCRIPTION_PLANS);
  }

  async getSubscription(userId: string) {
    const snapshot = await this.revenueCatService.getEntitlementSnapshot(userId);
    const activeSubscriptions = snapshot.subscriptions.filter((item) => item.isActive || item.status === 'grace_period');
    return {
      subscriptions: activeSubscriptions,
      entitlements: snapshot.entitlements,
      summary: snapshot.summary,
    };
  }

  getEntitlements(userId: string) {
    return this.revenueCatService.getEntitlementSnapshot(userId);
  }

  refreshEntitlements(userId: string) {
    return this.revenueCatService.refreshCustomerForUser(userId);
  }

  async recordWalletTransaction(input: {
    userId: string;
    type: TransactionType;
    amountUsdCents: number;
    balanceAfterUsdCents: number;
    description: string;
    referenceId?: string;
    externalReference?: string;
    gateway?: PaymentGateway;
    metadata?: Record<string, unknown>;
  }) {
    const amount = Number(input.amountUsdCents);
    const balanceAfter = Number(input.balanceAfterUsdCents);
    const balanceBefore = balanceAfter - amount;

    return this.txRepo.save(
      this.txRepo.create({
        userId: input.userId,
        type: input.type,
        status: TransactionStatus.COMPLETED,
        amountUsdCents: amount,
        balanceBeforeUsdCents: balanceBefore,
        balanceAfterUsdCents: balanceAfter,
        description: input.description,
        referenceId: input.referenceId,
        externalReference: input.externalReference,
        gateway: input.gateway,
        metadata: input.metadata || {},
      }),
    );
  }

  async hasAnyActiveEntitlement(userId: string, identifiers: string[]) {
    if (!identifiers.length) return false;

    const count = await this.entitlementRepo.count({
      where: {
        userId,
        identifier: In(identifiers),
        isActive: true,
      },
    });

    return count > 0;
  }

  private groupPlansByProduct(plans: BillingSubscriptionPlan[]) {
    return Array.from(
      plans.reduce<Map<string, {
        product: string;
        productName: string;
        plans: BillingSubscriptionPlan[];
      }>>((map, plan) => {
        const existing = map.get(plan.product);
        if (existing) {
          existing.plans.push(plan);
          return map;
        }

        map.set(plan.product, {
          product: plan.product,
          productName: plan.productName,
          plans: [plan],
        });
        return map;
      }, new Map()).values(),
    );
  }

  private toPaymentSessionView(session: PaymentSession) {
    return {
      id: session.id,
      reference: session.reference,
      gateway: session.gateway,
      status: session.status,
      amountMinor: Number(session.amountUsdCents ?? 0),
      currency: session.currency,
      checkoutUrl: session.checkoutUrl ?? null,
      paidAt: session.paidAt?.toISOString() ?? null,
      expiresAt: session.expiresAt?.toISOString() ?? null,
      createdAt: session.createdAt?.toISOString() ?? null,
      gatewayReference: session.gatewayReference ?? null,
      metadata: session.metadata ?? {},
    };
  }
}
