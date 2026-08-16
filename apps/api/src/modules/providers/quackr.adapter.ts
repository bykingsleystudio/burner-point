import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from 'axios';
import { MessengerProviderAdapter, ProviderName, ProviderPricingResult } from '../global/provider.service';
import { RouteProduct } from '../global/provider.service';

/**
 * Quackr API Adapter
 * Production provider for rental-only workflow (verification handled by TextVerified/JuicySMS).
 * 
 * Contract: https://quackr.io/api
 * Auth: API key authentication
 * Currencies: USD (all amounts quoted/billed in USD)
 */

interface QuackrRentalResponse {
  id: string;
  status: 'active' | 'expired' | 'pending' | 'failed';
  phoneNumber: string;
  country: string;
  service: string;
  purchasedAt: string;
  expiresAt: string;
  price: { amount: string; currency: string };
  autoRenew: boolean;
  renewalPrice?: { amount: string; currency: string };
}

interface QuackrMessageResponse {
  id: string;
  rentalId: string;
  phoneNumber: string;
  fromNumber?: string;
  message: string;
  receivedAt: string;
  code?: string;
}

@Injectable()
export class QuackrAdapter implements MessengerProviderAdapter {
  provider = ProviderName.QUACKR;
  private readonly logger = new Logger(`Quackr Adapter`);
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeout: number;

  constructor(private configService: ConfigService) {
    this.baseUrl = configService.get<string>('QUACKR_BASE_URL') || 'https://quackr.io/api';
    this.apiKey = configService.get<string>('QUACKR_API_KEY') || '';
    this.timeout = parseInt(configService.get<string>('QUACKR_TIMEOUT_MS') || '15000', 10);
  }

  async sendSMS() {
    throw new Error('Quackr outbound SMS is not active; use rental workflow instead');
  }

  async buyNumber() {
    throw new Error('Quackr number rental must route through rental.createRental instead');
  }

  async releaseNumber() {
    this.logger.log('Quackr: release request (handled by provider expiry)');
  }

  async startCall() {
    throw new Error('Quackr voice is not active in this release');
  }

  async endCall() {
    throw new Error('Quackr voice is not active in this release');
  }

  async receiveWebhook(payload: Record<string, unknown>) {
    this.logger.log(`Quackr webhook received: ${JSON.stringify(payload)}`);
    return { success: true as const };
  }

  async lookupAvailability() {
    return [];
  }

  async getPricing(countryCode: string, product: RouteProduct): Promise<ProviderPricingResult> {
    return {
      provider: ProviderName.QUACKR,
      product,
      countryCode: countryCode.toUpperCase(),
      currency: 'USD',
      notes: 'Quackr pricing is per-service and dynamic; use the service availability endpoint for live rates.',
    };
  }

