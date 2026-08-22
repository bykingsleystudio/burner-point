import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from 'axios';
import { ProviderName, ProviderPricingResult, RouteProduct } from '../global/provider.service';

/**
 * TextVerified v2 API Adapter
 * Verified production provider for US-only verification workflow.
 * 
 * Contract: https://www.textverified.com/docs/api/v2
 * Auth: Bearer token issued from username+apikey login
 * Geographic restriction: US only
 * Currencies: USD
 */

interface TextVerifiedService {
  id: string;
  serviceName: string;
  name: string;
  country: string;
}

interface TextVerifiedVerificationResponse {
  id: string;
  status: 'pending' | 'completed' | 'failed' | 'expired' | 'cancelled';
  serviceId: string;
  serviceName: string;
  phoneNumber: string;
  phoneNumberFormatted: string;
  code?: string;
  sms?: Array<{
    id: string;
    text: string;
    code?: string;
    receivedAt: string;
  }>;
  createdAt: string;
  expiresAt: string;
  links?: Array<{
    rel: string;
    href: string;
    method: string;
  }>;
}

interface TextVerifiedRentalResponse {
  id: string;
  status: 'active' | 'expired' | 'failed';
  serviceId: string;
  serviceName: string;
  phoneNumber: string;
  phoneNumberFormatted: string;
  renewalSettings: { autoRenew: boolean; renewalDuration?: string };
  pricing?: { amount: string; currency: string; duration: string };
  createdAt: string;
  expiresAt: string;
}

@Injectable()
export class TextVerifiedAdapter {
  private readonly logger = new Logger(`TextVerified Adapter`);
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeout: number;
  private cachedToken?: { token: string; expiresAt: number };

  constructor(private configService: ConfigService) {
    this.baseUrl = configService.get<string>('TEXTVERIFIED_BASE_URL') || 'https://www.textverified.com/api/pub/v2';
    this.apiKey = configService.get<string>('TEXTVERIFIED_API_KEY') || '';
    this.timeout = parseInt(configService.get<string>('TEXTVERIFIED_TIMEOUT_MS') || '15000', 10);
  }

  async sendSMS() {
    throw new Error('TextVerified outbound SMS is not active; use verification workflow instead');
  }

  async buyNumber() {
    throw new Error('TextVerified rental must route through rental.createRental instead');
  }

  async releaseNumber() {
    this.logger.log('TextVerified: release request (handled by provider expiry/cancellation)');
  }

  async startCall() {
    throw new Error('TextVerified voice is not active in this release');
  }

  async endCall() {
    throw new Error('TextVerified voice is not active in this release');
  }

  async receiveWebhook(payload: Record<string, unknown>) {
    this.logger.log(`TextVerified webhook received: ${JSON.stringify(payload)}`);
    return { success: true as const };
  }

  async lookupAvailability() {
    return [];
  }

  async getPricing(countryCode: string, product: RouteProduct): Promise<ProviderPricingResult> {
    return {
      provider: ProviderName.TEXTVERIFIED,
      product,
      countryCode: countryCode.toUpperCase(),
      currency: 'USD',
      notes: 'TextVerified is US-only; pricing is service-specific and inflation-sensitive.',
    };
  }

