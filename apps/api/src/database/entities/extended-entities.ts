/**
 * Extended Entities — Billing, Abuse, Enterprise, AI, API Platform, Growth
 * All 18 additional entities beyond the 3 core ones.
 */
import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { User } from './user.entity';

// ─── BILLING ────────────────────────────────────────────────────────────────

export enum TransactionType {
  DEPOSIT = 'deposit',
  PRODUCT_PURCHASE = 'product_purchase',
  PRODUCT_REFUND = 'product_refund',
  WALLET_LOCK = 'wallet_lock',
  WALLET_RELEASE = 'wallet_release',
  CALL_CREDIT_PURCHASE = 'call_credit_purchase',
  CREDIT_PURCHASE = 'credit_purchase', NUMBER_PURCHASE = 'number_purchase',
  NUMBER_RENEWAL = 'number_renewal', SMS_SEND = 'sms_send',
  CALL_CHARGE = 'call_charge', REFERRAL_BONUS = 'referral_bonus',
  REFUND = 'refund', ADJUSTMENT = 'adjustment',
  SUBSCRIPTION_PURCHASE = 'subscription_purchase',
  ESIM_PURCHASE = 'esim_purchase', PROXY_PURCHASE = 'proxy_purchase',
  VPN_PURCHASE = 'vpn_purchase',
}
export enum TransactionStatus { PENDING = 'pending', COMPLETED = 'completed', FAILED = 'failed', REVERSED = 'reversed' }
export enum PaymentGateway { FLUTTERWAVE = 'flutterwave', PAYSTACK = 'paystack', KORAPAY = 'korapay', PADDLE = 'paddle', NOWPAYMENTS = 'nowpayments' }

@Entity('wallet_transactions')
export class WalletTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'enum', enum: TransactionType })
  type: TransactionType;

  @Column({ type: 'enum', enum: TransactionStatus, default: TransactionStatus.PENDING })
  status: TransactionStatus;

  @Column({ name: 'amount_kobo', type: 'bigint' })
  amountKobo: number;

  @Column({ name: 'balance_before_kobo', type: 'bigint' })
  balanceBeforeKobo: number;

  @Column({ name: 'balance_after_kobo', type: 'bigint' })
  balanceAfterKobo: number;

  @Column({ nullable: true })
  description: string;

  @Column({ name: 'reference_id', nullable: true })
  referenceId: string;

  @Column({ name: 'external_reference', nullable: true })
  externalReference: string;

  @Column({ type: 'enum', enum: PaymentGateway, nullable: true })
  gateway: PaymentGateway;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('payment_sessions')
export class PaymentSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ type: 'enum', enum: PaymentGateway })
  gateway: PaymentGateway;

  @Column({ name: 'amount_kobo', type: 'bigint' })
  amountKobo: number;

  @Column({ default: 'NGN' })
  currency: string;

  @Column({ unique: true })
  @Index()
  reference: string;

  @Column({ name: 'gateway_reference', nullable: true })
  gatewayReference: string;

  @Column({ name: 'checkout_url', nullable: true })
  checkoutUrl: string;

  @Column({ default: 'pending' })
  status: string;

  @Column({ name: 'gateway_response', type: 'jsonb', default: {} })
  gatewayResponse: Record<string, unknown>;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, unknown>;

  @Column({ name: 'paid_at', nullable: true, type: 'timestamp' })
  paidAt: Date;

  @Column({ name: 'expires_at', nullable: true, type: 'timestamp' })
  expiresAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('subscription_plans')
export class SubscriptionPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  slug: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'price_kobo_monthly', type: 'bigint' })
  priceKoboMonthly: number;

  @Column({ name: 'price_kobo_yearly', type: 'bigint' })
  priceKoboYearly: number;

  @Column({ type: 'jsonb', default: {} })
  features: Record<string, unknown>;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('user_subscriptions')
export class UserSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'plan_id' })
  planId: string;

  @ManyToOne(() => SubscriptionPlan, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'plan_id' })
  plan: SubscriptionPlan;

  @Column({ default: 'active' })
  status: string;

  @Column({ name: 'billing_cycle', default: 'monthly' })
  billingCycle: string;

  @Column({ name: 'current_period_start', type: 'timestamp' })
  currentPeriodStart: Date;

  @Column({ name: 'current_period_end', type: 'timestamp' })
  currentPeriodEnd: Date;

  @Column({ name: 'cancel_at', nullable: true })
  cancelAt: Date;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('webhook_dedup')
