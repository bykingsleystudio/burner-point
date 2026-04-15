/**
 * apps/api/src/modules/payments/payments.service.ts
 *
 * Burner Point Payment Service
 * - Credits: $0.99 per verification (one-time)
 * - Rental: $5.99 per rental (1-14 days, one-time)
 * - Subscription: $15.99/month (recurring)
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
import {
  PaymentSession,
  WalletTransaction,
  PaymentGateway,
  TransactionType,
  TransactionStatus,
  CreditPackage,
  WebhookDedup,
} from '../../database/entities/extended-entities';
import { User } from '../../database/entities/user.entity';
import { UsersService } from '../users/users.service';

// ─── Payment Types ─────────────────────────────────────────────────────────
export enum PaymentType {
  CREDITS = 'credits',           // $0.99 per verification
  RENTAL = 'rental',             // $5.99 per rental (1-14 days)
  SUBSCRIPTION = 'subscription', // $15.99/month
}

// ─── Paddle Configuration ──────────────────────────────────────────────────
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

const DEFAULT_CREDIT_PACKAGES = [
  {
    id: 'starter',
    name: 'Starter Credits',
    amountKobo: 160000,
    bonusKobo: 0,
    priceKobo: 160000,
    isFeatured: false,
  },
  {
    id: 'growth',
    name: 'Growth Credits',
    amountKobo: 800000,
    bonusKobo: 80000,
    priceKobo: 800000,
    isFeatured: true,
  },
  {
    id: 'scale',
    name: 'Scale Credits',
    amountKobo: 1600000,
    bonusKobo: 240000,
    priceKobo: 1600000,
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
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private configService: ConfigService,
    private usersService: UsersService,
  ) {}

  // ─── Public API ───────────────────────────────────────────────────────────

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
    rentalDays?: number, // Only for rental payments
    packageId?: string,
    clientPlatform: 'web' | 'mobile' = 'web',
  ) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    this.assertGatewayAllowed(gateway, clientPlatform);

    // Validate rental days
    if (paymentType === PaymentType.RENTAL) {
      if (!rentalDays || rentalDays < 1 || rentalDays > 14) {
        throw new BadRequestException('Rental days must be between 1-14');
      }
    }

    const reference = `BP-${paymentType.toUpperCase()}-${Date.now()}-${uuidv4().slice(0, 8).toUpperCase()}`;
    const amountKobo = await this.resolveAmountKobo(paymentType, packageId);

    let checkoutUrl: string;
    let gatewayReference: string;

    switch (gateway) {
      case PaymentGateway.PADDLE:
        ({ checkoutUrl, gatewayReference } = await this.initPaddlePayment(
          user,
          paymentType,
          reference,
          rentalDays,
        ));
        break;

      case PaymentGateway.NOWPAYMENTS:
        ({ checkoutUrl, gatewayReference } = await this.initNowPayments(
          paymentType,
          reference,
          rentalDays,
          amountKobo,
        ));
        break;

      case PaymentGateway.PAYSTACK:
        ({ checkoutUrl, gatewayReference } = await this.initPaystack(
          user.email,
          amountKobo,
          reference,
        ));
        break;

      case PaymentGateway.FLUTTERWAVE:
        ({ checkoutUrl, gatewayReference } = await this.initFlutterwave(
          user,
          amountKobo,
          reference,
        ));
        break;

      case PaymentGateway.SQUAD:
        ({ checkoutUrl, gatewayReference } = await this.initSquad(
          user.email,
          amountKobo,
          reference,
        ));
        break;

      case PaymentGateway.KORAPAY:
        ({ checkoutUrl, gatewayReference } = await this.initKorapay(
          user.email,
          amountKobo,
          reference,
        ));
        break;

      case PaymentGateway.OPAY:
        ({ checkoutUrl, gatewayReference } = await this.initOpay(
          user.email,
          amountKobo,
          reference,
        ));
        break;

      default:
        throw new BadRequestException(`Gateway ${gateway} not implemented yet`);
    }

    // Create payment session
    const session = this.sessionRepo.create({
      reference,
      userId,
      gateway,
      amountKobo,
      currency: gateway === PaymentGateway.PADDLE || gateway === PaymentGateway.NOWPAYMENTS ? 'USD' : 'NGN',
      status: 'pending',
      gatewayReference,
      checkoutUrl,
      metadata: {
        paymentType,
        packageId: packageId || null,
        rentalDays: rentalDays || null,
        clientPlatform,
      },
    });

    await this.sessionRepo.save(session);

    return {
      checkoutUrl,
      reference,
      amount: amountKobo,
      currency: session.currency,
      gateway,
    };
  }

  async getTransactionHistory(userId: string) {
    return this.txRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  // ─── Paddle Integration ───────────────────────────────────────────────────

  private async initPaddlePayment(
    user: User,
    paymentType: PaymentType,
    reference: string,
    rentalDays?: number,
  ) {
    const isSandbox = this.configService.get('PADDLE_SANDBOX') === 'true';
    const apiKey = this.configService.get('PADDLE_API_KEY');
    const baseUrl = isSandbox ? PADDLE_CONFIG.SANDBOX_API_URL : PADDLE_CONFIG.API_URL;
    if (!apiKey) throw new BadRequestException('Paddle is not configured');

    // Get the correct price ID
    const priceId = this.getPaddlePriceId(paymentType);
    if (!priceId) throw new BadRequestException('Paddle price is not configured');

    const payload = {
      items: [{
        price_id: priceId,
        quantity: 1,
      }],
      customer: {
        email: user.email,
        name: user.firstName + ' ' + user.lastName,
      },
      custom_data: {
        reference,
        paymentType,
        rentalDays: rentalDays || null,
        userId: user.id,
      },
      checkout: {
        url: `${this.getWebUrl()}/dashboard/payments/success`,
      },
    };

    try {
      const response = await axios.post(
        `${baseUrl}/transactions`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        checkoutUrl: response.data.data.checkout.url,
        gatewayReference: response.data.data.id,
      };
    } catch (error) {
      this.logger.error('Paddle payment initialization failed', error.response?.data);
      throw new BadRequestException('Failed to initialize Paddle payment');
    }
  }

  private async initNowPayments(
    paymentType: PaymentType,
    reference: string,
    rentalDays?: number,
    amountKobo?: number,
  ) {
    const apiKey = this.configService.get('NOWPAYMENTS_API_KEY');
    if (!apiKey) throw new BadRequestException('NOWPayments is not configured');

    const amount = amountKobo ?? this.getAmountForPaymentType(paymentType);
    const usdAmount = amount / 100; // minor units to USD amount

    const payload = {
      price_amount: usdAmount,
      price_currency: 'usd',
      pay_currency: 'btc', // Let user choose, but default to BTC
      ipn_callback_url: `${this.getApiUrl()}/payments/webhook/nowpayments`,
      order_id: reference,
      order_description: `Burner Point ${paymentType}`,
      success_url: `${this.getWebUrl()}/dashboard/payments/success?ref=${reference}`,
      cancel_url: `${this.getWebUrl()}/dashboard/payments/cancel?ref=${reference}`,
    };

    try {
      const response = await axios.post(
        'https://api.nowpayments.io/v1/invoice',
        payload,
        {
          headers: {
            'x-api-key': apiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        checkoutUrl: response.data.invoice_url,
        gatewayReference: response.data.id,
      };
    } catch (error) {
      this.logger.error('NOWPayments initialization failed', error.response?.data);
      throw new BadRequestException('Failed to initialize crypto payment');
    }
  }

  private async initPaystack(
    email: string,
    amountKobo: number,
    reference: string,
  ) {
    const secretKey = this.configService.get('PAYSTACK_SECRET_KEY');
    if (!secretKey) throw new BadRequestException('Paystack is not configured');
    const res = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email,
        amount: amountKobo,
        reference,
        callback_url: `${this.getWebUrl()}/dashboard/payments/success?ref=${reference}`,
      },
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
      },
    );
    return {
      checkoutUrl: res.data.data.authorization_url as string,
      gatewayReference: res.data.data.reference as string,
    };
  }

  private async initFlutterwave(
    user: User,
    amountKobo: number,
    reference: string,
  ) {
    const amountNgn = amountKobo / 100;
    const res = await axios.post(
      'https://api.flutterwave.com/v3/payments',
      {
        tx_ref: reference,
        amount: amountNgn,
        currency: 'NGN',
        redirect_url: `${this.getWebUrl()}/dashboard/payments/success?ref=${reference}`,
        customer: {
          email: user.email,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
        },
        customizations: {
          title: 'Burner Point Credits',
          logo: `${this.getWebUrl()}/assets/logo-mark.svg`,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${this.configService.get('FLUTTERWAVE_SECRET_KEY')}`,
        },
      },
    );
    return {
      checkoutUrl: res.data.data.link as string,
      gatewayReference: reference,
    };
  }

  private async initSquad(
    email: string,
    amountKobo: number,
    reference: string,
  ) {
    const res = await axios.post(
      `${this.configService.get('SQUAD_BASE_URL')}/transaction/initiate`,
      {
        email,
        amount: amountKobo,
        currency: 'NGN',
        transaction_ref: reference,
        pass_charge: false,
        callback_url: `${this.getWebUrl()}/dashboard/payments/success?ref=${reference}`,
      },
      {
        headers: {
          Authorization: `Bearer ${this.configService.get('SQUAD_SECRET_KEY')}`,
        },
      },
    );
    return {
      checkoutUrl: res.data.data.checkout_url as string,
      gatewayReference: res.data.data.transaction_ref as string,
    };
  }

  private async initKorapay(
    email: string,
    amountKobo: number,
    reference: string,
  ) {
    const res = await axios.post(
      'https://api.korapay.com/merchant/api/v1/charges/initialize',
      {
        reference,
        amount: amountKobo,
        currency: 'NGN',
        redirect_url: `${this.getWebUrl()}/dashboard/payments/success?ref=${reference}`,
        customer: {
          email,
        },
        notification_url: `${this.getApiUrl()}/payments/webhook/korapay`,
      },
      {
        headers: {
          Authorization: `Bearer ${this.configService.get('KORAPAY_SECRET_KEY')}`,
        },
      },
    );
    return {
      checkoutUrl: res.data.data.checkout_url as string,
      gatewayReference: res.data.data.reference as string,
    };
  }

  private async initOpay(
    email: string,
    amountKobo: number,
    reference: string,
  ) {
    const res = await axios.post(
      'https://api.opaycheckout.com/api/v1/international/cashier/create',
      {
        reference,
        amount: amountKobo.toString(),
        currency: 'NGN',
        returnUrl: `${this.getWebUrl()}/dashboard/payments/success?ref=${reference}`,
        userInfo: {
          userEmail: email,
        },
        product: {
          name: 'Burner Point Credits',
          description: 'Purchase credits for Burner Point services',
        },
        callbackUrl: `${this.getApiUrl()}/payments/webhook/opay`,
      },
      {
        headers: {
          Authorization: `Bearer ${this.configService.get('OPAY_PUBLIC_KEY')}:${this.configService.get('OPAY_SECRET_KEY')}`,
          'MerchantId': this.configService.get('OPAY_MERCHANT_ID'),
        },
      },
    );
    return {
      checkoutUrl: res.data.data.cashierUrl as string,
      gatewayReference: res.data.data.reference as string,
    };
  }

  // ─── Webhook Handlers ─────────────────────────────────────────────────────

  async handlePaddleWebhook(rawBody: Buffer, signature: string) {
    // Verify webhook signature
    const secret = this.configService.get('PADDLE_WEBHOOK_SECRET');
    const expectedSignature = createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      throw new BadRequestException('Invalid webhook signature');
    }

    const payload = JSON.parse(rawBody.toString());
    const eventId = payload.event_id ?? `${payload.event_type}:${payload.data?.id ?? Date.now()}`;
    const isFresh = await this.recordWebhookOnce(
      `paddle:${eventId}`,
      'paddle',
      payload.event_type,
      payload,
    );
    if (!isFresh) return { received: true, duplicate: true };

    // Handle different event types
    switch (payload.event_type) {
      case 'transaction.completed':
        await this.handlePaddleTransactionCompleted(payload.data);
        break;
      case 'subscription.created':
      case 'subscription.updated':
        await this.handlePaddleSubscriptionEvent(payload.data);
        break;
      case 'subscription.canceled':
        await this.handlePaddleSubscriptionCanceled(payload.data);
        break;
      default:
        this.logger.log(`Unhandled Paddle event: ${payload.event_type}`);
    }

    return { received: true };
  }

  async handleNowPaymentsWebhook(payload: any) {
    // Verify IPN signature
    const secret = this.configService.get('NOWPAYMENTS_IPN_SECRET');
    const expectedSignature = createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    if (payload.signature !== expectedSignature) {
      throw new BadRequestException('Invalid IPN signature');
    }

    const eventId = payload.payment_id ?? `${payload.order_id}:${payload.payment_status}`;
    const isFresh = await this.recordWebhookOnce(
      `nowpayments:${eventId}`,
      'nowpayments',
      payload.payment_status ?? 'unknown',
      payload,
    );
    if (!isFresh) return { received: true, duplicate: true };

    if (payload.payment_status === 'finished') {
      await this.handleNowPaymentsCompleted(payload);
    }

    return { received: true };
  }

  async handleWebhook(gateway: PaymentGateway, body: any, headers: Record<string, string>) {
    let reference: string;
    let isSuccess: boolean;
    let eventType = 'unknown';
    let eventId: string;

    switch (gateway) {
      case PaymentGateway.PAYSTACK: {
        const hash = headers['x-paystack-signature'];
        const secret = this.configService.get('PAYSTACK_SECRET_KEY');
        const expectedHash = createHmac('sha512', secret)
          .update(JSON.stringify(body))
          .digest('hex');

        if (hash !== expectedHash) {
          throw new BadRequestException('Invalid Paystack signature');
        }

        const event = body as { event: string; data: { reference: string; status: string } };
        eventType = event.event;
        eventId = `${gateway}:${event.event}:${event.data?.reference}`;
        if (event.event !== 'charge.success') return { received: true };
        reference = event.data.reference;
        isSuccess = event.data.status === 'success';
        break;
      }

      case PaymentGateway.FLUTTERWAVE: {
        const hash = headers['verif-hash'] || headers['x-flutterwave-signature'];
        const expectedHash = this.configService.get<string>('FLUTTERWAVE_WEBHOOK_HASH');
        if (hash !== expectedHash) {
          this.logger.warn('Flutterwave webhook signature mismatch');
          return { received: true };
        }
        const event = body as { event: string; data: { tx_ref: string; status: string } };
        eventType = event.event;
        eventId = `${gateway}:${event.event}:${event.data?.tx_ref}`;
        if (event.event !== 'charge.completed') return { received: true };
        reference = event.data.tx_ref;
        isSuccess = event.data.status === 'successful';
        break;
      }

      case PaymentGateway.SQUAD: {
        const event = body as { Event: string; Body: { transaction_ref: string; success: boolean } };
        eventType = event.Event;
        eventId = `${gateway}:${event.Event}:${event.Body?.transaction_ref}`;
        if (event.Event !== 'charge_successful') return { received: true };
        reference = event.Body.transaction_ref;
        isSuccess = event.Body.success;
        break;
      }

      case PaymentGateway.KORAPAY: {
        const event = body as { event: string; data: { reference: string; status: string } };
        eventType = event.event;
        eventId = `${gateway}:${event.event}:${event.data?.reference}`;
        if (event.event !== 'charge.success') return { received: true };
        reference = event.data.reference;
        isSuccess = event.data.status === 'success';
        break;
      }

      case PaymentGateway.OPAY: {
        const event = body as { eventType: string; data: { reference: string; status: string } };
        eventType = event.eventType;
        eventId = `${gateway}:${event.eventType}:${event.data?.reference}`;
        if (event.eventType !== 'charge.success') return { received: true };
        reference = event.data.reference;
        isSuccess = event.data.status === 'successful';
        break;
      }

      default:
        throw new BadRequestException(`Webhook not implemented for ${gateway}`);
    }

    const isFresh = await this.recordWebhookOnce(eventId ?? `${gateway}:${reference}`, gateway, eventType, body);
    if (!isFresh) return { received: true, duplicate: true };

    if (reference && isSuccess) {
      await this.fulfillPayment(reference);
    }

    return { received: true };
  }

  async fulfillPayment(reference: string, gatewayReference?: string) {
    const session = await this.sessionRepo.findOne({ where: { reference } });
    if (!session || session.status === 'completed') {
      this.logger.debug(`Payment ${reference} already fulfilled or not found`);
      return;
    }

    const user = await this.userRepo.findOne({ where: { id: session.userId } });
    if (!user) return;

    const balanceBefore = Number(user.walletBalanceKobo);

    await this.usersService.creditWallet(session.userId, session.amountKobo);

    await this.txRepo.save(
      this.txRepo.create({
        userId: session.userId,
        type: TransactionType.CREDIT_PURCHASE,
        status: TransactionStatus.COMPLETED,
        amountKobo: session.amountKobo,
        balanceBeforeKobo: balanceBefore,
        balanceAfterKobo: balanceBefore + Number(session.amountKobo),
        description: `Credit purchase via ${session.gateway}`,
        referenceId: session.id,
        externalReference: reference,
        gateway: session.gateway,
      }),
    );

    await this.sessionRepo.update(session.id, {
      status: 'completed',
      gatewayReference: gatewayReference ?? session.gatewayReference,
      paidAt: new Date(),
    });

    this.logger.log(
      `✅ Payment fulfilled: ${reference} — ₦${Number(session.amountKobo) / 100} via ${session.gateway}`,
    );
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────

  private assertGatewayAllowed(gateway: PaymentGateway, clientPlatform: 'web' | 'mobile'): void {
    if (clientPlatform === 'mobile' && this.configService.get('MOBILE_EXTERNAL_PAYMENTS_ENABLED') !== 'true') {
      throw new BadRequestException(
        'Mobile in-app external payments are disabled for store-policy safety. Complete purchases on web.',
      );
    }

    if (CORE_WEB_GATEWAYS.includes(gateway)) return;

    if (
      DEFERRED_GATEWAYS.includes(gateway) &&
      this.configService.get('SECONDARY_GATEWAYS_ENABLED') === 'true'
    ) {
      return;
    }

    throw new BadRequestException(
      `${gateway} is deferred until the Paystack core revenue flow is stable`,
    );
  }

  private async resolveAmountKobo(paymentType: PaymentType, packageId?: string): Promise<number> {
    if (paymentType === PaymentType.CREDITS && packageId) {
      const creditPackage = await this.packageRepo.findOne({
        where: { id: packageId, isActive: true },
      });
      if (creditPackage) return Number(creditPackage.priceKobo);

      const fallbackPackage = DEFAULT_CREDIT_PACKAGES.find((pkg) => pkg.id === packageId);
      if (fallbackPackage) return fallbackPackage.priceKobo;
    }

    return this.getAmountForPaymentType(paymentType);
  }

  private async recordWebhookOnce(
    eventId: string,
    source: string,
    eventType: string,
    payload: Record<string, unknown>,
  ): Promise<boolean> {
    const existing = await this.webhookDedupRepo.findOne({ where: { eventId } });
    if (existing) {
      this.logger.debug(`Duplicate webhook ignored: ${eventId}`);
      return false;
    }

    await this.webhookDedupRepo.save(
      this.webhookDedupRepo.create({
        eventId,
        source,
        eventType,
        payload,
        status: 'processed',
      }),
    );
    return true;
  }

  private getAmountForPaymentType(paymentType: PaymentType): number {
    switch (paymentType) {
      case PaymentType.CREDITS:
        return 99; // $0.99 in kobo (multiply by 100)
      case PaymentType.RENTAL:
        return 599; // $5.99 in cents-equivalent minor units
      case PaymentType.SUBSCRIPTION:
        return 1599; // $15.99 in kobo
      default:
        throw new BadRequestException('Invalid payment type');
    }
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

  private getWebUrl(): string {
    return (this.configService.get<string>('WEB_URL') || 'http://localhost:3000').replace(/\/+$/, '');
  }

  private getApiUrl(): string {
    return (this.configService.get<string>('API_URL') || 'http://localhost:3001/api').replace(/\/+$/, '');
  }

  private async handlePaddleTransactionCompleted(transaction: any) {
    const reference = transaction.custom_data?.reference;
    if (!reference) return;

    await this.fulfillPayment(reference, transaction.id);
  }

  private async handlePaddleSubscriptionEvent(subscription: any) {
    // Handle subscription created/updated
    const userId = subscription.custom_data?.userId;
    if (!userId) return;

    // Update user subscription status
    // This would need a subscription entity in your database
    this.logger.log(`Subscription ${subscription.id} ${subscription.status} for user ${userId}`);
  }

  private async handlePaddleSubscriptionCanceled(subscription: any) {
    // Handle subscription cancellation
    const userId = subscription.custom_data?.userId;
    this.logger.log(`Subscription ${subscription.id} canceled for user ${userId}`);
  }

  private async handleNowPaymentsCompleted(payload: any) {
    const reference = payload.order_id;
    await this.fulfillPayment(reference, payload.payment_id);
  }

  private getTransactionTypeForPayment(paymentType: string): TransactionType {
    switch (paymentType) {
      case PaymentType.CREDITS:
        return TransactionType.CREDIT_PURCHASE;
      case PaymentType.RENTAL:
        return TransactionType.NUMBER_RENEWAL; // Or create new type
      case PaymentType.SUBSCRIPTION:
        return TransactionType.CREDIT_PURCHASE; // Would need subscription type
      default:
        return TransactionType.CREDIT_PURCHASE;
    }
  }

  private async applyPaymentEffects(userId: string, paymentType: string, metadata: any) {
    switch (paymentType) {
      case PaymentType.CREDITS:
        // Add credits to user wallet (1 verification = $0.99)
        await this.usersService.creditWallet(userId, 99); // $0.99 in kobo
        break;

      case PaymentType.RENTAL:
        // Assign a phone number for the rental period
        const rentalDays = metadata?.rentalDays || 1;
        await this.assignRentalNumber(userId, rentalDays);
        break;

      case PaymentType.SUBSCRIPTION:
        // Activate subscription
        await this.activateSubscription(userId);
        break;
    }
  }

  private async assignRentalNumber(userId: string, days: number) {
    // Implementation would depend on your phone number management system
    this.logger.log(`Assigning rental number to ${userId} for ${days} days`);
  }

  private async activateSubscription(userId: string) {
    // Implementation for subscription activation
    this.logger.log(`Activating subscription for ${userId}`);
  }
}
