import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsEnum, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  SupportTicketPriority,
  SupportTicketStatus,
} from '../../database/entities/extended-entities';
import { SupportService } from './support.service';

class CreateSupportTicketDto {
  @IsIn(['account', 'billing', 'verification', 'rental', 'messenger', 'esim', 'proxy', 'vpn', 'security', 'other'])
  category: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  product?: string;

  @IsString()
  @MaxLength(140)
  subject: string;

  @IsString()
  @MaxLength(4000)
  message: string;

  @IsOptional()
  @IsEnum(SupportTicketPriority)
  priority?: SupportTicketPriority;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  reference?: string;
}

class SupportReplyDto { @IsString() @MaxLength(4000) message: string; }
class SupportFeedbackDto { @IsIn([1, 2, 3, 4, 5]) rating: number; @IsString() @MaxLength(4000) message: string; @IsOptional() @IsString() @MaxLength(120) reference?: string; }

@ApiTags('support')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get('tickets')
  @ApiOperation({ summary: 'List authenticated user support tickets' })
  listTickets(
    @Req() req: { user: { id: string } },
    @Query('status') status?: SupportTicketStatus,
  ) {
    return this.supportService.listTickets(req.user.id, status);
  }

  @Get('tickets/:id')
  @ApiOperation({ summary: 'Get one authenticated user support ticket' })
  getTicket(@Req() req: { user: { id: string } }, @Param('id') id: string) {
    return this.supportService.getTicket(req.user.id, id);
  }

  @Post('tickets')
  @ApiOperation({ summary: 'Create a support ticket for the authenticated user' })
  createTicket(@Req() req: { user: { id: string } }, @Body() dto: CreateSupportTicketDto) {
    return this.supportService.createTicket(req.user.id, dto);
  }

  @Post('tickets/:id/replies')
  @ApiOperation({ summary: 'Reply to an authenticated user support ticket' })
  reply(@Req() req: { user: { id: string } }, @Param('id') id: string, @Body() dto: SupportReplyDto) {
    return this.supportService.replyToTicket(req.user.id, id, dto.message);
  }

  @Post('feedback')
  @ApiOperation({ summary: 'Submit authenticated user support feedback' })
  feedback(@Req() req: { user: { id: string } }, @Body() dto: SupportFeedbackDto) {
    return this.supportService.submitFeedback(req.user.id, dto);
  }
}
