/**
 * Burner Point payment service.
 *
 * Client apps only create Burner Point payment sessions. Gateway calls,
 * webhook verification, reconciliation, wallet updates, number assignment,
 * and subscription activation stay on the API.
 */
import {
  Injectable,
  BadRequestException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { createHmac, timingSafeEqual } from 'crypto';
import axios from 'axios';
import { QueryFailedError } from 'typeorm';
import {
  PaymentSession,
  WalletTransaction,
  PaymentGateway,
  TransactionType,
  TransactionStatus,
  CreditPackage,
  WebhookDedup,
  SubscriptionPlan,
  UserSubscription,
} from '../../database/entities/extended-entities';
import { User } from '../../database/entities/user.entity';
import { NumberType } from '../../database/entities/phone-number.entity';
import { UsersService } from '../users/users.service';
import { NumbersService } from '../numbers/numbers.service';
import { resolveApiUrl, resolveConfiguredEnv } from '../../config/runtime-env';

export enum PaymentType {
  CREDITS = 'credits',
  RENTAL = 'rental',
  SUBSCRIPTION = 'subscription',
}

type ClientPlatform = 'web' | 'mobile';
type ChargeCurrency = 'NGN' | 'USD';

interface InitializePaymentOptions {
  planId?: string;
  phoneNumber?: string;
  countryCode?: string;
  numberType?: NumberType;
}

interface PricingResolution {
  amountMinor: number;
  currency: ChargeCurrency;
  walletCreditKobo: number;
  walletEquivalentKobo: number;
  productLabel: string;
  metadata: Record<string, unknown>;
}

interface ReconciliationCheck {
  amountMinor?: number;
  currency?: string;
}

const USD_CENTS = {
  verification: 99,
  rental: 599,
  subscription: 1599,
};

const PADDLE_CONFIG = {
  API_URL: 'https://api.paddle.com',
  SANDBOX_API_URL: 'https://sandbox-api.paddle.com',
  PRICE_VERIFICATION: 'PADDLE_PRICE_VERIFICATION',
  PRICE_RENTAL: 'PADDLE_PRICE_RENTAL',
  PRICE_SUB_MONTHLY: 'PADDLE_PRICE_SUB_MONTHLY',
};

const CORE_WEB_GATEWAYS = [
  PaymentGateway.PAYSTACK,
  PaymentGateway.PADDLE,
  PaymentGateway.NOWPAYMENTS,
];

const DEFERRED_GATEWAYS = [
  PaymentGateway.FLUTTERWAVE,
  PaymentGateway.SQUAD,
  PaymentGateway.KORAPAY,
  PaymentGateway.OPAY,
];

const DEFAULT_USD_TO_NGN_RATE = 1600;
const PAYMENT_SESSION_TTL_MINUTES = 60;

const DEFAULT_CREDIT_PACKAGES = [
  {
    id: 'starter',
    name: 'Starter Credits',
    amountKobo: 160000,
    bonusKobo: 0,
    priceKobo: 160000,
    availableGateways: ['paystack', 'nowpayments'],
    isFeatured: false,
  },
  {
    id: 'growth',
    name: 'Growth Credits',
    amountKobo: 800000,
    bonusKobo: 80000,
    priceKobo: 800000,
    availableGateways: ['paystack', 'nowpayments'],
    isFeatured: true,
  },
  {
    id: 'scale',
    name: 'Scale Credits',
    amountKobo: 1600000,
    bonusKobo: 240000,
    priceKobo: 1600000,
    availableGateways: ['paystack', 'nowpayments'],
    isFeatured: false,
  },
];

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(PaymentSession)
    private sessionRepo: Repository<PaymentSession>,
    @InjectRepository(WalletTransaction)
    private txRepo: Repository<WalletTransaction>,
    @InjectRepository(CreditPackage)
    private packageRepo: Repository<CreditPackage>,
    @InjectRepository(WebhookDedup)
    private webhookDedupRepo: Repository<WebhookDedup>,
    @InjectRepository(SubscriptionPlan)
    private planRepo: Repository<SubscriptionPlan>,
    @InjectRepository(UserSubscription)
    private subscriptionRepo: Repository<UserSubscription>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private configService: ConfigService,
    private usersService: UsersService,
    private numbersService: NumbersService,
  ) {}

  async getCreditPackages() {
    const packages = await this.packageRepo.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC' },
    });

    return packages.length ? packages : DEFAULT_CREDIT_PACKAGES;
  }

  async initializePayment(
    userId: string,
    paymentType: PaymentType = PaymentType.CREDITS,
    gateway: PaymentGateway = PaymentGateway.PAYSTACK,
    rentalDays?: number,
    packageId?: string,
    clientPlatform: ClientPlatform = 'web',
    options: InitializePaymentOptions = {},
  ) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    this.assertGatewayAllowed(gateway, clientPlatform);
    this.assertPaymentInput(paymentType, rentalDays, options);

    const pricing = await this.resolvePricing(paymentType, gateway, packageId, options.planId);
    const reference = `BP-${paymentType.toUpperCase()}-${Date.now()}-${uuidv4().slice(0, 8).toUpperCase()}`;

    let checkoutUrl: string;
    let gatewayReference: string;

    switch (gateway) {
      case PaymentGateway.PADDLE:
        ({ checkoutUrl, gatewayReference } = await this.initPaddlePayment(
          user,
          paymentType,
          reference,
          rentalDays,
          pricing,
          options,
        ));
        break;
      case PaymentGateway.NOWPAYMENTS:
        ({ checkoutUrl, gatewayReference } = await this.initNowPayments(
          paymentType,
          reference,
          rentalDays,
          pricing,
        ));
        break;
      case PaymentGateway.PAYSTACK:
        ({ checkoutUrl, gatewayReference } = await this.initPaystack(
          user.email,
          pricing,
          reference,
          paymentType,
          options,
        ));
        break;
      case PaymentGateway.FLUTTERWAVE:
        ({ checkoutUrl, gatewayReference } = await this.initFlutterwave(user, pricing.amountMinor, reference));
        break;
      case PaymentGateway.SQUAD:
        ({ checkoutUrl, gatewayReference } = await this.initSquad(user.email, pricing.amountMinor, reference));
        break;
      case PaymentGateway.KORAPAY:
        ({ checkoutUrl, gatewayReference } = await this.initKorapay(user.email, pricing.amountMinor, reference));
        break;
      case PaymentGateway.OPAY:
        ({ checkoutUrl, gatewayReference } = await this.initOpay(user.email, pricing.amountMinor, reference));
        break;
      default:
        throw new BadRequestException(`Gateway ${gateway} is not implemented`);
    }

    const expiresAt = new Date(Date.now() + PAYMENT_SESSION_TTL_MINUTES * 60 * 1000);
    const session = this.sessionRepo.create({
      reference,
      userId,
      gateway,
      amountKobo: pricing.amountMinor,
      currency: pricing.currency,
      status: 'pending',
      gatewayReference,
      checkoutUrl,
      expiresAt,
      metadata: {
        paymentType,
        packageId: packageId || null,
        planId: options.planId || null,
        rentalDays: rentalDays || null,
        clientPlatform,
        productLabel: pricing.productLabel,
        walletCreditKobo: pricing.walletCreditKobo,
        walletEquivalentKobo: pricing.walletEquivalentKobo,
        phoneNumber: options.phoneNumber || null,
        countryCode: options.countryCode || null,
        numberType: options.numberType || null,
        fulfillmentStatus: 'awaiting_webhook',
        ...pricing.metadata,
      },
    });

    await this.sessionRepo.save(session);

    return {
      checkoutUrl,
      reference,
      amount: pricing.amountMinor,
      currency: pricing.currency,
      gateway,
      paymentType,
      expiresAt: expiresAt.toISOString(),
    };
  }

  async getTransactionHistory(userId: string) {
    return this.txRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async handlePaddleWebhook(rawBody: Buffer | undefined, signature: string) {
    if (!rawBody || !this.verifyPaddleSignature(signature, rawBody)) {
      throw new BadRequestException('Invalid Paddle webhook signature');
    }

    const payload = JSON.parse(rawBody.toString());
    const eventType = String(payload.event_type ?? 'unknown');
    const eventId = payload.event_id ?? `${eventType}:${payload.data?.id ?? Date.now()}`;
    const isFresh = await this.recordWebhookOnce(`paddle:${eventId}`, 'paddle', eventType, payload);
    if (!isFresh) return { received: true, duplicate: true };

    if (eventType === 'transaction.completed') {
      const transaction = payload.data ?? {};
      const reference = transaction.custom_data?.reference;
      if (reference) {
        await this.fulfillPayment(reference, transaction.id, transaction, {
          amountMinor: this.extractPaddleAmountMinor(transaction),
          currency: transaction.currency_code ?? transaction.details?.currency_code,
        });
      }
    }

    if (eventType === 'subscription.created' || eventType === 'subscription.updated') {
      await this.syncSubscriptionEvent(payload.data ?? {});
    }

    if (eventType === 'subscription.canceled') {
      await this.cancelSubscriptionEvent(payload.data ?? {});
    }

    return { received: true };
  }

  async handleNowPaymentsWebhook(
    payload: Record<string, unknown>,
    headers: Record<string, string> = {},
    rawBody?: Buffer,
  ) {
    if (!this.verifyNowPaymentsSignature(payload, headers, rawBody)) {
      throw new BadRequestException('Invalid NOWPayments IPN signature');
    }

    const status = String(payload.payment_status ?? 'unknown');
    const reference = String(payload.order_id ?? '');
    const eventId = String(payload.payment_id ?? `${reference}:${status}`);
    const isFresh = await this.recordWebhookOnce(
      `nowpayments:${eventId}`,
      'nowpayments',
      status,
      payload,
    );
    if (!isFresh) return { received: true, duplicate: true };

    if (['finished', 'confirmed'].includes(status) && reference) {
      await this.fulfillPayment(reference, String(payload.payment_id ?? ''), payload, {
        amountMinor: this.decimalToMinor(payload.price_amount),
        currency: String(payload.price_currency ?? 'usd').toUpperCase(),
      });
    }

    return { received: true };
  }

  async handleWebhook(gateway: PaymentGateway, body: any, headers: Record<string, string>) {
    let reference = '';
    let gatewayReference = '';
    let isSuccess = false;
    let eventType = 'unknown';
    let eventId = '';
    let reconciliation: ReconciliationCheck = {};

    switch (gateway) {
      case PaymentGateway.PAYSTACK: {
        this.assertPaystackSignature(body, headers);
        const event = body as { event: string; data: { reference: string; status: string; amount?: number; currency?: string; id?: number } };
        eventType = event.event;
        eventId = `${gateway}:${event.event}:${event.data?.reference}`;
        if (event.event !== 'charge.success') return { received: true };
        reference = event.data.reference;
        gatewayReference = String(event.data.id ?? event.data.reference);
        isSuccess = event.data.status === 'success';
        reconciliation = { amountMinor: Number(event.data.amount), currency: event.data.currency };
        break;
      }
      case PaymentGateway.FLUTTERWAVE: {
        const hash = headers['verif-hash'] || headers['x-flutterwave-signature'];
        const expectedHash = resolveConfiguredEnv('FLUTTERWAVE_WEBHOOK_HASH', this.configService);
        if (!expectedHash || hash !== expectedHash) throw new BadRequestException('Invalid Flutterwave signature');
        const event = body as { event: string; data: { tx_ref: string; status: string; amount?: number; currency?: string; id?: number } };
        eventType = event.event;
        eventId = `${gateway}:${event.event}:${event.data?.tx_ref}`;
        if (event.event !== 'charge.completed') return { received: true };
        reference = event.data.tx_ref;
        gatewayReference = String(event.data.id ?? reference);
        isSuccess = event.data.status === 'successful';
        reconciliation = { amountMinor: this.decimalToMinor(event.data.amount), currency: event.data.currency };
        break;
      }
      case PaymentGateway.SQUAD: {
        this.assertSquadSignature(body, headers);
        const event = body as { Event: string; Body: { transaction_ref: string; success: boolean; amount?: number } };
        eventType = event.Event;
        eventId = `${gateway}:${event.Event}:${event.Body?.transaction_ref}`;
        if (event.Event !== 'charge_successful') return { received: true };
        reference = event.Body.transaction_ref;
        gatewayReference = reference;
        isSuccess = event.Body.success;
        reconciliation = { amountMinor: Number(event.Body.amount), currency: 'NGN' };
        break;
      }
      case PaymentGateway.KORAPAY: {
        this.assertKorapaySignature(body, headers);
        const event = body as { event: string; data: { reference: string; status: string; amount?: number; currency?: string } };
        eventType = event.event;
        eventId = `${gateway}:${event.event}:${event.data?.reference}`;
        if (event.event !== 'charge.success') return { received: true };
        reference = event.data.reference;
        gatewayReference = reference;
        isSuccess = event.data.status === 'success';
        reconciliation = { amountMinor: this.decimalToMinor(event.data.amount), currency: event.data.currency };
        break;
      }
      case PaymentGateway.OPAY: {
        this.assertOpaySignature(body, headers);
        const event = body as { eventType: string; data: { reference: string; status: string; amount?: { total?: number } | number; currency?: string } };
        eventType = event.eventType;
        eventId = `${gateway}:${event.eventType}:${event.data?.reference}`;
        if (event.eventType !== 'charge.success') return { received: true };
        reference = event.data.reference;
        gatewayReference = reference;
        isSuccess = event.data.status === 'successful';
        reconciliation = {
          amountMinor: typeof event.data.amount === 'object' ? Number(event.data.amount?.total) : Number(event.data.amount),
          currency: event.data.currency,
        };
        break;
      }
      default:
        throw new BadRequestException(`Webhook not implemented for ${gateway}`);
    }

    const isFresh = await this.recordWebhookOnce(eventId || `${gateway}:${reference}`, gateway, eventType, body);
    if (!isFresh) return { received: true, duplicate: true };

    if (reference && isSuccess) {
      await this.fulfillPayment(reference, gatewayReference, body, reconciliation);
    }

    return { received: true };
  }

  async fulfillPayment(
    reference: string,
    gatewayReference?: string,
    gatewayResponse: Record<string, unknown> = {},
    reconciliation: ReconciliationCheck = {},
  ) {
    const session = await this.sessionRepo.findOne({ where: { reference } });
    if (!session) {
      this.logger.warn(`Payment session not found for reference ${reference}`);
      return;
    }

    if (session.status === 'completed') {
      this.logger.debug(`Payment ${reference} already fulfilled`);
      return;
    }

    if (!this.isReconciled(session, reconciliation)) {
      await this.sessionRepo.update(session.id, {
        status: 'reconciliation_failed',
        gatewayReference: gatewayReference ?? session.gatewayReference,
        gatewayResponse,
        metadata: {
          ...(session.metadata || {}),
          fulfillmentStatus: 'reconciliation_failed',
          reconciliation,
        },
      });
      this.logger.error(`Payment ${reference} failed reconciliation`);
      return;
    }

    const claim = await this.sessionRepo.update(
      { id: session.id, status: 'pending' },
      {
        status: 'processing',
        gatewayReference: gatewayReference ?? session.gatewayReference,
        gatewayResponse,
        paidAt: new Date(),
        metadata: {
          ...(session.metadata || {}),
          fulfillmentStatus: 'processing',
        },
      },
    );

    if (!claim.affected) {
      this.logger.debug(`Payment ${reference} is already processing with status ${session.status}`);
      return;
    }

    const processingSession = await this.sessionRepo.findOne({ where: { id: session.id } });
    if (!processingSession) return;

    try {
      await this.applyPaymentEffects(processingSession);
      await this.sessionRepo.update(processingSession.id, {
        status: 'completed',
        gatewayReference: gatewayReference ?? processingSession.gatewayReference,
        gatewayResponse,
        paidAt: processingSession.paidAt ?? new Date(),
        metadata: {
          ...(processingSession.metadata || {}),
          fulfillmentStatus: 'fulfilled',
          fulfilledAt: new Date().toISOString(),
        },
      });
      this.logger.log(`Payment fulfilled: ${reference} via ${processingSession.gateway}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.sessionRepo.update(processingSession.id, {
        status: 'paid_pending_fulfillment',
        gatewayReference: gatewayReference ?? processingSession.gatewayReference,
        gatewayResponse,
        paidAt: processingSession.paidAt ?? new Date(),
        metadata: {
          ...(processingSession.metadata || {}),
          fulfillmentStatus: 'requires_operator_review',
          fulfillmentError: message,
        },
      });
      this.logger.error(`Payment ${reference} paid but fulfillment needs review: ${message}`);
    }
  }

  private async applyPaymentEffects(session: PaymentSession) {
    const paymentType = session.metadata?.paymentType as PaymentType | undefined;

    switch (paymentType) {
      case PaymentType.CREDITS:
        await this.fulfillCredits(session);
        break;
      case PaymentType.RENTAL:
        await this.fulfillRental(session);
        break;
      case PaymentType.SUBSCRIPTION:
        await this.fulfillSubscription(session);
        break;
      default:
        throw new BadRequestException(`Unknown payment type for ${session.reference}`);
    }
  }

  private async fulfillCredits(session: PaymentSession) {
    const walletCreditKobo = Number(session.metadata?.walletCreditKobo ?? session.metadata?.walletEquivalentKobo ?? 0);
    if (walletCreditKobo <= 0) throw new BadRequestException('Credit amount is missing');

    const user = await this.userRepo.findOne({ where: { id: session.userId } });
    if (!user) throw new NotFoundException('User not found');

    const balanceBefore = Number(user.walletBalanceKobo);
    await this.usersService.creditWallet(session.userId, walletCreditKobo);

    await this.recordTransaction(session, {
      type: TransactionType.CREDIT_PURCHASE,
      amountKobo: walletCreditKobo,
      balanceBeforeKobo: balanceBefore,
      balanceAfterKobo: balanceBefore + walletCreditKobo,
      description: `Verification credits via ${session.gateway}`,
    });
  }

  private async fulfillRental(session: PaymentSession) {
    const metadata = session.metadata || {};
    const user = await this.userRepo.findOne({ where: { id: session.userId } });
    if (!user) throw new NotFoundException('User not found');

    const amountKobo = Number(metadata.walletEquivalentKobo ?? 0);
    const phoneNumber = typeof metadata.phoneNumber === 'string' ? metadata.phoneNumber : '';
    const countryCode = typeof metadata.countryCode === 'string' ? metadata.countryCode : '';
    const rentalDays = Number(metadata.rentalDays ?? 7);
    const numberType = metadata.numberType === NumberType.RENTAL ? NumberType.RENTAL : NumberType.BURNER;

    if (phoneNumber && countryCode) {
      await this.numbersService.assignPaidNumber(session.userId, phoneNumber, numberType, countryCode, {
        durationDays: rentalDays,
        paymentReference: session.reference,
        priceKobo: amountKobo,
        autoRenew: numberType === NumberType.RENTAL,
      });
      return;
    }

    const balance = Number(user.walletBalanceKobo);
    await this.recordTransaction(session, {
      type: TransactionType.NUMBER_PURCHASE,
      amountKobo,
      balanceBeforeKobo: balance,
      balanceAfterKobo: balance,
      description: 'Paid rental entitlement awaiting number selection',
      metadata: {
        assignmentStatus: 'awaiting_number_selection',
        rentalDays,
      },
    });
  }

  private async fulfillSubscription(session: PaymentSession) {
    const metadata = session.metadata || {};
    const plan = await this.resolveSubscriptionPlan(String(metadata.planId || ''));
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const existing = await this.subscriptionRepo.findOne({
      where: { userId: session.userId, status: 'active' },
    });

    const subscriptionPayload = {
      userId: session.userId,
      planId: plan.id,
      status: 'active',
      billingCycle: 'monthly',
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      metadata: {
        gateway: session.gateway,
        paymentReference: session.reference,
        gatewayReference: session.gatewayReference,
        source: 'payment_webhook',
      },
    };

    if (existing) await this.subscriptionRepo.update(existing.id, subscriptionPayload);
    else await this.subscriptionRepo.save(this.subscriptionRepo.create(subscriptionPayload));

    const user = await this.userRepo.findOne({ where: { id: session.userId } });
    const balance = Number(user?.walletBalanceKobo ?? 0);
    await this.recordTransaction(session, {
      type: TransactionType.SUBSCRIPTION_PURCHASE,
      amountKobo: Number(metadata.walletEquivalentKobo ?? 0),
      balanceBeforeKobo: balance,
      balanceAfterKobo: balance,
      description: `${plan.name} monthly subscription activated`,
      metadata: {
        planId: plan.id,
        currentPeriodEnd: periodEnd.toISOString(),
      },
    });
  }

  private async recordTransaction(
    session: PaymentSession,
    input: {
      type: TransactionType;
      amountKobo: number;
      balanceBeforeKobo: number;
      balanceAfterKobo: number;
      description: string;
      metadata?: Record<string, unknown>;
    },
  ) {
    await this.txRepo.save(
      this.txRepo.create({
        userId: session.userId,
        type: input.type,
        status: TransactionStatus.COMPLETED,
        amountKobo: input.amountKobo,
        balanceBeforeKobo: input.balanceBeforeKobo,
        balanceAfterKobo: input.balanceAfterKobo,
        description: input.description,
        referenceId: session.id,
        externalReference: session.reference,
        gateway: session.gateway,
        metadata: {
          paymentReference: session.reference,
          chargeAmountMinor: session.amountKobo,
          chargeCurrency: session.currency,
          gatewayReference: session.gatewayReference,
          ...(input.metadata || {}),
        },
      }),
    );
  }

  private async resolvePricing(
    paymentType: PaymentType,
    gateway: PaymentGateway,
    packageId?: string,
    planId?: string,
  ): Promise<PricingResolution> {
    const currency = this.gatewayCurrency(gateway);

    if (paymentType === PaymentType.CREDITS) {
      if (packageId) {
        if (gateway === PaymentGateway.PADDLE) {
          throw new BadRequestException('Paddle credit packages need dedicated Paddle price IDs. Use Paystack or NOWPayments for package checkout.');
        }
        const creditPackage = await this.findCreditPackage(packageId);
        const walletCreditKobo = Number(creditPackage.amountKobo) + Number(creditPackage.bonusKobo || 0);
        const priceKobo = Number(creditPackage.priceKobo);
        return {
          amountMinor: currency === 'NGN' ? priceKobo : this.ngnKoboToUsdCents(priceKobo),
          currency,
          walletCreditKobo,
          walletEquivalentKobo: priceKobo,
          productLabel: creditPackage.name,
          metadata: { creditPackageName: creditPackage.name },
        };
      }

      const equivalentKobo = this.usdCentsToNgnKobo(USD_CENTS.verification);
      return {
        amountMinor: currency === 'NGN' ? equivalentKobo : USD_CENTS.verification,
        currency,
        walletCreditKobo: equivalentKobo,
        walletEquivalentKobo: equivalentKobo,
        productLabel: 'Verification credit',
        metadata: { unitPriceUsdCents: USD_CENTS.verification },
      };
    }

    if (paymentType === PaymentType.RENTAL) {
      const equivalentKobo = this.usdCentsToNgnKobo(USD_CENTS.rental);
      return {
        amountMinor: currency === 'NGN' ? equivalentKobo : USD_CENTS.rental,
        currency,
        walletCreditKobo: 0,
        walletEquivalentKobo: equivalentKobo,
        productLabel: 'Non-renewable rental',
        metadata: { unitPriceUsdCents: USD_CENTS.rental },
      };
    }

    const plan = planId ? await this.resolveSubscriptionPlan(planId) : await this.resolveSubscriptionPlan('');
    const equivalentKobo = Number(plan.priceKoboMonthly) || this.usdCentsToNgnKobo(USD_CENTS.subscription);
    return {
      amountMinor: currency === 'NGN' ? equivalentKobo : this.ngnKoboToUsdCents(equivalentKobo),
      currency,
      walletCreditKobo: 0,
      walletEquivalentKobo: equivalentKobo,
      productLabel: `${plan.name} monthly subscription`,
      metadata: {
        planId: plan.id,
        planSlug: plan.slug,
        unitPriceUsdCents: USD_CENTS.subscription,
      },
    };
  }

  private async findCreditPackage(packageId: string) {
    const creditPackage = await this.packageRepo.findOne({
      where: { id: packageId, isActive: true },
    });
    if (creditPackage) return creditPackage;

    const fallback = DEFAULT_CREDIT_PACKAGES.find((pkg) => pkg.id === packageId);
    if (fallback) return fallback;

    throw new NotFoundException('Credit package not found');
  }

  private async resolveSubscriptionPlan(planId: string) {
    if (planId) {
      const selected = await this.planRepo.findOne({ where: { id: planId, isActive: true } });
      if (selected) return selected;
    }

    const privacyMonthly = await this.planRepo.findOne({ where: { slug: 'privacy-monthly', isActive: true } });
    if (privacyMonthly) return privacyMonthly;

    const pro = await this.planRepo.findOne({ where: { slug: 'pro', isActive: true } });
    if (pro) return pro;

    throw new NotFoundException('Subscription plan not found');
  }

  private assertPaymentInput(paymentType: PaymentType, rentalDays?: number, options: InitializePaymentOptions = {}) {
    if (paymentType !== PaymentType.RENTAL) return;

    if (!rentalDays || rentalDays < 1 || rentalDays > 14) {
      throw new BadRequestException('Rental days must be between 1 and 14');
    }
    if (options.phoneNumber && !/^\+[1-9]\d{6,14}$/.test(options.phoneNumber.trim())) {
      throw new BadRequestException('Rental phoneNumber must be E.164, for example +14155550182');
    }
    if (options.countryCode && !['US', 'CA'].includes(options.countryCode.toUpperCase())) {
      throw new BadRequestException('Paid conversation rental assignment is available for US and Canada numbers');
    }
  }

  private assertGatewayAllowed(gateway: PaymentGateway, clientPlatform: ClientPlatform): void {
    if (clientPlatform === 'mobile' && this.configService.get('MOBILE_EXTERNAL_PAYMENTS_ENABLED') !== 'true') {
      throw new BadRequestException(
        'Mobile external checkout is disabled for store-policy safety. Complete purchases on web.',
      );
    }

    if (CORE_WEB_GATEWAYS.includes(gateway)) return;

    if (
      DEFERRED_GATEWAYS.includes(gateway) &&
      this.configService.get('SECONDARY_GATEWAYS_ENABLED') === 'true'
    ) {
      return;
    }

    throw new BadRequestException(`${gateway} is deferred until Paystack, Paddle, and NOWPayments are stable`);
  }

  private async initPaddlePayment(
    user: User,
    paymentType: PaymentType,
    reference: string,
    rentalDays: number | undefined,
    pricing: PricingResolution,
    options: InitializePaymentOptions,
  ) {
    const isSandbox = this.configService.get('PADDLE_SANDBOX') === 'true';
    const apiKey = this.configService.get('PADDLE_API_KEY');
    const baseUrl = isSandbox ? PADDLE_CONFIG.SANDBOX_API_URL : PADDLE_CONFIG.API_URL;
    if (!apiKey) throw new BadRequestException('Paddle is not configured');

    const priceId = this.getPaddlePriceId(paymentType);
    if (!priceId) throw new BadRequestException('Paddle price is not configured');

    const payload = {
      items: [{ price_id: priceId, quantity: 1 }],
      customer: {
        email: user.email,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
      },
      custom_data: {
        reference,
        paymentType,
        rentalDays: rentalDays || null,
        userId: user.id,
        planId: options.planId || null,
        productLabel: pricing.productLabel,
      },
      checkout: {
        url: `${this.getWebUrl()}/dashboard/payments/success?ref=${reference}`,
      },
    };

    try {
      const response = await axios.post(`${baseUrl}/transactions`, payload, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      return {
        checkoutUrl: response.data.data.checkout.url as string,
        gatewayReference: response.data.data.id as string,
      };
    } catch (error) {
      this.logger.error('Paddle payment initialization failed', this.safeErrorData(error));
      throw new BadRequestException('Failed to initialize Paddle payment');
    }
  }

  private async initNowPayments(
    paymentType: PaymentType,
    reference: string,
    rentalDays: number | undefined,
    pricing: PricingResolution,
  ) {
    const apiKey = this.configService.get('NOWPAYMENTS_API_KEY');
    if (!apiKey) throw new BadRequestException('NOWPayments is not configured');

    const payload = {
      price_amount: pricing.amountMinor / 100,
      price_currency: 'usd',
      ipn_callback_url: `${this.getApiUrl()}/payments/webhook/nowpayments`,
      order_id: reference,
      order_description: `Burner Point ${paymentType}${rentalDays ? ` ${rentalDays} days` : ''}`,
      success_url: `${this.getWebUrl()}/dashboard/payments/success?ref=${reference}`,
      cancel_url: `${this.getWebUrl()}/dashboard/payments/cancel?ref=${reference}`,
    };

    try {
      const response = await axios.post('https://api.nowpayments.io/v1/invoice', payload, {
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
      });

      return {
        checkoutUrl: response.data.invoice_url as string,
        gatewayReference: String(response.data.id),
      };
    } catch (error) {
      this.logger.error('NOWPayments initialization failed', this.safeErrorData(error));
      throw new BadRequestException('Failed to initialize crypto payment');
    }
  }

  private async initPaystack(
    email: string,
    pricing: PricingResolution,
    reference: string,
    paymentType: PaymentType,
    options: InitializePaymentOptions,
  ) {
    const secretKey = this.configService.get('PAYSTACK_SECRET_KEY');
    if (!secretKey) throw new BadRequestException('Paystack is not configured');

    try {
      const res = await axios.post(
        'https://api.paystack.co/transaction/initialize',
        {
          email,
          amount: pricing.amountMinor,
          reference,
          callback_url: `${this.getWebUrl()}/dashboard/payments/success?ref=${reference}`,
          metadata: {
            paymentType,
            reference,
            productLabel: pricing.productLabel,
            planId: options.planId || null,
          },
        },
        { headers: { Authorization: `Bearer ${secretKey}` } },
      );

      return {
        checkoutUrl: res.data.data.authorization_url as string,
        gatewayReference: res.data.data.reference as string,
      };
    } catch (error) {
      this.logger.error('Paystack initialization failed', this.safeErrorData(error));
      throw new BadRequestException('Failed to initialize Paystack payment');
    }
  }

  private async initFlutterwave(user: User, amountKobo: number, reference: string) {
    const secret = this.configService.get('FLUTTERWAVE_SECRET_KEY');
    if (!secret) throw new BadRequestException('Flutterwave is not configured');

    const res = await axios.post(
      'https://api.flutterwave.com/v3/payments',
      {
        tx_ref: reference,
        amount: amountKobo / 100,
        currency: 'NGN',
        redirect_url: `${this.getWebUrl()}/dashboard/payments/success?ref=${reference}`,
        customer: {
          email: user.email,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
        },
        customizations: {
          title: 'Burner Point',
          logo: `${this.getWebUrl()}/assets/logo-mark.svg`,
        },
      },
      { headers: { Authorization: `Bearer ${secret}` } },
    );

    return { checkoutUrl: res.data.data.link as string, gatewayReference: reference };
  }

  private async initSquad(email: string, amountKobo: number, reference: string) {
    const secret = this.configService.get('SQUAD_SECRET_KEY');
    const baseUrl = this.configService.get('SQUAD_BASE_URL');
    if (!secret || !baseUrl) throw new BadRequestException('Squad is not configured');

    const res = await axios.post(
      `${baseUrl}/transaction/initiate`,
      {
        email,
        amount: amountKobo,
        currency: 'NGN',
        transaction_ref: reference,
        pass_charge: false,
        callback_url: `${this.getWebUrl()}/dashboard/payments/success?ref=${reference}`,
      },
      { headers: { Authorization: `Bearer ${secret}` } },
    );

    return {
      checkoutUrl: res.data.data.checkout_url as string,
      gatewayReference: res.data.data.transaction_ref as string,
    };
  }

  private async initKorapay(email: string, amountKobo: number, reference: string) {
    const secret = this.configService.get('KORAPAY_SECRET_KEY');
    if (!secret) throw new BadRequestException('Korapay is not configured');

    const res = await axios.post(
      'https://api.korapay.com/merchant/api/v1/charges/initialize',
      {
        reference,
        amount: amountKobo / 100,
        currency: 'NGN',
        redirect_url: `${this.getWebUrl()}/dashboard/payments/success?ref=${reference}`,
        customer: { email },
        notification_url: `${this.getApiUrl()}/payments/webhook/korapay`,
      },
      { headers: { Authorization: `Bearer ${secret}` } },
    );

    return {
      checkoutUrl: res.data.data.checkout_url as string,
      gatewayReference: res.data.data.reference as string,
    };
  }

  private async initOpay(email: string, amountKobo: number, reference: string) {
    const publicKey = this.configService.get('OPAY_PUBLIC_KEY');
    const secretKey = resolveConfiguredEnv('OPAY_SECRET_KEY', this.configService);
    const merchantId = this.configService.get('OPAY_MERCHANT_ID');
    if (!publicKey || !secretKey || !merchantId) throw new BadRequestException('OPay is not configured');

    const res = await axios.post(
      'https://api.opaycheckout.com/api/v1/international/cashier/create',
      {
        reference,
        amount: amountKobo.toString(),
        currency: 'NGN',
        returnUrl: `${this.getWebUrl()}/dashboard/payments/success?ref=${reference}`,
        userInfo: { userEmail: email },
        product: {
          name: 'Burner Point',
          description: 'Burner Point privacy telecom purchase',
        },
        callbackUrl: `${this.getApiUrl()}/payments/webhook/opay`,
      },
      {
        headers: {
          Authorization: `Bearer ${publicKey}:${secretKey}`,
          MerchantId: merchantId,
        },
      },
    );

    return {
      checkoutUrl: res.data.data.cashierUrl as string,
      gatewayReference: res.data.data.reference as string,
    };
  }

  private async recordWebhookOnce(
    eventId: string,
    source: string,
    eventType: string,
    payload: Record<string, unknown>,
  ): Promise<boolean> {
    try {
      await this.webhookDedupRepo.insert(
        this.webhookDedupRepo.create({
          eventId,
          source,
          eventType,
          payload,
          status: 'processed',
        }),
      );
      return true;
    } catch (error) {
      if (this.isUniqueConstraintViolation(error)) {
        this.logger.debug(`Duplicate webhook ignored: ${eventId}`);
        return false;
      }
      throw error;
    }
  }

  private isUniqueConstraintViolation(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) return false;
    const driverError = error.driverError as { code?: string; constraint?: string } | undefined;
    // Postgres unique violation code.
    return driverError?.code === '23505' || driverError?.constraint === 'webhook_dedup_event_id_key';
  }

  private verifyPaddleSignature(signature: string | undefined, rawBody: Buffer): boolean {
    const secret = this.configService.get<string>('PADDLE_WEBHOOK_SECRET');
    if (!secret || !signature) return false;

    const parts = Object.fromEntries(
      signature.split(';').map((part) => {
        const [key, ...value] = part.split('=');
        return [key.trim(), value.join('=').trim()];
      }),
    );
    const ts = parts.ts;
    const received = parts.h1;
    if (!ts || !received) return false;

    const expected = createHmac('sha256', secret)
      .update(`${ts}:${rawBody.toString()}`)
      .digest('hex');
    return this.safeCompare(received, expected, 'hex');
  }

  private verifyNowPaymentsSignature(
    payload: Record<string, unknown>,
    headers: Record<string, string>,
    rawBody?: Buffer,
  ): boolean {
    const secret = this.configService.get<string>('NOWPAYMENTS_IPN_SECRET');
    if (!secret) return false;

    const received = headers['x-nowpayments-sig'] || headers['X-NOWPAYMENTS-SIG'] || String(payload.signature ?? '');
    if (!received) return false;

    const { signature: _signature, ...payloadWithoutSignature } = payload;
    const sortedPayload = this.sortObject(payloadWithoutSignature);
    const candidates = [
      JSON.stringify(sortedPayload),
      JSON.stringify(payloadWithoutSignature),
      rawBody?.toString(),
    ].filter((value): value is string => Boolean(value));

    return candidates.some((candidate) => {
      const expected = createHmac('sha512', secret).update(candidate).digest('hex');
      return this.safeCompare(received, expected, 'hex');
    });
  }

  private assertPaystackSignature(body: Record<string, unknown>, headers: Record<string, string>) {
    const hash = headers['x-paystack-signature'];
    const secret = this.configService.get('PAYSTACK_SECRET_KEY');
    if (!hash || !secret) throw new BadRequestException('Invalid Paystack signature');

    const expectedHash = createHmac('sha512', secret)
      .update(JSON.stringify(body))
      .digest('hex');
    if (!this.safeCompare(hash, expectedHash, 'hex')) {
      throw new BadRequestException('Invalid Paystack signature');
    }
  }

  private assertSquadSignature(body: Record<string, unknown>, headers: Record<string, string>) {
    const secret = this.configService.get('SQUAD_WEBHOOK_SECRET');
    const received = headers['x-squad-signature'] || headers['x-webhook-signature'] || headers['signature'];
    if (!secret || !received) throw new BadRequestException('Invalid Squad signature');

    const payload = JSON.stringify(body);
    const expectedHex = createHmac('sha512', secret).update(payload).digest('hex');
    const expectedBase64 = createHmac('sha512', secret).update(payload).digest('base64');
    const verified =
      this.safeCompare(received, expectedHex, 'hex')
      || this.safeCompare(received, expectedBase64, 'base64');

    if (!verified) throw new BadRequestException('Invalid Squad signature');
  }

  private assertKorapaySignature(body: Record<string, unknown>, headers: Record<string, string>) {
    const secret = this.configService.get('KORAPAY_WEBHOOK_SECRET');
    const received = headers['x-korapay-signature'] || headers['x-signature'] || headers['signature'];
    if (!secret || !received) throw new BadRequestException('Invalid Korapay signature');

    const payload = JSON.stringify(body);
    const expectedHex = createHmac('sha256', secret).update(payload).digest('hex');
    const expectedBase64 = createHmac('sha256', secret).update(payload).digest('base64');
    const verified =
      this.safeCompare(received, expectedHex, 'hex')
      || this.safeCompare(received, expectedBase64, 'base64');

    if (!verified) throw new BadRequestException('Invalid Korapay signature');
  }

  private assertOpaySignature(body: Record<string, unknown>, headers: Record<string, string>) {
    const secret = this.configService.get('OPAY_WEBHOOK_SECRET');
    const received = headers['x-opay-signature'] || headers['x-signature'] || headers['signature'];
    if (!secret || !received) throw new BadRequestException('Invalid OPay signature');

    const payload = JSON.stringify(body);
    const expectedHex = createHmac('sha512', secret).update(payload).digest('hex');
    const expectedBase64 = createHmac('sha512', secret).update(payload).digest('base64');
    const verified =
      this.safeCompare(received, expectedHex, 'hex')
      || this.safeCompare(received, expectedBase64, 'base64');

    if (!verified) throw new BadRequestException('Invalid OPay signature');
  }

  private isReconciled(session: PaymentSession, reconciliation: ReconciliationCheck): boolean {
    if (!reconciliation.amountMinor && !reconciliation.currency) return true;

    const expectedCurrency = session.currency.toUpperCase();
    const receivedCurrency = reconciliation.currency?.toUpperCase();
    if (receivedCurrency && receivedCurrency !== expectedCurrency) return false;

    const receivedAmount = Number(reconciliation.amountMinor ?? 0);
    if (receivedAmount > 0 && receivedAmount < Number(session.amountKobo)) return false;

    return true;
  }

  private gatewayCurrency(gateway: PaymentGateway): ChargeCurrency {
    return gateway === PaymentGateway.PADDLE || gateway === PaymentGateway.NOWPAYMENTS ? 'USD' : 'NGN';
  }

  private usdCentsToNgnKobo(usdCents: number): number {
    return Math.round((usdCents / 100) * this.usdToNgnRate() * 100);
  }

  private ngnKoboToUsdCents(ngnKobo: number): number {
    return Math.max(1, Math.round((ngnKobo / 100 / this.usdToNgnRate()) * 100));
  }

  private usdToNgnRate(): number {
    const configured = Number(this.configService.get<string>('PAYMENT_USD_TO_NGN_RATE'));
    return Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_USD_TO_NGN_RATE;
  }

  private getPaddlePriceId(paymentType: PaymentType): string {
    switch (paymentType) {
      case PaymentType.CREDITS:
        return this.configService.get(PADDLE_CONFIG.PRICE_VERIFICATION);
      case PaymentType.RENTAL:
        return this.configService.get(PADDLE_CONFIG.PRICE_RENTAL);
      case PaymentType.SUBSCRIPTION:
        return this.configService.get(PADDLE_CONFIG.PRICE_SUB_MONTHLY);
      default:
        throw new BadRequestException('Invalid payment type for Paddle');
    }
  }

  private extractPaddleAmountMinor(transaction: any): number | undefined {
    const totals = transaction?.details?.totals ?? {};
    const amount = totals.grand_total ?? totals.total;
    return amount === undefined ? undefined : Number(amount);
  }

  private async syncSubscriptionEvent(subscription: any) {
    const userId = subscription.custom_data?.userId;
    if (!userId) return;

    const plan = await this.resolveSubscriptionPlan(String(subscription.custom_data?.planId || ''));
    const nextBilledAt = subscription.next_billed_at ? new Date(subscription.next_billed_at) : null;
    const now = new Date();
    const periodEnd = nextBilledAt ?? new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
    const existing = await this.subscriptionRepo.findOne({ where: { userId, status: 'active' } });
    const payload = {
      userId,
      planId: plan.id,
      status: subscription.status ?? 'active',
      billingCycle: 'monthly',
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      metadata: {
        paddleSubscriptionId: subscription.id,
        source: 'paddle_subscription_event',
      },
    };

    if (existing) await this.subscriptionRepo.update(existing.id, payload);
    else await this.subscriptionRepo.save(this.subscriptionRepo.create(payload));
  }

  private async cancelSubscriptionEvent(subscription: any) {
    const userId = subscription.custom_data?.userId;
    if (!userId) return;
    const existing = await this.subscriptionRepo.findOne({ where: { userId, status: 'active' } });
    if (!existing) return;
    await this.subscriptionRepo.update(existing.id, {
      status: 'canceled',
      cancelAt: new Date(),
      metadata: {
        ...(existing.metadata || {}),
        paddleSubscriptionId: subscription.id,
        canceledFromWebhook: true,
      },
    });
  }

  private decimalToMinor(value: unknown): number | undefined {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) return undefined;
    return Math.round(numeric * 100);
  }

  private getWebUrl(): string {
    const configured =
      this.configService.get<string>('APP_URL') ||
      this.configService.get<string>('WEB_URL') ||
      this.configService.get<string>('NEXT_PUBLIC_APP_URL');

    if (configured) {
      return configured.replace(/\/+$/, '');
    }

    if (this.configService.get<string>('NODE_ENV') === 'production') {
      throw new BadRequestException('APP_URL must be configured before starting payment flows');
    }

    return 'http://localhost:3000';
  }

  private getApiUrl(): string {
    return resolveApiUrl(this.configService);
  }

  private safeErrorData(error: unknown) {
    return (error as { response?: { data?: unknown }; message?: string })?.response?.data ?? (error as Error)?.message;
  }

  private safeCompare(a: string, b: string, encoding: BufferEncoding = 'utf8'): boolean {
    try {
      const left = Buffer.from(a, encoding);
      const right = Buffer.from(b, encoding);
      return left.length === right.length && timingSafeEqual(left, right);
    } catch {
      return false;
    }
  }

  private sortObject(value: unknown): unknown {
    if (Array.isArray(value)) return value.map((item) => this.sortObject(item));
    if (!value || typeof value !== 'object') return value;
    return Object.keys(value as Record<string, unknown>).sort().reduce<Record<string, unknown>>((acc, key) => {
      acc[key] = this.sortObject((value as Record<string, unknown>)[key]);
      return acc;
    }, {});
  }
}
