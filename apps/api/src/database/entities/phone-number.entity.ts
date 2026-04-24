import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, Index,
} from 'typeorm';
import { User } from './user.entity';
import { Message } from './message.entity';

export enum NumberStatus { ACTIVE = 'active', EXPIRED = 'expired', RELEASED = 'released', SUSPENDED = 'suspended', PENDING = 'pending' }
export enum NumberType { BURNER = 'burner', RENTAL = 'rental', VERIFICATION = 'verification', ENTERPRISE = 'enterprise' }
export enum NumberProvider {
  TWILIO = 'twilio',
  TELNYX = 'telnyx',
  PLIVO = 'plivo',
  TERMII = 'termii',
}

@Entity('phone_numbers')
export class PhoneNumber {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  number: string;

  @Column({ name: 'friendly_name', nullable: true })
  friendlyName: string;

  @Column({ type: 'enum', enum: NumberStatus, default: NumberStatus.ACTIVE })
  @Index()
  status: NumberStatus;

  @Column({ type: 'enum', enum: NumberType, default: NumberType.BURNER })
  type: NumberType;

  @Column({ type: 'enum', enum: NumberProvider, default: NumberProvider.TWILIO })
  provider: NumberProvider;

  @Column({ name: 'provider_number_sid', nullable: true })
  providerNumberSid: string;

  @Column({ type: 'text', array: true, default: () => "'{sms}'" })
  capabilities: string[];

  @Column({ name: 'country_code', nullable: true })
  countryCode: string;

  @Column({ name: 'area_code', nullable: true })
  areaCode: string;

  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  @Index()
  expiresAt: Date;

  @Column({ name: 'auto_renew_at', type: 'timestamp', nullable: true })
  autoRenewAt: Date;

  @Column({ name: 'auto_renew', default: false })
  autoRenew: boolean;

  @Column({ name: 'price_kobo', type: 'int', default: 0 })
  priceKobo: number;

  @Column({ name: 'renewal_price_kobo', type: 'int', default: 0 })
  renewalPriceKobo: number;

  @Column({ name: 'sms_received', default: 0 })
  smsReceived: number;

  @Column({ name: 'sms_sent', default: 0 })
  smsSent: number;

  @Column({ name: 'calls_received', default: 0 })
  callsReceived: number;

  @Column({ name: 'forwarding_config', type: 'jsonb', default: {} })
  forwardingConfig: Record<string, unknown>;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, unknown>;

  @Column({ name: 'workspace_id', nullable: true })
  workspaceId: string;

  @Column({ name: 'assigned_to_user_id', nullable: true })
  assignedToUserId: string;

  @ManyToOne(() => User, (u) => u.phoneNumbers, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @OneToMany(() => Message, (m) => m.phoneNumber)
  messages: Message[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
