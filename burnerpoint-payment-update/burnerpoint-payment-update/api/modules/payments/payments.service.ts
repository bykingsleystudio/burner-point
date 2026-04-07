/**
 * apps/api/src/modules/payments/payments.service.ts
 *
 * COMPLETE REPLACEMENT FILE
 * - Removed: Stripe, Coinbase Commerce
 * - Added:   Paddle (billing API v2), NOWPayments
 * - Nigerian gateways (Flutterwave, Paystack, Squad, OPay, Korapay) unchanged
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
  CreditPackage,
  PaymentGateway,
  TransactionType,
  TransactionStatus,
} from '../../database/entities/extended-entities';
import { User } from '../../database/entities/user.entity';
import { UsersService } from '../users/users.service';

// ─── Paddle price ID map ───────────────────────────────────────────────────
// Maps credit package sort_order (0-5) to Paddle Price IDs from .env
const PADDLE_PRICE_ENV_KEYS = [
  'PADDLE_PRICE_STARTER',
  'PADDLE_PRICE_BASIC',
  'PADDLE_PRICE_VALUE',
  'PADDLE_PRICE_PRO',
  'PADDLE_PRICE_POWER',
  'PADDLE_PRICE_BUSINESS',
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
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private configService: ConfigService,
    private usersService: UsersService,
  ) {}

  // ─── Public API ───────────────────────────────────────────────────────────

  async getPackages() {
    return this.packageRepo.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC' },
    });
  }

  async initializePayment(
    userId: string,
    packageId: string,
    gateway: PaymentGateway,
  ) {
    const pkg = await this.packageRepo.findOne({
      where: { id: packageId, isActive: true },
    });
    if (!pkg) throw new NotFoundException('Credit package not found');

    if (!pkg.availableGateways.includes(gateway)) {
      throw new BadRequestException(
        `Gateway ${gateway} is not available for this package`,
      );
    }

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const reference = `BP-${Date.now()}-${uuidv4().slice(0, 8).toUpperCase()}`;

    let checkoutUrl: string;
    let gatewayReference: string;

    switch (gateway) {
      // ── Nigerian gateways ─────────────────────────────────────────────────
      case PaymentGateway.FLUTTERWAVE:
        ({ checkoutUrl, gatewayReference } = await this.initFlutterwave(
          user,
          pkg.priceKobo,
          reference,
        ));
        break;

      case PaymentGateway.PAYSTACK:
        ({ checkoutUrl, gatewayReference } = await this.initPaystack(
          user.email,
          pkg.priceKobo,
          reference,
        ));
        break;

      case PaymentGateway.SQUAD:
        ({ checkoutUrl, gatewayReference } = await this.initSquad(
          user.email,
          pkg.priceKobo,
          reference,
        ));
        break;

      case PaymentGateway.KORAPAY:
        ({ checkoutUrl, gatewayReference } = await this.initKorapay(
          user.email,
          pkg.priceKobo,
          reference,
        ));
        break;

      case PaymentGateway.OPAY:
        ({ checkoutUrl, gatewayReference } = await this.initOpay(
          user.email,
          pkg.priceKobo,
          reference,
        ));
        break;

      // ── International gateways ────────────────────────────────────────────
      case PaymentGateway.PADDLE:
        ({ checkoutUrl, gatewayReference } = await this.initPaddle(
          user,
          pkg,
          reference,
        ));
        break;

      case PaymentGateway.NOWPAYMENTS:
        ({ checkoutUrl, gatewayReference } = await this.initNowpayments(
          pkg.priceKobo,
          reference,
        ));
        break;

      default:
        throw new BadRequestException(`Unsupported gateway: ${gateway}`);
    }

    const session = this.sessionRepo.create({
      userId,
      gateway,
      amountKobo: pkg.priceKobo,
      currency: 'NGN',
      reference,
      gatewayReference,
      checkoutUrl,
      status: 'pending',
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    });
    await this.sessionRepo.save(session);

    return { reference, checkoutUrl, amountKobo: pkg.priceKobo, gateway };
  }

  async handleWebhook(
    gateway: PaymentGateway,
    payload: Record<string, unknown>,
    headers: Record<string, string>,
    rawBody?: Buffer,
  ) {
    let reference: string | undefined;
    let isSuccess = false;

    switch (gateway) {
      // ── Nigerian webhook handlers (unchanged logic) ───────────────────────

      case PaymentGateway.PAYSTACK: {
        const event = payload as {
          event: string;
          data: { reference: string; status: string };
        };
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
        const event = payload as {
          event: string;
          data: { tx_ref: string; status: string };
        };
        if (event.event !== 'charge.completed') return { received: true };
        reference = event.data.tx_ref;
        isSuccess = event.data.status === 'successful';
        break;
      }

      case PaymentGateway.SQUAD: {
        const event = payload as {
          Event: string;
          Body: { transaction_ref: string; success: boolean };
        };
        if (event.Event !== 'charge_successful') return { received: true };
        reference = event.Body.transaction_ref;
        isSuccess = event.Body.success;
        break;
      }

      case PaymentGateway.KORAPAY: {
        const event = payload as {
          event: string;
          data: { reference: string; status: string };
        };
        if (event.event !== 'charge.success') return { received: true };
        reference = event.data.reference;
        isSuccess = event.data.status === 'success';
        break;
      }

      case PaymentGateway.OPAY: {
        const event = payload as {
          type: string;
          data: { reference: string; status: string };
        };
        if (event.type !== 'payment.completed') return { received: true };
        reference = event.data.reference;
        isSuccess = event.data.status === 'SUCCESS';
        break;
      }

      // ── Paddle webhook handler ────────────────────────────────────────────
      case PaymentGateway.PADDLE: {
        if (!this.verifyPaddleWebhook(headers, rawBody)) {
          this.logger.warn('Paddle webhook signature verification failed');
          return { received: true };
        }

        const event = payload as {
          event_type: string;
          data: {
            custom_data?: { reference?: string };
            status: string;
          };
        };

        // Paddle fires 'transaction.completed' for successful one-time payments
        if (event.event_type !== 'transaction.completed') return { received: true };
        reference = event.data?.custom_data?.reference;
        isSuccess = event.data?.status === 'completed';
        break;
      }

      // ── NOWPayments webhook handler ───────────────────────────────────────
      case PaymentGateway.NOWPAYMENTS: {
        if (!this.verifyNowpaymentsWebhook(headers, rawBody)) {
          this.logger.warn('NOWPayments IPN signature verification failed');
          return { received: true };
        }

        const event = payload as {
          payment_status: string;
          order_id: string; // we store our reference here
          price_amount: number;
          price_currency: string;
        };

        // NOWPayments: 'finished' = fully confirmed, 'partially_paid' also
        // possible for underpaid crypto — we only credit on 'finished'
        if (event.payment_status !== 'finished') {
          this.logger.log(
            `NOWPayments status: ${event.payment_status} for ${event.order_id} — waiting`,
          );
          return { received: true };
        }

        reference = event.order_id;
        isSuccess = true;
        break;
      }

      default:
        this.logger.warn(`Unknown gateway webhook: ${gateway}`);
        return { received: true };
    }

    if (reference && isSuccess) {
      await this.fulfillPayment(reference);
    }

    return { received: true };
  }

  async fulfillPayment(reference: string) {
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
      paidAt: new Date(),
    });

    this.logger.log(
      `✅ Payment fulfilled: ${reference} — ₦${Number(session.amountKobo) / 100} via ${session.gateway}`,
    );
  }

  async getTransactionHistory(userId: string) {
    return this.txRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  // ─── Nigerian Gateway Initializers (unchanged) ────────────────────────────

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
        redirect_url: `${this.configService.get('WEB_URL')}/dashboard/credits?status=success&ref=${reference}`,
        customer: {
          email: user.email,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
        },
        customizations: {
          title: 'BurnerPoint Credits',
          logo: `${this.configService.get('WEB_URL')}/assets/logo-mark.svg`,
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

  private async initPaystack(
    email: string,
    amountKobo: number,
    reference: string,
  ) {
    const res = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email,
        amount: amountKobo,
        reference,
        callback_url: `${this.configService.get('WEB_URL')}/dashboard/credits?status=success&ref=${reference}`,
      },
      {
        headers: {
          Authorization: `Bearer ${this.configService.get('PAYSTACK_SECRET_KEY')}`,
        },
      },
    );
    return {
      checkoutUrl: res.data.data.authorization_url as string,
      gatewayReference: res.data.data.reference as string,
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
        callback_url: `${this.configService.get('WEB_URL')}/dashboard/credits?status=success&ref=${reference}`,
      },
      {
        headers: {
          Authorization: `Bearer ${this.configService.get('SQUAD_SECRET_KEY')}`,
        },
      },
    );
    return {
      checkoutUrl: res.data.data.checkout_url as string,
      gatewayReference: reference,
    };
  }

  private async initOpay(email: string, amountKobo: number, reference: string) {
    const amountNgn = amountKobo / 100;
    // OPay Merchant checkout — returns redirect URL
    return {
      checkoutUrl: `${this.configService.get('OPAY_BASE_URL')}/checkout?ref=${reference}&amount=${amountNgn}`,
      gatewayReference: reference,
    };
  }

  private async initKorapay(
    email: string,
    amountKobo: number,
    reference: string,
  ) {
    const amountNgn = amountKobo / 100;
    const res = await axios.post(
      'https://api.korapay.com/merchant/api/v1/charges/initialize',
      {
        amount: amountNgn,
        currency: 'NGN',
        reference,
        customer: { email },
        notification_url: `${this.configService.get('APP_URL')}/payments/webhook/korapay`,
        redirect_url: `${this.configService.get('WEB_URL')}/dashboard/credits?status=success&ref=${reference}`,
      },
      {
        headers: {
          Authorization: `Bearer ${this.configService.get('KORAPAY_SECRET_KEY')}`,
        },
      },
    );
    return {
      checkoutUrl: res.data.data.checkout_url as string,
      gatewayReference: reference,
    };
  }

  // ─── Paddle Initializer ───────────────────────────────────────────────────

  private async initPaddle(
    user: User,
    pkg: CreditPackage,
    reference: string,
  ) {
    const isSandbox =
      this.configService.get<string>('PADDLE_SANDBOX') === 'true';
    const apiBase = isSandbox
      ? 'https://sandbox-api.paddle.com'
      : 'https://api.paddle.com';

    // Map sortOrder to the configured Paddle price ID
    const priceEnvKey = PADDLE_PRICE_ENV_KEYS[pkg.sortOrder] ?? PADDLE_PRICE_ENV_KEYS[0];
    const priceId = this.configService.get<string>(priceEnvKey);

    if (!priceId) {
      throw new BadRequestException(
        `Paddle price ID not configured for package "${pkg.name}". ` +
          `Set ${priceEnvKey} in your .env file.`,
      );
    }

    // Create a Paddle transaction (Billing API v2)
    const res = await axios.post(
      `${apiBase}/transactions`,
      {
        items: [{ price_id: priceId, quantity: 1 }],
        customer: { email: user.email },
        custom_data: { reference, userId: user.id },
        checkout: {
          url: `${this.configService.get('WEB_URL')}/dashboard/credits?status=success&ref=${reference}`,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${this.configService.get('PADDLE_API_KEY')}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const transaction = res.data?.data;
    const checkoutUrl: string =
      transaction?.checkout?.url ??
      `${this.configService.get('WEB_URL')}/dashboard/credits?status=error`;

    return { checkoutUrl, gatewayReference: transaction?.id ?? reference };
  }

  // ─── NOWPayments Initializer ──────────────────────────────────────────────

  private async initNowpayments(amountKobo: number, reference: string) {
    const isSandbox =
      this.configService.get<string>('NOWPAYMENTS_SANDBOX') === 'true';
    const apiBase = isSandbox
      ? 'https://api-sandbox.nowpayments.io/v1'
      : 'https://api.nowpayments.io/v1';

    // Convert NGN to USD for the crypto invoice (approx rate: ₦1600 = $1)
    const amountNgn = amountKobo / 100;
    const amountUsd = parseFloat((amountNgn / 1600).toFixed(2));

    // Create a payment link (hosted checkout)
    const res = await axios.post(
      `${apiBase}/invoice`,
      {
        price_amount: amountUsd,
        price_currency: 'usd',
        order_id: reference,
        order_description: `BurnerPoint Credits — ₦${amountNgn.toLocaleString()}`,
        ipn_callback_url: `${this.configService.get('APP_URL')}/payments/webhook/nowpayments`,
        success_url: `${this.configService.get('WEB_URL')}/dashboard/credits?status=success&ref=${reference}`,
        cancel_url: `${this.configService.get('WEB_URL')}/dashboard/credits?status=cancelled`,
        is_fixed_rate: false,   // allow best available crypto rate
        is_fee_paid_by_user: false,
      },
      {
        headers: {
          'x-api-key': this.configService.get<string>('NOWPAYMENTS_API_KEY'),
          'Content-Type': 'application/json',
        },
      },
    );

    return {
      checkoutUrl: res.data.invoice_url as string,
      gatewayReference: res.data.id as string,
    };
  }

  // ─── Webhook Signature Verifiers ─────────────────────────────────────────

  /**
   * Verifies Paddle webhook using HMAC-SHA256 with the webhook secret.
   * Paddle sends the signature in the `paddle-signature` header:
   *   ts=<timestamp>;h1=<hmac>
   */
  private verifyPaddleWebhook(
    headers: Record<string, string>,
    rawBody?: Buffer,
  ): boolean {
    const secret = this.configService.get<string>('PADDLE_WEBHOOK_SECRET');
    if (!secret || !rawBody) return false;

    const signatureHeader = headers['paddle-signature'];
    if (!signatureHeader) return false;

    // Parse ts and h1 from header
    const parts = Object.fromEntries(
      signatureHeader.split(';').map((p) => p.split('=')),
    );
    const ts = parts['ts'];
    const receivedHmac = parts['h1'];
    if (!ts || !receivedHmac) return false;

    // Compute expected HMAC: HMAC-SHA256(secret, ts:rawBody)
    const payload = `${ts}:${rawBody.toString()}`;
    const expectedHmac = createHmac('sha256', secret)
      .update(payload)
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

  /**
   * Verifies NOWPayments IPN using HMAC-SHA512 with the IPN secret.
   * NOWPayments sends the signature in `x-nowpayments-sig` header.
   * The signed string is the sorted JSON body.
   */
  private verifyNowpaymentsWebhook(
    headers: Record<string, string>,
    rawBody?: Buffer,
  ): boolean {
    const secret = this.configService.get<string>('NOWPAYMENTS_IPN_SECRET');
    if (!secret || !rawBody) return false;

    const receivedSig = headers['x-nowpayments-sig'];
    if (!receivedSig) return false;

    // NOWPayments signs sorted keys JSON
    let sortedBody: string;
    try {
      const parsed = JSON.parse(rawBody.toString());
      const sorted = Object.keys(parsed)
        .sort()
        .reduce((acc, key) => ({ ...acc, [key]: parsed[key] }), {});
      sortedBody = JSON.stringify(sorted);
    } catch {
      return false;
    }

    const expectedSig = createHmac('sha512', secret)
      .update(sortedBody)
      .digest('hex');

    try {
      return timingSafeEqual(
        Buffer.from(receivedSig, 'hex'),
        Buffer.from(expectedSig, 'hex'),
      );
    } catch {
      return false;
    }
  }
}
