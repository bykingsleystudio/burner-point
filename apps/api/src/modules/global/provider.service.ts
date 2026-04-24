import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import Twilio = require('twilio');
import { RedisService } from './redis.service';
import { resolveWebhookBaseUrl } from '../../config/runtime-env';

export enum ProviderName {
  TWILIO = 'twilio',
  TELNYX = 'telnyx',
  TREMIL = 'tremil',
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
    const fallbackProviders = [ProviderName.TELNYX, ProviderName.TREMIL];
    const primaryProvider = preferredProvider ?? ProviderName.TWILIO;

    return {
      product: RouteProduct.CONVERSATION,
      countryCode: country,
      routeLabel: 'BP Conversation Core',
      primaryProvider,
      fallbackProviders: fallbackProviders.filter((p) => p !== primaryProvider),
      numberProvider: country === 'US' || country === 'CA'
        ? ProviderName.TELNYX
        : ProviderName.TWILIO,
      reason: country === 'US' || country === 'CA'
        ? 'US/CA conversation uses Twilio for app messaging and voice, Telnyx for number infrastructure, and Tremil as the economy fallback route.'
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
      route.numberProvider === ProviderName.TELNYX &&
      this.isProviderConfigured(ProviderName.TELNYX)
    ) {
      return this.searchTelnyxNumbers(country, areaCode, route.numberProvider, smsEnabled);
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

    if (
      route.numberProvider === ProviderName.TELNYX &&
      this.isProviderConfigured(ProviderName.TELNYX)
    ) {
      return this.purchaseTelnyxNumber(phoneNumber, route.numberProvider);
    }

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
    if (provider === ProviderName.TELNYX) {
      await this.releaseTelnyxNumber(sid);
      return;
    }

    if (provider !== ProviderName.TWILIO) {
      this.logger.warn(`Release requested for ${provider}; Twilio and Telnyx are the active release adapters.`);
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
      case ProviderName.TELNYX:
        return this.sendTelnyxSms(to, from, body);
      case ProviderName.TREMIL:
        return this.sendTremilSms(to, from, body);
      default:
        throw new Error(`${provider} SMS adapter is deferred for this release`);
    }
  }

  private async sendTwilioSms(to: string, from: string, body: string) {
    if (!this.twilioClient) throw new Error('Twilio not configured');
    const msg = await this.twilioClient.messages.create({ to, from, body });
    return { sid: msg.sid, status: msg.status };
  }

  private async sendTelnyxSms(to: string, from: string, body: string) {
    const apiKey = this.configService.get<string>('TELNYX_API_KEY');
    if (!apiKey) throw new Error('Telnyx not configured');
    const webhookBaseUrl = this.getWebhookBaseUrl();
    const messagingProfileId = this.configService.get<string>('TELNYX_MESSAGING_PROFILE_ID');

    const payload: Record<string, unknown> = {
      from,
      to,
      text: body,
      webhook_url: `${webhookBaseUrl}/telnyx`,
    };
    if (messagingProfileId) payload.messaging_profile_id = messagingProfileId;

    const response = await axios.post('https://api.telnyx.com/v2/messages', payload, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    const message = response.data?.data ?? {};
    return {
      sid: message.id ?? `telnyx-${Date.now()}`,
      status: message.status ?? 'queued',
    }
  }

  private async sendTremilSms(to: string, from: string, body: string) {
    const baseUrl = this.configService.get<string>('TREMIL_BASE_URL');
    const apiKey = this.configService.get<string>('TREMIL_API_KEY');
    const apiSecret = this.configService.get<string>('TREMIL_SECRET');
    if (!baseUrl || !apiKey) throw new Error('Tremil not configured');

    const response = await axios.post(
      `${baseUrl.replace(/\/$/, '')}/messages`,
      {
        from,
        to,
        text: body,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          ...(apiSecret ? { 'X-API-Secret': apiSecret } : {}),
          'Content-Type': 'application/json',
        },
      },
    );

    const message = response.data?.data ?? response.data ?? {};
    return {
      sid: message.id ?? message.messageId ?? `tremil-${Date.now()}`,
      status: message.status ?? 'queued',
    };
  }

