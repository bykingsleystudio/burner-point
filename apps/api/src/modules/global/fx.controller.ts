import { Controller, Get, Query } from '@nestjs/common';
import { FxService } from './fx.service';

@Controller('fx')
export class FxController {
  constructor(private readonly fxService: FxService) {}

  @Get('rates')
  rates(@Query('currency') currency = 'USD') {
    return this.fxService.getRate(currency);
  }
  
  @Get('currency-for-country')
  currencyForCountry(@Query('country') country?: string) {
    const currency = this.fxService.currencyForCountry(country);
    return { countryCode: country?.trim().toUpperCase() || null, currency, metadata: this.fxService.currencyMetadata(currency) };
  }

  @Get('convert')
  convert(@Query('amount') amount: string, @Query('to') currency = 'USD') {
    return this.fxService.convertUsdToLocal(Number(amount), currency);
  }
}