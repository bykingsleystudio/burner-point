import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('support_messages')
export class SupportMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'ticket_id' })
  @Index()
  ticketId: string;

  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @Column({ name: 'author_role', default: 'customer' })
  authorRole: 'customer' | 'agent' | 'system';

  @Column({ type: 'text' })
  message: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
