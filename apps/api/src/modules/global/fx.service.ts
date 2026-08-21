import { Injectable, Logger, BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { countries } from 'countries-list';
import { currencies } from 'countries-list/currencies';
import { RedisService } from './redis.service';

export const PLATFORM_CURRENCY = 'USD' as const;
const FX_CACHE_KEY = 'fx:USD:latest';

export interface FxRateResponse {
  available: boolean;
  baseCurrency: 'USD';
  quoteCurrency: string;
  rate?: number;
  provider: string;
  providerTimestamp?: string;
  fetchedAt?: string;
  expiresAt?: string;
  cached?: boolean;
  displayAmount?: number;
}

interface CachedRates {
  base: string;
  rates: Record<string, number>;
  providerTimestamp: string;
  fetchedAt: string;
  expiresAt: string;
}

@Injectable()
export class FxService {
  private readonly logger = new Logger(FxService.name);
  private readonly provider = 'forexrateapi';

  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  getSupportedCurrencies(): string[] {
    return [...new Set(Object.values(countries).flatMap((country) => country.currency))].sort();
  }

  currencyForCountry(countryCode?: string | null): string {
    const normalized = countryCode?.trim().toUpperCase();
    if (!normalized || normalized === 'US') return PLATFORM_CURRENCY;
    const country = countries[normalized as keyof typeof countries];
    return country?.currency?.[0] ?? PLATFORM_CURRENCY;
  }

  currencyMetadata(code: string) {
    const normalized = this.validateCurrency(code);
    const locale = normalized === PLATFORM_CURRENCY ? 'en-US' : 'en';
    return {
      code: normalized,
      symbol: new Intl.NumberFormat(locale, { style: 'currency', currency: normalized })
        .formatToParts(0)
        .find((part) => part.type === 'currency')?.value ?? normalized,
      name: new Intl.DisplayNames(['en'], { type: 'currency' }).of(normalized) ?? normalized,
    };
  }

  async getRate(quoteCurrency: string): Promise<FxRateResponse> {
    const quote = this.validateCurrency(quoteCurrency);
    if (quote === PLATFORM_CURRENCY) {
      const now = new Date().toISOString();
      return {
        available: true,
        baseCurrency: PLATFORM_CURRENCY,
        quoteCurrency: quote,
        rate: 1,
        provider: 'platform',
        providerTimestamp: now,
        fetchedAt: now,
        expiresAt: now,
      };
    }

    const cached = await this.readCache();
    if (cached?.rates[quote]) return this.toResponse(cached, quote, true);

    try {
      const fresh = await this.fetchRates();
      return this.toResponse(fresh, quote, false);
    } catch (error) {
      this.logger.error({
        event: 'fx_provider_error',
        provider: this.provider,
        quoteCurrency: quote,
        message: error instanceof Error ? error.message : 'Unknown FX provider error',
      });
      return {
        available: false,
        baseCurrency: PLATFORM_CURRENCY,
        quoteCurrency: quote,
        provider: this.provider,
      };
    }
  }

  async convertUsdToLocal(amountUsd: number, quoteCurrency: string): Promise<FxRateResponse> {
    if (!Number.isFinite(amountUsd) || amountUsd < 0) {
      throw new BadRequestException('amountUsd must be a non-negative number');
    }
    const result = await this.getRate(quoteCurrency);
    return result.available && result.rate !== undefined
      ? { ...result, displayAmount: amountUsd * result.rate }
      : result;
  }

  async convertUsdCentsToMinor(usdCents: number, quoteCurrency: string) {
    const quote = this.validateCurrency(quoteCurrency);
    if (quote === PLATFORM_CURRENCY) return { amountMinor: Math.round(usdCents), fx: null };
    const result = await this.getRate(quote);
    if (!result.available || result.rate === undefined) {
      throw new ServiceUnavailableException('FX conversion is temporarily unavailable');
    }
    return {
      amountMinor: Math.max(1, Math.round((usdCents / 100) * result.rate * 100)),
      fx: {
        sourceCurrency: PLATFORM_CURRENCY,
        targetCurrency: quote,
        sourceAmount: usdCents / 100,
        targetAmount: (usdCents / 100) * result.rate,
        fxRate: result.rate,
        fxProvider: result.provider,
        fxTimestamp: result.providerTimestamp,
      },
    };
  }

  validateCurrency(code: string): string {
    const normalized = code?.trim().toUpperCase();
    if (!normalized || !/^[A-Z]{3}$/.test(normalized)) {
      throw new BadRequestException('Unsupported ISO 4217 currency');
    }
    if (!(normalized in currencies)) {
      throw new BadRequestException('Unsupported ISO 4217 currency');
    }
    try {
      new Intl.NumberFormat('en', { style: 'currency', currency: normalized }).format(0);
    } catch {
      throw new BadRequestException('Unsupported ISO 4217 currency');
    }
    return normalized;
  }

  private async fetchRates(): Promise<CachedRates> {
    const apiKey = this.configService.get<string>('FOREXRATEAPI_API_KEY')?.trim();
    if (!apiKey) throw new Error('FOREXRATEAPI_API_KEY is not configured');

    const baseUrl = (this.configService.get<string>('FOREXRATEAPI_BASE_URL') || 'https://api.forexrateapi.com').replace(/\/+$/, '');

    const response = await axios.get<{ base: string; rates: Record<string, number>; updated_at?: string }>(
      `${baseUrl}/v1/latest`,
      {
        params: { base: PLATFORM_CURRENCY },
        headers: { 'X-API-KEY': apiKey },
        timeout: 10000,
      },
    );

    if (response.data.base !== PLATFORM_CURRENCY || !response.data.rates) {
      throw new Error('FX provider returned an unexpected response format');
    }

    const fetchedAt = new Date().toISOString();
    const ttl = this.configService.get<number>('FX_CACHE_TTL_SECONDS') ?? 3600;
    const expiresAt = new Date(Date.now() + Math.max(60, ttl) * 1000).toISOString();
    const payload: CachedRates = {
      base: PLATFORM_CURRENCY,
      rates: response.data.rates,
      providerTimestamp: response.data.updated_at ? new Date(response.data.updated_at).toISOString() : fetchedAt,
      fetchedAt,
      expiresAt,
    };
    await this.redisService.set(FX_CACHE_KEY, JSON.stringify(payload), Math.max(60, ttl));
    return payload;
  }

  private async readCache(): Promise<CachedRates | null> {
    const raw = await this.redisService.get(FX_CACHE_KEY);
    if (!raw) return null;
    try {
      const cached = JSON.parse(raw) as CachedRates;
      if (cached.base !== PLATFORM_CURRENCY || !cached.rates || new Date(cached.expiresAt) <= new Date()) return null;
      return cached;
    } catch {
      return null;
    }
  }

  private toResponse(payload: CachedRates, quote: string, cached: boolean): FxRateResponse {
    return {
      available: true,
      baseCurrency: PLATFORM_CURRENCY,
      quoteCurrency: quote,
      rate: payload.rates[quote],
      provider: this.provider,
      providerTimestamp: payload.providerTimestamp,
      fetchedAt: payload.fetchedAt,
      expiresAt: payload.expiresAt,
      cached,
    };
  }
}