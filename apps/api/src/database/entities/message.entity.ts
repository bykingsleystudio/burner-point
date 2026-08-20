import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { User } from './user.entity';
import { PhoneNumber } from './phone-number.entity';

export enum MessageDirection { INBOUND = 'inbound', OUTBOUND = 'outbound' }
export enum MessageStatus { PENDING = 'pending', QUEUED = 'queued', SENT = 'sent', DELIVERED = 'delivered', FAILED = 'failed', RECEIVED = 'received', UNREAD = 'unread', READ = 'read' }
export enum MessageType { SMS = 'sms', MMS = 'mms' }

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'from_number' })
  @Index()
  from: string;

  @Column({ name: 'to_number' })
  @Index()
  to: string;

  @Column({ type: 'text', nullable: true })
  body: string;

  @Column({ type: 'enum', enum: MessageDirection })
  direction: MessageDirection;

  @Column({ type: 'enum', enum: MessageStatus, default: MessageStatus.PENDING })
  status: MessageStatus;

  @Column({ type: 'enum', enum: MessageType, default: MessageType.SMS })
  type: MessageType;

  @Column({ name: 'provider_message_id', nullable: true })
  providerMessageSid: string;

  @Column({ name: 'num_segments', type: 'int', default: 0 })
  numSegments: number;

  @Column({ name: 'price_usd_cents', type: 'int', default: 0 })
  priceUsdCents: number;

  @Column({ nullable: true })
  aiClassification: string;

  @Column({ nullable: true })
  extractedOtp: string;

  @Column({ type: 'float', default: 0 })
  spamScore: number;

  @Column({ default: false })
  isSpam: boolean;

  @Column({ type: 'jsonb', default: [] })
  mediaUrls: string[];

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, unknown>;

  @Column({ nullable: true, type: 'timestamp' })
  readAt: Date;

  @ManyToOne(() => User, (u) => u.messages, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @ManyToOne(() => PhoneNumber, (pn) => pn.messages, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'phone_number_id' })
  phoneNumber: PhoneNumber;

  @Column({ name: 'phone_number_id', nullable: true })
  phoneNumberId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
