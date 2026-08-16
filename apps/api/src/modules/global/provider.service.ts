import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as Twilio from 'twilio';
import { RedisService } from './redis.service';
import { resolveApiUrl } from '../../config/runtime-env';
import { JuicySmsAdapter } from '../providers/juicysms.adapter';
import { TextVerifiedAdapter } from '../providers/textverified.adapter';
import { SMSPoolAdapter } from '../providers/smspool.adapter';
import { QuackrAdapter } from '../providers/quackr.adapter';

export enum ProviderName {
  TWILIO = 'twilio',
  TELNYX = 'telnyx',
  BANDWIDTH = 'bandwidth',
  JUICYSMS = 'juicysms',
  TEXTVERIFIED = 'textverified',
  SMSPOOL = 'smspool',
  TIGERSMS = 'tigersms',
  QUACKR = 'quackr',
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

export interface ProviderNumberSearchResult {
  number: string;
  friendlyName: string;
  countryCode: string;
  provider: ProviderName;
  preferredNumberProvider?: ProviderName;
  capabilities: {
    sms: boolean;
    voice: boolean;
    mms: boolean;
  };
}

export interface ProviderNumberPurchaseResult {
  sid: string;
  number: string;
  provider: ProviderName;
  numberProvider: ProviderName;
}

export interface ProviderCallResult {
  sid: string;
  status: string;
  provider: ProviderName;
  routeLabel: string;
}

export interface ProviderCallOptions {
  callId?: string;
}

export interface ProviderAvailabilityOptions {
  countryCode: string;
  areaCode?: string;
  smsEnabled?: boolean;
}

export interface ProviderPurchaseOptions {
  phoneNumber: string;
  countryCode?: string;
}

export interface ProviderReleaseOptions {
  sid: string;
  phoneNumber?: string;
}

export interface ProviderPricingResult {
  provider: ProviderName;
  product: RouteProduct;
  countryCode: string;
  currency: 'USD';
  notes: string;
}

export interface MessengerProviderAdapter {
  provider: ProviderName;
  sendSMS(to: string, from: string, body: string): Promise<Omit<ProviderSmsResult, 'provider' | 'routeLabel'>>;
  buyNumber(options: ProviderPurchaseOptions): Promise<ProviderNumberPurchaseResult>;
  releaseNumber(options: ProviderReleaseOptions): Promise<void>;
  receiveWebhook(payload: Record<string, unknown>, headers?: Record<string, string>): Promise<{ success: true }>;
  startCall(to: string, from: string, options?: ProviderCallOptions): Promise<Omit<ProviderCallResult, 'provider' | 'routeLabel'>>;
  endCall(callSid: string): Promise<void>;
  lookupAvailability(options: ProviderAvailabilityOptions): Promise<ProviderNumberSearchResult[]>;
  getPricing(countryCode: string, product: RouteProduct): Promise<ProviderPricingResult>;
}

const HEALTH_TTL_SECONDS = 300;

const CONVERSATION_PROVIDER_PRIORITY: Record<string, ProviderName[]> = {
  US: [ProviderName.BANDWIDTH, ProviderName.TWILIO, ProviderName.TELNYX],
  CA: [ProviderName.TELNYX, ProviderName.BANDWIDTH, ProviderName.TWILIO],
  GB: [ProviderName.TWILIO, ProviderName.TELNYX, ProviderName.BANDWIDTH],
  default: [ProviderName.TWILIO, ProviderName.TELNYX, ProviderName.BANDWIDTH],
};

@Injectable()
export class ProviderService {
  private readonly logger = new Logger(ProviderService.name);
  private _twilioClient: Twilio.Twilio | null = null;
  private readonly messengerAdapters: Partial<Record<ProviderName, MessengerProviderAdapter>>;

  constructor(
    private configService: ConfigService,
    private redisService: RedisService,
  ) {
    this.messengerAdapters = this.buildMessengerAdapters();
  }

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
    const providerChain = this.getConversationProviderChain(country);
    const primaryProvider = preferredProvider ?? providerChain[0];

    return {
      product: RouteProduct.CONVERSATION,
      countryCode: country,
      routeLabel: 'BP Messenger Route',
      primaryProvider,
      fallbackProviders: providerChain.filter((provider) => provider !== primaryProvider),
      numberProvider: this.getPreferredNumberProvider(country),
      reason: 'BP Messenger routing weighs provider availability, country fit, deliverability, recent failures, and cost before choosing a route.',
    };
  }