  private async searchTelnyxNumbers(
    country: string,
    areaCode: string | undefined,
    numberProvider: ProviderName,
    smsEnabled: boolean,
  ) {
    const apiKey = this.configService.get<string>('TELNYX_API_KEY');
    if (!apiKey) throw new Error('Telnyx not configured');

    const params: Record<string, string | number> = {
      'filter[country_code]': country,
      'filter[phone_number_type]': 'local',
      'filter[features]': smsEnabled ? 'sms' : 'voice',
      'filter[limit]': 20,
    };
    if (areaCode) params['filter[national_destination_code]'] = areaCode;

    const response = await axios.get('https://api.telnyx.com/v2/available_phone_numbers', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      params,
    });

    return (response.data?.data ?? []).map((item: Record<string, unknown>) => {
      const features = Array.isArray(item.features) ? item.features.map((feature) => String(feature).toLowerCase()) : [];
      return {
        number: String(item.phone_number ?? ''),
        friendlyName: String(item.phone_number ?? ''),
        countryCode: country,
        provider: ProviderName.TELNYX,
        preferredNumberProvider: numberProvider,
        capabilities: {
          sms: features.includes('sms'),
          voice: features.includes('voice') || features.includes('emergency'),
          mms: features.includes('mms'),
        },
      };
    });
  }

  private async purchaseTelnyxNumber(
    phoneNumber: string,
    numberProvider: ProviderName,
  ): Promise<{ sid: string; number: string; provider: ProviderName; numberProvider: ProviderName }> {
    const apiKey = this.configService.get<string>('TELNYX_API_KEY');
    if (!apiKey) throw new Error('Telnyx not configured');

    const connectionId = this.configService.get<string>('TELNYX_CONNECTION_ID');
    const messagingProfileId = this.configService.get<string>('TELNYX_MESSAGING_PROFILE_ID');
    const payload: Record<string, unknown> = {
      phone_numbers: [{ phone_number: phoneNumber }],
      customer_reference: `burner-point-${Date.now()}`,
    };
    if (connectionId) payload.connection_id = connectionId;
    if (messagingProfileId) payload.messaging_profile_id = messagingProfileId;

    const response = await axios.post('https://api.telnyx.com/v2/number_orders', payload, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    const purchased = response.data?.data?.phone_numbers?.[0] ?? {};

    return {
      sid: purchased.id ?? response.data?.data?.id ?? `telnyx-order-${Date.now()}`,
      number: purchased.phone_number ?? phoneNumber,
      provider: ProviderName.TELNYX,
      numberProvider,
    };
  }

  private async releaseTelnyxNumber(phoneNumberId: string): Promise<void> {
    const apiKey = this.configService.get<string>('TELNYX_API_KEY');
    if (!apiKey) throw new Error('Telnyx not configured');

    await axios.delete(`https://api.telnyx.com/v2/phone_numbers/${phoneNumberId}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
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
    if (['US', 'CA', 'GB'].includes(countryCode)) return [ProviderName.TWILIO, ProviderName.TELNYX, ProviderName.TREMIL];
    if (['DE', 'FR', 'ES', 'IT', 'NL', 'SE', 'NO', 'FI'].includes(countryCode)) {
      return [ProviderName.TELNYX, ProviderName.TWILIO, ProviderName.TREMIL];
    }
    if (service.includes('high-risk')) return [ProviderName.TELNYX, ProviderName.TWILIO, ProviderName.TREMIL];
    return [ProviderName.TWILIO, ProviderName.TELNYX, ProviderName.TREMIL];
  }

  private getVerificationRouteLabel(provider: ProviderName): string {
    switch (provider) {
      case ProviderName.TWILIO:
        return 'BP Core Verify';
      case ProviderName.TELNYX:
        return 'BP Standard Route';
      case ProviderName.TREMIL:
        return 'BP Economy Route';
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
      case ProviderName.TELNYX:
        return Boolean(this.configService.get('TELNYX_API_KEY'));
      case ProviderName.TREMIL:
        return Boolean(this.configService.get('TREMIL_API_KEY') && this.configService.get('TREMIL_BASE_URL'));
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
