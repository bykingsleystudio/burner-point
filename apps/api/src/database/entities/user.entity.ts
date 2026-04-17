import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, OneToMany, Index,
} from 'typeorm';
import { PhoneNumber } from './phone-number.entity';
import { Message } from './message.entity';

export enum UserRole { USER = 'user', ADMIN = 'admin', ENTERPRISE = 'enterprise' }
export enum UserStatus { ACTIVE = 'active', SUSPENDED = 'suspended', BANNED = 'banned', PENDING = 'pending' }
export enum KycStatus { NONE = 'none', PENDING = 'pending', VERIFIED = 'verified', REJECTED = 'rejected' }

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, nullable: true })
  email: string;

  @Column({ name: 'password_hash', nullable: true, select: false })
  passwordHash: string;

  @Column({ name: 'phone_number', nullable: true, unique: true })
  @Index()
  phoneNumber: string;

  @Column({ name: 'first_name', nullable: true })
  firstName: string;

  @Column({ name: 'last_name', nullable: true })
  lastName: string;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.PENDING })
  status: UserStatus;

  @Column({ name: 'kyc_status', type: 'enum', enum: KycStatus, default: KycStatus.NONE })
  kycStatus: KycStatus;

  @Column({ name: 'wallet_balance_kobo', type: 'bigint', default: 0 })
  walletBalanceKobo: number;

  @Column({ name: 'lifetime_spend_kobo', type: 'bigint', default: 0 })
  lifetimeSpendKobo: number;

  @Column({ name: 'email_verified', default: false })
  emailVerified: boolean;

  @Column({ name: 'phone_verified', default: false })
  phoneVerified: boolean;

  @Column({ name: 'two_factor_enabled', default: false })
  twoFactorEnabled: boolean;

  @Column({ name: 'two_factor_secret', nullable: true, select: false })
  twoFactorSecret: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  timezone: string;

  @Column({ type: 'jsonb', default: {} })
  preferences: Record<string, unknown>;

  @Column({ name: 'google_id', nullable: true })
  googleId: string;

  @Column({ name: 'apple_id', nullable: true })
  appleId: string;

  @Column({ name: 'referral_code', unique: true, nullable: true })
  referralCode: string;

  @Column({ name: 'referred_by_user_id', nullable: true })
  referredByUserId: string;

  @Column({ name: 'referral_count', default: 0 })
  referralCount: number;

  @Column({ name: 'failed_login_attempts', default: 0 })
  failedLoginAttempts: number;

  @Column({ name: 'locked_until', nullable: true, type: 'timestamp' })
  lockedUntil: Date;

  @Column({ name: 'last_login_at', nullable: true, type: 'timestamp' })
  lastLoginAt: Date;

  @Column({ name: 'last_login_ip', nullable: true })
  lastLoginIp: string;

  @Column({ name: 'trusted_devices', type: 'jsonb', default: [] })
  trustedDevices: Array<{ deviceId: string; name: string; addedAt: string }>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'deleted_at', nullable: true, type: 'timestamp' })
  deletedAt: Date;

  @OneToMany(() => PhoneNumber, (pn) => pn.user)
  phoneNumbers: PhoneNumber[];

  @OneToMany(() => Message, (m) => m.user)
  messages: Message[];

  get fullName(): string {
    return [this.firstName, this.lastName].filter(Boolean).join(' ');
  }

  get walletBalanceNgn(): number {
    return this.walletBalanceKobo / 100;
  }
}