  selectVerificationRoute(
    countryCode: string,
    serviceCode?: string,
    preferredProvider?: ProviderName,
  ): RouteDecision {
    const country = this.normalizeCountry(countryCode);
    const providerChain = this.getVerificationProviderChain(country, serviceCode);
    const primaryProvider = preferredProvider ?? providerChain[0];

    return {
      product: RouteProduct.VERIFICATION,
      countryCode: country,
      routeLabel: this.getVerificationRouteLabel(primaryProvider),
      primaryProvider,
      fallbackProviders: providerChain.filter((provider) => provider !== primaryProvider),
      reason: 'Verification routing weighs country, provider reliability, expected cost, queue health, and fallback independence.',
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
      const adapter = this.getAdapter(provider);
      if (!adapter) continue;

      if (!(await this.isProviderHealthy(provider, product, countryCode))) {
        this.logger.warn(`Skipping unhealthy ${provider} route for ${product}:${countryCode}`);
        continue;
      }

      try {
        const result = await adapter.sendSMS(to, from, body);
        return {
          ...result,
          provider,
          routeLabel: route.routeLabel,
        };
      } catch (error) {
        lastError = error;
        this.logger.warn(
          `${provider} ${product} SMS route failed for ${countryCode}: ${this.describeError(error)}`,
        );
        await this.setProviderHealth(provider, 'degraded', product, countryCode);
      }
    }

    throw lastError ?? new Error('No healthy SMS provider route available');
  }

  async searchNumbers(countryCode: string, areaCode?: string, smsEnabled = true): Promise<ProviderNumberSearchResult[]> {
    const country = this.normalizeCountry(countryCode);
    const route = this.selectConversationRoute(country);
    const providersToTry = this.uniqueProviders([
      route.numberProvider ?? route.primaryProvider,
      route.primaryProvider,
      ...route.fallbackProviders,
    ]);

    let lastError: unknown;

    for (const provider of providersToTry) {
      const adapter = this.getAdapter(provider);
      if (!adapter) continue;
      if (!this.isProviderConfigured(provider)) continue;

      try {
        const numbers = await adapter.lookupAvailability({ countryCode: country, areaCode, smsEnabled });
        if (numbers.length) {
          return numbers.map((item) => ({
            ...item,
            preferredNumberProvider: route.numberProvider ?? provider,
          }));
        }
      } catch (error) {
        lastError = error;
        this.logger.warn(
          `${provider} number search failed for ${country}: ${this.describeError(error)}`,
        );
      }
    }

    if (lastError) throw lastError;
    return [];
  }

  async purchaseNumber(
    phoneNumber: string,
    countryCode?: string,
  ): Promise<ProviderNumberPurchaseResult> {
    const country = countryCode ? this.normalizeCountry(countryCode) : this.inferCountryFromPhone(phoneNumber);
    const route = this.selectConversationRoute(country);
    const providersToTry = this.uniqueProviders([
      route.numberProvider ?? route.primaryProvider,
      route.primaryProvider,
      ...route.fallbackProviders,
    ]);

    let lastError: unknown;

    for (const provider of providersToTry) {
      const adapter = this.getAdapter(provider);
      if (!adapter) continue;
      if (!this.isProviderConfigured(provider)) continue;

      try {
        return await adapter.buyNumber({ phoneNumber, countryCode: country });
      } catch (error) {
        lastError = error;
        this.logger.warn(
          `${provider} number purchase failed for ${country}: ${this.describeError(error)}`,
        );
        await this.setProviderHealth(provider, 'degraded', RouteProduct.CONVERSATION, country);
      }
    }

    throw lastError ?? new Error('No provider could assign this number right now');
  }

  async releaseNumber(
    sid: string,
    provider: ProviderName = ProviderName.TWILIO,
    phoneNumber?: string,
  ): Promise<void> {
    const adapter = this.getAdapter(provider);
    if (!adapter) {
      this.logger.warn(`Release requested for unsupported provider ${provider}`);
      return;
    }

    await adapter.releaseNumber({ sid, phoneNumber });
  }

  async startCall(
    to: string,
    from: string,
    countryCode?: string,
    preferredProvider?: ProviderName,
    options?: ProviderCallOptions,
  ): Promise<ProviderCallResult> {
    const route = this.selectConversationRoute(countryCode ?? this.inferCountryFromPhone(to), preferredProvider);
    const providersToTry = this.uniqueProviders([route.primaryProvider, ...route.fallbackProviders]);
    let lastError: unknown;

    for (const provider of providersToTry) {
      const adapter = this.getAdapter(provider);
      if (!adapter) continue;

      try {
        const result = await adapter.startCall(to, from, options);
        return {
          ...result,
          provider,
          routeLabel: route.routeLabel,
        };
      } catch (error) {
        lastError = error;
        this.logger.warn(`${provider} call route failed: ${this.describeError(error)}`);
      }
    }

    throw lastError ?? new Error('No healthy call provider route available');
  }