export class WebhookDedup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'event_id', unique: true })
  @Index()
  eventId: string;

  @Column()
  source: string;

  @Column({ name: 'event_type' })
  eventType: string;

  @Column({ type: 'jsonb', default: {} })
  payload: Record<string, unknown>;

  @Column({ default: 'processed' })
  status: string;

  @CreateDateColumn({ name: 'processed_at' })
  processedAt: Date;
}

// ─── ABUSE ──────────────────────────────────────────────────────────────────

export enum AbuseEventType {
  VELOCITY_BREACH = 'velocity_breach', SUSPICIOUS_LOGIN = 'suspicious_login',
  FRAUD_PATTERN = 'fraud_pattern', SANCTIONS_HIT = 'sanctions_hit',
  SPAM_DETECTED = 'spam_detected', DEVICE_FRAUD = 'device_fraud',
}
export enum AbuseAction { ALLOW = 'allow', FLAG = 'flag', BLOCK = 'block', CHALLENGE = 'challenge' }

@Entity('abuse_events')
export class AbuseEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @Column({ name: 'ip_address', nullable: true })
  ipAddress: string;

  @Column({ name: 'device_fingerprint', nullable: true })
  deviceFingerprint: string;

  @Column({ type: 'enum', enum: AbuseEventType })
  eventType: AbuseEventType;

  @Column({ type: 'enum', enum: AbuseAction, default: AbuseAction.FLAG })
  action: AbuseAction;

  @Column({ type: 'float', default: 0 })
  riskScore: number;

  @Column({ type: 'jsonb', default: {} })
  details: Record<string, unknown>;

  @Column({ name: 'resolved_by', nullable: true })
  resolvedBy: string;

  @Column({ name: 'resolved_at', nullable: true, type: 'timestamp' })
  resolvedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

@Entity('velocity_counters')
export class VelocityCounter {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  key: string; // e.g. "user:uuid:sms_send:1h"

  @Column()
  dimension: string; // user_id, ip, device

  @Column()
  action: string; // sms_send, number_purchase, login

  @Column()
  window: string; // 1h, 24h, 7d

  @Column({ default: 0 })
  count: number;

  @Column({ type: 'timestamp' })
  windowStart: Date;

  @Column({ type: 'timestamp' })
  windowEnd: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// ─── CALLS ──────────────────────────────────────────────────────────────────

export enum CallStatus {
  INITIATED = 'initiated',
  RINGING = 'ringing',
  ANSWERED = 'answered',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  BUSY = 'busy',
  NO_ANSWER = 'no-answer',
  CANCELED = 'canceled',
}
export enum CallDirection { INBOUND = 'inbound', OUTBOUND = 'outbound' }

@Entity('calls')
export class Call {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'from_number' })
  @Index()
  from: string;

  @Column({ name: 'to_number' })
  to: string;

  @Column({ type: 'enum', enum: CallDirection })
  direction: CallDirection;

  @Column({ type: 'enum', enum: CallStatus, default: CallStatus.INITIATED })
  status: CallStatus;

  @Column({ nullable: true })
  provider: string;

  @Column({ name: 'provider_call_id', nullable: true })
  providerCallId: string;

  @Column({ name: 'duration_seconds', type: 'int', default: 0 })
  durationSeconds: number;

  @Column({ name: 'billable_seconds', type: 'int', default: 0 })
  billableSeconds: number;

  @Column({ name: 'credits_locked', type: 'int', default: 0 })
  creditsLocked: number;

  @Column({ name: 'credits_spent', type: 'int', default: 0 })
  creditsSpent: number;

  @Column({ name: 'price_usd_cents', type: 'int', default: 0 })
  priceKobo: number;

  @Column({ name: 'failure_reason', nullable: true })
  failureReason: string;

  @Column({ name: 'destination_country', nullable: true })
  destinationCountry: string;

  @Column({ name: 'idempotency_key', nullable: true })
  @Index()
  idempotencyKey: string;

  @Column({ name: 'recording_url', nullable: true })
  recordingUrl: string;

  @Column({ name: 'voicemail_url', nullable: true })
  voicemailUrl: string;

  @Column({ name: 'recording_transcription', nullable: true })
  transcription: string;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @Column({ name: 'phone_number_id', nullable: true })
  phoneNumberId: string;

  @Column({ name: 'started_at', type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ name: 'answered_at', type: 'timestamp', nullable: true })
  answeredAt: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

