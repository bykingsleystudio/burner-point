/**
 * apps/api/src/modules/paddle/paddle.service.ts
 *
 * Handles all three Paddle monetization types:
 *   1. Credits (verifications)  → one-time $0.99
 *   2. Rentals (phone numbers)  -> one-time $5.99
 *   3. Subscriptions            → $15.99/month recurring
 */
import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import axios, { AxiosInstance } from 'axios';
import { User } from '../../database/entities/user.entity';
import { PhoneNumber } from '../../database/entities/phone-number.entity';
import { WalletTransaction } from '../../database/entities/extended-entities';
import { UsersService } from '../users/users.service';

// ─── Paddle payment types ──────────────────────────────────────────────────
export enum PaddlePaymentType {
  VERIFICATION = 'verification',   // $0.99 per OTP check
  RENTAL       = 'rental',         // $5.99 per phone number rental
  SUBSCRIPTION = 'subscription',   // $15.99/month
}

// Credits awarded per payment type
const CREDITS_MAP: Record<PaddlePaymentType, number> = {
  // Wallet is stored in USD cents (legacy column name "kobo").
  [PaddlePaymentType.VERIFICATION]: 99,
  [PaddlePaymentType.RENTAL]: 599,
  [PaddlePaymentType.SUBSCRIPTION]: 0,
};

