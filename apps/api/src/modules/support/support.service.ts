import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  SupportTicket,
  SupportTicketPriority,
  SupportTicketStatus,
} from '../../database/entities/extended-entities';
import { MessagingService } from '../messaging/messaging.service';
import { UsersService } from '../users/users.service';
import { SupportMessage } from '../../database/entities/support-message.entity';

export interface CreateSupportTicketInput {
  category: string;
  product?: string;
  subject: string;
  message: string;
  priority?: SupportTicketPriority;
  reference?: string;
}

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);

  constructor(
    @InjectRepository(SupportTicket)
    private readonly supportTicketRepo: Repository<SupportTicket>,
    private readonly usersService: UsersService,
    private readonly messagingService: MessagingService,
    @InjectRepository(SupportMessage)
    private readonly supportMessageRepo: Repository<SupportMessage>,
  ) {}

  async listTickets(userId: string, status?: SupportTicketStatus) {
    return this.supportTicketRepo.find({
      where: status ? { userId, status } : { userId },
      order: { updatedAt: 'DESC', createdAt: 'DESC' },
    });
  }

  async getTicket(userId: string, id: string) {
    const ticket = await this.supportTicketRepo.findOne({ where: { id, userId } });
    if (!ticket) throw new NotFoundException('Support ticket not found');
    const messages = await this.supportMessageRepo.find({ where: { ticketId: id, userId }, order: { createdAt: 'ASC' } });
    return { ...ticket, messages };
  }

  async replyToTicket(userId: string, ticketId: string, message: string) {
    const ticket = await this.supportTicketRepo.findOne({ where: { id: ticketId, userId } });
    if (!ticket) throw new NotFoundException('Support ticket not found');
    const reply = await this.supportMessageRepo.save(this.supportMessageRepo.create({ ticketId, userId, authorRole: 'customer', message: message.trim() }));
    await this.supportTicketRepo.update(ticket.id, { lastReplyAt: new Date(), status: SupportTicketStatus.OPEN });
    return reply;
  }

  async submitFeedback(userId: string, input: { rating: number; message: string; reference?: string }) {
    return this.createTicket(userId, {
      category: 'other',
      product: 'Support feedback',
      subject: `Support feedback (${input.rating}/5)`,
      message: input.message,
      priority: SupportTicketPriority.NORMAL,
      reference: input.reference,
    });
  }

  async createTicket(userId: string, input: CreateSupportTicketInput) {
    const user = await this.usersService.findById(userId);
    const ticket = await this.supportTicketRepo.save(
      this.supportTicketRepo.create({
        userId,
        ticketNumber: this.generateTicketNumber(),
        category: input.category.trim(),
        product: input.product?.trim() || null,
        subject: input.subject.trim(),
        message: input.message.trim(),
        priority: input.priority ?? SupportTicketPriority.NORMAL,
        reference: input.reference?.trim() || null,
        status: SupportTicketStatus.OPEN,
        metadata: {
          source: 'dashboard',
          userEmail: user?.email ?? null,
        },
      }),
    );

    try {
      await this.messagingService.sendSupportIntake({
        name: [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() || 'Burner Point customer',
        email: user?.email || 'info@burnerpoint.com',
        product: input.product || input.category,
        reference: input.reference || ticket.ticketNumber,
        source: `dashboard-ticket:${ticket.ticketNumber}`,
        message: `${input.subject.trim()}\n\n${input.message.trim()}`,
      });
    } catch (error) {
      this.logger.warn(`Support email notification failed for ${ticket.ticketNumber}: ${error instanceof Error ? error.message : String(error)}`);
    }

    return ticket;
  }

  private generateTicketNumber() {
    const random = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `BP-${random}`;
  }
}
