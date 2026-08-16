import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from 'axios';
import { MessengerProviderAdapter, ProviderName, ProviderPricingResult, ProviderNumberSearchResult, ProviderNumberPurchaseResult } from '../global/provider.service';
import { RouteProduct } from '../global/provider.service';

/**
 * JuicySMS v2 API Adapter
 * Verified production provider for verification and rental flows.
 * 
 * Contract: https://juicysms.com/api
 * Auth: Bearer token in Authorization header
 * Currencies: EUR (all amounts quoted/billed in EUR)
 */

interface JuicySmsService {
  id: number;
  name: string;
}

interface JuicySmsOrderResponse {
  object: 'order';
  id: number;
  status: 'pending' | 'completed' | 'cancelled' | 'expired';
  service: { id: number; name: string };
  country: string;
  country_iso: string;
  phone_number: string;
  phone_number_local: string;
  price: { amount: string; amount_minor: number; currency: string };
  charged: boolean;
  code?: string;
  messages: Array<{
    id: number;
    sender: string;
    text: string;
    code?: string;
    received_at: string;
    source: string;
  }>;
  created_at: string;
  expires_at: string;
}

interface JuicySmsMessagesResponse {
  data: Array<{
    object: 'message';
    id: number;
    sender: string;
    text: string;
    code?: string;
    received_at: string;
    source: string;
  }>;
  order_id: number;
  order_status: 'pending' | 'completed' | 'cancelled' | 'expired';
}

interface JuicySmsRentalResponse {
  object: 'rental';
  id: number;
  status: 'active' | 'expired' | 'cancelled';
  country: string;
  country_iso: string;
  phone_number: string;
  phone_number_local: string;
  package: string;
  price: { amount: string; amount_minor: number; currency: string };
  auto_renew: boolean;
  created_at: string;
  expires_at: string;
}

@Injectable()
export class JuicySmsAdapter implements MessengerProviderAdapter {
  provider = ProviderName.JUICYSMS;
  private readonly logger = new Logger(`JuicySMS Adapter`);
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeout: number;

  constructor(private configService: ConfigService) {
    this.baseUrl = configService.get<string>('JUICYSMS_BASE_URL') || 'https://juicysms.com/api/v2';
    this.apiKey = configService.get<string>('JUICYSMS_API_KEY') || '';
    this.timeout = parseInt(configService.get<string>('JUICYSMS_TIMEOUT_MS') || '15000', 10);
  }

  async sendSMS() {
    throw new Error('JuicySMS outbound SMS is not active; use order/verification workflow instead');
  }

  async buyNumber() {
    throw new Error('JuicySMS buyNumber must route through verification.createVerificationOrder instead');
  }

  async releaseNumber() {
    // JuicySMS auto-releases after order expiry; explicit release not needed
    this.logger.log('JuicySMS: release request (handled by provider expiry)');
  }

  async startCall() {
    throw new Error('JuicySMS voice is not active in this release');
  }

  async endCall() {
    throw new Error('JuicySMS voice is not active in this release');
  }

  async receiveWebhook(payload: Record<string, unknown>) {
    this.logger.log(`JuicySMS webhook received: ${JSON.stringify(payload)}`);
    return { success: true as const };
  }

  async lookupAvailability() {
    return [];
  }

  async getPricing(countryCode: string, product: RouteProduct): Promise<ProviderPricingResult> {
    return {
      provider: ProviderName.JUICYSMS,
      product,
      countryCode,
      currency: 'USD',
      notes: 'JuicySMS pricing is dynamic and quoted per service/country; consult service catalog for live rates.',
    };
  }

  /**
   * Create a one-time verification order.
   * Returns the order ID and phone number allocated.
   */
  async createVerificationOrder(serviceId: number, country: string, maxPriceEur?: number): Promise<JuicySmsOrderResponse> {
    if (!this.apiKey) throw new Error('JUICYSMS_API_KEY not configured');

    const payload: Record<string, unknown> = {
      service_id: serviceId,
      country,
    };
    if (maxPriceEur !== undefined) {
      payload.max_price = maxPriceEur.toFixed(2);
    }

    try {
      const response = await axios.post(`${this.baseUrl}/orders`, payload, {
        headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
        timeout: this.timeout,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'createVerificationOrder');
    }
  }

  /**
   * Poll for incoming SMS on an order.
   */
  async getOrderMessages(orderId: number): Promise<JuicySmsMessagesResponse> {
    if (!this.apiKey) throw new Error('JUICYSMS_API_KEY not configured');

    try {
      const response = await axios.get(`${this.baseUrl}/orders/${orderId}/messages`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
        timeout: this.timeout,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'getOrderMessages');
    }
  }

  /**
   * Cancel an order and release the number.
   */
  async cancelOrder(orderId: number): Promise<void> {
    if (!this.apiKey) throw new Error('JUICYSMS_API_KEY not configured');

    try {
      await axios.post(`${this.baseUrl}/orders/${orderId}/cancel`, {}, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
        timeout: this.timeout,
      });
    } catch (error) {
      throw this.handleError(error, 'cancelOrder');
    }
  }

