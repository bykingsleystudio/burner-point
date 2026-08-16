import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from 'axios';
import { MessengerProviderAdapter, ProviderName, ProviderPricingResult } from '../global/provider.service';
import { RouteProduct } from '../global/provider.service';

/**
 * SMSPool API Adapter
 * Production provider for rental-only workflow (verification handled by TextVerified/JuicySMS).
 * 
 * Contract: https://app.smspool.net/api
 * Auth: API key in Authorization header
 * Currencies: USD (all amounts quoted/billed in USD)
 */

interface SMSPoolRentalResponse {
  ID: string;
  phonenumber: string;
  service: string;
  country: string;
  purchased_at: string;
  expires_at: string;
  rerent_before: string;
  status: 'active' | 'expired' | 'failed';
  price: number;
  renewal_price?: number;
}

interface SMSPoolMessageResponse {
  ID: string;
  phonenumber: string;
  serviceid: number;
  service: string;
  message: string;
  timestamp: string;
  country: string;
  receiver?: string;
}

@Injectable()
export class SMSPoolAdapter implements MessengerProviderAdapter {
  provider = ProviderName.SMSPOOL;
  private readonly logger = new Logger(`SMSPool Adapter`);
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeout: number;

  constructor(private configService: ConfigService) {
    this.baseUrl = configService.get<string>('SMSPOOL_BASE_URL') || 'https://app.smspool.net/api';
    this.apiKey = configService.get<string>('SMSPOOL_API_KEY') || '';
    this.timeout = parseInt(configService.get<string>('SMSPOOL_TIMEOUT_MS') || '15000', 10);
  }

  async sendSMS() {
    throw new Error('SMSPool outbound SMS is not active; use rental workflow instead');
  }

  async buyNumber() {
    throw new Error('SMSPool number rental must route through rental.createRental instead');
  }

  async releaseNumber() {
    this.logger.log('SMSPool: release request (handled by provider expiry)');
  }

  async startCall() {
    throw new Error('SMSPool voice is not active in this release');
  }

  async endCall() {
    throw new Error('SMSPool voice is not active in this release');
  }

  async receiveWebhook(payload: Record<string, unknown>) {
    this.logger.log(`SMSPool webhook received: ${JSON.stringify(payload)}`);
    return { success: true as const };
  }

  async lookupAvailability() {
    return [];
  }

  async getPricing(countryCode: string, product: RouteProduct): Promise<ProviderPricingResult> {
    return {
      provider: ProviderName.SMSPOOL,
      product,
      countryCode: countryCode.toUpperCase(),
      currency: 'USD',
      notes: 'SMSPool pricing is per-service and dynamic; use the country/service lookup endpoint for live rates.',
    };
  }

