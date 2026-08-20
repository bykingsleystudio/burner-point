import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { CreditPackage, TransactionStatus, TransactionType, WalletTransaction } from '../../database/entities/extended-entities';
import {
  CreditAccount,
  CreditLock,
  CreditLockStatus,
  CreditPricingLog,
  CreditPricingRule,
  CreditTransaction,
  CreditTransactionStatus,
  CreditTransactionType,
  Wallet,
  WalletLock,
  WalletLockStatus,
} from '../../database/entities/financial-ledger.entity';
import { NumberType, PhoneNumber, NumberStatus } from '../../database/entities/phone-number.entity';
import { buildWalletPresentation } from '../../config/money';
import { EventsGateway } from '../gateway/events.gateway';
import { UsersService } from '../users/users.service';
import {
  defaultNumberDurationDays,
  getNumberProductBasePriceUsdCents,
  normalizeNumberDurationDays,
  VERIFICATION_LOCK_TIMEOUT_MINUTES,
} from './product-credit-pricing';
import {
  calculatePackageTotalCredits,
  quoteCreditsPrice,
} from './pricing-engine';

type CreditProductId =
  | 'verify_hub'
  | 'rentals'
  | 'esim_store'
  | 'proxy_store'
  | 'secure_tunnel'
  | 'messenger_calls'
  | 'dedicated_ip'
  | 'wallet_conversion';

export type CreditQuoteInput = {
  product: CreditProductId | string;
  countryCode?: string;
  provider?: string;
  serviceCode?: string;
  routeQuality?: string;
  basePriceUsdCents?: number;
  providerCostUsdCents?: number;
  numberType?: NumberType;
  durationDays?: number;
  quantity?: number;
  routeQualityMultiplier?: number;
  countryMultiplier?: number;
  relatedEntityId?: string;
};

export type CreditLockRequest = {
  userId: string;
  creditsAmount: number;
  relatedProduct?: string;
  relatedEntityId?: string;
  reason: string;
  description?: string;
  expiresAt?: Date | null;
  idempotencyKey: string;
  metadata?: Record<string, unknown>;
};

export type CreditSpendRequest = {
  userId: string;
  lockId: string;
  creditsAmount?: number;
  usdValueCents?: number;
  relatedProduct?: string;
  relatedEntityId?: string;
  description?: string;
  idempotencyKey: string;
  metadata?: Record<string, unknown>;
};

export type CreditReleaseRequest = {
  userId: string;
  lockId: string;
  description?: string;
  idempotencyKey: string;
  metadata?: Record<string, unknown>;
};

export type CreditRefundRequest = {
  userId: string;
  creditsAmount: number;
  usdValueCents?: number;
  relatedProduct?: string;
  relatedEntityId?: string;
  description?: string;
  idempotencyKey: string;
  metadata?: Record<string, unknown>;
};

export type WalletLockRequest = {
  userId: string;
  amountUsdCents: number;
  reason: string;
  relatedProduct?: string;
  relatedEntityId?: string;
  description?: string;
  expiresAt?: Date | null;
  idempotencyKey: string;
  metadata?: Record<string, unknown>;
};

export type WalletSpendRequest = {
  userId: string;
  lockId: string;
  amountUsdCents?: number;
  type?: TransactionType;
  relatedProduct?: string;
  relatedEntityId?: string;
  description?: string;
  idempotencyKey: string;
  metadata?: Record<string, unknown>;
};

export type WalletReleaseRequest = {
  userId: string;
  lockId: string;
  description?: string;
  idempotencyKey: string;
  metadata?: Record<string, unknown>;
};

export type WalletRefundRequest = {
  userId: string;
  amountUsdCents: number;
  type?: TransactionType;
  relatedProduct?: string;
  relatedEntityId?: string;
  description?: string;
  idempotencyKey: string;
  metadata?: Record<string, unknown>;
};

const DEFAULT_CREDIT_PACKAGES = [
  { id: 'starter-call-credits', name: 'Starter Call Credits', usdPriceCents: 500, baseCredits: 500, bonusCredits: 0, sortOrder: 1 },
  { id: 'standard-call-credits', name: 'Standard Call Credits', usdPriceCents: 1000, baseCredits: 1000, bonusCredits: 0, sortOrder: 2 },
  { id: 'power-call-credits', name: 'Power Call Credits', usdPriceCents: 2500, baseCredits: 2500, bonusCredits: 0, sortOrder: 3 },
  { id: 'business-call-credits', name: 'Business Call Credits', usdPriceCents: 5000, baseCredits: 5000, bonusCredits: 0, sortOrder: 4 },
  { id: 'enterprise-call-credits', name: 'Enterprise Call Credits', usdPriceCents: 10000, baseCredits: 10000, bonusCredits: 0, sortOrder: 5 },
] as const;

@Injectable()
export class CreditsService {
  private readonly logger = new Logger(CreditsService.name);

  constructor(
    @InjectRepository(CreditPackage)
    private readonly packageRepo: Repository<CreditPackage>,
    @InjectRepository(CreditAccount)
    private readonly creditAccountRepo: Repository<CreditAccount>,
    @InjectRepository(CreditTransaction)
    private readonly creditTransactionRepo: Repository<CreditTransaction>,
    @InjectRepository(CreditLock)
    private readonly creditLockRepo: Repository<CreditLock>,
    @InjectRepository(CreditPricingRule)
    private readonly pricingRuleRepo: Repository<CreditPricingRule>,
    @InjectRepository(CreditPricingLog)
    private readonly pricingLogRepo: Repository<CreditPricingLog>,
    @InjectRepository(Wallet)
    private readonly walletRepo: Repository<Wallet>,
    @InjectRepository(WalletLock)
    private readonly walletLockRepo: Repository<WalletLock>,
    @InjectRepository(WalletTransaction)
    private readonly walletTransactionRepo: Repository<WalletTransaction>,
    @InjectRepository(PhoneNumber)
    private readonly phoneNumberRepo: Repository<PhoneNumber>,
    private readonly usersService: UsersService,
    private readonly eventsGateway: EventsGateway,
    private readonly configService: ConfigService,
  ) {}

  async getBalance(userId: string) {
    const [walletBalance, creditAccount] = await Promise.all([
      this.usersService.getWalletBalance(userId),
      this.ensureCreditAccount(userId),
    ]);

    return {
      wallet: {
        balanceUsdCents: walletBalance.balanceUsdCents,
        lockedBalanceUsdCents: walletBalance.lockedBalanceUsdCents,
        availableUsdCents: walletBalance.balanceUsdCents - walletBalance.lockedBalanceUsdCents,
        displayCurrency: walletBalance.displayCurrency,
        localDisplay: {
          currency: null,
          amountUsdCents: null,
          fxRateNgnPerUsd: null,
        },
      },
      credits: this.toCreditAccountView(creditAccount),
    };
  }

  async getWalletBalance(userId: string) {
    const walletBalance = await this.usersService.getWalletBalance(userId);
    return {
      balanceUsdCents: walletBalance.balanceUsdCents,
      lockedBalanceUsdCents: walletBalance.lockedBalanceUsdCents,
      availableUsdCents: walletBalance.balanceUsdCents - walletBalance.lockedBalanceUsdCents,
      displayCurrency: walletBalance.displayCurrency,
      localDisplay: {
        currency: null,
        amountUsdCents: null,
        fxRateNgnPerUsd: null,
      },
    };
  }

