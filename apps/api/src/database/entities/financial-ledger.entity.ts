import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum CreditTransactionType {
  PURCHASE = 'purchase',
  SPEND = 'spend',
  REFUND = 'refund',
  LOCK = 'lock',
  RELEASE = 'release',
  ADJUSTMENT = 'adjustment',
  BONUS = 'bonus',
  EXPIRATION = 'expiration',
}

export enum CreditTransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REVERSED = 'reversed',
}

export enum CreditLockStatus {
  ACTIVE = 'active',
  SPENT = 'spent',
  RELEASED = 'released',
  EXPIRED = 'expired',
  CANCELED = 'canceled',
}

export enum WalletLockStatus {
  ACTIVE = 'active',
  SPENT = 'spent',
  RELEASED = 'released',
  EXPIRED = 'expired',
  CANCELED = 'canceled',
}

@Entity('wallets')
export class Wallet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', unique: true })
  @Index()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'balance_usd_cents', type: 'bigint', default: 0 })
  balanceUsdCents: number;

  @Column({ name: 'locked_balance_usd_cents', type: 'bigint', default: 0 })
  lockedBalanceUsdCents: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('wallet_locks')
export class WalletLock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'amount_usd_cents', type: 'bigint' })
  amountUsdCents: number;

  @Column()
  reason: string;

  @Column({ name: 'related_product', nullable: true })
  relatedProduct: string;

  @Column({ name: 'related_entity_id', nullable: true })
  relatedEntityId: string;

  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  @Index()
  expiresAt: Date;

  @Column({ type: 'enum', enum: WalletLockStatus, default: WalletLockStatus.ACTIVE })
  status: WalletLockStatus;

  @Column({ name: 'idempotency_key', nullable: true, unique: true })
  @Index()
  idempotencyKey: string;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'released_at', type: 'timestamp', nullable: true })
  releasedAt: Date;
}

@Entity('credit_accounts')
export class CreditAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', unique: true })
  @Index()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'credit_balance', type: 'bigint', default: 0 })
  creditBalance: number;

  @Column({ name: 'locked_credit_balance', type: 'bigint', default: 0 })
  lockedCreditBalance: number;

  @Column({ name: 'lifetime_credits_purchased', type: 'bigint', default: 0 })
  lifetimeCreditsPurchased: number;

  @Column({ name: 'lifetime_credits_spent', type: 'bigint', default: 0 })
  lifetimeCreditsSpent: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('credit_transactions')
export class CreditTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'enum', enum: CreditTransactionType })
  type: CreditTransactionType;

  @Column({ name: 'credits_amount', type: 'bigint' })
  creditsAmount: number;

  @Column({ name: 'usd_value_cents', type: 'bigint', default: 0 })
  usdValueCents: number;

  @Column({ name: 'related_product', nullable: true })
  relatedProduct: string;

  @Column({ name: 'related_entity_id', nullable: true })
  relatedEntityId: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: CreditTransactionStatus, default: CreditTransactionStatus.COMPLETED })
  status: CreditTransactionStatus;

  @Column({ name: 'idempotency_key', nullable: true, unique: true })
  @Index()
  idempotencyKey: string;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

@Entity('credit_locks')
export class CreditLock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'credits_amount', type: 'bigint' })
  creditsAmount: number;

  @Column()
  reason: string;

  @Column({ name: 'related_product', nullable: true })
  relatedProduct: string;

  @Column({ name: 'related_entity_id', nullable: true })
  relatedEntityId: string;

  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  @Index()
  expiresAt: Date;

  @Column({ type: 'enum', enum: CreditLockStatus, default: CreditLockStatus.ACTIVE })
  status: CreditLockStatus;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'released_at', type: 'timestamp', nullable: true })
  releasedAt: Date;
}

@Entity('credit_pricing_rules')
export class CreditPricingRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  product: string;

  @Column({ name: 'country_code', nullable: true })
  @Index()
  countryCode: string;

  @Column({ nullable: true })
  @Index()
  provider: string;

  @Column({ name: 'service_code', nullable: true })
  @Index()
  serviceCode: string;

  @Column({ name: 'route_quality', nullable: true })
  routeQuality: string;

  @Column({ name: 'provider_cost_usd_cents', type: 'bigint', default: 0 })
  providerCostUsdCents: number;

  @Column({ name: 'platform_margin_usd_cents', type: 'bigint', default: 0 })
  platformMarginUsdCents: number;

  @Column({ name: 'risk_margin_usd_cents', type: 'bigint', default: 0 })
  riskMarginUsdCents: number;

  @Column({ name: 'country_multiplier', type: 'decimal', precision: 10, scale: 4, default: 1 })
  countryMultiplier: string;

  @Column({ name: 'route_quality_multiplier', type: 'decimal', precision: 10, scale: 4, default: 1 })
  routeQualityMultiplier: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('credit_pricing_logs')
export class CreditPricingLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', nullable: true })
  @Index()
  userId: string;

  @Column()
  @Index()
  product: string;

  @Column({ name: 'country_code', nullable: true })
  countryCode: string;

  @Column({ nullable: true })
  provider: string;

  @Column({ name: 'service_code', nullable: true })
  serviceCode: string;

  @Column({ name: 'related_entity_id', nullable: true })
  relatedEntityId: string;

  @Column({ name: 'quote_request', type: 'jsonb', default: {} })
  quoteRequest: Record<string, unknown>;

  @Column({ name: 'quote_result', type: 'jsonb', default: {} })
  quoteResult: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