  async endCall(callSid: string, provider: ProviderName = ProviderName.TWILIO): Promise<void> {
    const adapter = this.getAdapter(provider);
    if (!adapter) {
      this.logger.warn(`End-call requested for unsupported provider ${provider}`);
      return;
    }

    await adapter.endCall(callSid);
  }

  async receiveWebhook(
    provider: ProviderName,
    payload: Record<string, unknown>,
    headers: Record<string, string> = {},
  ) {
    const adapter = this.getAdapter(provider);
    if (!adapter) return { success: true as const };
    return adapter.receiveWebhook(payload, headers);
  }

  async getPricing(provider: ProviderName, countryCode: string, product: RouteProduct) {
    const adapter = this.getAdapter(provider);
    if (!adapter) {
      return {
        provider,
        product,
        countryCode: this.normalizeCountry(countryCode),
        currency: 'USD' as const,
        notes: 'Pricing handled by provider contract.',
      };
    }

    return adapter.getPricing(countryCode, product);
  }

  private buildMessengerAdapters(): Partial<Record<ProviderName, MessengerProviderAdapter>> {
    return {
      [ProviderName.TWILIO]: {
        provider: ProviderName.TWILIO,
        sendSMS: (to, from, body) => this.sendTwilioSms(to, from, body),
        buyNumber: ({ phoneNumber, countryCode }) => this.purchaseTwilioNumber(phoneNumber, countryCode),
        releaseNumber: ({ sid }) => this.releaseTwilioNumber(sid),
        receiveWebhook: async () => ({ success: true }),
        startCall: (to, from, options) => this.startTwilioCall(to, from, options),
        endCall: (callSid) => this.endTwilioCall(callSid),
        lookupAvailability: ({ countryCode, areaCode, smsEnabled }) => this.searchTwilioNumbers(countryCode, areaCode, smsEnabled ?? true),
        getPricing: async (countryCode, product) => ({
          provider: ProviderName.TWILIO,
          product,
          countryCode: this.normalizeCountry(countryCode),
          currency: 'USD',
          notes: 'Twilio pricing varies by country, capability, and route.',
        }),
      },
      [ProviderName.TELNYX]: {
        provider: ProviderName.TELNYX,
        sendSMS: (to, from, body) => this.sendTelnyxSms(to, from, body),
        buyNumber: ({ phoneNumber }) => this.purchaseTelnyxNumber(phoneNumber),
        releaseNumber: ({ sid }) => this.releaseTelnyxNumber(sid),
        receiveWebhook: async () => ({ success: true }),
        startCall: async () => {
          throw new Error('Telnyx voice is not active in this release');
        },
        endCall: async () => {
          throw new Error('Telnyx voice is not active in this release');
        },
        lookupAvailability: ({ countryCode, areaCode, smsEnabled }) => this.searchTelnyxNumbers(countryCode, areaCode, smsEnabled ?? true),
        getPricing: async (countryCode, product) => ({
          provider: ProviderName.TELNYX,
          product,
          countryCode: this.normalizeCountry(countryCode),
          currency: 'USD',
          notes: 'Telnyx pricing varies by number type, messaging route, and region.',
        }),
      },
      [ProviderName.BANDWIDTH]: {
        provider: ProviderName.BANDWIDTH,
        sendSMS: (to, from, body) => this.sendBandwidthSms(to, from, body),
        buyNumber: ({ phoneNumber }) => this.purchaseBandwidthNumber(phoneNumber),
        releaseNumber: ({ phoneNumber }) => this.releaseBandwidthNumber(phoneNumber),
        receiveWebhook: async () => ({ success: true }),
        startCall: (to, from, options) => this.startBandwidthCall(to, from, options),
        endCall: (callSid) => this.endBandwidthCall(callSid),
        lookupAvailability: ({ countryCode, areaCode, smsEnabled }) => this.searchBandwidthNumbers(countryCode, areaCode, smsEnabled ?? true),
        getPricing: async (countryCode, product) => ({
          provider: ProviderName.BANDWIDTH,
          product,
          countryCode: this.normalizeCountry(countryCode),
          currency: 'USD',
          notes: 'Bandwidth pricing varies by North America inventory, messaging volume, and voice route.',
        }),
      },
      [ProviderName.JUICYSMS]: {
        provider: ProviderName.JUICYSMS,
        sendSMS: async () => { throw new Error('JuicySMS outbound messaging is not active in this release'); },
        buyNumber: async () => { throw new Error('JuicySMS number purchase must use verification-hub.createOrder'); },
        releaseNumber: async () => undefined,
        receiveWebhook: async (payload) => ({ success: true }),
        startCall: async () => { throw new Error('JuicySMS voice is not active in this release'); },
        endCall: async () => undefined,
        lookupAvailability: async () => [],
        getPricing: async (countryCode, product) => ({
          provider: ProviderName.JUICYSMS,
          product,
          countryCode: this.normalizeCountry(countryCode),
          currency: 'USD',
          notes: 'JuicySMS pricing is quoted by service and country in EUR; use service-level pricing queries.',
        }),
      },
      [ProviderName.TEXTVERIFIED]: {
        provider: ProviderName.TEXTVERIFIED,
        sendSMS: async () => { throw new Error('TextVerified outbound messaging is not active in this release'); },
        buyNumber: async () => { throw new Error('TextVerified number purchase must use verification-hub.createOrder'); },
        releaseNumber: async () => undefined,
        receiveWebhook: async (payload) => ({ success: true }),
        startCall: async () => { throw new Error('TextVerified voice is not active in this release'); },
        endCall: async () => undefined,
        lookupAvailability: async () => [],
        getPricing: async (countryCode, product) => ({
          provider: ProviderName.TEXTVERIFIED,
          product,
          countryCode: this.normalizeCountry(countryCode),
          currency: 'USD',
          notes: 'TextVerified is US-only; pricing is service-specific and inflation-sensitive.',
        }),
      },
      [ProviderName.SMSPOOL]: {
        provider: ProviderName.SMSPOOL,
        sendSMS: async () => { throw new Error('SMSPool outbound messaging is not active in this release'); },
        buyNumber: async () => { throw new Error('SMSPool number purchase must use rental-hub.createRental'); },
        releaseNumber: async () => undefined,
        receiveWebhook: async (payload) => ({ success: true }),
        startCall: async () => { throw new Error('SMSPool voice is not active in this release'); },
        endCall: async () => undefined,
        lookupAvailability: async () => [],
        getPricing: async (countryCode, product) => ({
          provider: ProviderName.SMSPOOL,
          product,
          countryCode: this.normalizeCountry(countryCode),
          currency: 'USD',
          notes: 'SMSPool pricing is per-service and dynamic; use service lookup endpoints for live rates.',
        }),
      },
      [ProviderName.QUACKR]: {
        provider: ProviderName.QUACKR,
        sendSMS: async () => { throw new Error('Quackr outbound messaging is not active in this release'); },
        buyNumber: async () => { throw new Error('Quackr number purchase must use rental-hub.createRental'); },
        releaseNumber: async () => undefined,
        receiveWebhook: async (payload) => ({ success: true }),
        startCall: async () => { throw new Error('Quackr voice is not active in this release'); },
        endCall: async () => undefined,
        lookupAvailability: async () => [],
        getPricing: async (countryCode, product) => ({
          provider: ProviderName.QUACKR,
          product,
          countryCode: this.normalizeCountry(countryCode),
          currency: 'USD',
          notes: 'Quackr pricing is per-service and dynamic; use service availability endpoints for live rates.',
        }),
      },
    };
  }

