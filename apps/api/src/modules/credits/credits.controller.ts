import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreditsService } from './credits.service';
import { InternalApiKeyGuard } from './internal-api-key.guard';

class PurchaseCreditsDto {
  @IsString()
  @MaxLength(80)
  packageId: string;

  @IsString()
  @MaxLength(180)
  idempotencyKey: string;
}

class InternalLockDto {
  @IsString()
  @MaxLength(120)
  userId: string;

  @IsInt()
  @Min(1)
  creditsAmount: number;

  @IsString()
  @MaxLength(180)
  idempotencyKey: string;

  @IsString()
  @MaxLength(160)
  reason: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  relatedProduct?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  relatedEntityId?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

class InternalSpendDto {
  @IsString()
  @MaxLength(120)
  userId: string;

  @IsString()
  @MaxLength(120)
  lockId: string;

  @IsString()
  @MaxLength(180)
  idempotencyKey: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  creditsAmount?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  usdValueCents?: number;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  relatedProduct?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  relatedEntityId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  description?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

class InternalReleaseDto {
  @IsString()
  @MaxLength(120)
  userId: string;

  @IsString()
  @MaxLength(120)
  lockId: string;

  @IsString()
  @MaxLength(180)
  idempotencyKey: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  description?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

class InternalRefundDto {
  @IsString()
  @MaxLength(120)
  userId: string;

  @IsInt()
  @Min(1)
  creditsAmount: number;

  @IsString()
  @MaxLength(180)
  idempotencyKey: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  usdValueCents?: number;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  relatedProduct?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  relatedEntityId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  description?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

class WalletLockDto {
  @IsString()
  @MaxLength(120)
  userId: string;

  @IsInt()
  @Min(1)
  amountUsdCents: number;

  @IsString()
  @MaxLength(180)
  idempotencyKey: string;

  @IsString()
  @MaxLength(160)
  reason: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  relatedProduct?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  relatedEntityId?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

class WalletSpendDto {
  @IsString()
  @MaxLength(120)
  userId: string;

  @IsString()
  @MaxLength(120)
  lockId: string;

  @IsString()
  @MaxLength(180)
  idempotencyKey: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  amountUsdCents?: number;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  relatedProduct?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  relatedEntityId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  description?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

class WalletReleaseDto {
  @IsString()
  @MaxLength(120)
  userId: string;

  @IsString()
  @MaxLength(120)
  lockId: string;

  @IsString()
  @MaxLength(180)
  idempotencyKey: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  description?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

class WalletRefundDto {
  @IsString()
  @MaxLength(120)
  userId: string;

  @IsInt()
  @Min(1)
  amountUsdCents: number;

  @IsString()
  @MaxLength(180)
  idempotencyKey: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  relatedProduct?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  relatedEntityId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  description?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

@ApiTags('messenger-call-credits')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('messenger/call-credits')
export class CallCreditsController {
  constructor(private readonly creditsService: CreditsService) {}

  @Get('balance')
  @ApiOperation({ summary: 'Get BP Messenger call credit balance' })
  async balance(@Req() req: { user: { id: string } }) {
    const balance = await this.creditsService.getBalance(req.user.id);
    return {
      wallet: balance.wallet,
      callCredits: balance.credits,
    };
  }

  @Get('packages')
  @ApiOperation({ summary: 'Get active BP Messenger call credit packages' })
  packages() {
    return this.creditsService.getPackages();
  }

  @Post('purchase')
  @ApiOperation({ summary: 'Purchase BP Messenger call credits from wallet balance' })
  purchase(@Req() req: { user: { id: string } }, @Body() dto: PurchaseCreditsDto) {
    return this.creditsService.purchaseCredits(req.user.id, dto.packageId, dto.idempotencyKey);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get BP Messenger call credit transaction history' })
  transactions(
    @Req() req: { user: { id: string } },
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.creditsService.listTransactions(req.user.id, +page, +limit);
  }

  @Get('rates')
  @ApiOperation({ summary: 'Get BP Messenger call credit rates' })
  rates() {
    return this.creditsService.getCallCreditRates();
  }
}

@ApiTags('messenger-call-credits-internal')
@UseGuards(InternalApiKeyGuard)
@Controller('internal/messenger/call-credits')
export class InternalCallCreditsController {
  constructor(private readonly creditsService: CreditsService) {}

  @Post('lock')
  @ApiOperation({ summary: 'Internally lock BP Messenger call credits for a pending call action' })
  lock(@Body() dto: InternalLockDto) {
    return this.creditsService.createLock({
      ...dto,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
    });
  }

  @Post('spend')
  @ApiOperation({ summary: 'Internally convert a call credit lock into spend' })
  spend(@Body() dto: InternalSpendDto) {
    return this.creditsService.spendLock(dto);
  }

  @Post('release')
  @ApiOperation({ summary: 'Internally release a call credit lock' })
  release(@Body() dto: InternalReleaseDto) {
    return this.creditsService.releaseLock(dto);
  }

  @Post('refund')
  @ApiOperation({ summary: 'Internally refund BP Messenger call credits' })
  refund(@Body() dto: InternalRefundDto) {
    return this.creditsService.refundCredits(dto);
  }
}

@ApiTags('wallet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wallet')
export class WalletController {
  constructor(private readonly creditsService: CreditsService) {}

  @Get('balance')
  @ApiOperation({ summary: 'Get wallet balance' })
  balance(@Req() req: { user: { id: string } }) {
    return this.creditsService.getWalletBalance(req.user.id);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get wallet transaction history' })
  transactions(
    @Req() req: { user: { id: string } },
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.creditsService.listWalletTransactions(req.user.id, +page, +limit);
  }
}

@ApiTags('wallet-internal')
@UseGuards(InternalApiKeyGuard)
@Controller('internal/wallet')
export class InternalWalletController {
  constructor(private readonly creditsService: CreditsService) {}

  @Post('lock')
  @ApiOperation({ summary: 'Internally lock wallet balance for a pending product action' })
  lock(@Body() dto: WalletLockDto) {
    return this.creditsService.createWalletLock({
      ...dto,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
    });
  }

  @Post('spend')
  @ApiOperation({ summary: 'Internally convert a wallet lock into a product charge' })
  spend(@Body() dto: WalletSpendDto) {
    return this.creditsService.spendWalletLock(dto);
  }

  @Post('release')
  @ApiOperation({ summary: 'Internally release a wallet lock' })
  release(@Body() dto: WalletReleaseDto) {
    return this.creditsService.releaseWalletLock(dto);
  }

  @Post('refund')
  @ApiOperation({ summary: 'Internally refund wallet balance' })
  refund(@Body() dto: WalletRefundDto) {
    return this.creditsService.refundWallet(dto);
  }
}
