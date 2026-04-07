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
  CREDIT_PURCHASE = 'credit_purchase', NUMBER_PURCHASE = 'number_purchase',
  NUMBER_RENEWAL = 'number_renewal', SMS_SEND = 'sms_send',
  CALL_CHARGE = 'call_charge', REFERRAL_BONUS = 'referral_bonus',
  REFUND = 'refund', ADJUSTMENT = 'adjustment',
}
export enum TransactionStatus { PENDING = 'pending', COMPLETED = 'completed', FAILED = 'failed', REVERSED = 'reversed' }
export enum PaymentGateway { FLUTTERWAVE = 'flutterwave', PAYSTACK = 'paystack', SQUAD = 'squad', KORAPAY = 'korapay', OPAY = 'opay', PADDLE = 'paddle', NOWPAYMENTS = 'nowpayments' }

@Entity('wallet_transactions')
export class WalletTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'enum', enum: TransactionType })
  type: TransactionType;

  @Column({ type: 'enum', enum: TransactionStatus, default: TransactionStatus.PENDING })
  status: TransactionStatus;

  @Column({ type: 'bigint' })
  amountKobo: number;

  @Column({ type: 'bigint' })
  balanceBeforeKobo: number;

  @Column({ type: 'bigint' })
  balanceAfterKobo: number;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  referenceId: string;

  @Column({ nullable: true })
  externalReference: string;

  @Column({ type: 'enum', enum: PaymentGateway, nullable: true })
  gateway: PaymentGateway;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('payment_sessions')
export class PaymentSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ type: 'enum', enum: PaymentGateway })
  gateway: PaymentGateway;

  @Column({ type: 'bigint' })
  amountKobo: number;

  @Column({ default: 'NGN' })
  currency: string;

  @Column({ unique: true })
  @Index()
  reference: string;

  @Column({ nullable: true })
  gatewayReference: string;

  @Column({ nullable: true })
  checkoutUrl: string;

  @Column({ default: 'pending' })
  status: string;

  @Column({ type: 'jsonb', default: {} })
  gatewayResponse: Record<string, unknown>;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, unknown>;

  @Column({ nullable: true, type: 'timestamp' })
  paidAt: Date;

  @Column({ nullable: true, type: 'timestamp' })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
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

  @Column({ type: 'bigint' })
  priceKoboMonthly: number;

  @Column({ type: 'bigint' })
  priceKoboYearly: number;

  @Column({ type: 'jsonb', default: {} })
  features: Record<string, unknown>;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('user_subscriptions')
export class UserSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  planId: string;

  @Column({ default: 'active' })
  status: string;

  @Column({ default: 'monthly' })
  billingCycle: string;

  @Column({ type: 'timestamp' })
  currentPeriodStart: Date;

  @Column({ type: 'timestamp' })
  currentPeriodEnd: Date;

  @Column({ nullable: true })
  cancelAt: Date;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('webhook_dedup')
export class WebhookDedup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  eventId: string;

  @Column()
  source: string;

  @Column()
  eventType: string;

  @Column({ type: 'jsonb', default: {} })
  payload: Record<string, unknown>;

  @Column({ default: 'processed' })
  status: string;

  @CreateDateColumn()
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

  @Column({ nullable: true })
  userId: string;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  deviceFingerprint: string;

  @Column({ type: 'enum', enum: AbuseEventType })
  eventType: AbuseEventType;

  @Column({ type: 'enum', enum: AbuseAction, default: AbuseAction.FLAG })
  action: AbuseAction;

  @Column({ type: 'float', default: 0 })
  riskScore: number;

  @Column({ type: 'jsonb', default: {} })
  details: Record<string, unknown>;

  @Column({ nullable: true })
  resolvedBy: string;

  @Column({ nullable: true, type: 'timestamp' })
  resolvedAt: Date;

  @CreateDateColumn()
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

export enum CallStatus { INITIATED = 'initiated', RINGING = 'ringing', IN_PROGRESS = 'in-progress', COMPLETED = 'completed', FAILED = 'failed', BUSY = 'busy', NO_ANSWER = 'no-answer' }
export enum CallDirection { INBOUND = 'inbound', OUTBOUND = 'outbound' }

@Entity('calls')
export class Call {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  from: string;

  @Column()
  to: string;

  @Column({ type: 'enum', enum: CallDirection })
  direction: CallDirection;

  @Column({ type: 'enum', enum: CallStatus, default: CallStatus.INITIATED })
  status: CallStatus;

  @Column({ nullable: true })
  providerCallSid: string;

  @Column({ type: 'int', default: 0 })
  durationSeconds: number;

  @Column({ type: 'int', default: 0 })
  priceKobo: number;

  @Column({ nullable: true })
  recordingUrl: string;

  @Column({ nullable: true })
  voicemailUrl: string;

  @Column({ nullable: true })
  transcription: string;

  @Column({ nullable: true })
  userId: string;

  @Column({ nullable: true })
  phoneNumberId: string;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
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

  @Column()
  userId: string;

  @Column({ nullable: true })
  workspaceId: string;

  @Column()
  action: string;

  @Column()
  resource: string;

  @Column({ nullable: true })
  resourceId: string;

  @Column({ type: 'jsonb', default: {} })
  oldValue: Record<string, unknown>;

  @Column({ type: 'jsonb', default: {} })
  newValue: Record<string, unknown>;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @CreateDateColumn()
  createdAt: Date;
}

// ─── API PLATFORM ───────────────────────────────────────────────────────────

@Entity('api_keys')
export class ApiKey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ nullable: true })
  workspaceId: string;

  @Column()
  name: string;

  @Column({ unique: true, select: false })
  @Index()
  keyHash: string;

  @Column()
  keyPrefix: string; // First 8 chars for display

  @Column({ type: 'simple-array', default: 'read' })
  scopes: string[];

  @Column({ nullable: true, type: 'timestamp' })
  expiresAt: Date;

  @Column({ default: 0 })
  usageCount: number;

  @Column({ nullable: true, type: 'timestamp' })
  lastUsedAt: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', default: {} })
  rateLimit: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('developer_webhooks')
export class DeveloperWebhook {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ nullable: true })
  workspaceId: string;

  @Column()
  name: string;

  @Column()
  url: string;

  @Column({ type: 'simple-array' })
  events: string[];

  @Column({ nullable: true, select: false })
  signingSecret: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  deliverySuccessCount: number;

  @Column({ default: 0 })
  deliveryFailureCount: number;

  @Column({ nullable: true, type: 'timestamp' })
  lastDeliveryAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
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

  @Column()
  @Index()
  phoneNumber: string;

  @Column()
  channel: string; // sms | call | whatsapp

  @Column({ nullable: true })
  verificationSid: string;

  @Column({ default: 'pending' })
  status: string; // pending | approved | expired | failed

  @Column({ default: 0 })
  attempts: number;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// ─── NGN PACKAGES ───────────────────────────────────────────────────────────

@Entity('credit_packages')
export class CreditPackage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'bigint' })
  amountKobo: number;

  @Column({ type: 'bigint' })
  bonusKobo: number;

  @Column({ type: 'bigint' })
  priceKobo: number;

  @Column({ type: 'jsonb', default: [] })
  availableGateways: string[];

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isFeatured: boolean;

  @Column({ default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