  private getAdapter(provider: ProviderName) {
    return this.messengerAdapters[provider];
  }

  private getConversationProviderChain(countryCode: string): ProviderName[] {
    return CONVERSATION_PROVIDER_PRIORITY[countryCode] ?? CONVERSATION_PROVIDER_PRIORITY.default;
  }

  private getPreferredNumberProvider(countryCode: string): ProviderName {
    if (countryCode === 'US') return ProviderName.BANDWIDTH;
    if (countryCode === 'CA') return ProviderName.TELNYX;
    if (countryCode === 'GB') return ProviderName.TWILIO;
    return ProviderName.TWILIO;
  }

  private getVerificationProviderChain(countryCode: string, serviceCode?: string): ProviderName[] {
    const verifyHubEnabled = this.configService.get<string>('VERIFY_HUB_ENABLED')?.toLowerCase() === 'true';
    const verifyHubProviders = this.configService.get<string>('VERIFY_HUB_PROVIDERS')?.split(',').map((p) => p.trim()) || [];
    const verifyHubPriority = this.configService.get<string>('VERIFY_HUB_PROVIDER_PRIORITY')?.split(',').map((p) => p.trim()) || [];

    // If feature gate is off, fall back to legacy providers only
    if (!verifyHubEnabled) {
      if (['US', 'CA', 'GB'].includes(countryCode)) {
        return [ProviderName.TWILIO, ProviderName.TELNYX, ProviderName.BANDWIDTH];
      }
      if (['DE', 'FR', 'ES', 'IT', 'NL', 'SE', 'NO', 'FI'].includes(countryCode)) {
        return [ProviderName.TELNYX, ProviderName.TWILIO, ProviderName.BANDWIDTH];
      }
      return [ProviderName.TWILIO, ProviderName.TELNYX, ProviderName.BANDWIDTH];
    }

    // Build provider chain respecting priority and feature gates
    let chain: ProviderName[] = [];

    // If explicit priority is configured, use it for configured providers
    if (verifyHubPriority.length > 0) {
      chain = verifyHubPriority
        .map((name) => {
          const upper = name.toUpperCase();
          return Object.values(ProviderName).find((v) => v.toUpperCase() === upper);
        })
        .filter((p) => p && this.isProviderConfigured(p as ProviderName)) as ProviderName[];
    }

    // If no priority, use default regional chains filtered by configured providers
    if (chain.length === 0) {
      let defaultChain: ProviderName[] = [];
      if (['US', 'CA', 'GB'].includes(countryCode)) {
        defaultChain = [ProviderName.JUICYSMS, ProviderName.TEXTVERIFIED, ProviderName.TWILIO, ProviderName.TELNYX, ProviderName.BANDWIDTH];
      } else if (['DE', 'FR', 'ES', 'IT', 'NL', 'SE', 'NO', 'FI'].includes(countryCode)) {
        defaultChain = [ProviderName.JUICYSMS, ProviderName.TEXTVERIFIED, ProviderName.TELNYX, ProviderName.TWILIO, ProviderName.BANDWIDTH];
      } else {
        defaultChain = [ProviderName.JUICYSMS, ProviderName.TEXTVERIFIED, ProviderName.TWILIO, ProviderName.TELNYX, ProviderName.BANDWIDTH];
      }
      chain = defaultChain.filter((p) => this.isProviderConfigured(p));
    }

    // If still empty (no providers configured), return legacy fallback
    if (chain.length === 0) {
      this.logger.warn(`No verification providers configured for ${countryCode}; falling back to Twilio`);
      return [ProviderName.TWILIO];
    }

    return chain;
  }