// ─── ENTERPRISE ─────────────────────────────────────────────────────────────

export enum WorkspaceMemberRole { OWNER = 'owner', ADMIN = 'admin', MEMBER = 'member', VIEWER = 'viewer' }

@Entity('workspaces')
export class Workspace {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ nullable: true })
  logoUrl: string;

  @Column()
  ownerUserId: string;

  @Column({ type: 'jsonb', default: {} })
  settings: Record<string, unknown>;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'bigint', default: 0 })
  walletBalanceKobo: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('workspace_members')
export class WorkspaceMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  workspaceId: string;

  @Column()
  userId: string;

  @Column({ type: 'enum', enum: WorkspaceMemberRole, default: WorkspaceMemberRole.MEMBER })
  role: WorkspaceMemberRole;

  @Column({ type: 'jsonb', default: [] })
  permissions: string[];

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  joinedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'workspace_id', nullable: true })
  workspaceId: string;

  @Column()
  action: string;

  @Column()
  resource: string;

  @Column({ name: 'resource_id', nullable: true })
  resourceId: string;

  @Column({ type: 'jsonb', default: {} })
  oldValue: Record<string, unknown>;

  @Column({ type: 'jsonb', default: {} })
  newValue: Record<string, unknown>;

  @Column({ name: 'ip_address', nullable: true })
  ipAddress: string;

  @Column({ name: 'user_agent', nullable: true })
  userAgent: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

// ─── API PLATFORM ───────────────────────────────────────────────────────────

export enum SupportTicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export enum SupportTicketPriority {
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

@Entity('support_tickets')
export class SupportTicket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'ticket_number', unique: true })
  @Index()
  ticketNumber: string;

  @Column()
  category: string;

  @Column({ nullable: true })
  product: string;

  @Column()
  subject: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'enum', enum: SupportTicketStatus, default: SupportTicketStatus.OPEN })
  @Index()
  status: SupportTicketStatus;

  @Column({ type: 'enum', enum: SupportTicketPriority, default: SupportTicketPriority.NORMAL })
  priority: SupportTicketPriority;

  @Column({ nullable: true })
  reference: string;

  @Column({ name: 'resolution_summary', type: 'text', nullable: true })
  resolutionSummary: string;

  @Column({ name: 'last_reply_at', type: 'timestamp', nullable: true })
  lastReplyAt: Date;

  @Column({ name: 'closed_at', type: 'timestamp', nullable: true })
  closedAt: Date;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('api_keys')
export class ApiKey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'workspace_id', nullable: true })
  workspaceId: string;

  @Column()
  name: string;

  @Column({ name: 'key_hash', unique: true, select: false })
  @Index()
  keyHash: string;

  @Column({ name: 'key_prefix' })
  keyPrefix: string; // First 8 chars for display

  @Column({ type: 'jsonb', default: () => "'[\"read\"]'::jsonb" })
  scopes: string[];

  @Column({ name: 'expires_at', nullable: true, type: 'timestamp' })
  expiresAt: Date;

  @Column({ name: 'usage_count', default: 0 })
  usageCount: number;

  @Column({ name: 'last_used_at', nullable: true, type: 'timestamp' })
  lastUsedAt: Date;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'rate_limit', type: 'jsonb', default: {} })
  rateLimit: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('developer_webhooks')
export class DeveloperWebhook {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'workspace_id', nullable: true })
  workspaceId: string;

  @Column()
  name: string;

  @Column()
  url: string;

  @Column({ type: 'jsonb' })
  events: string[];

  @Column({ name: 'signing_secret', nullable: true, select: false })
  signingSecret: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'delivery_success_count', default: 0 })
  deliverySuccessCount: number;

  @Column({ name: 'delivery_failure_count', default: 0 })
  deliveryFailureCount: number;

  @Column({ name: 'last_delivery_at', nullable: true, type: 'timestamp' })
  lastDeliveryAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

