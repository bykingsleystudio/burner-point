import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface FxRate {
  baseCurrency: 'USD';
  quoteCurrency: string;
  rate: number;
  timestamp: number;
  provider: 'forexrateapi' | 'cache';
}

@Injectable()
export class FxRateService {
  private readonly cache = new Map<string, FxRate>();

  constructor(private readonly config: ConfigService) {}

  async getUsdToLocalRate(quoteCurrency: string): Promise<FxRate> {
    const quote = quoteCurrency.trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(quote)) throw new ServiceUnavailableException('Invalid quote currency');
    if (quote === 'USD') {
      return { baseCurrency: 'USD', quoteCurrency: 'USD', rate: 1, timestamp: Date.now(), provider: 'forexrateapi' };
    }

    const cached = this.cache.get(quote);
    const apiKey = this.config.get<string>('FOREXRATEAPI_API_KEY')?.trim();
    if (!apiKey) {
      if (cached) return { ...cached, provider: 'cache' };
      throw new ServiceUnavailableException('FX provider is not configured');
    }

    const baseUrl = (this.config.get<string>('FOREXRATEAPI_BASE_URL') || 'https://api.forexrateapi.com').replace(/\/+$/, '');
    try {
      const response = await axios.get(`${baseUrl}/v1/latest`, {
        params: { base: 'USD', currencies: quote },
        headers: { 'X-API-KEY': apiKey },
        timeout: 5000,
      });
      const rate = Number(response.data?.rates?.[quote]);
      if (!Number.isFinite(rate) || rate <= 0) throw new Error('Invalid FX response');
      const result: FxRate = {
        baseCurrency: 'USD',
        quoteCurrency: quote,
        rate,
        timestamp: Number(response.data?.timestamp ?? Date.now()),
        provider: 'forexrateapi',
      };
      this.cache.set(quote, result);
      return result;
    } catch (error) {
      if (cached) return { ...cached, provider: 'cache' };
      throw new ServiceUnavailableException('FX provider request failed', { cause: error as Error });
    }
  }
}