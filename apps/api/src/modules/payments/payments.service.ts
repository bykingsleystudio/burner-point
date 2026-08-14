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
import {
  PaddleEvent,
  SubscriptionEntitlement,
  SubscriptionProvider,
  SubscriptionRecord,
  SubscriptionStatus,
} from '../../database/entities/subscription.entity';
import { User } from '../../database/entities/user.entity';
import { NumberType } from '../../database/entities/phone-number.entity';
import { UsersService } from '../users/users.service';
import { NumbersService } from '../numbers/numbers.service';
import { resolveApiUrl, resolveConfiguredEnv } from '../../config/runtime-env';
import { BILLING_SUBSCRIPTION_PLANS, findBillingSubscriptionPlan } from '../billing-v2/billing-config';

export enum PaymentType {
  WALLET = 'wallet',
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
  reference?: string;
  providerStatus?: string;
}

interface ProviderVerificationResult {
  verified: boolean;
  reconciliation?: ReconciliationCheck;
  providerResponse?: Record<string, unknown>;
  reason?: string;
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
  PaymentGateway.FLUTTERWAVE,
  PaymentGateway.NOWPAYMENTS,
];

const DEFERRED_GATEWAYS = [
  PaymentGateway.KORAPAY,
];

const DEFAULT_USD_TO_NGN_RATE = 1600;
const PAYMENT_SESSION_TTL_MINUTES = 60;

