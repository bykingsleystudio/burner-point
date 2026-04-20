import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import Twilio = require('twilio');
import { RedisService } from './redis.service';
import { resolveWebhookBaseUrl } from '../../config/runtime-env';

export enum ProviderName {
  TWILIO = 'twilio',
  BANDWIDTH = 'bandwidth',
  VONAGE = 'vonage',
  INFOBIP = 'infobip',
  TELNYX = 'telnyx',
  PLIVO = 'plivo',
  TERMII = 'termii',
}

export enum RouteProduct {
  CONVERSATION = 'conversation',
  VERIFICATION = 'verification',
}

export interface RouteDecision {
  product: RouteProduct;
  countryCode: string;
  routeLabel: string;
  primaryProvider: ProviderName;
  fallbackProviders: ProviderName[];
  numberProvider?: ProviderName;
  reason: string;
}

export interface SmsSendOptions {
  product?: RouteProduct;
  countryCode?: string;
  preferredProvider?: ProviderName;
}

export interface ProviderSmsResult {
  sid: string;
  status: string;
  provider: ProviderName;
  routeLabel: string;
}

const HEALTH_TTL_SECONDS = 300;

@Injectable()
export class ProviderService {
  private readonly logger = new Logger(ProviderService.name);
  private _twilioClient: Twilio.Twilio | null = null;

  constructor(
    private configService: ConfigService,
    private redisService: RedisService,
  ) {}

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

  selectConversationRoute(countryCode: string, preferredProvider?: ProviderName): RouteDecision {
    const country = this.normalizeCountry(countryCode);
    const fallbackProviders = [ProviderName.VONAGE];
    const primaryProvider = preferredProvider ?? ProviderName.TWILIO;

    return {
      product: RouteProduct.CONVERSATION,
      countryCode: country,
      routeLabel: 'BP Conversation Core',
      primaryProvider,
      fallbackProviders: fallbackProviders.filter((p) => p !== primaryProvider),
      numberProvider: country === 'US' || country === 'CA'
        ? ProviderName.BANDWIDTH
        : ProviderName.TWILIO,
      reason: country === 'US' || country === 'CA'
        ? 'US/CA conversation uses Twilio for app messaging/voice, Bandwidth as number infrastructure, and Vonage as independent fallback.'
        : 'Conversation is designed for US/CA only; non-US/CA traffic should be routed through verification or blocked by product policy.',
    };
  }

  selectVerificationRoute(
    countryCode: string,
    serviceCode?: string,
    preferredProvider?: ProviderName,
  ): RouteDecision {
    const country = this.normalizeCountry(countryCode);
    const chain = this.getVerificationProviderChain(country, serviceCode);
    const primaryProvider = preferredProvider ?? chain[0];

    return {
      product: RouteProduct.VERIFICATION,
      countryCode: country,
      routeLabel: this.getVerificationRouteLabel(primaryProvider),
      primaryProvider,
      fallbackProviders: chain.filter((p) => p !== primaryProvider),
      reason: 'Global OTP route selected by country, provider coverage, expected cost, speed, and fallback independence.',
    };
  }

  selectProvider(toNumber: string, preferredProvider?: ProviderName): ProviderName {
    const country = this.inferCountryFromPhone(toNumber);
    return this.selectConversationRoute(country, preferredProvider).primaryProvider;
  }

  async setProviderHealth(
    provider: ProviderName,
    status: 'healthy' | 'degraded' | 'down',
    product: RouteProduct,
    countryCode = 'global',
  ): Promise<void> {
    await this.redisService.set(
      this.healthKey(provider, product, countryCode),
      status,
      HEALTH_TTL_SECONDS,
    );
  }

  async sendSms(
    to: string,
    from: string,
    body: string,
    options: SmsSendOptions = {},
  ): Promise<ProviderSmsResult> {
    const product = options.product ?? RouteProduct.CONVERSATION;
    const countryCode = options.countryCode ?? this.inferCountryFromPhone(to);
    const route = product === RouteProduct.VERIFICATION
      ? this.selectVerificationRoute(countryCode, undefined, options.preferredProvider)
      : this.selectConversationRoute(countryCode, options.preferredProvider);

    const providerChain = [route.primaryProvider, ...route.fallbackProviders];
    let lastError: unknown;

    for (const provider of providerChain) {
      if (!(await this.isProviderHealthy(provider, product, countryCode))) {
        this.logger.warn(`Skipping unhealthy ${provider} route for ${product}:${countryCode}`);
        continue;
      }

      try {
        const result = await this.sendSmsWithProvider(provider, to, from, body);
        return {
          ...result,
          provider,
          routeLabel: route.routeLabel,
        };
      } catch (err) {
        lastError = err;
        const message = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          `${provider} ${product} SMS route failed for ${countryCode}: ${message}`,
        );
        await this.setProviderHealth(provider, 'degraded', product, countryCode);
      }
    }

