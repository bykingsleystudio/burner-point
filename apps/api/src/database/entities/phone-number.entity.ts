import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, Index,
} from 'typeorm';
import { User } from './user.entity';
import { Message } from './message.entity';

export enum NumberStatus { ACTIVE = 'active', EXPIRED = 'expired', RELEASED = 'released', SUSPENDED = 'suspended', PENDING = 'pending' }
export enum NumberType { BURNER = 'burner', RENTAL = 'rental', VERIFICATION = 'verification', ENTERPRISE = 'enterprise' }
export enum NumberProvider { TWILIO = 'twilio', TELNYX = 'telnyx' }

@Entity('phone_numbers')
export class PhoneNumber {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  number: string;

  @Column({ nullable: true })
  friendlyName: string;

  @Column({ type: 'enum', enum: NumberStatus, default: NumberStatus.ACTIVE })
  @Index()
  status: NumberStatus;

  @Column({ type: 'enum', enum: NumberType, default: NumberType.BURNER })
  type: NumberType;

  @Column({ type: 'enum', enum: NumberProvider, default: NumberProvider.TWILIO })
  provider: NumberProvider;

  @Column({ nullable: true })
  providerNumberSid: string;

  @Column({ type: 'simple-array', default: 'sms' })
  capabilities: string[];

  @Column({ nullable: true })
  countryCode: string;

  @Column({ nullable: true })
  areaCode: string;

  @Column({ type: 'timestamp', nullable: true })
  @Index()
  expiresAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  autoRenewAt: Date;

  @Column({ default: false })
  autoRenew: boolean;

  @Column({ type: 'int', default: 0 })
  priceKobo: number;

  @Column({ type: 'int', default: 0 })
  renewalPriceKobo: number;

  @Column({ default: 0 })
  smsReceived: number;

  @Column({ default: 0 })
  smsSent: number;

  @Column({ default: 0 })
  callsReceived: number;

  @Column({ type: 'jsonb', default: {} })
  forwardingConfig: Record<string, unknown>;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, unknown>;

  @Column({ nullable: true })
  workspaceId: string;

  @Column({ nullable: true })
  assignedToUserId: string;

  @ManyToOne(() => User, (u) => u.phoneNumbers, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  userId: string;

  @OneToMany(() => Message, (m) => m.phoneNumber)
  messages: Message[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
