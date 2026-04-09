import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Twilio = require('twilio');

export enum ProviderName { TWILIO = 'twilio', TELNYX = 'telnyx' }

const API_WEBHOOK_BASE_PATH = '/api/webhooks';

@Injectable()
export class ProviderService {
  private readonly logger = new Logger(ProviderService.name);
  private _twilioClient: Twilio.Twilio | null = null;

  constructor(private configService: ConfigService) {}

  private get twilioClient(): Twilio.Twilio | null {
    if (this._twilioClient) return this._twilioClient;
    const sid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const token = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    if (!sid || !token) return null;
    this._twilioClient = new Twilio.Twilio(sid, token);
    return this._twilioClient;
  }

  getTwilioClient(): Twilio.Twilio | null {
    return this.twilioClient;
  }

  /**
   * Selects best provider based on destination country, cost, and availability.
   * Twilio is primary; Telnyx is fallback.
   */
  selectProvider(toNumber: string, preferredProvider?: ProviderName): ProviderName {
    // Simple routing: Nigeria uses Twilio, others based on preference or default
    if (toNumber.startsWith('+234')) return ProviderName.TWILIO;
    return preferredProvider || ProviderName.TWILIO;
  }

  async sendSms(to: string, from: string, body: string): Promise<{ sid: string; status: string }> {
    if (!this.twilioClient) throw new Error('Twilio not configured');
    try {
      const msg = await this.twilioClient.messages.create({ to, from, body });
      return { sid: msg.sid, status: msg.status };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`SMS send failed: ${message}`, { to, from });
      throw err;
    }
  }

  async searchNumbers(countryCode: string, areaCode?: string, smsEnabled = true) {
    if (!this.twilioClient) throw new Error('Twilio not configured');
    try {
      const params: Record<string, unknown> = { smsEnabled, limit: 20 };
      if (areaCode) params.areaCode = areaCode;
      const numbers = await this.twilioClient.availablePhoneNumbers(countryCode).local.list(params as any);
      return numbers.map((n) => ({
        number: n.phoneNumber,
        friendlyName: n.friendlyName,
        countryCode,
        capabilities: {
          sms: n.capabilities.sms,
          voice: n.capabilities.voice,
          mms: n.capabilities.mms,
        },
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Number search failed: ${message}`);
      throw err;
    }
  }

  async purchaseNumber(phoneNumber: string): Promise<{ sid: string; number: string }> {
    if (!this.twilioClient) throw new Error('Twilio not configured');
    const appUrl = this.configService.get<string>('APP_URL');
    const webhookBaseUrl = appUrl
      ? `${appUrl.replace(/\/$/, '')}${API_WEBHOOK_BASE_PATH}`
      : API_WEBHOOK_BASE_PATH;

    const purchased = await this.twilioClient.incomingPhoneNumbers.create({
      phoneNumber,
      smsUrl: `${webhookBaseUrl}/twilio/sms`,
      voiceUrl: `${webhookBaseUrl}/twilio/voice`,
      statusCallback: `${webhookBaseUrl}/twilio/status`,
    });
    return { sid: purchased.sid, number: purchased.phoneNumber };
  }

  async releaseNumber(sid: string): Promise<void> {
    if (!this.twilioClient) throw new Error('Twilio not configured');
    await this.twilioClient.incomingPhoneNumbers(sid).remove();
  }
}