    throw lastError ?? new Error('No healthy SMS provider route available');
  }

  async searchNumbers(countryCode: string, areaCode?: string, smsEnabled = true) {
    const country = this.normalizeCountry(countryCode);
    const route = this.selectConversationRoute(country);

    if (
      route.numberProvider === ProviderName.BANDWIDTH &&
      this.isProviderConfigured(ProviderName.BANDWIDTH)
    ) {
      this.logger.warn(
        'Bandwidth is selected as US/CA number infrastructure, but this build still uses Twilio number search until the Bandwidth numbers adapter is enabled.',
      );
    }

    if (!this.twilioClient) throw new Error('Twilio not configured');
    try {
      const params: Record<string, unknown> = { smsEnabled, limit: 20 };
      if (areaCode) params.areaCode = areaCode;
      const numbers = await this.twilioClient.availablePhoneNumbers(country).local.list(params as any);
      return numbers.map((n) => ({
        number: n.phoneNumber,
        friendlyName: n.friendlyName,
        countryCode: country,
        provider: ProviderName.TWILIO,
        preferredNumberProvider: route.numberProvider,
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

  async purchaseNumber(
    phoneNumber: string,
    countryCode?: string,
  ): Promise<{ sid: string; number: string; provider: ProviderName; numberProvider: ProviderName }> {
    const country = countryCode ? this.normalizeCountry(countryCode) : this.inferCountryFromPhone(phoneNumber);
    const route = this.selectConversationRoute(country);

    if (!this.twilioClient) throw new Error('Twilio not configured');
    const webhookBaseUrl = this.getWebhookBaseUrl();

    const purchased = await this.twilioClient.incomingPhoneNumbers.create({
      phoneNumber,
      smsUrl: `${webhookBaseUrl}/twilio/sms`,
      voiceUrl: `${webhookBaseUrl}/twilio/voice`,
      statusCallback: `${webhookBaseUrl}/twilio/status`,
    });

    return {
      sid: purchased.sid,
      number: purchased.phoneNumber,
      provider: ProviderName.TWILIO,
      numberProvider: route.numberProvider ?? ProviderName.TWILIO,
    };
  }

  async releaseNumber(sid: string, provider: ProviderName = ProviderName.TWILIO): Promise<void> {
    if (provider !== ProviderName.TWILIO) {
      this.logger.warn(`Release requested for ${provider}; Twilio adapter is the only active release adapter.`);
      return;
    }
    if (!this.twilioClient) throw new Error('Twilio not configured');
    await this.twilioClient.incomingPhoneNumbers(sid).remove();
  }

  private async sendSmsWithProvider(
    provider: ProviderName,
    to: string,
    from: string,
    body: string,
  ): Promise<Omit<ProviderSmsResult, 'provider' | 'routeLabel'>> {
    switch (provider) {
      case ProviderName.TWILIO:
        return this.sendTwilioSms(to, from, body);
      case ProviderName.VONAGE:
        return this.sendVonageSms(to, from, body);
      case ProviderName.INFOBIP:
        return this.sendInfobipSms(to, from, body);
      default:
        throw new Error(`${provider} SMS adapter is deferred for this release`);
    }
  }

  private async sendTwilioSms(to: string, from: string, body: string) {
    if (!this.twilioClient) throw new Error('Twilio not configured');
    const msg = await this.twilioClient.messages.create({ to, from, body });
    return { sid: msg.sid, status: msg.status };
  }

  private async sendVonageSms(to: string, from: string, body: string) {
    const apiKey = this.configService.get<string>('VONAGE_API_KEY');
    const apiSecret = this.configService.get<string>('VONAGE_API_SECRET');
    if (!apiKey || !apiSecret) throw new Error('Vonage not configured');
    const webhookBaseUrl = this.getWebhookBaseUrl();

    const response = await axios.post('https://rest.nexmo.com/sms/json', {
      api_key: apiKey,
      api_secret: apiSecret,
      to: this.stripPlus(to),
      from: this.stripPlus(from),
      text: body,
      'status-report-req': 1,
      callback: `${webhookBaseUrl}/vonage/status`,
    });

    const message = response.data?.messages?.[0] ?? {};
    const status = String(message.status ?? 'unknown');
    if (status !== '0') {
      throw new Error(message['error-text'] ?? `Vonage SMS failed with status ${status}`);
    }

    return {
      sid: message['message-id'] ?? `vonage-${Date.now()}`,
      status: 'queued',
    };
  }

  private async sendInfobipSms(to: string, from: string, body: string) {
    const baseUrl = this.configService.get<string>('INFOBIP_BASE_URL');
    const apiKey = this.configService.get<string>('INFOBIP_API_KEY');
    if (!baseUrl || !apiKey) throw new Error('Infobip not configured');
    const webhookBaseUrl = this.getWebhookBaseUrl();

    const response = await axios.post(
      `${baseUrl.replace(/\/$/, '')}/sms/2/text/advanced`,
      {
        messages: [{
          from: this.stripPlus(from),
          destinations: [{ to: this.stripPlus(to) }],
          text: body,
          notifyUrl: `${webhookBaseUrl}/infobip/status`,
          notifyContentType: 'application/json',
        }],
      },
      {
        headers: {
          Authorization: `App ${apiKey}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const message = response.data?.messages?.[0] ?? {};
    return {
      sid: message.messageId ?? `infobip-${Date.now()}`,
      status: message.status?.groupName ?? 'queued',
    };
  }

  private async isProviderHealthy(
    provider: ProviderName,
    product: RouteProduct,
    countryCode: string,
  ): Promise<boolean> {
    const countryStatus = await this.redisService.get(this.healthKey(provider, product, countryCode));
    const globalStatus = await this.redisService.get(this.healthKey(provider, product, 'global'));
    return countryStatus !== 'down' && globalStatus !== 'down';
  }

  private getVerificationProviderChain(countryCode: string, serviceCode?: string): ProviderName[] {
    const service = (serviceCode ?? '').toLowerCase();
    if (countryCode === 'NG') return [ProviderName.INFOBIP, ProviderName.TWILIO, ProviderName.VONAGE];
    if (['IN', 'PK', 'BD'].includes(countryCode)) return [ProviderName.INFOBIP, ProviderName.VONAGE, ProviderName.TWILIO];
    if (['US', 'CA'].includes(countryCode)) return [ProviderName.TWILIO, ProviderName.VONAGE, ProviderName.INFOBIP];
    if (['GB', 'DE', 'FR', 'ES', 'IT', 'NL', 'SE', 'NO', 'FI'].includes(countryCode)) {
      return [ProviderName.TWILIO, ProviderName.VONAGE, ProviderName.INFOBIP];
    }
    if (service.includes('high-risk')) return [ProviderName.INFOBIP, ProviderName.VONAGE, ProviderName.TWILIO];
    return [ProviderName.TWILIO, ProviderName.INFOBIP, ProviderName.VONAGE];
  }

  private getVerificationRouteLabel(provider: ProviderName): string {
    switch (provider) {
      case ProviderName.TWILIO:
        return 'BP Core Verify';
      case ProviderName.INFOBIP:
        return 'BP Global Route';
      case ProviderName.VONAGE:
        return 'BP Smart Route';
      case ProviderName.PLIVO:
        return 'BP Budget Route';
      case ProviderName.TERMII:
        return 'BP Nigeria Local Route';
      default:
        return 'BP Deferred Route';
    }
  }

  private isProviderConfigured(provider: ProviderName): boolean {
    switch (provider) {
      case ProviderName.TWILIO:
        return Boolean(this.configService.get('TWILIO_ACCOUNT_SID') && this.configService.get('TWILIO_AUTH_TOKEN'));
      case ProviderName.VONAGE:
        return Boolean(this.configService.get('VONAGE_API_KEY') && this.configService.get('VONAGE_API_SECRET'));
      case ProviderName.INFOBIP:
        return Boolean(this.configService.get('INFOBIP_BASE_URL') && this.configService.get('INFOBIP_API_KEY'));
      case ProviderName.BANDWIDTH:
        return Boolean(this.configService.get('BANDWIDTH_ACCOUNT_ID') && this.configService.get('BANDWIDTH_API_TOKEN'));
      default:
        return false;
    }
  }

  private getWebhookBaseUrl(): string {
    return resolveWebhookBaseUrl(this.configService);
  }

  private healthKey(provider: ProviderName, product: RouteProduct, countryCode: string): string {
    return `provider_health:${product}:${provider}:${this.normalizeCountry(countryCode)}`;
  }

  private inferCountryFromPhone(phoneNumber: string): string {
    if (phoneNumber.startsWith('+1')) return 'US';
    if (phoneNumber.startsWith('+234')) return 'NG';
    if (phoneNumber.startsWith('+44')) return 'GB';
    if (phoneNumber.startsWith('+91')) return 'IN';
    return 'global';
  }

  private normalizeCountry(countryCode: string): string {
    return (countryCode || 'global').trim().toUpperCase();
  }

  private stripPlus(value: string): string {
    return value.replace(/^\+/, '');
  }
}