  async getPackages() {
    const packages = await this.packageRepo.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });

    const resolved = packages.length ? packages : DEFAULT_CREDIT_PACKAGES.map((item) => this.packageRepo.create({
      ...item,
      totalCredits: calculatePackageTotalCredits(item),
      isActive: true,
    }));

    return resolved.map((pkg) => this.toPackageView(pkg));
  }

  async listTransactions(userId: string, page = 1, limit = 20) {
    const [transactions, total] = await this.creditTransactionRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      transactions: transactions.map((item) => this.toCreditTransactionView(item)),
      total,
      page,
      limit,
    };
  }

  async getActiveLocks(userId: string) {
    const locks = await this.creditLockRepo.find({
      where: { userId, status: CreditLockStatus.ACTIVE },
      order: { createdAt: 'DESC' },
    });
    return locks.map((lock) => this.toCreditLockView(lock));
  }

  async getPricingRules() {
    const rules = await this.pricingRuleRepo.find({
      order: { product: 'ASC', countryCode: 'ASC', provider: 'ASC', createdAt: 'ASC' },
    });
    return rules.map((rule) => this.toPricingRuleView(rule));
  }

  async getCallCreditRates() {
    const rules = await this.pricingRuleRepo.find({
      where: { product: 'messenger_calls', isActive: true },
      order: { countryCode: 'ASC', provider: 'ASC', createdAt: 'ASC' },
    });

    return rules.map((rule) => ({
      id: rule.id,
      destinationCountry: rule.countryCode ?? 'GLOBAL',
      destinationPrefix: rule.metadata?.destinationPrefix ?? null,
      provider: rule.provider ?? null,
      creditsPerMinute: Math.max(
        1,
        Math.ceil(
          Number(rule.providerCostUsdCents)
          + Number(rule.platformMarginUsdCents)
          + Number(rule.riskMarginUsdCents),
        ),
      ),
      usdCostPerMinuteCents: Number(rule.providerCostUsdCents),
      marginPercent: Number(rule.metadata?.marginPercent ?? 0),
      isActive: rule.isActive,
      createdAt: rule.createdAt?.toISOString() ?? null,
      updatedAt: rule.updatedAt?.toISOString() ?? null,
    }));
  }

  async upsertPackage(input: {
    id?: string;
    name: string;
    usdPriceCents: number;
    baseCredits: number;
    bonusCredits?: number;
    isActive?: boolean;
    sortOrder?: number;
  }) {
    const entity = input.id
      ? await this.packageRepo.findOne({ where: { id: input.id } })
      : null;

    const next = entity ?? this.packageRepo.create();
    next.name = input.name.trim();
    next.usdPriceCents = Math.max(0, Math.round(Number(input.usdPriceCents)));
    next.baseCredits = Math.max(0, Math.round(Number(input.baseCredits)));
    next.bonusCredits = Math.max(0, Math.round(Number(input.bonusCredits ?? 0)));
    next.totalCredits = calculatePackageTotalCredits({
      baseCredits: next.baseCredits,
      bonusCredits: next.bonusCredits,
    });
    next.isActive = input.isActive ?? true;
    next.sortOrder = Math.max(0, Math.round(Number(input.sortOrder ?? 0)));

    const saved = await this.packageRepo.save(next);
    return this.toPackageView(saved);
  }

  async upsertPricingRule(input: {
    id?: string;
    product: string;
    countryCode?: string;
    provider?: string;
    serviceCode?: string;
    routeQuality?: string;
    providerCostUsdCents?: number;
    platformMarginUsdCents?: number;
    riskMarginUsdCents?: number;
    countryMultiplier?: number;
    routeQualityMultiplier?: number;
    isActive?: boolean;
    metadata?: Record<string, unknown>;
  }) {
    const entity = input.id
      ? await this.pricingRuleRepo.findOne({ where: { id: input.id } })
      : null;

    const next = entity ?? this.pricingRuleRepo.create();
    next.product = input.product.trim();
    next.countryCode = input.countryCode?.trim().toUpperCase() || null;
    next.provider = input.provider?.trim() || null;
    next.serviceCode = input.serviceCode?.trim() || null;
    next.routeQuality = input.routeQuality?.trim() || null;
    next.providerCostUsdCents = Math.max(0, Math.round(Number(input.providerCostUsdCents ?? 0)));
    next.platformMarginUsdCents = Math.max(0, Math.round(Number(input.platformMarginUsdCents ?? 0)));
    next.riskMarginUsdCents = Math.max(0, Math.round(Number(input.riskMarginUsdCents ?? 0)));
    next.countryMultiplier = this.normalizedMultiplier(input.countryMultiplier ?? 1).toFixed(4);
    next.routeQualityMultiplier = this.normalizedMultiplier(input.routeQualityMultiplier ?? 1).toFixed(4);
    next.isActive = input.isActive ?? true;
    next.metadata = input.metadata ?? {};

    const saved = await this.pricingRuleRepo.save(next);
    return this.toPricingRuleView(saved);
  }

  async quote(input: CreditQuoteInput, userId?: string) {
    const pricingRule = await this.resolvePricingRule(input);
    const resolvedProviderCostUsdCents = this.resolveProviderCostUsdCents(input, pricingRule);
    const resolvedCountryMultiplier = input.countryMultiplier ?? Number(pricingRule?.countryMultiplier ?? 1);
    const resolvedRouteMultiplier = input.routeQualityMultiplier ?? Number(pricingRule?.routeQualityMultiplier ?? 1);
    const quantity = Math.max(1, Math.round(Number(input.quantity ?? 1)));

    const quote = quoteCreditsPrice({
      product: input.product,
      providerCostUsdCents: resolvedProviderCostUsdCents * quantity,
      platformMarginUsdCents: Number(pricingRule?.platformMarginUsdCents ?? 0),
      riskMarginUsdCents: Number(pricingRule?.riskMarginUsdCents ?? 0),
      countryMultiplier: resolvedCountryMultiplier,
      routeQualityMultiplier: resolvedRouteMultiplier,
    });

    const response = {
      product: input.product,
      credits: quote.finalCredits,
      usdValueCents: quote.finalUsdCents,
      usdDisplay: (quote.finalUsdCents / 100).toFixed(2),
      breakdown: {
        ...quote.breakdown,
        quantity,
        pricingRuleId: pricingRule?.id ?? null,
      },
      input: {
        countryCode: input.countryCode ?? null,
        provider: input.provider ?? null,
        serviceCode: input.serviceCode ?? null,
        routeQuality: input.routeQuality ?? null,
        relatedEntityId: input.relatedEntityId ?? null,
      },
    };

    await this.pricingLogRepo.save(this.pricingLogRepo.create({
      userId: userId ?? null,
      product: input.product,
      countryCode: input.countryCode?.toUpperCase() ?? null,
      provider: input.provider ?? null,
      serviceCode: input.serviceCode ?? null,
      relatedEntityId: input.relatedEntityId ?? null,
      quoteRequest: { ...input, pricingRuleId: pricingRule?.id ?? null },
      quoteResult: response,
    }));

    this.logger.log(`Credit quote calculated for ${input.product}: ${quote.finalCredits} credits`);
    return response;
  }

  async purchaseCredits(userId: string, packageId: string, idempotencyKey: string) {
    if (!idempotencyKey?.trim()) {
      throw new BadRequestException('An idempotency key is required.');
    }

    const existing = await this.creditTransactionRepo.findOne({
      where: { idempotencyKey },
    });
    if (existing) {
      return this.purchaseSummary(userId, existing);
    }

    const summary = await this.creditTransactionRepo.manager.transaction(async (manager) => {
      const wallet = await this.findOrCreateWalletWithManager(manager, userId);
      const account = await this.findOrCreateCreditAccountWithManager(manager, userId);
      const pkg = await this.findPackageWithManager(manager, packageId);
      const availableUsdCents = Number(wallet.balanceUsdCents) - Number(wallet.lockedBalanceUsdCents ?? 0);
      if (availableUsdCents < Number(pkg.usdPriceCents)) {
        throw new BadRequestException('Insufficient wallet balance');
      }

      wallet.lockedBalanceUsdCents = Number(wallet.lockedBalanceUsdCents) + Number(pkg.usdPriceCents);
      await manager.save(wallet);

      const balanceBeforeUsdCents = Number(wallet.balanceUsdCents);
      wallet.balanceUsdCents = Number(wallet.balanceUsdCents) - Number(pkg.usdPriceCents);
      wallet.lockedBalanceUsdCents = Number(wallet.lockedBalanceUsdCents) - Number(pkg.usdPriceCents);

      account.creditBalance = Number(account.creditBalance) + Number(pkg.totalCredits);
      account.lifetimeCreditsPurchased = Number(account.lifetimeCreditsPurchased) + Number(pkg.totalCredits);

      await manager.save([wallet, account]);
      await this.syncUserWalletMirror(manager, userId, Number(wallet.balanceUsdCents));

      await manager.save(
        manager.create(WalletTransaction, {
          userId,
          type: TransactionType.CALL_CREDIT_PURCHASE,
          status: TransactionStatus.COMPLETED,
          amountUsdCents: -Number(pkg.usdPriceCents),
          balanceBeforeUsdCents,
          balanceAfterUsdCents: Number(wallet.balanceUsdCents),
          referenceId: idempotencyKey,
          description: `Purchased ${pkg.name} from wallet balance`,
          metadata: {
            kind: 'call_credit_purchase',
            creditPackageId: pkg.id,
            creditPackageName: pkg.name,
            baseCredits: Number(pkg.baseCredits),
            bonusCredits: Number(pkg.bonusCredits),
            totalCredits: Number(pkg.totalCredits),
          },
        }),
      );

      const purchaseTx = await manager.save(
        manager.create(CreditTransaction, {
          userId,
          type: CreditTransactionType.PURCHASE,
          creditsAmount: Number(pkg.baseCredits),
          usdValueCents: Number(pkg.usdPriceCents),
          relatedProduct: 'messenger_calls',
          relatedEntityId: pkg.id,
          description: `Purchased ${pkg.name}`,
          status: CreditTransactionStatus.COMPLETED,
          idempotencyKey,
          metadata: {
            packageName: pkg.name,
            totalCredits: Number(pkg.totalCredits),
          },
        }),
      );

      if (Number(pkg.bonusCredits) > 0) {
        await manager.save(
          manager.create(CreditTransaction, {
            userId,
            type: CreditTransactionType.BONUS,
            creditsAmount: Number(pkg.bonusCredits),
            usdValueCents: 0,
            relatedProduct: 'messenger_calls',
            relatedEntityId: pkg.id,
            description: `${pkg.name} bonus call credits`,
            status: CreditTransactionStatus.COMPLETED,
            metadata: {
              packageName: pkg.name,
            },
          }),
        );
      }

      return {
        transactionId: purchaseTx.id,
        wallet,
        account,
        pkg,
      };
    });

    await this.emitBalanceUpdate(userId);
    return {
      success: true,
      package: this.toPackageView(summary.pkg),
      wallet: this.toWalletView(summary.wallet),
      credits: this.toCreditAccountView(summary.account),
      transactionId: summary.transactionId,
    };
  }

  async listWalletTransactions(userId: string, page = 1, limit = 20) {
    const [transactions, total] = await this.walletTransactionRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      transactions: transactions.map((item) => this.toWalletTransactionView(item)),
      total,
      page,
      limit,
    };
  }

  async createWalletLock(input: WalletLockRequest) {
    const existingTx = await this.findWalletTransactionByReference(input.userId, input.idempotencyKey, TransactionType.WALLET_LOCK);
    if (existingTx?.metadata?.lockId) {
      const existingLock = await this.walletLockRepo.findOne({
        where: { id: String(existingTx.metadata.lockId), userId: input.userId },
      });
      if (existingLock) {
        const wallet = await this.findOrCreateWallet(input.userId);
        return {
          success: true,
          wallet: this.toWalletView(wallet),
          lock: this.toWalletLockView(existingLock),
        };
      }
    }

    const result = await this.walletLockRepo.manager.transaction(async (manager) => {
      const wallet = await this.findOrCreateWalletWithManager(manager, input.userId);
      const amountUsdCents = Math.max(1, Math.round(Number(input.amountUsdCents)));
      const availableUsdCents = Number(wallet.balanceUsdCents) - Number(wallet.lockedBalanceUsdCents ?? 0);
      if (availableUsdCents < amountUsdCents) {
        throw new BadRequestException('Insufficient wallet balance');
      }

      const lockedBeforeUsdCents = Number(wallet.lockedBalanceUsdCents ?? 0);
      wallet.lockedBalanceUsdCents = lockedBeforeUsdCents + amountUsdCents;
      await manager.save(wallet);

      const lock = await manager.save(
        manager.create(WalletLock, {
          userId: input.userId,
          amountUsdCents,
          reason: input.reason,
          relatedProduct: input.relatedProduct ?? null,
          relatedEntityId: input.relatedEntityId ?? null,
          expiresAt: input.expiresAt ?? null,
          status: WalletLockStatus.ACTIVE,
          idempotencyKey: input.idempotencyKey,
          metadata: input.metadata ?? {},
        }),
      );

      await manager.save(
        manager.create(WalletTransaction, {
          userId: input.userId,
          type: TransactionType.WALLET_LOCK,
          status: TransactionStatus.COMPLETED,
          amountUsdCents: 0,
          balanceBeforeUsdCents: Number(wallet.balanceUsdCents),
          balanceAfterUsdCents: Number(wallet.balanceUsdCents),
          description: input.description ?? input.reason,
          referenceId: input.idempotencyKey,
          metadata: {
            lockId: lock.id,
            lockedAmountUsdCents: amountUsdCents,
            lockedBalanceBeforeUsdCents: lockedBeforeUsdCents,
            lockedBalanceAfterUsdCents: Number(wallet.lockedBalanceUsdCents),
            relatedProduct: input.relatedProduct ?? null,
            relatedEntityId: input.relatedEntityId ?? null,
            expiresAt: input.expiresAt?.toISOString() ?? null,
            ...(input.metadata ?? {}),
          },
        }),
      );

      return { wallet, lock };
    });

    await this.emitBalanceUpdate(input.userId);
    return {
      success: true,
      wallet: this.toWalletView(result.wallet),
      lock: this.toWalletLockView(result.lock),
    };
  }

  async spendWalletLock(input: WalletSpendRequest) {
    const existingTx = await this.findWalletTransactionByReference(input.userId, input.idempotencyKey);
    if (existingTx) {
      const wallet = await this.findOrCreateWallet(input.userId);
      return {
        success: true,
        wallet: this.toWalletView(wallet),
        transaction: this.toWalletTransactionView(existingTx),
      };
    }

    const result = await this.walletTransactionRepo.manager.transaction(async (manager) => {
      const wallet = await this.findOrCreateWalletWithManager(manager, input.userId);
      const lock = await manager.findOne(WalletLock, {
        where: { id: input.lockId, userId: input.userId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!lock) throw new NotFoundException('Wallet lock not found');
      if (lock.status === WalletLockStatus.SPENT) {
        throw new BadRequestException('Wallet lock has already been spent');
      }
      if (lock.status !== WalletLockStatus.ACTIVE) {
        throw new BadRequestException('Wallet lock is not active');
      }

      const spendAmountUsdCents = Math.max(1, Math.round(Number(input.amountUsdCents ?? lock.amountUsdCents)));
      if (spendAmountUsdCents > Number(lock.amountUsdCents)) {
        throw new BadRequestException('Spend amount exceeds locked wallet balance');
      }

      const releaseAmountUsdCents = Number(lock.amountUsdCents) - spendAmountUsdCents;
      const balanceBeforeUsdCents = Number(wallet.balanceUsdCents);
      const lockedBeforeUsdCents = Number(wallet.lockedBalanceUsdCents ?? 0);

      wallet.balanceUsdCents = balanceBeforeUsdCents - spendAmountUsdCents;
      wallet.lockedBalanceUsdCents = lockedBeforeUsdCents - Number(lock.amountUsdCents);
      await manager.save(wallet);
      await this.syncUserWalletMirror(manager, input.userId, Number(wallet.balanceUsdCents));

      lock.status = WalletLockStatus.SPENT;
      lock.releasedAt = new Date();
      lock.metadata = {
        ...(lock.metadata ?? {}),
        spentAmountUsdCents: spendAmountUsdCents,
        releasedAmountUsdCents: releaseAmountUsdCents,
      };
      await manager.save(lock);

      const transaction = await manager.save(
        manager.create(WalletTransaction, {
          userId: input.userId,
          type: input.type ?? TransactionType.PRODUCT_PURCHASE,
          status: TransactionStatus.COMPLETED,
          amountUsdCents: -spendAmountUsdCents,
          balanceBeforeUsdCents,
          balanceAfterUsdCents: Number(wallet.balanceUsdCents),
          description: input.description ?? lock.reason,
          referenceId: input.idempotencyKey,
          metadata: {
            lockId: lock.id,
            lockedBalanceBeforeUsdCents: lockedBeforeUsdCents,
            lockedBalanceAfterUsdCents: Number(wallet.lockedBalanceUsdCents),
            spentAmountUsdCents: spendAmountUsdCents,
            releasedAmountUsdCents: releaseAmountUsdCents,
            relatedProduct: input.relatedProduct ?? lock.relatedProduct ?? null,
            relatedEntityId: input.relatedEntityId ?? lock.relatedEntityId ?? null,
            ...(input.metadata ?? {}),
          },
        }),
      );

      if (releaseAmountUsdCents > 0) {
        await manager.save(
          manager.create(WalletTransaction, {
            userId: input.userId,
            type: TransactionType.WALLET_RELEASE,
            status: TransactionStatus.COMPLETED,
            amountUsdCents: 0,
            balanceBeforeUsdCents: Number(wallet.balanceUsdCents),
            balanceAfterUsdCents: Number(wallet.balanceUsdCents),
            description: `Released unused wallet hold from ${lock.reason}`,
            metadata: {
              lockId: lock.id,
              releasedAmountUsdCents: releaseAmountUsdCents,
              releaseSource: 'partial_spend',
            },
          }),
        );
      }

      return { wallet, transaction };
    });

    await this.emitBalanceUpdate(input.userId);
    return {
      success: true,
      wallet: this.toWalletView(result.wallet),
      transaction: this.toWalletTransactionView(result.transaction),
    };
  }

  async releaseWalletLock(input: WalletReleaseRequest) {
    const existingTx = await this.findWalletTransactionByReference(input.userId, input.idempotencyKey, TransactionType.WALLET_RELEASE);
    if (existingTx) {
      const wallet = await this.findOrCreateWallet(input.userId);
      return {
        success: true,
        wallet: this.toWalletView(wallet),
        transaction: this.toWalletTransactionView(existingTx),
      };
    }

    const result = await this.walletTransactionRepo.manager.transaction(async (manager) => {
      const wallet = await this.findOrCreateWalletWithManager(manager, input.userId);
      const lock = await manager.findOne(WalletLock, {
        where: { id: input.lockId, userId: input.userId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!lock) throw new NotFoundException('Wallet lock not found');
      if (lock.status === WalletLockStatus.RELEASED || lock.status === WalletLockStatus.EXPIRED) {
        throw new BadRequestException('Wallet lock has already been released');
      }
      if (lock.status !== WalletLockStatus.ACTIVE) {
        throw new BadRequestException('Wallet lock is not active');
      }

      const lockedBeforeUsdCents = Number(wallet.lockedBalanceUsdCents ?? 0);
      wallet.lockedBalanceUsdCents = lockedBeforeUsdCents - Number(lock.amountUsdCents);
      await manager.save(wallet);

      lock.status = WalletLockStatus.RELEASED;
      lock.releasedAt = new Date();
      await manager.save(lock);

      const transaction = await manager.save(
        manager.create(WalletTransaction, {
          userId: input.userId,
          type: TransactionType.WALLET_RELEASE,
          status: TransactionStatus.COMPLETED,
          amountUsdCents: 0,
          balanceBeforeUsdCents: Number(wallet.balanceUsdCents),
          balanceAfterUsdCents: Number(wallet.balanceUsdCents),
          description: input.description ?? `Released ${lock.reason}`,
          referenceId: input.idempotencyKey,
          metadata: {
            lockId: lock.id,
            releasedAmountUsdCents: Number(lock.amountUsdCents),
            lockedBalanceBeforeUsdCents: lockedBeforeUsdCents,
            lockedBalanceAfterUsdCents: Number(wallet.lockedBalanceUsdCents),
            ...(input.metadata ?? {}),
          },
        }),
      );

      return { wallet, transaction };
    });

    await this.emitBalanceUpdate(input.userId);
    return {
      success: true,
      wallet: this.toWalletView(result.wallet),
      transaction: this.toWalletTransactionView(result.transaction),
    };
  }

  async rebindWalletLockEntity(userId: string, lockId: string, relatedEntityId: string, relatedProduct?: string) {
    const lock = await this.walletLockRepo.findOne({
      where: { id: lockId, userId },
    });
    if (!lock) throw new NotFoundException('Wallet lock not found');

    lock.relatedEntityId = relatedEntityId;
    if (relatedProduct) {
      lock.relatedProduct = relatedProduct;
    }
    lock.metadata = {
      ...(lock.metadata ?? {}),
      reboundAt: new Date().toISOString(),
      reboundEntityId: relatedEntityId,
    };
    const saved = await this.walletLockRepo.save(lock);
    return this.toWalletLockView(saved);
  }

  async refundWallet(input: WalletRefundRequest) {
    const existingTx = await this.findWalletTransactionByReference(input.userId, input.idempotencyKey);
    if (existingTx) {
      const wallet = await this.findOrCreateWallet(input.userId);
      return {
        success: true,
        wallet: this.toWalletView(wallet),
        transaction: this.toWalletTransactionView(existingTx),
      };
    }

    const result = await this.walletTransactionRepo.manager.transaction(async (manager) => {
      const wallet = await this.findOrCreateWalletWithManager(manager, input.userId);
      const amountUsdCents = Math.max(1, Math.round(Number(input.amountUsdCents)));
      const balanceBeforeUsdCents = Number(wallet.balanceUsdCents);
      wallet.balanceUsdCents = balanceBeforeUsdCents + amountUsdCents;
      await manager.save(wallet);
      await this.syncUserWalletMirror(manager, input.userId, Number(wallet.balanceUsdCents));

      const transaction = await manager.save(
        manager.create(WalletTransaction, {
          userId: input.userId,
          type: input.type ?? TransactionType.PRODUCT_REFUND,
          status: TransactionStatus.COMPLETED,
          amountUsdCents,
          balanceBeforeUsdCents,
          balanceAfterUsdCents: Number(wallet.balanceUsdCents),
          description: input.description ?? 'Wallet refund',
          referenceId: input.idempotencyKey,
          metadata: {
            relatedProduct: input.relatedProduct ?? null,
            relatedEntityId: input.relatedEntityId ?? null,
            ...(input.metadata ?? {}),
          },
        }),
      );

      return { wallet, transaction };
    });

    await this.emitBalanceUpdate(input.userId);
    return {
      success: true,
      wallet: this.toWalletView(result.wallet),
      transaction: this.toWalletTransactionView(result.transaction),
    };
  }

  async createLock(input: CreditLockRequest) {
    const existing = await this.creditTransactionRepo.findOne({
      where: { idempotencyKey: input.idempotencyKey },
    });
    if (existing?.metadata?.lockId) {
      const lock = await this.creditLockRepo.findOne({ where: { id: String(existing.metadata.lockId), userId: input.userId } });
      if (lock) {
        const account = await this.ensureCreditAccount(input.userId);
        return {
          success: true,
          lock: this.toCreditLockView(lock),
          credits: this.toCreditAccountView(account),
        };
      }
    }

    const result = await this.creditLockRepo.manager.transaction(async (manager) => {
      const account = await this.findOrCreateCreditAccountWithManager(manager, input.userId);
      const creditsAmount = Math.max(1, Math.round(Number(input.creditsAmount)));
      const availableCredits = Number(account.creditBalance) - Number(account.lockedCreditBalance);
      if (availableCredits < creditsAmount) {
        throw new BadRequestException('Insufficient Call Credits balance');
      }

      account.lockedCreditBalance = Number(account.lockedCreditBalance) + creditsAmount;
      await manager.save(account);

      const lock = await manager.save(
        manager.create(CreditLock, {
          userId: input.userId,
          creditsAmount,
          reason: input.reason,
          relatedProduct: input.relatedProduct ?? null,
          relatedEntityId: input.relatedEntityId ?? null,
          expiresAt: input.expiresAt ?? null,
          status: CreditLockStatus.ACTIVE,
          metadata: input.metadata ?? {},
        }),
      );

      await manager.save(
        manager.create(CreditTransaction, {
          userId: input.userId,
          type: CreditTransactionType.LOCK,
          creditsAmount,
          usdValueCents: creditsAmount,
          relatedProduct: input.relatedProduct ?? null,
          relatedEntityId: input.relatedEntityId ?? lock.id,
          description: input.description ?? input.reason,
          status: CreditTransactionStatus.COMPLETED,
          idempotencyKey: input.idempotencyKey,
          metadata: {
            lockId: lock.id,
            expiresAt: input.expiresAt?.toISOString() ?? null,
            ...(input.metadata ?? {}),
          },
        }),
      );

      return { lock, account };
    });

    await this.emitBalanceUpdate(input.userId);
    return {
      success: true,
      lock: this.toCreditLockView(result.lock),
      credits: this.toCreditAccountView(result.account),
    };
  }

  async spendLock(input: CreditSpendRequest) {
    const existing = await this.creditTransactionRepo.findOne({
      where: { idempotencyKey: input.idempotencyKey },
    });
    if (existing) {
      const account = await this.ensureCreditAccount(input.userId);
      return {
        success: true,
        transaction: this.toCreditTransactionView(existing),
        credits: this.toCreditAccountView(account),
      };
    }

    const result = await this.creditTransactionRepo.manager.transaction(async (manager) => {
      const account = await this.findOrCreateCreditAccountWithManager(manager, input.userId);
      const lock = await manager.findOne(CreditLock, {
        where: { id: input.lockId, userId: input.userId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!lock) throw new NotFoundException('Credit lock not found');
      if (lock.status === CreditLockStatus.SPENT) {
        throw new BadRequestException('Credit lock has already been spent');
      }
      if (lock.status !== CreditLockStatus.ACTIVE) {
        throw new BadRequestException('Credit lock is not active');
      }

      const spendAmount = Math.max(1, Math.round(Number(input.creditsAmount ?? lock.creditsAmount)));
      if (spendAmount > Number(lock.creditsAmount)) {
        throw new BadRequestException('Spend amount exceeds locked credits');
      }

      const releaseAmount = Number(lock.creditsAmount) - spendAmount;
      account.creditBalance = Number(account.creditBalance) - spendAmount;
      account.lockedCreditBalance = Number(account.lockedCreditBalance) - Number(lock.creditsAmount);
      account.lifetimeCreditsSpent = Number(account.lifetimeCreditsSpent) + spendAmount;
      await manager.save(account);

      lock.status = CreditLockStatus.SPENT;
      lock.releasedAt = new Date();
      lock.metadata = {
        ...(lock.metadata ?? {}),
        spentCredits: spendAmount,
        releasedCredits: releaseAmount,
      };
      await manager.save(lock);

      const spendTx = await manager.save(
        manager.create(CreditTransaction, {
          userId: input.userId,
          type: CreditTransactionType.SPEND,
          creditsAmount: spendAmount,
          usdValueCents: Number(input.usdValueCents ?? spendAmount),
          relatedProduct: input.relatedProduct ?? lock.relatedProduct ?? null,
          relatedEntityId: input.relatedEntityId ?? lock.relatedEntityId ?? lock.id,
          description: input.description ?? lock.reason,
          status: CreditTransactionStatus.COMPLETED,
          idempotencyKey: input.idempotencyKey,
          metadata: {
            lockId: lock.id,
            ...(input.metadata ?? {}),
          },
        }),
      );

      if (releaseAmount > 0) {
        await manager.save(
          manager.create(CreditTransaction, {
            userId: input.userId,
            type: CreditTransactionType.RELEASE,
            creditsAmount: releaseAmount,
            usdValueCents: releaseAmount,
            relatedProduct: input.relatedProduct ?? lock.relatedProduct ?? null,
            relatedEntityId: input.relatedEntityId ?? lock.relatedEntityId ?? lock.id,
            description: `Released unused credits from ${lock.reason}`,
            status: CreditTransactionStatus.COMPLETED,
            metadata: {
              lockId: lock.id,
              releaseSource: 'partial_spend',
            },
          }),
        );
      }

      return { spendTx, account };
    });

    await this.emitBalanceUpdate(input.userId);
    return {
      success: true,
      transaction: this.toCreditTransactionView(result.spendTx),
      credits: this.toCreditAccountView(result.account),
    };
  }

  async releaseLock(input: CreditReleaseRequest) {
    const existing = await this.creditTransactionRepo.findOne({
      where: { idempotencyKey: input.idempotencyKey },
    });
    if (existing) {
      const account = await this.ensureCreditAccount(input.userId);
      return {
        success: true,
        transaction: this.toCreditTransactionView(existing),
        credits: this.toCreditAccountView(account),
      };
    }

    const result = await this.creditTransactionRepo.manager.transaction(async (manager) => {
      const account = await this.findOrCreateCreditAccountWithManager(manager, input.userId);
      const lock = await manager.findOne(CreditLock, {
        where: { id: input.lockId, userId: input.userId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!lock) throw new NotFoundException('Credit lock not found');
      if (lock.status === CreditLockStatus.RELEASED || lock.status === CreditLockStatus.EXPIRED) {
        throw new BadRequestException('Credit lock has already been released');
      }
      if (lock.status !== CreditLockStatus.ACTIVE) {
        throw new BadRequestException('Credit lock is not active');
      }

      account.lockedCreditBalance = Number(account.lockedCreditBalance) - Number(lock.creditsAmount);
      await manager.save(account);

      lock.status = CreditLockStatus.RELEASED;
      lock.releasedAt = new Date();
      await manager.save(lock);

      const releaseTx = await manager.save(
        manager.create(CreditTransaction, {
          userId: input.userId,
          type: CreditTransactionType.RELEASE,
          creditsAmount: Number(lock.creditsAmount),
          usdValueCents: Number(lock.creditsAmount),
          relatedProduct: lock.relatedProduct ?? null,
          relatedEntityId: lock.relatedEntityId ?? lock.id,
          description: input.description ?? `Released ${lock.reason}`,
          status: CreditTransactionStatus.COMPLETED,
          idempotencyKey: input.idempotencyKey,
          metadata: {
            lockId: lock.id,
            ...(input.metadata ?? {}),
          },
        }),
      );

      return { releaseTx, account };
    });

    await this.emitBalanceUpdate(input.userId);
    return {
      success: true,
      transaction: this.toCreditTransactionView(result.releaseTx),
      credits: this.toCreditAccountView(result.account),
    };
  }

  async refundCredits(input: CreditRefundRequest) {
    const existing = await this.creditTransactionRepo.findOne({
      where: { idempotencyKey: input.idempotencyKey },
    });
    if (existing) {
      const account = await this.ensureCreditAccount(input.userId);
      return {
        success: true,
        transaction: this.toCreditTransactionView(existing),
        credits: this.toCreditAccountView(account),
      };
    }

    const result = await this.creditTransactionRepo.manager.transaction(async (manager) => {
      const account = await this.findOrCreateCreditAccountWithManager(manager, input.userId);
      const creditsAmount = Math.max(1, Math.round(Number(input.creditsAmount)));
      account.creditBalance = Number(account.creditBalance) + creditsAmount;
      await manager.save(account);

      const refundTx = await manager.save(
        manager.create(CreditTransaction, {
          userId: input.userId,
          type: CreditTransactionType.REFUND,
          creditsAmount,
          usdValueCents: Number(input.usdValueCents ?? creditsAmount),
          relatedProduct: input.relatedProduct ?? null,
          relatedEntityId: input.relatedEntityId ?? null,
          description: input.description ?? 'Call Credits refund',
          status: CreditTransactionStatus.COMPLETED,
          idempotencyKey: input.idempotencyKey,
          metadata: input.metadata ?? {},
        }),
      );

      return { refundTx, account };
    });

    await this.emitBalanceUpdate(input.userId);
    return {
      success: true,
      transaction: this.toCreditTransactionView(result.refundTx),
      credits: this.toCreditAccountView(result.account),
    };
  }

  async reserveVerificationWalletAmount(input: {
    userId: string;
    phoneNumberId: string;
    countryCode: string;
    serviceCode?: string;
    routeQuality?: string;
    provider?: string;
    idempotencyKey: string;
  }) {
    const quote = await this.quote({
      product: 'verify_hub',
      countryCode: input.countryCode,
      serviceCode: input.serviceCode,
      routeQuality: input.routeQuality,
      provider: input.provider,
      relatedEntityId: input.phoneNumberId,
    }, input.userId);

    return this.createWalletLock({
      userId: input.userId,
      amountUsdCents: quote.usdValueCents,
      relatedProduct: 'verify_hub',
      relatedEntityId: input.phoneNumberId,
      reason: 'Verification session wallet hold',
      description: 'Locked wallet balance for BP Verify Hub session',
      expiresAt: new Date(Date.now() + VERIFICATION_LOCK_TIMEOUT_MINUTES * 60 * 1000),
      idempotencyKey: input.idempotencyKey,
      metadata: {
        quote,
      },
    });
  }

  async settleVerificationWalletDelivery(input: {
    userId: string;
    phoneNumberId: string;
    deliveryChannel: 'sms' | 'voice';
    idempotencyKey: string;
    messageId?: string;
  }) {
    const lock = await this.walletLockRepo.findOne({
      where: {
        userId: input.userId,
        relatedProduct: 'verify_hub',
        relatedEntityId: input.phoneNumberId,
        status: WalletLockStatus.ACTIVE,
      },
      order: { createdAt: 'DESC' },
    });
    if (!lock) return null;

    return this.spendWalletLock({
      userId: input.userId,
      lockId: lock.id,
      type: TransactionType.PRODUCT_PURCHASE,
      relatedProduct: 'verify_hub',
      relatedEntityId: input.phoneNumberId,
      description: `BP Verify Hub ${input.deliveryChannel.toUpperCase()} delivery confirmed`,
      idempotencyKey: input.idempotencyKey,
      metadata: {
        deliveryChannel: input.deliveryChannel,
        messageId: input.messageId ?? null,
      },
    });
  }

  async releaseExpiredVerificationWalletLock(phoneNumberId: string, userId: string, reason = 'Verification timeout expired') {
    const lock = await this.walletLockRepo.findOne({
      where: {
        userId,
        relatedProduct: 'verify_hub',
        relatedEntityId: phoneNumberId,
        status: WalletLockStatus.ACTIVE,
      },
      order: { createdAt: 'DESC' },
    });
    if (!lock) return null;

    return this.releaseWalletLock({
      userId,
      lockId: lock.id,
      description: reason,
      idempotencyKey: `verify-wallet-timeout:${lock.id}`,
      metadata: {
        releaseSource: 'verification_timeout',
      },
    });
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async expireWalletLocks() {
    const now = new Date();
    const expiredLocks = await this.walletLockRepo.find({
      where: { status: WalletLockStatus.ACTIVE },
      order: { createdAt: 'ASC' },
      take: 200,
    });

    for (const lock of expiredLocks) {
      if (!lock.expiresAt || lock.expiresAt > now) continue;

      try {
        const wallet = await this.walletTransactionRepo.manager.transaction(async (manager) => {
          const persistedLock = await manager.findOne(WalletLock, {
            where: { id: lock.id },
            lock: { mode: 'pessimistic_write' },
          });
          if (!persistedLock || persistedLock.status !== WalletLockStatus.ACTIVE) return null;

          const walletRow = await this.findOrCreateWalletWithManager(manager, persistedLock.userId);
          walletRow.lockedBalanceUsdCents = Number(walletRow.lockedBalanceUsdCents) - Number(persistedLock.amountUsdCents);
          await manager.save(walletRow);

          persistedLock.status = WalletLockStatus.EXPIRED;
          persistedLock.releasedAt = now;
          await manager.save(persistedLock);

          await manager.save(
            manager.create(WalletTransaction, {
              userId: persistedLock.userId,
              type: TransactionType.WALLET_RELEASE,
              status: TransactionStatus.COMPLETED,
              amountUsdCents: 0,
              balanceBeforeUsdCents: Number(walletRow.balanceUsdCents),
              balanceAfterUsdCents: Number(walletRow.balanceUsdCents),
              description: `Released expired ${persistedLock.reason}`,
              referenceId: `wallet-lock-expiration:${persistedLock.id}`,
              metadata: {
                lockId: persistedLock.id,
                releasedAmountUsdCents: Number(persistedLock.amountUsdCents),
                releaseSource: 'wallet_lock_expiration',
              },
            }),
          );

          return walletRow;
        });

        if (lock.relatedProduct === 'verify_hub' && lock.relatedEntityId) {
          await this.phoneNumberRepo.update(
            { id: lock.relatedEntityId, userId: lock.userId, status: NumberStatus.ACTIVE },
            {
              status: NumberStatus.EXPIRED,
              metadata: {
                ...(lock.metadata ?? {}),
                verificationTimeoutReleasedAt: now.toISOString(),
              },
            },
          );
        }

        if (wallet) {
          await this.emitBalanceUpdate(lock.userId);
        }
      } catch (error) {
        this.logger.warn(`Failed to expire wallet lock ${lock.id}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async expireCreditLocks() {
    const now = new Date();
    const expiredLocks = await this.creditLockRepo.find({
      where: { status: CreditLockStatus.ACTIVE },
      order: { createdAt: 'ASC' },
      take: 200,
    });

    for (const lock of expiredLocks) {
      if (!lock.expiresAt || lock.expiresAt > now) continue;

      try {
        const account = await this.creditTransactionRepo.manager.transaction(async (manager) => {
          const persistedLock = await manager.findOne(CreditLock, {
            where: { id: lock.id },
            lock: { mode: 'pessimistic_write' },
          });
          if (!persistedLock || persistedLock.status !== CreditLockStatus.ACTIVE) return null;

          const accountRow = await this.findOrCreateCreditAccountWithManager(manager, persistedLock.userId);
          accountRow.lockedCreditBalance = Number(accountRow.lockedCreditBalance) - Number(persistedLock.creditsAmount);
          await manager.save(accountRow);

          persistedLock.status = CreditLockStatus.EXPIRED;
          persistedLock.releasedAt = now;
          await manager.save(persistedLock);

          await manager.save(
            manager.create(CreditTransaction, {
              userId: persistedLock.userId,
              type: CreditTransactionType.RELEASE,
              creditsAmount: Number(persistedLock.creditsAmount),
              usdValueCents: Number(persistedLock.creditsAmount),
              relatedProduct: persistedLock.relatedProduct ?? null,
              relatedEntityId: persistedLock.relatedEntityId ?? persistedLock.id,
              description: `Released expired ${persistedLock.reason}`,
              status: CreditTransactionStatus.COMPLETED,
              idempotencyKey: `credit-lock-expiration:${persistedLock.id}`,
              metadata: {
                lockId: persistedLock.id,
                releaseSource: 'credit_lock_expiration',
              },
            }),
          );

          return accountRow;
        });

        if (lock.relatedProduct === 'verify_hub' && lock.relatedEntityId) {
          await this.phoneNumberRepo.update(
            { id: lock.relatedEntityId, userId: lock.userId, status: NumberStatus.ACTIVE },
            {
              status: NumberStatus.EXPIRED,
              metadata: {
                ...(lock.metadata ?? {}),
                verificationTimeoutReleasedAt: now.toISOString(),
              },
            },
          );
        }

        if (account) {
          await this.emitBalanceUpdate(lock.userId);
        }
      } catch (error) {
        this.logger.warn(`Failed to expire credit lock ${lock.id}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  private async purchaseSummary(userId: string, existing: CreditTransaction) {
    const [walletBalance, account] = await Promise.all([
      this.usersService.getWalletBalance(userId),
      this.ensureCreditAccount(userId),
    ]);

    return {
      success: true,
      package: null,
      wallet: {
        balanceUsdCents: walletBalance.balanceUsdCents,
        lockedBalanceUsdCents: walletBalance.lockedBalanceUsdCents,
        availableUsdCents: walletBalance.balanceUsdCents - walletBalance.lockedBalanceUsdCents,
      },
      credits: this.toCreditAccountView(account),
      transactionId: existing.id,
    };
  }

  private async resolvePricingRule(input: CreditQuoteInput) {
    const rules = await this.pricingRuleRepo.find({
      where: { product: input.product, isActive: true },
      order: { createdAt: 'ASC' },
    });

    let best: CreditPricingRule | null = null;
    let bestScore = -1;

    for (const rule of rules) {
      let score = 0;

      if (rule.countryCode) {
        if (rule.countryCode !== input.countryCode?.toUpperCase()) continue;
        score += 4;
      }
      if (rule.provider) {
        if (rule.provider !== input.provider) continue;
        score += 3;
      }
      if (rule.serviceCode) {
        if (rule.serviceCode !== input.serviceCode) continue;
        score += 2;
      }
      if (rule.routeQuality) {
        if (rule.routeQuality !== input.routeQuality) continue;
        score += 1;
      }

      if (score > bestScore) {
        best = rule;
        bestScore = score;
      }
    }

    return best;
  }

  private resolveProviderCostUsdCents(input: CreditQuoteInput, rule: CreditPricingRule | null) {
    const explicit = Number(input.providerCostUsdCents ?? input.basePriceUsdCents);
    if (Number.isFinite(explicit) && explicit > 0) {
      return Math.round(explicit);
    }

    const configured = Number(rule?.providerCostUsdCents ?? 0);
    if (configured > 0) {
      return configured;
    }

    switch (input.product) {
      case 'verify_hub':
        return 99;
      case 'rentals':
        return getNumberProductBasePriceUsdCents(
          input.countryCode || 'US',
          input.numberType ?? NumberType.BURNER,
          input.durationDays,
        );
      case 'esim_store':
        return this.configuredUsdCents('ESIM_ORDER_PRICE_USD_CENTS', 999);
      case 'proxy_store': {
        const base = this.configuredUsdCents('PROXY_ORDER_DAILY_PRICE_USD_CENTS', 199);
        return base * Math.max(1, Math.round(Number(input.durationDays ?? 30)));
      }
      case 'secure_tunnel':
      case 'dedicated_ip':
        return this.configuredUsdCents('VPN_SESSION_PRICE_USD_CENTS', 499);
      case 'messenger_calls':
        return this.configuredUsdCents('BP_CALL_PRICE_USD_CENTS_PER_MINUTE', 99);
      default:
        return 99;
    }
  }

  private configuredUsdCents(envName: string, fallback: number) {
    const parsed = Number(this.configService.get<string>(envName));
    return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : fallback;
  }

  private normalizedMultiplier(value: number) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  }

  private async emitBalanceUpdate(userId: string) {
    const balance = await this.getBalance(userId);
    this.eventsGateway.emitToUser(userId, 'billing.balance.updated', balance);
  }

  private async ensureCreditAccount(userId: string) {
    const existing = await this.creditAccountRepo.findOne({ where: { userId } });
    if (existing) return existing;

    return this.creditAccountRepo.save(this.creditAccountRepo.create({
      userId,
      creditBalance: 0,
      lockedCreditBalance: 0,
      lifetimeCreditsPurchased: 0,
      lifetimeCreditsSpent: 0,
    }));
  }

  private async findOrCreateWallet(userId: string) {
    const existing = await this.walletRepo.findOne({ where: { userId } });
    if (existing) return existing;

    return this.walletRepo.save(this.walletRepo.create({
      userId,
      balanceUsdCents: 0,
      lockedBalanceUsdCents: 0,
    }));
  }

  private async findOrCreateCreditAccountWithManager(manager: EntityManager, userId: string) {
    const existing = await manager.findOne(CreditAccount, {
      where: { userId },
      lock: { mode: 'pessimistic_write' },
    });
    if (existing) return existing;

    const next = manager.create(CreditAccount, {
      userId,
      creditBalance: 0,
      lockedCreditBalance: 0,
      lifetimeCreditsPurchased: 0,
      lifetimeCreditsSpent: 0,
    });
    return manager.save(next);
  }

  private async findOrCreateWalletWithManager(manager: EntityManager, userId: string) {
    const existing = await manager.findOne(Wallet, {
      where: { userId },
      lock: { mode: 'pessimistic_write' },
    });
    if (existing) return existing;

    const next = manager.create(Wallet, {
      userId,
      balanceUsdCents: 0,
      lockedBalanceUsdCents: 0,
    });
    return manager.save(next);
  }

  private async syncUserWalletMirror(manager: EntityManager, userId: string, balanceUsdCents: number) {
    await manager
      .createQueryBuilder()
      .update('users')
      .set({ wallet_balance_usd_cents: balanceUsdCents })
      .where('id = :userId', { userId })
      .execute();
  }

  private async findWalletTransactionByReference(userId: string, referenceId: string, type?: TransactionType) {
    if (!referenceId?.trim()) return null;

    const query = this.walletTransactionRepo.createQueryBuilder('tx')
      .where('tx.userId = :userId', { userId })
      .andWhere('tx.referenceId = :referenceId', { referenceId: referenceId.trim() })
      .orderBy('tx.createdAt', 'DESC');

    if (type) {
      query.andWhere('tx.type = :type', { type });
    }

    return query.getOne();
  }

  private async findPackageWithManager(manager: EntityManager, packageId: string) {
    const pkg = await manager.findOne(CreditPackage, {
      where: { id: packageId, isActive: true },
      lock: { mode: 'pessimistic_read' },
    });
    if (pkg) {
      pkg.totalCredits = calculatePackageTotalCredits({
        baseCredits: Number(pkg.baseCredits),
        bonusCredits: Number(pkg.bonusCredits),
      });
      return pkg;
    }

    const fallback = DEFAULT_CREDIT_PACKAGES.find((item) => item.id === packageId);
    if (!fallback) {
      throw new NotFoundException('Credit package not found');
    }

    return manager.create(CreditPackage, {
      ...fallback,
      totalCredits: calculatePackageTotalCredits(fallback),
      isActive: true,
    });
  }

  private toWalletView(wallet: Wallet) {
    const presentation = buildWalletPresentation(Number(wallet.balanceUsdCents), this.configService);
    return {
      balanceUsdCents: presentation.walletBalanceUsdCents,
      lockedBalanceUsdCents: Number(wallet.lockedBalanceUsdCents ?? 0),
      availableUsdCents: presentation.walletBalanceUsdCents - Number(wallet.lockedBalanceUsdCents ?? 0),
      localDisplay: {
        currency: null,
        amountUsdCents: null,
        fxRateNgnPerUsd: null,
      },
    };
  }

  private toWalletTransactionView(item: WalletTransaction) {
    return {
      id: item.id,
      type: item.type,
      status: item.status,
      amountUsdCents: Number(item.amountUsdCents ?? 0),
      balanceBeforeUsdCents: Number(item.balanceBeforeUsdCents ?? 0),
      balanceAfterUsdCents: Number(item.balanceAfterUsdCents ?? 0),
      description: item.description ?? null,
      referenceId: item.referenceId ?? null,
      externalReference: item.externalReference ?? null,
      gateway: item.gateway ?? null,
      metadata: item.metadata ?? {},
      createdAt: item.createdAt?.toISOString() ?? null,
    };
  }

  private toWalletLockView(lock: WalletLock) {
    return {
      id: lock.id,
      amountUsdCents: Number(lock.amountUsdCents),
      reason: lock.reason,
      relatedProduct: lock.relatedProduct ?? null,
      relatedEntityId: lock.relatedEntityId ?? null,
      expiresAt: lock.expiresAt?.toISOString() ?? null,
      status: lock.status,
      idempotencyKey: lock.idempotencyKey ?? null,
      metadata: lock.metadata ?? {},
      createdAt: lock.createdAt?.toISOString() ?? null,
      releasedAt: lock.releasedAt?.toISOString() ?? null,
    };
  }

  private toCreditAccountView(account: CreditAccount) {
    return {
      balance: Number(account.creditBalance),
      lockedBalance: Number(account.lockedCreditBalance),
      availableBalance: Number(account.creditBalance) - Number(account.lockedCreditBalance),
      equivalentUsdCents: Number(account.creditBalance),
      lifetimePurchased: Number(account.lifetimeCreditsPurchased),
      lifetimeSpent: Number(account.lifetimeCreditsSpent),
    };
  }

  private toPackageView(pkg: CreditPackage) {
    const totalCredits = calculatePackageTotalCredits({
      baseCredits: Number(pkg.baseCredits),
      bonusCredits: Number(pkg.bonusCredits),
    });

    return {
      id: pkg.id,
      name: pkg.name,
      usdPriceCents: Number(pkg.usdPriceCents),
      baseCredits: Number(pkg.baseCredits),
      bonusCredits: Number(pkg.bonusCredits),
      totalCredits,
      isActive: pkg.isActive,
      sortOrder: Number(pkg.sortOrder ?? 0),
    };
  }

  private toCreditTransactionView(item: CreditTransaction) {
    return {
      id: item.id,
      type: item.type,
      creditsAmount: Number(item.creditsAmount),
      usdValueCents: Number(item.usdValueCents),
      relatedProduct: item.relatedProduct ?? null,
      relatedEntityId: item.relatedEntityId ?? null,
      description: item.description ?? null,
      status: item.status,
      idempotencyKey: item.idempotencyKey ?? null,
      metadata: item.metadata ?? {},
      createdAt: item.createdAt?.toISOString() ?? null,
    };
  }

  private toCreditLockView(lock: CreditLock) {
    return {
      id: lock.id,
      creditsAmount: Number(lock.creditsAmount),
      reason: lock.reason,
      relatedProduct: lock.relatedProduct ?? null,
      relatedEntityId: lock.relatedEntityId ?? null,
      expiresAt: lock.expiresAt?.toISOString() ?? null,
      status: lock.status,
      metadata: lock.metadata ?? {},
      createdAt: lock.createdAt?.toISOString() ?? null,
      releasedAt: lock.releasedAt?.toISOString() ?? null,
    };
  }

  private toPricingRuleView(rule: CreditPricingRule) {
    return {
      id: rule.id,
      product: rule.product,
      countryCode: rule.countryCode ?? null,
      provider: rule.provider ?? null,
      serviceCode: rule.serviceCode ?? null,
      routeQuality: rule.routeQuality ?? null,
      providerCostUsdCents: Number(rule.providerCostUsdCents),
      platformMarginUsdCents: Number(rule.platformMarginUsdCents),
      riskMarginUsdCents: Number(rule.riskMarginUsdCents),
      countryMultiplier: Number(rule.countryMultiplier),
      routeQualityMultiplier: Number(rule.routeQualityMultiplier),
      isActive: rule.isActive,
      metadata: rule.metadata ?? {},
      createdAt: rule.createdAt?.toISOString() ?? null,
      updatedAt: rule.updatedAt?.toISOString() ?? null,
    };
  }
}
