import { Controller, Get, Post, Delete, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { NumbersService } from './numbers.service';
import { ApiKeyOrJwtGuard } from '../api-platform/api-key.guard';
import { ApiScopes } from '../api-platform/api-scopes.decorator';
import { NumberType } from '../../database/entities/phone-number.entity';
import { IsString, IsEnum, IsOptional, IsInt, Min, Max } from 'class-validator';

class ProvisionDto {
  @IsString() phoneNumber: string;
  @IsEnum(NumberType) type: NumberType;
  @IsString() countryCode: string;
  @IsOptional()
  @IsString()
  idempotencyKey?: string;
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  durationDays?: number;
}

class SearchDto {
  @IsString()
  country: string;

  @IsOptional()
  @IsString()
  areaCode?: string;

  @IsOptional()
  @IsEnum(NumberType)
  type?: NumberType;
}

@ApiTags('numbers')
@ApiBearerAuth()
@UseGuards(ApiKeyOrJwtGuard)
@Controller('numbers')
export class NumbersController {
  constructor(private service: NumbersService) {}

  @Get('search')
  @ApiScopes('numbers:read')
  @ApiOperation({ summary: 'Search available numbers' })
  @ApiQuery({ name: 'country', required: true })
  @ApiQuery({ name: 'areaCode', required: false })
  @ApiQuery({ name: 'type', required: false, enum: NumberType })
  search(@Query() query: SearchDto) {
    return this.service.searchAvailable(query.country, query.areaCode, query.type);
  }

  @Post('provision')
  @ApiScopes('numbers:write')
  @ApiOperation({ summary: 'Provision a phone number' })
  provision(@Body() dto: ProvisionDto, @Req() req) {
    return this.service.provision(req.user.id, dto.phoneNumber, dto.type, dto.countryCode, dto.durationDays, dto.idempotencyKey);
  }

  @Get()
  @ApiScopes('numbers:read')
  @ApiOperation({ summary: 'List my numbers' })
  list(@Req() req) { return this.service.getUserNumbers(req.user.id); }

  @Get(':id')
  @ApiScopes('numbers:read')
  @ApiOperation({ summary: 'Get number details' })
  get(@Param('id') id: string, @Req() req) { return this.service.getNumber(id, req.user.id); }

  @Post(':id/renew')
  @ApiScopes('numbers:write')
  @ApiOperation({ summary: 'Renew a number for 30 more days' })
  renew(@Param('id') id: string, @Req() req) { return this.service.renew(id, req.user.id); }

  @Delete(':id')
  @ApiScopes('numbers:write')
  @ApiOperation({ summary: 'Release / destroy a number' })
  release(@Param('id') id: string, @Req() req) { return this.service.release(id, req.user.id); }
}
