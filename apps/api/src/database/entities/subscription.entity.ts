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

export enum SubscriptionProvider {
  REVENUECAT = 'revenuecat',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  TRIALING = 'trialing',
  CANCELED = 'canceled',
  EXPIRED = 'expired',
  BILLING_ISSUE = 'billing_issue',
  PAUSED = 'paused',
  TRANSFERRED = 'transferred',
  UNKNOWN = 'unknown',
}

@Entity('subscriptions')
@Index('idx_subscriptions_user_provider_product', ['userId', 'provider', 'productId'])
export class SubscriptionRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'enum', enum: SubscriptionProvider, default: SubscriptionProvider.REVENUECAT })
  provider: SubscriptionProvider;

  @Column({ name: 'provider_customer_id' })
  @Index()
  providerCustomerId: string;

  @Column({ name: 'provider_reference', nullable: true })
  @Index()
  providerReference: string | null;

  @Column({ name: 'provider_event_id', nullable: true })
  providerEventId: string | null;

  @Column({ name: 'original_app_user_id', nullable: true })
  originalAppUserId: string | null;

  @Column({ name: 'product_id', nullable: true })
  productId: string | null;

  @Column({ name: 'offering_id', nullable: true })
  offeringId: string | null;

  @Column({ nullable: true })
  store: string | null;

  @Column({ nullable: true })
  environment: string | null;

  @Column({ type: 'enum', enum: SubscriptionStatus, default: SubscriptionStatus.UNKNOWN })
  status: SubscriptionStatus;

  @Column({ name: 'is_active', default: false })
  isActive: boolean;

  @Column({ name: 'will_renew', default: false })
  willRenew: boolean;

  @Column({ name: 'purchased_at', type: 'timestamptz', nullable: true })
  purchasedAt: Date | null;

  @Column({ name: 'current_period_start', type: 'timestamptz', nullable: true })
  currentPeriodStart: Date | null;

  @Column({ name: 'current_period_end', type: 'timestamptz', nullable: true })
  currentPeriodEnd: Date | null;

  @Column({ name: 'renews_at', type: 'timestamptz', nullable: true })
  renewsAt: Date | null;

  @Column({ name: 'cancelled_at', type: 'timestamptz', nullable: true })
  cancelledAt: Date | null;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt: Date | null;

  @Column({ name: 'last_synced_at', type: 'timestamptz', nullable: true })
  lastSyncedAt: Date | null;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

@Entity('subscription_entitlements')
@Index('idx_subscription_entitlements_user_identifier', ['userId', 'identifier'], { unique: true })
export class SubscriptionEntitlement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'subscription_id', nullable: true })
  subscriptionId: string | null;

  @ManyToOne(() => SubscriptionRecord, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'subscription_id' })
  subscription: SubscriptionRecord | null;

  @Column({ type: 'enum', enum: SubscriptionProvider, default: SubscriptionProvider.REVENUECAT })
  provider: SubscriptionProvider;

  @Column()
  identifier: string;

  @Column({ name: 'display_name', nullable: true })
  displayName: string | null;

  @Column({ name: 'is_active', default: false })
  isActive: boolean;

  @Column({ name: 'product_id', nullable: true })
  productId: string | null;

  @Column({ name: 'offering_id', nullable: true })
  offeringId: string | null;

  @Column({ nullable: true })
  store: string | null;

  @Column({ nullable: true })
  environment: string | null;

  @Column({ name: 'purchased_at', type: 'timestamptz', nullable: true })
  purchasedAt: Date | null;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt: Date | null;

  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt: Date | null;

  @Column({ name: 'last_event_id', nullable: true })
  lastEventId: string | null;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

@Entity('revenuecat_events')
export class RevenueCatEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'event_id', unique: true })
  @Index()
  eventId: string;

  @Column({ name: 'event_type' })
  eventType: string;

  @Column({ name: 'api_version', nullable: true })
  apiVersion: string | null;

  @Column({ name: 'app_user_id', nullable: true })
  @Index()
  appUserId: string | null;

  @Column({ name: 'original_app_user_id', nullable: true })
  originalAppUserId: string | null;

  @Column({ name: 'user_id', nullable: true })
  @Index()
  userId: string | null;

  @Column({ nullable: true })
  environment: string | null;

  @Column({ nullable: true })
  store: string | null;

  @Column({ name: 'authorization_verified', default: false })
  authorizationVerified: boolean;

  @Column({ default: false })
  processed: boolean;

  @Column({ name: 'processing_error', type: 'text', nullable: true })
  processingError: string | null;

  @Column({ name: 'occurred_at', type: 'timestamptz', nullable: true })
  occurredAt: Date | null;

  @Column({ name: 'processed_at', type: 'timestamptz', nullable: true })
  processedAt: Date | null;

  @Column({ type: 'jsonb', default: {} })
  payload: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