/** Retryable outbound developer webhook delivery record. */
@Entity('developer_webhook_deliveries')
export class DeveloperWebhookDelivery {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'webhook_id' })
  @Index()
  webhookId: string;

  @Column({ name: 'event_id' })
  eventId: string;

  @Column({ name: 'event_type' })
  @Index()
  eventType: string;

  @Column({ type: 'jsonb', default: {} })
  payload: Record<string, unknown>;

  @Column({ name: 'idempotency_key' })
  @Index()
  idempotencyKey: string;

  @Column({ name: 'attempt_count', default: 0 })
  attemptCount: number;

  @Column({ default: 'pending' })
  @Index()
  status: string;

  @Column({ name: 'response_status', type: 'int', nullable: true })
  responseStatus: number;

  @Column({ name: 'response_body', type: 'text', nullable: true })
  responseBody: string;

  @Column({ name: 'last_error', type: 'text', nullable: true })
  lastError: string;

  @Column({ name: 'next_attempt_at', type: 'timestamp', nullable: true })
  nextAttemptAt: Date;

  @Column({ name: 'delivered_at', type: 'timestamp', nullable: true })
  deliveredAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

/** Operator-configured service supported by the durable BP Verify Hub. */
@Entity('verification_services')
export class VerificationService {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'service_code', unique: true })
  @Index()
  serviceCode: string;

  @Column({ name: 'display_name' })
  displayName: string;

  @Column({ type: 'text', array: true, default: () => "'{}'::text[]" })
  countries: string[];

  @Column({ name: 'supported_providers', type: 'text', array: true, default: () => "'{}'::text[]" })
  supportedProviders: string[];

  @Column({ name: 'base_price_usd_cents', type: 'bigint' })
  basePriceUsdCents: number;

  @Column({ name: 'margin_usd_cents', type: 'bigint', default: 0 })
  marginUsdCents: number;

  @Column({ name: 'is_active', default: true })
  @Index()
  isActive: boolean;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

/** User-owned verification lifecycle and wallet-lock association. */
@Entity('verification_orders')
export class VerificationOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @Column({ name: 'service_id' })
  @Index()
  serviceId: string;

  @Column({ name: 'phone_number_id', nullable: true })
  @Index()
  phoneNumberId: string;

  @Column()
  provider: string;

  @Column({ name: 'provider_order_id', nullable: true })
  @Index()
  providerOrderId: string;

  @Column({ name: 'country_code' })
  countryCode: string;

  @Column({ name: 'phone_number', nullable: true })
  phoneNumber: string;

  @Column({ name: 'price_usd_cents', type: 'bigint' })
  priceUsdCents: number;

  @Column({ name: 'wallet_lock_id', nullable: true })
  walletLockId: string;

  @Column({ default: 'pending' })
  @Index()
  status: string;

  @Column({ name: 'otp_code', nullable: true, select: false })
  otpCode: string;

  @Column({ name: 'failure_reason', nullable: true })
  failureReason: string;

  @Column({ name: 'idempotency_key', nullable: true })
  @Index()
  idempotencyKey: string;

  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  expiresAt: Date;

  @Column({ name: 'cancelled_at', type: 'timestamp', nullable: true })
  cancelledAt: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ name: 'refunded_at', type: 'timestamp', nullable: true })
  refundedAt: Date;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

/** Durable eSIM fulfillment record. Activation material is encrypted at rest. */
@Entity('esim_orders')
export class EsimOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @Column({ default: 'airalo' })
  provider: string;

  @Column({ name: 'provider_order_id', nullable: true })
  @Index()
  providerOrderId: string;

  @Column({ name: 'plan_id', nullable: true })
  planId: string;

  @Column({ name: 'plan_name', nullable: true })
  planName: string;

  @Column({ nullable: true })
  country: string;

  @Column({ name: 'data_amount_gb', nullable: true })
  dataAmountGb: number;

  @Column({ name: 'validity_days', nullable: true })
  validityDays: number;

  @Column({ nullable: true })
  iccid: string;

  @Column({ name: 'activation_data_encrypted', nullable: true, select: false })
  activationDataEncrypted: string;

  @Column({ default: 'pending' })
  @Index()
  status: string;

  @Column({ name: 'price_usd_cents', type: 'bigint', nullable: true })
  priceUsdCents: number;

  @Column({ name: 'failure_reason', nullable: true })
  failureReason: string;

  @Column({ name: 'idempotency_key', nullable: true })
  @Index()
  idempotencyKey: string;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'activated_at', nullable: true, type: 'timestamp' })
  activatedAt: Date;

  @Column({ name: 'expires_at', nullable: true, type: 'timestamp' })
  expiresAt: Date;

  @Column({ name: 'cancelled_at', nullable: true, type: 'timestamp' })
  cancelledAt: Date;

  @Column({ name: 'refunded_at', nullable: true, type: 'timestamp' })
  refundedAt: Date;
}