  /**
   * Skip an order (cancel and blacklist the number).
   */
  async skipOrder(orderId: number): Promise<void> {
    if (!this.apiKey) throw new Error('JUICYSMS_API_KEY not configured');

    try {
      await axios.post(`${this.baseUrl}/orders/${orderId}/skip`, {}, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
        timeout: this.timeout,
      });
    } catch (error) {
      throw this.handleError(error, 'skipOrder');
    }
  }

  /**
   * Reuse an order (create a new order at half price using the same number).
   */
  async reuseOrder(orderId: number): Promise<JuicySmsOrderResponse> {
    if (!this.apiKey) throw new Error('JUICYSMS_API_KEY not configured');

    try {
      const response = await axios.post(`${this.baseUrl}/orders/${orderId}/reuse`, {}, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
        timeout: this.timeout,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'reuseOrder');
    }
  }

  /**
   * Get service catalogue for a country.
   */
  async getServices(country?: string): Promise<JuicySmsService[]> {
    if (!this.apiKey) throw new Error('JUICYSMS_API_KEY not configured');

    try {
      const params = country ? { country } : undefined;
      const response = await axios.get(`${this.baseUrl}/services`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
        params,
        timeout: this.timeout,
      });
      return response.data?.data || [];
    } catch (error) {
      throw this.handleError(error, 'getServices');
    }
  }

  /**
   * Create a rental (long-term number).
   */
  async createRental(
    country: string,
    package_key: string,
    autoRenew: boolean,
    maxPriceEur?: number,
  ): Promise<JuicySmsRentalResponse> {
    if (!this.apiKey) throw new Error('JUICYSMS_API_KEY not configured');

    const payload: Record<string, unknown> = {
      country,
      package: package_key,
      auto_renew: autoRenew,
    };
    if (maxPriceEur !== undefined) {
      payload.max_price = maxPriceEur.toFixed(2);
    }

    try {
      const response = await axios.post(`${this.baseUrl}/rentals`, payload, {
        headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
        timeout: this.timeout,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'createRental');
    }
  }

  /**
   * Get rental details.
   */
  async getRental(rentalId: number): Promise<JuicySmsRentalResponse> {
    if (!this.apiKey) throw new Error('JUICYSMS_API_KEY not configured');

    try {
      const response = await axios.get(`${this.baseUrl}/rentals/${rentalId}`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
        timeout: this.timeout,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'getRental');
    }
  }

  /**
   * Poll for SMS on a rental.
   */
  async getRentalMessages(rentalId: number) {
    if (!this.apiKey) throw new Error('JUICYSMS_API_KEY not configured');

    try {
      const response = await axios.get(`${this.baseUrl}/rentals/${rentalId}/messages`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
        timeout: this.timeout,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'getRentalMessages');
    }
  }

  /**
   * Extend a rental by adding time.
   */
  async extendRental(rentalId: number, package_key: string): Promise<JuicySmsRentalResponse> {
    if (!this.apiKey) throw new Error('JUICYSMS_API_KEY not configured');

    try {
      const response = await axios.post(
        `${this.baseUrl}/rentals/${rentalId}/extend`,
        { package: package_key },
        {
          headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
          timeout: this.timeout,
        },
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'extendRental');
    }
  }

  /**
   * Disable auto-renewal on a rental (effectively cancels it at expiry).
   */
  async disableRentalRenewal(rentalId: number): Promise<JuicySmsRentalResponse> {
    if (!this.apiKey) throw new Error('JUICYSMS_API_KEY not configured');

    try {
      const response = await axios.patch(`${this.baseUrl}/rentals/${rentalId}`, { auto_renew: false }, {
        headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
        timeout: this.timeout,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'disableRentalRenewal');
    }
  }

  private handleError(error: unknown, operation: string): Error {
    if (error instanceof AxiosError) {
      const code = error.response?.data?.code || 'unknown_error';
      const status = error.response?.status || error.code;
      const message = error.response?.data?.detail || error.message;
      const retryable = error.response?.data?.retryable ?? false;

      const errorMsg = `JuicySMS ${operation} failed [${status}/${code}]: ${message}${retryable ? ' (retryable)' : ''}`;
      this.logger.error(errorMsg);
      return new Error(errorMsg);
    }

    const msg = `JuicySMS ${operation} failed: ${error instanceof Error ? error.message : String(error)}`;
    this.logger.error(msg);
    return new Error(msg);
  }
}
