import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProviderName } from '../global/provider.service';
import { CallsService } from './calls.service';

class StartCallDto {
  @IsString()
  @MaxLength(32)
  to: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  fromNumberId?: string;

  @IsOptional()
  @IsEnum(ProviderName)
  preferredProvider?: ProviderName;

  @IsString()
  @MaxLength(180)
  idempotencyKey: string;
}

@ApiTags('messenger-calls')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('messenger/calls')
export class CallsController {
  constructor(private readonly callsService: CallsService) {}

  @Post('start')
  @ApiOperation({ summary: 'Start an outbound BP Messenger call' })
  start(@Req() req: { user: { id: string } }, @Body() dto: StartCallDto) {
    return this.callsService.startOutboundCall(req.user.id, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a BP Messenger call record' })
  getCall(@Req() req: { user: { id: string } }, @Param('id') id: string) {
    return this.callsService.getCall(req.user.id, id);
  }

  @Get()
  @ApiOperation({ summary: 'List BP Messenger calls' })
  listCalls(
    @Req() req: { user: { id: string } },
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.callsService.listCalls(
      req.user.id,
      Math.max(1, Number.parseInt(page, 10) || 1),
      Math.max(1, Number.parseInt(limit, 10) || 20),
    );
  }
}