  /**
   * Create a rental (long-term number).
   */
  async createRental(country: string, service: string, days: number = 30): Promise<SMSPoolRentalResponse> {
    if (!this.apiKey) throw new Error('SMSPOOL_API_KEY not configured');

    try {
      const response = await axios.post(
        `${this.baseUrl}/rentalsms/create`,
        { country, service, duration: days },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: this.timeout,
        },
      );

      if (response.data?.success === false) {
        throw new Error(response.data?.message || 'SMSPool rental creation failed');
      }

      return response.data;
    } catch (error) {
      throw this.handleError(error, 'createRental');
    }
  }

  /**
   * Get rental details.
   */
  async getRental(rentalId: string): Promise<SMSPoolRentalResponse> {
    if (!this.apiKey) throw new Error('SMSPOOL_API_KEY not configured');

    try {
      const response = await axios.get(`${this.baseUrl}/rentalsms/get/${rentalId}`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
        timeout: this.timeout,
      });

      if (response.data?.success === false) {
        throw new Error(response.data?.message || 'SMSPool rental lookup failed');
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
    if (!this.apiKey) throw new Error('SMSPOOL_API_KEY not configured');

    try {
      const params = status ? { status } : undefined;
      const response = await axios.get(`${this.baseUrl}/rentalsms/list`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
        params,
        timeout: this.timeout,
      });

      if (response.data?.success === false) {
        throw new Error(response.data?.message || 'SMSPool rental list failed');
      }

      return response.data?.data || [];
    } catch (error) {
      throw this.handleError(error, 'listRentals');
    }
  }

  /**
   * Get SMS messages for a rental.
   */
  async getRentalMessages(rentalId: string): Promise<SMSPoolMessageResponse[]> {
    if (!this.apiKey) throw new Error('SMSPOOL_API_KEY not configured');

    try {
      const response = await axios.get(`${this.baseUrl}/rentalsms/messages/${rentalId}`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
        timeout: this.timeout,
      });

      if (response.data?.success === false) {
        throw new Error(response.data?.message || 'SMSPool message retrieval failed');
      }

      return response.data?.data || [];
    } catch (error) {
      throw this.handleError(error, 'getRentalMessages');
    }
  }

  /**
   * Renew a rental (extend expiry).
   */
  async renewRental(rentalId: string, days: number = 30): Promise<SMSPoolRentalResponse> {
    if (!this.apiKey) throw new Error('SMSPOOL_API_KEY not configured');

    try {
      const response = await axios.post(
        `${this.baseUrl}/rentalsms/renew/${rentalId}`,
        { duration: days },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: this.timeout,
        },
      );

      if (response.data?.success === false) {
        throw new Error(response.data?.message || 'SMSPool renewal failed');
      }

      return response.data;
    } catch (error) {
      throw this.handleError(error, 'renewRental');
    }
  }

  /**
   * Cancel a rental.
   */
  async cancelRental(rentalId: string): Promise<void> {
    if (!this.apiKey) throw new Error('SMSPOOL_API_KEY not configured');

    try {
      const response = await axios.post(
        `${this.baseUrl}/rentalsms/cancel/${rentalId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: this.timeout,
        },
      );

      if (response.data?.success === false) {
        throw new Error(response.data?.message || 'SMSPool cancellation failed');
      }
    } catch (error) {
      throw this.handleError(error, 'cancelRental');
    }
  }

  /**
   * Get pricing for a country/service combination.
   */
  async getPricingInfo(country: string, service: string) {
    if (!this.apiKey) throw new Error('SMSPOOL_API_KEY not configured');

    try {
      const response = await axios.get(`${this.baseUrl}/utilities/pricing`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
        params: { country, service },
        timeout: this.timeout,
      });

      if (response.data?.success === false) {
        throw new Error(response.data?.message || 'SMSPool pricing lookup failed');
      }

      return response.data?.data;
    } catch (error) {
      throw this.handleError(error, 'getPricingInfo');
    }
  }

  /**
   * Get available countries and services.
   */
  async getCountryServiceList(country?: string) {
    if (!this.apiKey) throw new Error('SMSPOOL_API_KEY not configured');

    try {
      const params = country ? { country } : undefined;
      const response = await axios.get(`${this.baseUrl}/utilities/services`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
        params,
        timeout: this.timeout,
      });

      if (response.data?.success === false) {
        throw new Error(response.data?.message || 'SMSPool service list failed');
      }

      return response.data?.data || [];
    } catch (error) {
      throw this.handleError(error, 'getCountryServiceList');
    }
  }

  private handleError(error: unknown, operation: string): Error {
    if (error instanceof AxiosError) {
      const code = error.response?.data?.code || error.response?.data?.error || 'unknown_error';
      const status = error.response?.status || error.code;
      const message = error.response?.data?.message || error.message;

      const errorMsg = `SMSPool ${operation} failed [${status}/${code}]: ${message}`;
      this.logger.error(errorMsg);
      return new Error(errorMsg);
    }

    const msg = `SMSPool ${operation} failed: ${error instanceof Error ? error.message : String(error)}`;
    this.logger.error(msg);
    return new Error(msg);
  }
}
