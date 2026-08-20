import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsString, Matches, MaxLength, MinLength, IsUrl } from 'class-validator';
import { ProviderName } from '../global/provider.service';
import { MessagesService } from './messages.service';
import { ApiKeyOrJwtGuard } from '../api-platform/api-key.guard';
import { ApiScopes } from '../api-platform/api-scopes.decorator';

class SendMessageDto {
  @Matches(/^\+[1-9]\d{6,14}$/)
  from: string;

  @Matches(/^\+[1-9]\d{6,14}$/)
  to: string;

  @IsString()
  @MinLength(1)
  @MaxLength(1600)
  body: string;

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  @MaxLength(8, { each: true })
  mediaUrls?: string[];

  @IsOptional()
  @IsEnum(ProviderName)
  preferredProvider?: ProviderName;
}

@ApiTags('messages')
@ApiBearerAuth()
@UseGuards(ApiKeyOrJwtGuard)
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  @ApiScopes('messages:read')
  list(
    @Req() req,
    @Query('phoneNumberId') phoneNumberId: string,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.messagesService.list(req.user.id, phoneNumberId, page, limit);
  }

  @Get('conversations/:phoneNumberId/:counterpart')
  @ApiScopes('messages:read')
  conversation(
    @Req() req,
    @Param('phoneNumberId') phoneNumberId: string,
    @Param('counterpart') counterpart: string,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.messagesService.getConversation(req.user.id, phoneNumberId, counterpart, page, limit);
  }

  @Post()
  @ApiScopes('messages:write')
  send(@Req() req, @Body() dto: SendMessageDto) {
    return this.messagesService.send(req.user.id, dto);
  }

  @Patch(':id/read')
  @ApiScopes('messages:write')
  markRead(@Req() req, @Param('id') id: string) {
    return this.messagesService.markRead(req.user.id, id);
  }
}