const DEFAULT_WALLET_FUNDING_OPTIONS = [
  {
    id: 'wallet-500',
    name: 'Add $5.00',
    amountKobo: 500,
    bonusKobo: 0,
    priceKobo: 500,
    availableGateways: ['paystack', 'flutterwave', 'nowpayments'],
    isFeatured: false,
  },
  {
    id: 'wallet-1000',
    name: 'Add $10.00',
    amountKobo: 1000,
    bonusKobo: 0,
    priceKobo: 1000,
    availableGateways: ['paystack', 'flutterwave', 'nowpayments'],
    isFeatured: true,
  },
  {
    id: 'wallet-2500',
    name: 'Add $25.00',
    amountKobo: 2500,
    bonusKobo: 0,
    priceKobo: 2500,
    availableGateways: ['paystack', 'flutterwave', 'nowpayments'],
    isFeatured: false,
  },
  {
    id: 'wallet-5000',
    name: 'Add $50.00',
    amountKobo: 5000,
    bonusKobo: 0,
    priceKobo: 5000,
    availableGateways: ['paystack', 'flutterwave', 'nowpayments'],
    isFeatured: false,
  },
  {
    id: 'wallet-10000',
    name: 'Add $100.00',
    amountKobo: 10000,
    bonusKobo: 0,
    priceKobo: 10000,
    availableGateways: ['paystack', 'flutterwave', 'nowpayments'],
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
    @InjectRepository(SubscriptionRecord)
    private readonly syncedSubscriptionRepo: Repository<SubscriptionRecord>,
    @InjectRepository(SubscriptionEntitlement)
    private readonly entitlementRepo: Repository<SubscriptionEntitlement>,
    @InjectRepository(PaddleEvent)
    private readonly paddleEventRepo: Repository<PaddleEvent>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private configService: ConfigService,
    private usersService: UsersService,
    private numbersService: NumbersService,
  ) {}

  async getCreditPackages() {
    return DEFAULT_WALLET_FUNDING_OPTIONS;
  }

  async initializePayment(
    userId: string,
    paymentType: PaymentType = PaymentType.WALLET,
    gateway: PaymentGateway = PaymentGateway.PAYSTACK,
    rentalDays?: number,
    packageId?: string,
    clientPlatform: ClientPlatform = 'web',
    options: InitializePaymentOptions = {},
  ) {
    const normalizedPaymentType = paymentType === PaymentType.CREDITS
      ? PaymentType.WALLET
      : paymentType;
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    this.assertPaymentInput(normalizedPaymentType, rentalDays, options, clientPlatform);
    this.assertGatewayAllowed(gateway, clientPlatform, normalizedPaymentType);

    const pricing = await this.resolvePricing(normalizedPaymentType, gateway, packageId, options.planId);
    const reference = `BP-${normalizedPaymentType.toUpperCase()}-${Date.now()}-${uuidv4().slice(0, 8).toUpperCase()}`;
    const expiresAt = new Date(Date.now() + PAYMENT_SESSION_TTL_MINUTES * 60 * 1000);
    const session = await this.sessionRepo.save(
      this.sessionRepo.create({
        reference,
        userId,
        gateway,
        amountKobo: pricing.amountMinor,
        currency: pricing.currency,
        status: 'pending',
        expiresAt,
        metadata: {
          paymentType: normalizedPaymentType,
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
          fulfillmentStatus: 'checkout_initializing',
          ...pricing.metadata,
        },
      }),
    );

    let checkoutUrl: string;
    let gatewayReference: string;

    try {
      switch (gateway) {
        case PaymentGateway.PADDLE:
          ({ checkoutUrl, gatewayReference } = await this.initPaddlePayment(
            user,
            normalizedPaymentType,
            reference,
            rentalDays,
            pricing,
            options,
          ));
          break;
        case PaymentGateway.NOWPAYMENTS:
          ({ checkoutUrl, gatewayReference } = await this.initNowPayments(
            normalizedPaymentType,
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
            normalizedPaymentType,
            options,
          ));
          break;
        case PaymentGateway.FLUTTERWAVE:
          ({ checkoutUrl, gatewayReference } = await this.initFlutterwave(user, pricing.amountMinor, reference));
          break;
        case PaymentGateway.KORAPAY:
          ({ checkoutUrl, gatewayReference } = await this.initKorapay(user.email, pricing.amountMinor, reference));
          break;
        default:
          throw new BadRequestException(`Gateway ${gateway} is not implemented`);
      }
    } catch (error) {
      await this.sessionRepo.update(session.id, {
        status: 'initialization_failed',
        gatewayResponse: { error: this.safeErrorData(error) },
        metadata: {
          ...(session.metadata || {}),
          fulfillmentStatus: 'checkout_initialization_failed',
        },
      });
      throw error;
    }

    await this.sessionRepo.update(session.id, {
      gatewayReference,
      checkoutUrl,
      metadata: {
        ...(session.metadata || {}),
        fulfillmentStatus: 'awaiting_webhook',
      },
    });

    return {
      checkoutUrl,
      reference,
      amount: pricing.amountMinor,
      currency: pricing.currency,
      gateway,
      paymentType: normalizedPaymentType,
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
    const existingEvent = await this.paddleEventRepo.findOne({ where: { eventId } });
    if (existingEvent?.processed) {
      return { received: true, duplicate: true };
    }

    const eventRecord = existingEvent
      ?? await this.paddleEventRepo.save(
        this.paddleEventRepo.create({
          eventId,
          eventType,
          subscriptionId: this.asOptionalString(payload.data?.id),
          transactionId: this.asOptionalString(payload.data?.transaction_id),
          userId: this.asOptionalString(payload.data?.custom_data?.userId),
          providerCustomerId: this.asOptionalString(payload.data?.customer_id),
          occurredAt: this.parseDateValue(payload.occurred_at) ?? new Date(),
          processed: false,
          payload,
        }),
      );

    const isFresh = await this.recordWebhookOnce(`paddle:${eventId}`, 'paddle', eventType, payload);
    if (!isFresh) return { received: true, duplicate: true };

    try {
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
        await this.syncSubscriptionEvent(payload.data ?? {}, eventType);
      }

      if (eventType === 'subscription.canceled') {
        await this.cancelSubscriptionEvent(payload.data ?? {});
      }

      await this.paddleEventRepo.update(eventRecord.id, {
        processed: true,
        processedAt: new Date(),
        processingError: null,
      });

      return { received: true };
    } catch (error) {
      await this.paddleEventRepo.update(eventRecord.id, {
        processingError: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
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

    if (status === 'finished' && reference) {
      await this.fulfillPayment(reference, String(payload.payment_id ?? ''), payload, {
        amountMinor: this.decimalToMinor(payload.price_amount),
        currency: String(payload.price_currency ?? 'usd').toUpperCase(),
      });
    } else if (reference) {
      await this.markPaymentStatusFromWebhook(
        reference,
        this.mapProviderPaymentStatus(status),
        String(payload.payment_id ?? ''),
        payload,
        { providerStatus: status },
      );
    }

    return { received: true };
  }

  async handleWebhook(
    gateway: PaymentGateway,
    body: any,
    headers: Record<string, string>,
    rawBody?: Buffer,
  ) {
    let reference = '';
    let gatewayReference = '';
    let isSuccess = false;
    let eventType = 'unknown';
    let eventId = '';
    let reconciliation: ReconciliationCheck = {};
    let providerStatus = '';

    switch (gateway) {
      case PaymentGateway.PAYSTACK: {
        this.assertPaystackSignature(body, headers, rawBody);
        const event = body as { event: string; data: { reference: string; status: string; amount?: number; currency?: string; id?: number } };
        eventType = event.event;
        eventId = `${gateway}:${event.event}:${event.data?.reference}`;
        reference = event.data.reference;
        gatewayReference = String(event.data.id ?? event.data.reference);
        providerStatus = event.data.status;
        isSuccess = event.event === 'charge.success' && event.data.status === 'success';
        reconciliation = { amountMinor: Number(event.data.amount), currency: event.data.currency };
        break;
      }
      case PaymentGateway.FLUTTERWAVE: {
        this.assertFlutterwaveSignature(headers, rawBody);
        const event = body as { event: string; data: { tx_ref: string; status: string; amount?: number; currency?: string; id?: number } };
        eventType = event.event;
        eventId = `${gateway}:${event.event}:${event.data?.tx_ref}`;
        reference = event.data.tx_ref;
        gatewayReference = String(event.data.id ?? reference);
        providerStatus = event.data.status;
        isSuccess = event.event === 'charge.completed' && event.data.status === 'successful';
        reconciliation = { amountMinor: this.decimalToMinor(event.data.amount), currency: event.data.currency };
        break;
      }
      case PaymentGateway.KORAPAY: {
        this.assertKorapaySignature(body, headers, rawBody);
        const event = body as { event: string; data: { reference: string; status: string; amount?: number; currency?: string } };
        eventType = event.event;
        eventId = `${gateway}:${event.event}:${event.data?.reference}`;
        reference = event.data.reference;
        gatewayReference = reference;
        providerStatus = event.data.status;
        isSuccess = event.event === 'charge.success' && event.data.status === 'success';
        reconciliation = { amountMinor: this.decimalToMinor(event.data.amount), currency: event.data.currency };
        break;
      }
      default:
        throw new BadRequestException(`Webhook not implemented for ${gateway}`);
    }

    const isFresh = await this.recordWebhookOnce(eventId || `${gateway}:${reference}`, gateway, eventType, body);
    if (!isFresh) return { received: true, duplicate: true };

    if (reference && isSuccess) {
      await this.fulfillPayment(reference, gatewayReference, body, reconciliation);
    } else if (reference) {
      await this.markPaymentStatusFromWebhook(
        reference,
        this.mapProviderPaymentStatus(providerStatus || eventType),
        gatewayReference,
        body,
        { providerStatus, eventType },
      );
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

    const providerVerification = await this.verifyGatewayPayment(
      session,
      gatewayReference,
      gatewayResponse,
      reconciliation,
    );

    if (!providerVerification.verified) {
      await this.sessionRepo.update(session.id, {
        status: 'verification_failed',
        gatewayReference: gatewayReference ?? session.gatewayReference,
        gatewayResponse: {
          ...gatewayResponse,
          serverVerification: providerVerification.providerResponse ?? null,
        },
        metadata: {
          ...(session.metadata || {}),
          fulfillmentStatus: 'provider_verification_failed',
          verificationReason: providerVerification.reason,
        },
      });
      this.logger.error(`Payment ${reference} failed provider verification: ${providerVerification.reason}`);
      return;
    }

    const verifiedReconciliation = {
      ...reconciliation,
      ...providerVerification.reconciliation,
    };

    if (!this.isReconciled(session, verifiedReconciliation)) {
      await this.sessionRepo.update(session.id, {
        status: 'reconciliation_failed',
        gatewayReference: gatewayReference ?? session.gatewayReference,
        gatewayResponse: {
          ...gatewayResponse,
          serverVerification: providerVerification.providerResponse ?? null,
        },
        metadata: {
          ...(session.metadata || {}),
          fulfillmentStatus: 'reconciliation_failed',
          reconciliation: verifiedReconciliation,
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
      case PaymentType.WALLET:
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
      type: TransactionType.DEPOSIT,
      amountKobo: walletCreditKobo,
      balanceBeforeKobo: balanceBefore,
      balanceAfterKobo: balanceBefore + walletCreditKobo,
      description: `Wallet funding via ${session.gateway}`,
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
    // Web subscriptions are activated only from verified Paddle subscription lifecycle
    // events. The checkout transaction alone is not treated as proof of access.
    this.logger.log(`Subscription payment confirmed for ${session.reference}; awaiting Paddle subscription sync.`);
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
      return this.resolvePricing(PaymentType.WALLET, gateway, packageId, planId);
    }

    if (paymentType === PaymentType.WALLET) {
      if (packageId) {
        if (gateway === PaymentGateway.PADDLE) {
          throw new BadRequestException('Paddle wallet top-ups need dedicated Paddle price IDs. Use Paystack, Flutterwave, or NOWPayments for wallet funding.');
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
          metadata: { fundingOptionName: creditPackage.name },
        };
      }

      const chargeAmountMinor = currency === 'NGN'
        ? this.usdCentsToNgnKobo(500)
        : 500;
      return {
        amountMinor: chargeAmountMinor,
        currency,
        walletCreditKobo: 500,
        walletEquivalentKobo: 500,
        productLabel: 'Wallet funding',
        metadata: { unitPriceUsdCents: 500 },
      };
    }

    if (paymentType === PaymentType.RENTAL) {
      throw new BadRequestException('BP Rentals are wallet-only. Fund your wallet first, then rent from wallet balance.');
    }

    const plan = planId ? await this.resolveSubscriptionPlan(planId) : await this.resolveSubscriptionPlan('');
    const priceUsdCents = this.subscriptionPlanPriceUsdCents(plan);
    return {
      amountMinor: currency === 'NGN' ? this.usdCentsToNgnKobo(priceUsdCents) : priceUsdCents,
      currency,
      walletCreditKobo: 0,
      walletEquivalentKobo: priceUsdCents,
      productLabel: `${this.subscriptionPlanName(plan)} ${this.subscriptionPlanLabel(plan)}`,
      metadata: {
        planId: this.subscriptionPlanId(plan),
        planSlug: this.subscriptionPlanSlug(plan),
        unitPriceUsdCents: priceUsdCents,
        product: this.subscriptionPlanProduct(plan),
        productName: this.subscriptionPlanName(plan),
        planName: this.subscriptionPlanLabel(plan),
        paddlePriceEnv: this.subscriptionPlanPaddlePriceEnv(plan),
      },
    };
  }

  private async findCreditPackage(packageId: string) {
    const fallback = DEFAULT_WALLET_FUNDING_OPTIONS.find((pkg) => pkg.id === packageId);
    if (fallback) return fallback;

    throw new NotFoundException('Credit package not found');
  }

  private async resolveSubscriptionPlan(planId: string) {
    const configured = findBillingSubscriptionPlan(planId);
    if (configured) return configured;

    if (!planId) {
      return findBillingSubscriptionPlan('bp-premium') ?? BILLING_SUBSCRIPTION_PLANS[0];
    }

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

  private assertPaymentInput(
    paymentType: PaymentType,
    rentalDays?: number,
    options: InitializePaymentOptions = {},
    clientPlatform: ClientPlatform = 'web',
  ) {
    if (paymentType === PaymentType.RENTAL) {
      if (!rentalDays || rentalDays < 1 || rentalDays > 365) {
        throw new BadRequestException('BP Rentals durations must be selected before a wallet-backed order is created.');
      }
      throw new BadRequestException('Direct rental checkout is disabled. Use wallet balance for BP Rentals.');
    }

    if (paymentType === PaymentType.SUBSCRIPTION) {
      if (clientPlatform !== 'web') {
        throw new BadRequestException('Mobile subscriptions must be managed through Apple App Store or Google Play.');
      }
      if (!options.planId?.trim()) {
        throw new BadRequestException('A subscription plan selection is required.');
      }
    }
  }

  private assertGatewayAllowed(
    gateway: PaymentGateway,
    clientPlatform: ClientPlatform,
    paymentType: PaymentType,
  ): void {
    if (clientPlatform === 'mobile' && this.configService.get('MOBILE_EXTERNAL_PAYMENTS_ENABLED') !== 'true') {
      throw new BadRequestException(
        'Mobile external checkout is disabled for store-policy safety. Complete purchases on web.',
      );
    }

    if (paymentType === PaymentType.SUBSCRIPTION) {
      if (gateway !== PaymentGateway.PADDLE) {
        throw new BadRequestException('Web subscriptions are managed through Paddle only.');
      }
      return;
    }

    if (gateway === PaymentGateway.PADDLE) {
      throw new BadRequestException('Paddle is reserved for web subscriptions. Use Paystack, Flutterwave, or NOWPayments to fund the wallet.');
    }

    if (CORE_WEB_GATEWAYS.includes(gateway)) return;

    if (
      DEFERRED_GATEWAYS.includes(gateway) &&
      this.configService.get('SECONDARY_GATEWAYS_ENABLED') === 'true'
    ) {
      return;
    }

    throw new BadRequestException(`${gateway} is deferred until Paystack, Flutterwave, and NOWPayments are stable`);
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

    const configuredPriceEnv = typeof pricing.metadata?.paddlePriceEnv === 'string'
      ? pricing.metadata.paddlePriceEnv
      : undefined;
    const priceId = configuredPriceEnv
      ? this.configService.get<string>(configuredPriceEnv)
      : this.getPaddlePriceId(paymentType);
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
        subscriptionProduct: pricing.metadata?.product ?? null,
        subscriptionPlan: pricing.metadata?.planName ?? null,
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

  private async markPaymentStatusFromWebhook(
    reference: string,
    status: string | undefined,
    gatewayReference: string | undefined,
    gatewayResponse: Record<string, unknown>,
    metadata: Record<string, unknown> = {},
  ) {
    if (!status) return;
    const session = await this.sessionRepo.findOne({ where: { reference } });
    if (!session || session.status === 'completed') return;

    const nextStatus = status === 'failed'
      ? 'failed'
      : session.status === 'pending'
        ? 'pending'
        : session.status;

    await this.sessionRepo.update(session.id, {
      status: nextStatus,
      gatewayReference: gatewayReference || session.gatewayReference,
      gatewayResponse,
      metadata: {
        ...(session.metadata || {}),
        ...metadata,
        fulfillmentStatus: nextStatus === 'failed' ? 'failed' : 'awaiting_provider_finality',
        lastWebhookAt: new Date().toISOString(),
      },
    });
  }

  private mapProviderPaymentStatus(status: string | undefined): string | undefined {
    const normalized = String(status || '').toLowerCase();
    if (!normalized) return undefined;
    if (/(fail|failed|expired|cancel|declin|revers|abandon)/.test(normalized)) return 'failed';
    if (/(pending|waiting|confirming|confirmed|processing|ongoing|initiated)/.test(normalized)) return 'pending';
    return undefined;
  }

  private async verifyGatewayPayment(
    session: PaymentSession,
    gatewayReference?: string,
    gatewayResponse: Record<string, unknown> = {},
    reconciliation: ReconciliationCheck = {},
  ): Promise<ProviderVerificationResult> {
    try {
      switch (session.gateway) {
        case PaymentGateway.PAYSTACK:
          return await this.verifyPaystackPayment(session.reference);
        case PaymentGateway.FLUTTERWAVE:
          return await this.verifyFlutterwavePayment(session.reference);
        case PaymentGateway.PADDLE:
          return await this.verifyPaddlePayment(gatewayReference || session.gatewayReference);
        case PaymentGateway.NOWPAYMENTS:
          return await this.verifyNowPaymentsPayment(gatewayReference || this.asString(gatewayResponse.payment_id));
        case PaymentGateway.KORAPAY:
          return await this.verifyKorapayPayment(session.reference);
        default:
          return { verified: false, reason: `Unsupported payment gateway ${session.gateway}` };
      }
    } catch (error) {
      return {
        verified: false,
        reason: error instanceof Error ? error.message : String(error),
        providerResponse: { error: this.safeErrorData(error) },
        reconciliation,
      };
    }
  }

  private async verifyPaystackPayment(reference: string): Promise<ProviderVerificationResult> {
    const secretKey = this.configService.get<string>('PAYSTACK_SECRET_KEY');
    if (!secretKey) return { verified: false, reason: 'PAYSTACK_SECRET_KEY is not configured' };

    const response = await axios.get(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    const data = response.data?.data ?? {};
    return {
      verified: data.status === 'success',
      reason: data.status === 'success' ? undefined : `Paystack status ${data.status ?? 'unknown'}`,
      providerResponse: response.data,
      reconciliation: {
        amountMinor: Number(data.amount),
        currency: data.currency,
      },
    };
  }

  private async verifyFlutterwavePayment(reference: string): Promise<ProviderVerificationResult> {
    const secretKey = this.configService.get<string>('FLUTTERWAVE_SECRET_KEY');
    if (!secretKey) return { verified: false, reason: 'FLUTTERWAVE_SECRET_KEY is not configured' };

    const response = await axios.get('https://api.flutterwave.com/v3/transactions/verify_by_reference', {
      headers: { Authorization: `Bearer ${secretKey}` },
      params: { tx_ref: reference },
    });
    const data = response.data?.data ?? {};
    return {
      verified: data.status === 'successful',
      reason: data.status === 'successful' ? undefined : `Flutterwave status ${data.status ?? 'unknown'}`,
      providerResponse: response.data,
      reconciliation: {
        amountMinor: this.decimalToMinor(data.amount),
        currency: data.currency,
      },
    };
  }

  private async verifyPaddlePayment(transactionId: string | undefined): Promise<ProviderVerificationResult> {
    const apiKey = this.configService.get<string>('PADDLE_API_KEY');
    if (!apiKey) return { verified: false, reason: 'PADDLE_API_KEY is not configured' };
    if (!transactionId) return { verified: false, reason: 'Paddle transaction id is missing' };

    const isSandbox = this.configService.get('PADDLE_SANDBOX') === 'true';
    const baseUrl = isSandbox ? PADDLE_CONFIG.SANDBOX_API_URL : PADDLE_CONFIG.API_URL;
    const response = await axios.get(`${baseUrl}/transactions/${encodeURIComponent(transactionId)}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const data = response.data?.data ?? {};
    return {
      verified: data.status === 'completed',
      reason: data.status === 'completed' ? undefined : `Paddle status ${data.status ?? 'unknown'}`,
      providerResponse: response.data,
      reconciliation: {
        amountMinor: this.extractPaddleAmountMinor(data),
        currency: data.currency_code ?? data.details?.currency_code,
      },
    };
  }

  private async verifyNowPaymentsPayment(paymentId: string | undefined): Promise<ProviderVerificationResult> {
    const apiKey = this.configService.get<string>('NOWPAYMENTS_API_KEY');
    if (!apiKey) return { verified: false, reason: 'NOWPAYMENTS_API_KEY is not configured' };
    if (!paymentId) return { verified: false, reason: 'NOWPayments payment id is missing' };

    const response = await axios.get(`https://api.nowpayments.io/v1/payment/${encodeURIComponent(paymentId)}`, {
      headers: { 'x-api-key': apiKey },
    });
    const status = String(response.data?.payment_status ?? '').toLowerCase();
    return {
      verified: status === 'finished',
      reason: status === 'finished' ? undefined : `NOWPayments status ${status || 'unknown'}`,
      providerResponse: response.data,
      reconciliation: {
        amountMinor: this.decimalToMinor(response.data?.price_amount),
        currency: String(response.data?.price_currency ?? '').toUpperCase(),
      },
    };
  }

  private async verifyKorapayPayment(reference: string): Promise<ProviderVerificationResult> {
    const secretKey = this.configService.get<string>('KORAPAY_SECRET_KEY');
    if (!secretKey) return { verified: false, reason: 'KORAPAY_SECRET_KEY is not configured' };

    const response = await axios.get(`https://api.korapay.com/merchant/api/v1/charges/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    const data = response.data?.data ?? {};
    const status = String(data.status ?? '').toLowerCase();
    return {
      verified: status === 'success' || status === 'successful',
      reason: status === 'success' || status === 'successful' ? undefined : `Korapay status ${status || 'unknown'}`,
      providerResponse: response.data,
      reconciliation: {
        amountMinor: this.decimalToMinor(data.amount),
        currency: data.currency,
      },
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

  private assertPaystackSignature(
    body: Record<string, unknown>,
    headers: Record<string, string>,
    rawBody?: Buffer,
  ) {
    const hash = this.headerValue(headers, 'x-paystack-signature');
    const secret = this.configService.get('PAYSTACK_SECRET_KEY');
    if (!hash || !secret) throw new BadRequestException('Invalid Paystack signature');

    const expectedHash = createHmac('sha512', secret)
      .update(rawBody?.toString('utf8') ?? JSON.stringify(body))
      .digest('hex');
    if (!this.safeCompare(hash, expectedHash, 'hex')) {
      throw new BadRequestException('Invalid Paystack signature');
    }
  }

  private assertFlutterwaveSignature(headers: Record<string, string>, rawBody?: Buffer) {
    const secret = resolveConfiguredEnv('FLUTTERWAVE_WEBHOOK_HASH', this.configService);
    if (!secret) throw new BadRequestException('Invalid Flutterwave signature');

    const hmacSignature = this.headerValue(headers, 'flutterwave-signature');
    if (hmacSignature && rawBody) {
      const expected = createHmac('sha256', secret)
        .update(rawBody.toString('utf8'))
        .digest('base64');
      if (this.safeCompare(hmacSignature, expected)) return;
    }

    const legacyHash = this.headerValue(headers, 'verif-hash');
    if (legacyHash && this.safeCompare(legacyHash, secret)) return;

    throw new BadRequestException('Invalid Flutterwave signature');
  }

  private assertKorapaySignature(
    body: Record<string, unknown>,
    headers: Record<string, string>,
    rawBody?: Buffer,
  ) {
    const secret = this.configService.get('KORAPAY_WEBHOOK_SECRET') || this.configService.get('KORAPAY_SECRET_KEY');
    const received =
      this.headerValue(headers, 'x-korapay-signature') ||
      this.headerValue(headers, 'x-signature') ||
      this.headerValue(headers, 'signature');
    if (!secret || !received) throw new BadRequestException('Invalid Korapay signature');

    const dataPayload = JSON.stringify(body.data ?? {});
    const rawPayload = rawBody?.toString('utf8') ?? JSON.stringify(body);
    const expectedDataHex = createHmac('sha256', secret).update(dataPayload).digest('hex');
    const expectedRawHex = createHmac('sha256', secret).update(rawPayload).digest('hex');
    const expectedDataBase64 = createHmac('sha256', secret).update(dataPayload).digest('base64');
    const verified =
      this.safeCompare(received, expectedDataHex)
      || this.safeCompare(received, expectedRawHex)
      || this.safeCompare(received, expectedDataBase64);

    if (!verified) throw new BadRequestException('Invalid Korapay signature');
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

  private async syncSubscriptionEvent(subscription: any, eventType: string) {
    const userId = this.asOptionalString(subscription?.custom_data?.userId);
    if (!userId) return;

    const planId = this.asOptionalString(subscription?.custom_data?.planId);
    const plan = await this.resolveSubscriptionPlan(planId ?? '');
    const providerReference = this.asOptionalString(subscription?.id);
    const periodStart =
      this.parseDateValue(subscription?.current_billing_period?.starts_at)
      ?? this.parseDateValue(subscription?.started_at)
      ?? new Date();
    const periodEnd =
      this.parseDateValue(subscription?.next_billed_at)
      ?? this.parseDateValue(subscription?.current_billing_period?.ends_at)
      ?? this.parseDateValue(subscription?.scheduled_change?.effective_at)
      ?? null;
    const expiresAt = this.parseDateValue(subscription?.ends_at) ?? periodEnd;
    const status = this.mapPaddleSubscriptionStatus(subscription?.status, eventType);
    const existing = providerReference
      ? await this.syncedSubscriptionRepo.findOne({
          where: {
            provider: SubscriptionProvider.PADDLE,
            providerReference,
          },
        })
      : null;

    const saved = await this.syncedSubscriptionRepo.save(
      this.syncedSubscriptionRepo.create({
        ...existing,
        userId,
        provider: SubscriptionProvider.PADDLE,
        providerCustomerId:
          this.asOptionalString(subscription?.customer_id)
          ?? this.asOptionalString(subscription?.customer?.id)
          ?? userId,
        providerReference,
        providerEventId: `${eventType}:${providerReference ?? Date.now()}`,
        originalAppUserId: null,
        productId: this.subscriptionPlanProduct(plan),
        offeringId: null,
        store: 'paddle',
        environment: this.configService.get('PADDLE_SANDBOX') === 'true' ? 'sandbox' : 'production',
        status,
        isActive: this.subscriptionStillActive(status, expiresAt),
        willRenew: ![SubscriptionStatus.CANCELED, SubscriptionStatus.EXPIRED, SubscriptionStatus.PAUSED].includes(status),
        purchasedAt: this.parseDateValue(subscription?.started_at) ?? existing?.purchasedAt ?? periodStart,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        renewsAt: periodEnd,
        cancelledAt:
          status === SubscriptionStatus.CANCELED
            ? (this.parseDateValue(subscription?.canceled_at) ?? existing?.cancelledAt ?? new Date())
            : existing?.cancelledAt ?? null,
        expiresAt,
        lastSyncedAt: new Date(),
        metadata: {
          ...(existing?.metadata ?? {}),
          source: 'paddle_subscription_event',
          planId: this.subscriptionPlanId(plan),
          planSlug: this.subscriptionPlanSlug(plan),
          productName: this.subscriptionPlanName(plan),
          planName: this.subscriptionPlanLabel(plan),
          rawStatus: this.asOptionalString(subscription?.status),
          customData: subscription?.custom_data ?? {},
        },
      }),
    );

    await this.rebuildPaddleEntitlements(userId, saved.id);
  }

  private async cancelSubscriptionEvent(subscription: any) {
    await this.syncSubscriptionEvent(subscription, 'subscription.canceled');
  }

  private async rebuildPaddleEntitlements(userId: string, latestSubscriptionId: string | null) {
    const paddleSubscriptions = await this.syncedSubscriptionRepo.find({
      where: {
        userId,
        provider: SubscriptionProvider.PADDLE,
      },
      order: { updatedAt: 'DESC' },
    });
    const existingRows = await this.entitlementRepo.find({
      where: {
        userId,
        provider: SubscriptionProvider.PADDLE,
      },
      order: { updatedAt: 'DESC' },
    });
    const existingByIdentifier = new Map(existingRows.map((row) => [row.identifier, row]));
    const configured = this.getEntitlementConfig();
    const identifiers = [configured.messenger, configured.secureTunnel, configured.premium];

    for (const identifier of identifiers) {
      const grantingSubscription = paddleSubscriptions.find(
        (subscription) => subscription.isActive && this.subscriptionGrantsEntitlement(subscription.productId, identifier),
      );
      const existing = existingByIdentifier.get(identifier);
      const isActive = Boolean(grantingSubscription);

      await this.entitlementRepo.save(
        this.entitlementRepo.create({
          ...existing,
          userId,
          subscriptionId: grantingSubscription?.id ?? latestSubscriptionId ?? existing?.subscriptionId ?? null,
          provider: SubscriptionProvider.PADDLE,
          identifier,
          displayName: this.displayNameForEntitlement(identifier),
          isActive,
          productId: grantingSubscription?.productId ?? existing?.productId ?? null,
          offeringId: null,
          store: 'paddle',
          environment: this.configService.get('PADDLE_SANDBOX') === 'true' ? 'sandbox' : 'production',
          purchasedAt: grantingSubscription?.purchasedAt ?? existing?.purchasedAt ?? null,
          expiresAt: grantingSubscription?.expiresAt ?? existing?.expiresAt ?? null,
          revokedAt: isActive ? null : (existing?.revokedAt ?? new Date()),
          lastEventId: grantingSubscription?.providerEventId ?? existing?.lastEventId ?? null,
          metadata: {
            ...(existing?.metadata ?? {}),
            source: 'paddle_subscription_sync',
          },
        }),
      );
    }
  }

  private getEntitlementConfig() {
    return {
      messenger: this.configService.get<string>('REVENUECAT_ENTITLEMENT_BP_MESSENGER') || 'bp_messenger_pro',
      secureTunnel: this.configService.get<string>('REVENUECAT_ENTITLEMENT_BP_SECURE_TUNNEL') || 'bp_secure_tunnel',
      premium: this.configService.get<string>('REVENUECAT_ENTITLEMENT_BP_PREMIUM') || 'bp_premium',
    };
  }

  private subscriptionGrantsEntitlement(productId: string | null | undefined, entitlementId: string) {
    const configured = this.getEntitlementConfig();
    if (!productId) return false;

    if (productId === 'bp_premium') {
      return [configured.messenger, configured.secureTunnel, configured.premium].includes(entitlementId);
    }

    if (productId === 'bp_messenger_pro') {
      return entitlementId === configured.messenger;
    }

    if (productId === 'bp_secure_tunnel') {
      return entitlementId === configured.secureTunnel;
    }

    return false;
  }

  private displayNameForEntitlement(identifier: string) {
    const configured = this.getEntitlementConfig();
    if (identifier === configured.messenger) return 'BP Messenger Pro';
    if (identifier === configured.secureTunnel) return 'BP Secure Tunnel';
    if (identifier === configured.premium) return 'BP Premium';
    return identifier;
  }

  private mapPaddleSubscriptionStatus(rawStatus: unknown, eventType: string): SubscriptionStatus {
    const status = this.asOptionalString(rawStatus)?.toLowerCase() ?? '';
    const normalizedEvent = eventType.toLowerCase();

    if (normalizedEvent === 'subscription.canceled') return SubscriptionStatus.CANCELED;
    if (['active'].includes(status)) return SubscriptionStatus.ACTIVE;
    if (['trialing', 'trial'].includes(status)) return SubscriptionStatus.TRIALING;
    if (['past_due', 'past-due', 'paused_due'].includes(status)) return SubscriptionStatus.GRACE_PERIOD;
    if (['paused'].includes(status)) return SubscriptionStatus.PAUSED;
    if (['canceled', 'cancelled'].includes(status)) return SubscriptionStatus.CANCELED;
    if (['expired', 'inactive', 'stopped'].includes(status)) return SubscriptionStatus.EXPIRED;
    return SubscriptionStatus.UNKNOWN;
  }

  private subscriptionStillActive(status: SubscriptionStatus, expiresAt: Date | null) {
    if ([SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING, SubscriptionStatus.GRACE_PERIOD].includes(status)) {
      return true;
    }

    if (status === SubscriptionStatus.CANCELED) {
      return Boolean(expiresAt && expiresAt.getTime() > Date.now());
    }

    return false;
  }

  private isCatalogPlan(plan: any): plan is {
    id: string;
    product: string;
    productName: string;
    planName: string;
    priceUsdCents: number;
    paddlePriceEnv: string;
  } {
    return Boolean(plan && typeof plan === 'object' && 'paddlePriceEnv' in plan);
  }

  private subscriptionPlanId(plan: any) {
    return this.isCatalogPlan(plan) ? plan.id : plan.id;
  }

  private subscriptionPlanSlug(plan: any) {
    return this.isCatalogPlan(plan) ? plan.id : plan.slug;
  }

  private subscriptionPlanProduct(plan: any) {
    return this.isCatalogPlan(plan) ? plan.product : (plan.slug ?? 'subscription');
  }

  private subscriptionPlanName(plan: any) {
    return this.isCatalogPlan(plan) ? plan.productName : plan.name;
  }

  private subscriptionPlanLabel(plan: any) {
    return this.isCatalogPlan(plan) ? plan.planName : 'Monthly';
  }

  private subscriptionPlanPaddlePriceEnv(plan: any) {
    return this.isCatalogPlan(plan) ? plan.paddlePriceEnv : null;
  }

  private subscriptionPlanPriceUsdCents(plan: any) {
    if (this.isCatalogPlan(plan)) return Number(plan.priceUsdCents);
    return this.ngnKoboToUsdCents(Number(plan.priceKoboMonthly ?? 0));
  }

  private parseDateValue(value: unknown) {
    if (!value) return null;
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
    if (typeof value === 'number' && Number.isFinite(value)) {
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    if (typeof value === 'string' && value.trim()) {
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    return null;
  }

  private asOptionalString(value: unknown) {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }

  private decimalToMinor(value: unknown): number | undefined {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) return undefined;
    return Math.round(numeric * 100);
  }

  private asString(value: unknown): string {
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return '';
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

    return 'https://burnerpoint.com';
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

  private headerValue(headers: Record<string, string>, name: string): string {
    const direct = headers[name] || headers[name.toLowerCase()] || headers[name.toUpperCase()];
    if (direct) return String(direct);
    const found = Object.entries(headers || {}).find(([key]) => key.toLowerCase() === name.toLowerCase());
    return found ? String(found[1]) : '';
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