  /**
   * Create a rental (long-term number).
   */
  async createRental(
    country: string,
    service: string,
    durationDays: number = 30,
    autoRenew: boolean = false,
  ): Promise<QuackrRentalResponse> {
    if (!this.apiKey) throw new Error('QUACKR_API_KEY not configured');

    try {
      const response = await axios.post(
        `${this.baseUrl}/v1/rentals`,
        {
          country,
          service,
          durationDays,
          autoRenew,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'X-API-Key': this.apiKey,
          },
          timeout: this.timeout,
        },
      );

      if (!response.data?.id) {
        throw new Error('Quackr rental creation returned no rental ID');
      }

      return response.data;
    } catch (error) {
      throw this.handleError(error, 'createRental');
    }
  }

  /**
   * Get rental details.
   */
  async getRental(rentalId: string): Promise<QuackrRentalResponse> {
    if (!this.apiKey) throw new Error('QUACKR_API_KEY not configured');

    try {
      const response = await axios.get(`${this.baseUrl}/v1/rentals/${rentalId}`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'X-API-Key': this.apiKey,
        },
        timeout: this.timeout,
      });

      if (!response.data?.id) {
        throw new Error('Quackr rental lookup returned empty response');
      }

      return response.data;
    } catch (error) {
      throw this.handleError(error, 'getRental');
    }
  }

  /**
   * List rentals for this account.
   */
  async listRentals(status?: 'active' | 'expired') {
    if (!this.apiKey) throw new Error('QUACKR_API_KEY not configured');

    try {
      const params = status ? { status } : undefined;
      const response = await axios.get(`${this.baseUrl}/v1/rentals`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'X-API-Key': this.apiKey,
        },
        params,
        timeout: this.timeout,
      });

      return response.data?.rentals || [];
    } catch (error) {
      throw this.handleError(error, 'listRentals');
    }
  }

  /**
   * Get SMS messages for a rental.
   */
  async getRentalMessages(rentalId: string): Promise<QuackrMessageResponse[]> {
    if (!this.apiKey) throw new Error('QUACKR_API_KEY not configured');

    try {
      const response = await axios.get(`${this.baseUrl}/v1/rentals/${rentalId}/messages`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'X-API-Key': this.apiKey,
        },
        timeout: this.timeout,
      });

      return response.data?.messages || [];
    } catch (error) {
      throw this.handleError(error, 'getRentalMessages');
    }
  }

  /**
   * Extend a rental (add more days).
   */
  async extendRental(rentalId: string, durationDays: number = 30): Promise<QuackrRentalResponse> {
    if (!this.apiKey) throw new Error('QUACKR_API_KEY not configured');

    try {
      const response = await axios.post(
        `${this.baseUrl}/v1/rentals/${rentalId}/extend`,
        { durationDays },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'X-API-Key': this.apiKey,
          },
          timeout: this.timeout,
        },
      );

      return response.data;
    } catch (error) {
      throw this.handleError(error, 'extendRental');
    }
  }

  /**
   * Cancel a rental.
   */
  async cancelRental(rentalId: string): Promise<void> {
    if (!this.apiKey) throw new Error('QUACKR_API_KEY not configured');

    try {
      await axios.post(
        `${this.baseUrl}/v1/rentals/${rentalId}/cancel`,
        {},
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'X-API-Key': this.apiKey,
          },
          timeout: this.timeout,
        },
      );
    } catch (error) {
      throw this.handleError(error, 'cancelRental');
    }
  }

  /**
   * Update rental settings (including auto-renewal).
   */
  async updateRental(rentalId: string, updates: { autoRenew?: boolean }): Promise<QuackrRentalResponse> {
    if (!this.apiKey) throw new Error('QUACKR_API_KEY not configured');

    try {
      const response = await axios.patch(
        `${this.baseUrl}/v1/rentals/${rentalId}`,
        updates,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'X-API-Key': this.apiKey,
          },
          timeout: this.timeout,
        },
      );

      return response.data;
    } catch (error) {
      throw this.handleError(error, 'updateRental');
    }
  }

  /**
   * Check available services for a country.
   */
  async getAvailableServices(country: string) {
    if (!this.apiKey) throw new Error('QUACKR_API_KEY not configured');

    try {
      const response = await axios.get(`${this.baseUrl}/v1/availability/${country}`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'X-API-Key': this.apiKey,
        },
        timeout: this.timeout,
      });

      return response.data?.services || [];
    } catch (error) {
      throw this.handleError(error, 'getAvailableServices');
    }
  }

  /**
   * Get pricing information for a service.
   */
  async getServicePricing(country: string, service: string) {
    if (!this.apiKey) throw new Error('QUACKR_API_KEY not configured');

    try {
      const response = await axios.get(`${this.baseUrl}/v1/pricing`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'X-API-Key': this.apiKey,
        },
        params: { country, service },
        timeout: this.timeout,
      });

      return response.data;
    } catch (error) {
      throw this.handleError(error, 'getServicePricing');
    }
  }

  private handleError(error: unknown, operation: string): Error {
    if (error instanceof AxiosError) {
      const code = error.response?.data?.code || error.response?.data?.error || 'unknown_error';
      const status = error.response?.status || error.code;
      const message = error.response?.data?.message || error.response?.data?.detail || error.message;

      const errorMsg = `Quackr ${operation} failed [${status}/${code}]: ${message}`;
      this.logger.error(errorMsg);
      return new Error(errorMsg);
    }

    const msg = `Quackr ${operation} failed: ${error instanceof Error ? error.message : String(error)}`;
    this.logger.error(msg);
    return new Error(msg);
  }
}
