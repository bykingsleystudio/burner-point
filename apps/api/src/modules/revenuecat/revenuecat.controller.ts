import { Body, Controller, Headers, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RevenueCatService } from './revenuecat.service';

@ApiTags('webhooks')
@Controller('webhooks')
export class RevenueCatController {
  constructor(private readonly revenueCatService: RevenueCatService) {}

  @Post('revenuecat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'RevenueCat subscription webhook' })
  handleRevenueCatWebhook(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() body: { api_version?: string; event?: Record<string, unknown> },
  ) {
    return this.revenueCatService.handleWebhook(headers, body);
  }
}
