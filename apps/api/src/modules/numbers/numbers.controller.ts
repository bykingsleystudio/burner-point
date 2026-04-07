import { Controller, Get, Post, Delete, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { NumbersService } from './numbers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NumberType } from '../../database/entities/phone-number.entity';
import { IsString, IsEnum, IsOptional } from 'class-validator';

class ProvisionDto {
  @IsString() phoneNumber: string;
  @IsEnum(NumberType) type: NumberType;
  @IsString() countryCode: string;
}

@ApiTags('numbers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('numbers')
export class NumbersController {
  constructor(private service: NumbersService) {}

  @Get('search')
  @ApiOperation({ summary: 'Search available numbers' })
  @ApiQuery({ name: 'country', required: true })
  @ApiQuery({ name: 'areaCode', required: false })
  search(@Query('country') country: string, @Query('areaCode') areaCode?: string) {
    return this.service.searchAvailable(country, areaCode);
  }

  @Post('provision')
  @ApiOperation({ summary: 'Provision a phone number' })
  provision(@Body() dto: ProvisionDto, @Req() req) {
    return this.service.provision(req.user.id, dto.phoneNumber, dto.type, dto.countryCode);
  }

  @Get()
  @ApiOperation({ summary: 'List my numbers' })
  list(@Req() req) { return this.service.getUserNumbers(req.user.id); }

  @Get(':id')
  @ApiOperation({ summary: 'Get number details' })
  get(@Param('id') id: string, @Req() req) { return this.service.getNumber(id, req.user.id); }

  @Post(':id/renew')
  @ApiOperation({ summary: 'Renew a number for 30 more days' })
  renew(@Param('id') id: string, @Req() req) { return this.service.renew(id, req.user.id); }

  @Delete(':id')
  @ApiOperation({ summary: 'Release / destroy a number' })
  release(@Param('id') id: string, @Req() req) { return this.service.release(id, req.user.id); }
}