/** Durable proxy fulfillment record. Provider credentials are encrypted at rest. */
@Entity('proxy_orders')
export class ProxyOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @Column()
  provider: string;

  @Column({ name: 'provider_order_id', nullable: true })
  @Index()
  providerOrderId: string;

  @Column({ name: 'plan_type', nullable: true })
  planType: string;

  @Column({ nullable: true })
  location: string;

  @Column({ name: 'ip_count', nullable: true })
  ipCount: number;

  @Column({ name: 'bandwidth_gb', nullable: true })
  bandwidthGb: number;

  @Column({ name: 'credentials_encrypted', nullable: true, select: false })
  credentialsEncrypted: string;

  @Column({ default: 'pending' })
  @Index()
  status: string;

  @Column({ name: 'price_usd_cents', type: 'bigint', nullable: true })
  priceUsdCents: number;

  @Column({ name: 'renewal_at', nullable: true, type: 'timestamp' })
  renewalAt: Date;

  @Column({ name: 'expires_at', nullable: true, type: 'timestamp' })
  expiresAt: Date;

  @Column({ name: 'cancelled_at', nullable: true, type: 'timestamp' })
  cancelledAt: Date;

  @Column({ name: 'failure_reason', nullable: true })
  failureReason: string;

  @Column({ name: 'idempotency_key', nullable: true })
  @Index()
  idempotencyKey: string;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'activated_at', nullable: true, type: 'timestamp' })
  activatedAt: Date;
}

/** Durable WireGuard session. Configuration and private key are encrypted at rest. */
@Entity('vpn_sessions')
export class VpnSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @Column({ default: 'wireguard' })
  provider: string;

  @Column({ name: 'provider_session_id', nullable: true })
  @Index()
  providerSessionId: string;

  @Column({ name: 'device_name', nullable: true })
  deviceName: string;

  @Column({ name: 'server_id', nullable: true })
  serverId: string;

  @Column({ name: 'server_location', nullable: true })
  serverLocation: string;

  @Column({ name: 'config_encrypted', nullable: true, select: false })
  configEncrypted: string;

  @Column({ name: 'private_key_encrypted', nullable: true, select: false })
  privateKeyEncrypted: string;

  @Column({ default: 'pending' })
  @Index()
  status: string;

  @Column({ name: 'price_usd_cents', type: 'bigint', nullable: true })
  priceUsdCents: number;

  @Column({ name: 'failure_reason', nullable: true })
  failureReason: string;

  @Column({ name: 'idempotency_key', nullable: true })
  @Index()
  idempotencyKey: string;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'connected_at', nullable: true, type: 'timestamp' })
  connectedAt: Date;

  @Column({ name: 'disconnected_at', nullable: true, type: 'timestamp' })
  disconnectedAt: Date;

  @Column({ name: 'expires_at', nullable: true, type: 'timestamp' })
  expiresAt: Date;

  @Column({ name: 'revoked_at', nullable: true, type: 'timestamp' })
  revokedAt: Date;
}

// ─── GROWTH / REFERRAL ──────────────────────────────────────────────────────

@Entity('referrals')
export class Referral {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  referrerId: string;

  @Column()
  refereeId: string;

  @Column({ default: 'pending' })
  status: string;

  @Column({ type: 'bigint', default: 0 })
  referrerBonusKobo: number;

  @Column({ type: 'bigint', default: 0 })
  refereeBonusKobo: number;

  @Column({ default: false })
  bonusPaid: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// ─── PHONE OTP AUTH ─────────────────────────────────────────────────────────

@Entity('phone_otp_sessions')
export class PhoneOtpSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', nullable: true })
  @Index()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'phone_number' })
  @Index()
  phoneNumber: string;

  @Column()
  channel: string; // sms | call | whatsapp

  @Column({ name: 'verification_sid', nullable: true })
  verificationSid: string;

  @Column({ default: 'pending' })
  status: string; // pending | approved | expired | failed

  @Column({ default: 0 })
  attempts: number;

  @Column({ name: 'ip_address', nullable: true })
  ipAddress: string;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

// ─── NGN PACKAGES ───────────────────────────────────────────────────────────

@Entity('credit_packages')
export class CreditPackage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ name: 'usd_price_cents', type: 'bigint' })
  usdPriceCents: number;

  @Column({ name: 'base_credits', type: 'bigint' })
  baseCredits: number;

  @Column({ name: 'bonus_credits', type: 'bigint', default: 0 })
  bonusCredits: number;

  @Column({ name: 'total_credits', type: 'bigint' })
  totalCredits: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