@Injectable()
export class PaddleService {
  private readonly logger = new Logger(PaddleService.name);
  private readonly http: AxiosInstance;
  private readonly isSandbox: boolean;

  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(PhoneNumber)
    private phoneRepo: Repository<PhoneNumber>,
    @InjectRepository(WalletTransaction)
    private txRepo: Repository<WalletTransaction>,
    private config: ConfigService,
    private usersService: UsersService,
  ) {
    this.isSandbox = this.config.get<string>('PADDLE_SANDBOX') === 'true';
    const baseURL = this.isSandbox
      ? 'https://sandbox-api.paddle.com'
      : 'https://api.paddle.com';

    this.http = axios.create({
      baseURL,
      headers: {
        Authorization: `Bearer ${this.config.get('PADDLE_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });
  }

  // ─── Public: Create checkout transaction ──────────────────────────────────

  /**
   * Creates a Paddle transaction for one-time or subscription checkout.
   * Returns a checkout URL the frontend opens in a browser/WebView.
   */
  async createCheckout(
    userId: string,
    type: PaddlePaymentType,
    metadata: Record<string, unknown> = {},
  ): Promise<{ checkoutUrl: string; transactionId: string }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const priceId = this.getPriceId(type);
    const reference = `BP-PADDLE-${Date.now()}-${userId.slice(0, 8)}`;

    const body = {
      items: [{ price_id: priceId, quantity: 1 }],
      customer: { email: user.email },
      custom_data: {
        userId,
        reference,
        paymentType: type,
        ...metadata,
      },
      checkout: {
        url: `${this.getWebUrl()}/dashboard/payments/success?ref=${reference}`,
      },
      // For subscriptions, Paddle handles recurrence automatically
      // For one-time, transaction completes and fires transaction.completed
    };

    const res = await this.http.post('/transactions', body);
    const transaction = res.data?.data;

    if (!transaction?.checkout?.url) {
      throw new BadRequestException('Paddle did not return a checkout URL');
    }

    this.logger.log(
      `Paddle checkout created: ${type} for user ${userId} — ref ${reference}`,
    );

    return {
      checkoutUrl: transaction.checkout.url,
      transactionId: transaction.id,
    };
  }

  /**
   * Retrieves subscription status for a user.
   */
  async getSubscription(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Search Paddle subscriptions by customer email
    const res = await this.http.get('/subscriptions', {
      params: { customer_email: user.email, status: 'active', per_page: 1 },
    });

    const subscription = res.data?.data?.[0] ?? null;
    return {
      active: !!subscription,
      status: subscription?.status ?? 'none',
      nextBilledAt: subscription?.next_billed_at ?? null,
      canceledAt: subscription?.canceled_at ?? null,
      priceId: subscription?.items?.[0]?.price?.id ?? null,
    };
  }

  /**
   * Cancels a user's active Paddle subscription.
   */
  async cancelSubscription(userId: string): Promise<{ cancelled: boolean }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const res = await this.http.get('/subscriptions', {
      params: { customer_email: user.email, status: 'active', per_page: 1 },
    });

    const sub = res.data?.data?.[0];
    if (!sub) throw new NotFoundException('No active subscription found');

    await this.http.post(`/subscriptions/${sub.id}/cancel`, {
      effective_from: 'next_billing_period', // stays active until end of period
    });

    this.logger.log(`Paddle subscription cancelled for user ${userId}`);
    return { cancelled: true };
  }

  // ─── Webhook handler ─────────────────────────────────────────────────────

  /**
   * Verifies and processes Paddle webhook events.
   * Called from PaddleController — receives raw body for HMAC verification.
   */
  async handleWebhook(
    headers: Record<string, string>,
    rawBody: Buffer,
  ): Promise<{ received: true }> {
    if (!this.verifySignature(headers, rawBody)) {
      this.logger.warn('Paddle webhook: invalid signature — rejecting');
      return { received: true }; // Always return 200 to prevent Paddle retries
    }

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(rawBody.toString());
    } catch {
      this.logger.error('Paddle webhook: failed to parse body');
      return { received: true };
    }

    const eventType = payload.event_type as string;
    this.logger.log(`Paddle webhook received: ${eventType}`);

    switch (eventType) {
      case 'transaction.completed':
        await this.handleTransactionCompleted(payload);
        break;

      case 'subscription.created':
        await this.handleSubscriptionCreated(payload);
        break;

      case 'subscription.updated':
        await this.handleSubscriptionUpdated(payload);
        break;

      case 'subscription.canceled':
        await this.handleSubscriptionCanceled(payload);
        break;

      default:
        this.logger.debug(`Paddle webhook: unhandled event ${eventType}`);
    }

    return { received: true };
  }

  // ─── Private: Webhook event processors ──────────────────────────────────

  private async handleTransactionCompleted(payload: Record<string, unknown>) {
    const data = payload.data as Record<string, unknown>;
    const customData = data?.custom_data as Record<string, unknown> | undefined;

    const userId = customData?.userId as string;
    const paymentType = customData?.paymentType as PaddlePaymentType;
    const reference = customData?.reference as string;

    if (!userId || !paymentType) {
      this.logger.warn(
        'Paddle transaction.completed: missing userId or paymentType in custom_data',
      );
      return;
    }

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      this.logger.warn(`Paddle transaction.completed: user ${userId} not found`);
      return;
    }

    const creditAmount = CREDITS_MAP[paymentType] ?? 0;
    const transactionId = data?.id as string;

    switch (paymentType) {
      case PaddlePaymentType.VERIFICATION:
      case PaddlePaymentType.RENTAL:
        // Credit the user's wallet
        await this.usersService.creditWallet(userId, creditAmount);
        await this.recordTransaction(
          userId,
          creditAmount,
          Number(user.walletBalanceKobo),
          `Paddle ${paymentType} payment`,
          reference ?? transactionId,
        );
        this.logger.log(
          `Paddle ${paymentType}: credited $${(creditAmount / 100).toFixed(2)} to user ${userId}`,
        );
        break;

      default:
        this.logger.debug(
          `transaction.completed for type ${paymentType} — handled by subscription events`,
        );
    }
  }

  private async handleSubscriptionCreated(payload: Record<string, unknown>) {
    const data = payload.data as Record<string, unknown>;
    const customData = data?.custom_data as Record<string, unknown> | undefined;
    const userId = customData?.userId as string;

    if (!userId) return;

    // Mark user as subscriber in preferences
    await this.userRepo.update(userId, {
      preferences: {
        paddleSubscriptionId: data?.id,
        subscriptionStatus: 'active',
        subscriptionStartedAt: new Date().toISOString(),
      },
    });

    this.logger.log(`✅ Paddle subscription created for user ${userId}`);
  }

  private async handleSubscriptionUpdated(payload: Record<string, unknown>) {
    const data = payload.data as Record<string, unknown>;
    const customData = data?.custom_data as Record<string, unknown> | undefined;
    const userId = customData?.userId as string;

    if (!userId) return;

    const status = data?.status as string;
    await this.userRepo.update(userId, {
      preferences: { subscriptionStatus: status },
    });

    this.logger.log(
      `📋 Paddle subscription updated for user ${userId}: ${status}`,
    );
  }

  private async handleSubscriptionCanceled(payload: Record<string, unknown>) {
    const data = payload.data as Record<string, unknown>;
    const customData = data?.custom_data as Record<string, unknown> | undefined;
    const userId = customData?.userId as string;

    if (!userId) return;

    await this.userRepo.update(userId, {
      preferences: {
        subscriptionStatus: 'canceled',
        subscriptionCanceledAt: new Date().toISOString(),
      },
    });

    this.logger.log(`❌ Paddle subscription canceled for user ${userId}`);
  }

  // ─── Private: Helpers ─────────────────────────────────────────────────────

  private getPriceId(type: PaddlePaymentType): string {
    const map: Record<PaddlePaymentType, string> = {
      [PaddlePaymentType.VERIFICATION]:
        this.config.getOrThrow<string>('PADDLE_PRICE_VERIFICATION'),
      [PaddlePaymentType.RENTAL]:
        this.config.getOrThrow<string>('PADDLE_PRICE_RENTAL'),
      [PaddlePaymentType.SUBSCRIPTION]:
        this.config.getOrThrow<string>('PADDLE_PRICE_SUB_MONTHLY'),
    };

    const priceId = map[type];
    if (!priceId) {
      throw new BadRequestException(
        `Paddle price ID not configured for type: ${type}. ` +
          'Check PADDLE_PRICE_* environment variables.',
      );
    }
    return priceId;
  }

  /**
   * Verifies Paddle webhook HMAC-SHA256 signature.
   * Paddle header: `paddle-signature: ts=<timestamp>;h1=<hmac>`
   */
  private verifySignature(
    headers: Record<string, string>,
    rawBody: Buffer,
  ): boolean {
    const secret = this.config.get<string>('PADDLE_WEBHOOK_SECRET');
    if (!secret) {
      this.logger.error('PADDLE_WEBHOOK_SECRET not configured');
      return false;
    }

    const sigHeader = headers['paddle-signature'];
    if (!sigHeader) return false;

    // Parse ts=xxx;h1=xxx
    const parts = Object.fromEntries(
      sigHeader.split(';').map((p) => {
        const [k, ...v] = p.split('=');
        return [k, v.join('=')];
      }),
    );
    const ts = parts['ts'];
    const receivedHmac = parts['h1'];
    if (!ts || !receivedHmac) return false;

    const signedPayload = `${ts}:${rawBody.toString()}`;
    const expectedHmac = createHmac('sha256', secret)
      .update(signedPayload)
      .digest('hex');

    try {
      return timingSafeEqual(
        Buffer.from(receivedHmac, 'hex'),
        Buffer.from(expectedHmac, 'hex'),
      );
    } catch {
      return false;
    }
  }

  private async recordTransaction(
    userId: string,
    amountKobo: number,
    balanceBefore: number,
    description: string,
    reference: string,
  ) {
    await this.txRepo.save(
      this.txRepo.create({
        userId,
        type: 'credit_purchase' as any,
        status: 'completed' as any,
        amountKobo,
        balanceBeforeKobo: balanceBefore,
        balanceAfterKobo: balanceBefore + amountKobo,
        description,
        externalReference: reference,
        gateway: 'paddle' as any,
      }),
    );
  }

  private getWebUrl(): string {
    const configured =
      this.config.get<string>('APP_URL') ||
      this.config.get<string>('WEB_URL') ||
      this.config.get<string>('NEXT_PUBLIC_APP_URL');

    if (configured) {
      return configured.replace(/\/+$/, '');
    }

    if (this.config.get<string>('NODE_ENV') === 'production') {
      throw new BadRequestException('APP_URL must be configured before creating Paddle checkouts');
    }

    return 'http://localhost:3000';
  }
}