  /**
   * Get a fresh bearer token by authenticating with API key.
   * Caches the token until near expiry.
   */
  private async getAuthToken(): Promise<string> {
    if (!this.apiKey) throw new Error('TEXTVERIFIED_API_KEY not configured');

    // Return cached token if still valid
    if (this.cachedToken && this.cachedToken.expiresAt > Date.now()) {
      return this.cachedToken.token;
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/auth`,
        { apiKey: this.apiKey },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: this.timeout,
        },
      );

      const token = response.data?.token;
      const expiresIn = parseInt(String(response.data?.expiresIn || 3600), 10);
      if (!token) throw new Error('No token in auth response');

      this.cachedToken = {
        token,
        expiresAt: Date.now() + (expiresIn - 60) * 1000, // Refresh 60s before expiry
      };

      return token;
    } catch (error) {
      throw this.handleError(error, 'getAuthToken');
    }
  }

  /**
   * Create a one-time verification.
   * US-only.
   */
  async createVerification(serviceId: string, country: string = 'US'): Promise<TextVerifiedVerificationResponse> {
    if (country.toUpperCase() !== 'US') {
      throw new Error('TextVerified is US-only; country must be US');
    }

    const token = await this.getAuthToken();

    try {
      const response = await axios.post(
        `${this.baseUrl}/verifications`,
        { serviceId },
        {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          timeout: this.timeout,
        },
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'createVerification');
    }
  }

  /**
   * Get verification details.
   */
  async getVerification(verificationId: string): Promise<TextVerifiedVerificationResponse> {
    const token = await this.getAuthToken();

    try {
      const response = await axios.get(`${this.baseUrl}/verifications/${verificationId}`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: this.timeout,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'getVerification');
    }
  }

  /**
   * Get SMS messages received on a verification.
   */
  async getVerificationSms(verificationId: string) {
    const token = await this.getAuthToken();

    try {
      const response = await axios.get(`${this.baseUrl}/sms?reservationId=${verificationId}`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: this.timeout,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'getVerificationSms');
    }
  }

  /**
   * Cancel a verification and release the number.
   */
  async cancelVerification(verificationId: string): Promise<void> {
    const token = await this.getAuthToken();

    try {
      await axios.post(
        `${this.baseUrl}/verifications/${verificationId}/cancel`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: this.timeout,
        },
      );
    } catch (error) {
      throw this.handleError(error, 'cancelVerification');
    }
  }

  /**
   * Report a verification and blacklist the number.
   */
  async reportVerification(verificationId: string): Promise<void> {
    const token = await this.getAuthToken();

    try {
      await axios.post(
        `${this.baseUrl}/verifications/${verificationId}/report`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: this.timeout,
        },
      );
    } catch (error) {
      throw this.handleError(error, 'reportVerification');
    }
  }

  /**
   * Reuse a verification (create a new verification for the same number).
   */
  async reuseVerification(verificationId: string): Promise<TextVerifiedVerificationResponse> {
    const token = await this.getAuthToken();

    try {
      const response = await axios.post(
        `${this.baseUrl}/verifications/${verificationId}/reuse`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: this.timeout,
        },
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'reuseVerification');
    }
  }

  /**
   * Reactivate an expired verification.
   */
  async reactivateVerification(verificationId: string): Promise<TextVerifiedVerificationResponse> {
    const token = await this.getAuthToken();

    try {
      const response = await axios.post(
        `${this.baseUrl}/verifications/${verificationId}/reactivate`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: this.timeout,
        },
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'reactivateVerification');
    }
  }

  /**
   * Get service catalogue.
   */
  async getServices(country: string = 'US'): Promise<TextVerifiedService[]> {
    const token = await this.getAuthToken();

    try {
      const response = await axios.get(`${this.baseUrl}/services`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { country },
        timeout: this.timeout,
      });
      return response.data?.data || [];
    } catch (error) {
      throw this.handleError(error, 'getServices');
    }
  }

  /**
   * Create a rental (long-term number).
   * US-only.
   */
  async createRental(
    serviceId: string,
    renewalSettings: { autoRenew: boolean; renewalDuration?: string },
    country: string = 'US',
  ): Promise<TextVerifiedRentalResponse> {
    if (country.toUpperCase() !== 'US') {
      throw new Error('TextVerified is US-only; country must be US');
    }

    const token = await this.getAuthToken();

    try {
      const response = await axios.post(
        `${this.baseUrl}/reservations/rental`,
        { serviceId, ...renewalSettings },
        {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          timeout: this.timeout,
        },
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'createRental');
    }
  }

  /**
   * Get rental details.
   */
  async getRental(rentalId: string): Promise<TextVerifiedRentalResponse> {
    const token = await this.getAuthToken();

    try {
      const response = await axios.get(`${this.baseUrl}/reservations/rental/${rentalId}`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: this.timeout,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'getRental');
    }
  }

  /**
   * Get SMS messages received on a rental.
   */
  async getRentalSms(rentalId: string) {
    const token = await this.getAuthToken();

    try {
      const response = await axios.get(`${this.baseUrl}/sms?reservationId=${rentalId}`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: this.timeout,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'getRentalSms');
    }
  }

  /**
   * Reactivate an expired rental.
   */
  async reactivateRental(rentalId: string): Promise<TextVerifiedRentalResponse> {
    const token = await this.getAuthToken();

    try {
      const response = await axios.post(
        `${this.baseUrl}/reservations/rental/${rentalId}/reactivate`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: this.timeout,
        },
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'reactivateRental');
    }
  }

  /**
   * Update rental renewal settings (disable auto-renewal to cancel at expiry).
   */
  async updateRentalRenewalSettings(rentalId: string, autoRenew: boolean): Promise<TextVerifiedRentalResponse> {
    const token = await this.getAuthToken();

    try {
      const response = await axios.patch(
        `${this.baseUrl}/reservations/rental/${rentalId}`,
        { renewalSettings: { autoRenew } },
        {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          timeout: this.timeout,
        },
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'updateRentalRenewalSettings');
    }
  }

  private handleError(error: unknown, operation: string): Error {
    if (error instanceof AxiosError) {
      const code = error.response?.data?.code || error.response?.data?.errorCode || 'unknown_error';
      const status = error.response?.status || error.code;
      const message = error.response?.data?.message || error.response?.data?.detail || error.message;

      const errorMsg = `TextVerified ${operation} failed [${status}/${code}]: ${message}`;
      this.logger.error(errorMsg);
      return new Error(errorMsg);
    }

    const msg = `TextVerified ${operation} failed: ${error instanceof Error ? error.message : String(error)}`;
    this.logger.error(msg);
    return new Error(msg);
  }
}
