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

  @Column({ nullable: true, select: false })
  passwordHash: string;

  @Column({ nullable: true, unique: true })
  @Index()
  phoneNumber: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ nullable: true })
  avatarUrl: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.PENDING })
  status: UserStatus;

  @Column({ type: 'enum', enum: KycStatus, default: KycStatus.NONE })
  kycStatus: KycStatus;

  @Column({ type: 'bigint', default: 0 })
  walletBalanceKobo: number;

  @Column({ type: 'bigint', default: 0 })
  lifetimeSpendKobo: number;

  @Column({ default: false })
  emailVerified: boolean;

  @Column({ default: false })
  phoneVerified: boolean;

  @Column({ default: false })
  twoFactorEnabled: boolean;

  @Column({ nullable: true, select: false })
  twoFactorSecret: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  timezone: string;

  @Column({ type: 'jsonb', default: {} })
  preferences: Record<string, unknown>;

  @Column({ nullable: true })
  googleId: string;

  @Column({ nullable: true })
  appleId: string;

  @Column({ unique: true, nullable: true })
  referralCode: string;

  @Column({ nullable: true })
  referredByUserId: string;

  @Column({ default: 0 })
  referralCount: number;

  @Column({ default: 0 })
  failedLoginAttempts: number;

  @Column({ nullable: true, type: 'timestamp' })
  lockedUntil: Date;

  @Column({ nullable: true, type: 'timestamp' })
  lastLoginAt: Date;

  @Column({ nullable: true })
  lastLoginIp: string;

  @Column({ type: 'jsonb', default: [] })
  trustedDevices: Array<{ deviceId: string; name: string; addedAt: string }>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true, type: 'timestamp' })
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
