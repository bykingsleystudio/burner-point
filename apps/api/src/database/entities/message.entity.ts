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

  @Column()
  @Index()
  from: string;

  @Column()
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

  @Column({ nullable: true })
  providerMessageSid: string;

  @Column({ type: 'int', default: 0 })
  numSegments: number;

  @Column({ type: 'int', default: 0 })
  priceKobo: number;

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
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  userId: string;

  @ManyToOne(() => PhoneNumber, (pn) => pn.messages, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'phoneNumberId' })
  phoneNumber: PhoneNumber;

  @Column({ nullable: true })
  phoneNumberId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