  private isProviderConfigured(provider: ProviderName): boolean {
    switch (provider) {
      case ProviderName.TWILIO:
        return !!this.configService.get<string>('TWILIO_ACCOUNT_SID');
      case ProviderName.TELNYX:
        return !!this.configService.get<string>('TELNYX_API_KEY');
      case ProviderName.BANDWIDTH:
        return !!this.configService.get<string>('BANDWIDTH_API_TOKEN');
      case ProviderName.JUICYSMS:
        return !!this.configService.get<string>('JUICYSMS_API_KEY');
      case ProviderName.TEXTVERIFIED:
        return !!this.configService.get<string>('TEXTVERIFIED_API_KEY');
      case ProviderName.SMSPOOL:
        return !!this.configService.get<string>('SMSPOOL_API_KEY');
      case ProviderName.TIGERSMS:
        return false; // Explicitly disabled until contract verification
      case ProviderName.QUACKR:
        return !!this.configService.get<string>('QUACKR_API_KEY');
      default:
        return false;
    }
  }

  private getVerificationRouteLabel(provider: ProviderName): string {
    switch (provider) {
      case ProviderName.JUICYSMS:
        return 'BP JuicySMS Verify';
      case ProviderName.TEXTVERIFIED:
        return 'BP TextVerified Verify';
      case ProviderName.TWILIO:
        return 'BP Core Verify';
      case ProviderName.TELNYX:
        return 'BP Standard Route';
      case ProviderName.BANDWIDTH:
        return 'BP Carrier Route';
      default:
        return 'BP Deferred Route';
    }
  }

  private async fetchJuicySmsServices(countryCode: string): Promise<Array<{ name: string; countryCode: string }>> {
    const apiKey = this.configService.get<string>('JUICYSMS_API_KEY');
    if (!apiKey) return [];

    try {
      const response = await axios.get('https://juicysms.com/api/v2/services', {
        headers: { Authorization: `Bearer ${apiKey}` },
        params: countryCode ? { country: countryCode } : undefined,
      });

      const list = Array.isArray(response.data?.data) ? response.data.data : [];
      return list.map((service: Record<string, unknown>) => ({
        name: String(service.name ?? 'JuicySMS service'),
        countryCode: this.normalizeCountry(String(service.country ?? countryCode ?? 'global')),
      }));
    } catch (error) {
      this.logger.warn(`JuicySMS service catalog lookup failed for ${countryCode}: ${this.describeError(error)}`);
      return [];
    }
  }

  private async fetchTextVerifiedServices(countryCode: string): Promise<Array<{ name: string; countryCode: string }>> {
    const apiKey = this.configService.get<string>('TEXTVERIFIED_API_KEY');
    if (!apiKey) return [];

    try {
      const response = await axios.get(`${this.configService.get<string>('TEXTVERIFIED_BASE_URL') ?? 'https://www.textverified.com/api/pub/v2'}/services`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        params: countryCode ? { country: countryCode } : undefined,
      });

      const list = Array.isArray(response.data?.data) ? response.data.data : [];
      return list.map((service: Record<string, unknown>) => ({
        name: String(service.name ?? service.serviceName ?? 'TextVerified service'),
        countryCode: this.normalizeCountry(String(service.country ?? countryCode ?? 'global')),
      }));
    } catch (error) {
      this.logger.warn(`TextVerified service catalog lookup failed for ${countryCode}: ${this.describeError(error)}`);
      return [];
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
      webhook_url: `${webhookBaseUrl}/webhooks/telnyx`,
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
    };
  }

  private async sendBandwidthSms(to: string, from: string, body: string) {
    const { accountId, username, password, applicationId } = this.getBandwidthMessagingConfig();
    const response = await axios.post(
      `https://messaging.bandwidth.com/api/v2/users/${accountId}/messages`,
      {
        to: [to],
        from,
        text: body,
        applicationId,
        tag: `bp-${Date.now()}`,
      },
      {
        auth: { username, password },
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      },
    );

    const message = response.data ?? {};
    return {
      sid: String(message.id ?? `bandwidth-${Date.now()}`),
      status: 'accepted',
    };
  }

  private async searchTwilioNumbers(country: string, areaCode?: string, smsEnabled = true): Promise<ProviderNumberSearchResult[]> {
    if (!this.twilioClient) throw new Error('Twilio not configured');

    const params: Record<string, unknown> = { smsEnabled, limit: 20 };
    if (areaCode) params.areaCode = areaCode;

    const numbers = await this.twilioClient.availablePhoneNumbers(country).local.list(params as any);
    return numbers.map((item) => ({
      number: item.phoneNumber,
      friendlyName: item.friendlyName,
      countryCode: country,
      provider: ProviderName.TWILIO,
      capabilities: {
        sms: item.capabilities.sms,
        voice: item.capabilities.voice,
        mms: item.capabilities.mms,
      },
    }));
  }

  private async searchTelnyxNumbers(
    country: string,
    areaCode?: string,
    smsEnabled = true,
  ): Promise<ProviderNumberSearchResult[]> {
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
      const features = Array.isArray(item.features)
        ? item.features.map((feature) => String(feature).toLowerCase())
        : [];

      return {
        number: String(item.phone_number ?? ''),
        friendlyName: String(item.phone_number ?? ''),
        countryCode: country,
        provider: ProviderName.TELNYX,
        capabilities: {
          sms: features.includes('sms'),
          voice: features.includes('voice') || features.includes('emergency'),
          mms: features.includes('mms'),
        },
      };
    });
  }

  private async searchBandwidthNumbers(
    country: string,
    areaCode?: string,
    smsEnabled = true,
  ): Promise<ProviderNumberSearchResult[]> {
    if (!['US', 'CA'].includes(country)) {
      return [];
    }

    const { accountId, username, password } = this.getBandwidthCoreAuth();
    const params: Record<string, string | number> = { quantity: 20 };
    if (areaCode) params.areaCode = areaCode;

    const response = await axios.get(
      `https://api.bandwidth.com/api/accounts/${accountId}/availableNumbers`,
      {
        auth: { username, password },
        params,
        headers: {
          Accept: 'application/xml',
        },
      },
    );

    const xml = String(response.data ?? '');
    return this.extractXmlValues(xml, 'TelephoneNumber').map((number) => ({
      number: this.ensurePlus(number),
      friendlyName: this.ensurePlus(number),
      countryCode: country,
      provider: ProviderName.BANDWIDTH,
      capabilities: {
        sms: smsEnabled,
        voice: true,
        mms: false,
      },
    }));
  }

  private async purchaseTwilioNumber(
    phoneNumber: string,
    countryCode?: string,
  ): Promise<ProviderNumberPurchaseResult> {
    if (!this.twilioClient) throw new Error('Twilio not configured');
    const webhookBaseUrl = this.getWebhookBaseUrl();

    const purchased = await this.twilioClient.incomingPhoneNumbers.create({
      phoneNumber,
      smsUrl: `${webhookBaseUrl}/webhooks/twilio/sms`,
      voiceUrl: `${webhookBaseUrl}/webhooks/twilio/voice`,
      statusCallback: `${webhookBaseUrl}/webhooks/twilio/status`,
    });

    const normalizedCountry = countryCode ? this.normalizeCountry(countryCode) : this.inferCountryFromPhone(phoneNumber);
    return {
      sid: purchased.sid,
      number: purchased.phoneNumber,
      provider: ProviderName.TWILIO,
      numberProvider: this.getPreferredNumberProvider(normalizedCountry),
    };
  }

  private async purchaseTelnyxNumber(phoneNumber: string): Promise<ProviderNumberPurchaseResult> {
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
    const country = this.inferCountryFromPhone(phoneNumber);

    return {
      sid: purchased.id ?? response.data?.data?.id ?? `telnyx-order-${Date.now()}`,
      number: purchased.phone_number ?? phoneNumber,
      provider: ProviderName.TELNYX,
      numberProvider: this.getPreferredNumberProvider(country),
    };
  }

  private async purchaseBandwidthNumber(phoneNumber: string): Promise<ProviderNumberPurchaseResult> {
    const { accountId, username, password, siteId, peerId } = this.getBandwidthNumberOrderingConfig();
    const normalizedNumber = this.stripPlus(phoneNumber);
    const peerXml = peerId ? `<PeerId>${peerId}</PeerId>` : '';
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Order>
  <Name>Burner Point Number Order</Name>
  <SiteId>${siteId}</SiteId>
  ${peerXml}
  <PartialAllowed>true</PartialAllowed>
  <ExistingTelephoneNumberOrderType>
    <TelephoneNumberList>
      <TelephoneNumber>${normalizedNumber}</TelephoneNumber>
    </TelephoneNumberList>
  </ExistingTelephoneNumberOrderType>
</Order>`;

    const response = await axios.post(
      `https://api.bandwidth.com/api/accounts/${accountId}/orders`,
      xml,
      {
        auth: { username, password },
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          Accept: 'application/xml',
        },
      },
    );

    const responseXml = String(response.data ?? '');
    const orderId = this.extractXmlValue(responseXml, 'id') ?? `bandwidth-order-${Date.now()}`;
    const purchasedNumber = this.extractXmlValue(responseXml, 'TelephoneNumber') ?? normalizedNumber;
    const country = this.inferCountryFromPhone(phoneNumber);

    return {
      sid: orderId,
      number: this.ensurePlus(purchasedNumber),
      provider: ProviderName.BANDWIDTH,
      numberProvider: this.getPreferredNumberProvider(country),
    };
  }

  private async releaseTwilioNumber(sid: string): Promise<void> {
    if (!this.twilioClient) throw new Error('Twilio not configured');
    await this.twilioClient.incomingPhoneNumbers(sid).remove();
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

  private async releaseBandwidthNumber(phoneNumber?: string): Promise<void> {
    if (!phoneNumber) throw new Error('Bandwidth release requires the phone number');

    const { accountId, username, password } = this.getBandwidthCoreAuth();
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<DisconnectTelephoneNumberOrder>
  <CustomerOrderId>burner-point-disconnect-${Date.now()}</CustomerOrderId>
  <DisconnectTelephoneNumberOrderType>
    <TelephoneNumberList>
      <TelephoneNumber>${this.stripPlus(phoneNumber)}</TelephoneNumber>
    </TelephoneNumberList>
  </DisconnectTelephoneNumberOrderType>
</DisconnectTelephoneNumberOrder>`;

    await axios.post(
      `https://api.bandwidth.com/api/accounts/${accountId}/disconnects`,
      xml,
      {
        auth: { username, password },
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          Accept: 'application/xml',
        },
      },
    );
  }

  private async startTwilioCall(to: string, from: string, options?: ProviderCallOptions) {
    if (!this.twilioClient) throw new Error('Twilio not configured');
    const webhookBaseUrl = this.getWebhookBaseUrl();
    const querySuffix = options?.callId ? `?callId=${encodeURIComponent(options.callId)}` : '';

    const call = await this.twilioClient.calls.create({
      to,
      from,
      url: `${webhookBaseUrl}/webhooks/voice/twilio/answer${querySuffix}`,
      statusCallback: `${webhookBaseUrl}/webhooks/voice/twilio${querySuffix}`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
    });

    return {
      sid: call.sid,
      status: call.status ?? 'queued',
    };
  }

  private async endTwilioCall(callSid: string): Promise<void> {
    if (!this.twilioClient) throw new Error('Twilio not configured');
    await this.twilioClient.calls(callSid).update({ status: 'completed' });
  }

  private async startBandwidthCall(to: string, from: string, options?: ProviderCallOptions) {
    const { accountId, username, password, applicationId } = this.getBandwidthVoiceConfig();
    const webhookBaseUrl = this.getWebhookBaseUrl();
    const querySuffix = options?.callId ? `?callId=${encodeURIComponent(options.callId)}` : '';

    const response = await axios.post(
      `https://voice.bandwidth.com/api/v2/accounts/${accountId}/calls`,
      {
        to,
        from,
        applicationId,
        answerUrl: `${webhookBaseUrl}/webhooks/voice/bandwidth/answer${querySuffix}`,
        disconnectUrl: `${webhookBaseUrl}/webhooks/voice/bandwidth${querySuffix}`,
      },
      {
        auth: { username, password },
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    const data = response.data ?? {};
    return {
      sid: String(data.callId ?? data.id ?? `bandwidth-call-${Date.now()}`),
      status: String(data.state ?? 'queued'),
    };
  }

  private async endBandwidthCall(callSid: string) {
    const { accountId, username, password } = this.getBandwidthCoreAuth();
    await axios.post(
      `https://voice.bandwidth.com/api/v2/accounts/${accountId}/calls/${callSid}`,
      { state: 'completed' },
      {
        auth: { username, password },
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
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

  private getWebhookBaseUrl(): string {
    return resolveApiUrl(this.configService);
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

  private ensurePlus(value: string): string {
    return value.startsWith('+') ? value : `+${value}`;
  }

  private uniqueProviders(providers: Array<ProviderName | undefined>): ProviderName[] {
    return providers.filter((provider): provider is ProviderName => Boolean(provider)).filter((provider, index, list) => list.indexOf(provider) === index);
  }

  private describeError(error: unknown): string {
    if (error instanceof Error) return error.message;
    return String(error);
  }

  private extractXmlValues(xml: string, tag: string): string[] {
    const pattern = new RegExp(`<${tag}>(.*?)</${tag}>`, 'g');
    const values: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(xml)) !== null) {
      values.push(match[1]);
    }
    return values;
  }

  private extractXmlValue(xml: string, tag: string): string | null {
    return this.extractXmlValues(xml, tag)[0] ?? null;
  }

  private getBandwidthCoreAuth() {
    const accountId = this.configService.get<string>('BANDWIDTH_ACCOUNT_ID');
    const username = this.configService.get<string>('BANDWIDTH_USERNAME');
    const password = this.configService.get<string>('BANDWIDTH_PASSWORD');

    if (!accountId || !username || !password) {
      throw new Error('Bandwidth core credentials are not configured');
    }

    return { accountId, username, password };
  }

  private getBandwidthMessagingConfig() {
    const core = this.getBandwidthCoreAuth();
    const applicationId =
      this.configService.get<string>('BANDWIDTH_MESSAGING_APPLICATION_ID') ||
      this.configService.get<string>('BANDWIDTH_APPLICATION_ID');

    if (!applicationId) {
      throw new Error('Bandwidth messaging application is not configured');
    }

    return { ...core, applicationId };
  }

  private getBandwidthVoiceConfig() {
    const core = this.getBandwidthCoreAuth();
    const applicationId =
      this.configService.get<string>('BANDWIDTH_VOICE_APPLICATION_ID') ||
      this.configService.get<string>('BANDWIDTH_APPLICATION_ID');

    if (!applicationId) {
      throw new Error('Bandwidth voice application is not configured');
    }

    return { ...core, applicationId };
  }

  private getBandwidthNumberOrderingConfig() {
    const core = this.getBandwidthCoreAuth();
    const siteId =
      this.configService.get<string>('BANDWIDTH_SITE_ID') ||
      this.configService.get<string>('BANDWIDTH_LOCATION_ID');
    const peerId = this.configService.get<string>('BANDWIDTH_SIPPEER_ID');

    if (!siteId) {
      throw new Error('Bandwidth number ordering requires BANDWIDTH_SITE_ID');
    }

    return { ...core, siteId, peerId };
  }
}
