import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { createHash, randomBytes } from 'crypto';
import { UsersService } from '../users/users.service';
import { BillingService } from '../billing-v2/billing.service';
import { TransactionType } from '../../database/entities/extended-entities';
import { resolveConfiguredEnv } from '../../config/runtime-env';
import {
  BACKEND_INTEGRATION_CONTRACTS,
  BackendIntegrationContract,
  BackendIntegrationId,
} from './integration-registry';

export interface CaptureAnalyticsEventInput {
  event: string;
  properties?: Record<string, unknown>;
  distinctId?: string;
}

export interface UploadIntentInput {
  purpose: 'mms' | 'voicemail' | 'support_attachment' | 'document' | 'export';
  fileName: string;
  contentType: string;
  byteSize: number;
}

export interface EsimPlansInput {
  countryCode: string;
  region?: string;
}

export interface EsimOrderInput {
  planId: string;
  countryCode: string;
  iccid?: string;
}

export interface ProxyOrderInput {
  region: string;
  type: 'residential' | 'mobile';
  durationDays?: number;
}

export interface VpnSessionInput {
  deviceName: string;
  region?: string;
}

type ProviderOperation =
  | 'airalo.plans'
  | 'airalo.order'
  | 'oxylabs.proxyOrder'
  | 'smartproxy.proxyOrder'
  | 'wireguard.session';

const PROVIDER_OPERATIONS: Record<ProviderOperation, {
  integrationId: BackendIntegrationId;
  baseUrlEnv: string;
  pathEnv: string;
  authHeaders: string[];
  authKind: 'bearer' | 'basic' | 'raw';
}> = {
  'airalo.plans': {
    integrationId: 'airalo',
    baseUrlEnv: 'AIRALO_BASE_URL',
    pathEnv: 'AIRALO_PLANS_PATH',
    authHeaders: ['AIRALO_API_KEY', 'AIRALO_API_SECRET'],
    authKind: 'basic',
  },
  'airalo.order': {
    integrationId: 'airalo',
    baseUrlEnv: 'AIRALO_BASE_URL',
    pathEnv: 'AIRALO_ORDER_PATH',
    authHeaders: ['AIRALO_API_KEY', 'AIRALO_API_SECRET'],
    authKind: 'basic',
  },
  'oxylabs.proxyOrder': {
    integrationId: 'oxylabs',
    baseUrlEnv: 'OXYLABS_BASE_URL',
    pathEnv: 'OXYLABS_PROXY_ORDER_PATH',
    authHeaders: ['OXYLABS_USERNAME', 'OXYLABS_PASSWORD'],
    authKind: 'basic',
  },
  'smartproxy.proxyOrder': {
    integrationId: 'smartproxy',
    baseUrlEnv: 'SMARTPROXY_BASE_URL',
    pathEnv: 'SMARTPROXY_PROXY_ORDER_PATH',
    authHeaders: ['SMARTPROXY_API_KEY'],
    authKind: 'bearer',
  },
  'wireguard.session': {
    integrationId: 'wireguard',
    baseUrlEnv: 'WIREGUARD_CONTROL_BASE_URL',
    pathEnv: 'WIREGUARD_SESSION_PATH',
    authHeaders: ['WIREGUARD_CONTROL_API_KEY'],
    authKind: 'bearer',
  },
};

const ALLOWED_UPLOAD_CONTENT_TYPES: Record<UploadIntentInput['purpose'], string[]> = {
  mms: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'audio/mpeg'],
  voicemail: ['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/x-wav', 'audio/webm'],
  support_attachment: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'text/plain'],
  document: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  export: ['application/json', 'text/csv', 'application/zip'],
};

@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly usersService: UsersService,
    private readonly billingService: BillingService,
  ) {}

  getCatalog() {
    return BACKEND_INTEGRATION_CONTRACTS.map((contract) => this.toSafeContract(contract));
  }

  getContracts() {
    return {
      product: 'Burner Point',
      rule: 'All third-party service calls route through the Burner Point backend. Clients never receive provider secrets.',
      generatedAt: new Date().toISOString(),
      endpoints: BACKEND_INTEGRATION_CONTRACTS.flatMap((contract) =>
        contract.endpoints.map((endpoint) => ({
          integrationId: contract.id,
          integrationName: contract.name,
          ...endpoint,
        })),
      ),
    };
  }

  getIntegration(id: string) {
    const contract = BACKEND_INTEGRATION_CONTRACTS.find((item) => item.id === id);
    if (!contract) throw new NotFoundException('Integration not found');
    return this.toSafeContract(contract);
  }

  async captureAnalyticsEvent(userId: string, input: CaptureAnalyticsEventInput) {
    if (!input.event?.trim()) throw new BadRequestException('event is required');

    const apiKey = resolveConfiguredEnv('POSTHOG_API_KEY', this.config);
    const host = (this.config.get<string>('POSTHOG_HOST') || 'https://us.i.posthog.com').replace(/\/+$/, '');
    const payload = {
      api_key: apiKey,
      event: input.event.trim(),
      distinct_id: input.distinctId || userId,
      properties: {
        ...(input.properties || {}),
        userId,
        source: 'burner_point_api',
      },
    };

    if (!apiKey) {
      this.logger.warn(`PostHog event skipped because POSTHOG_KEY is missing: ${input.event}`);
      return {
        queued: false,
        status: 'not_configured',
        missingEnv: ['POSTHOG_KEY'],
      };
    }

    await axios.post(`${host}/capture/`, payload, { timeout: 5000 });
    this.logger.log(`PostHog event captured server-side: ${input.event}`);
    return { queued: true, status: 'captured' };
  }

  createUploadIntent(userId: string, input: UploadIntentInput) {
    if (!input.fileName || !input.contentType || !input.byteSize) {
      throw new BadRequestException('fileName, contentType, and byteSize are required');
    }

    const maxBytes = this.maxUploadBytes(input.purpose);
    if (input.byteSize > maxBytes) {
      throw new BadRequestException(`Upload exceeds ${maxBytes} bytes for ${input.purpose}`);
    }

    if (!this.isAllowedUploadType(input.purpose, input.contentType)) {
      throw new BadRequestException(`Unsupported upload content type for ${input.purpose}`);
    }

    const userShard = createHash('sha256').update(userId).digest('hex').slice(0, 16);
    const objectKey = [
      input.purpose,
      userShard,
      new Date().toISOString().slice(0, 10),
      `${Date.now()}-${randomBytes(8).toString('hex')}-${this.safeFileName(input.fileName)}`,
    ].join('/');

    const configured = this.hasStorageConfigured();
    return {
      status: configured ? 'ready' : 'not_configured',
      objectKey,
      uploadMethod: 'backend-controlled',
      accessControl: 'private',
      directPublicAccess: false,
      classification: this.uploadClassification(input.purpose),
      requiresServerSideScan: ['support_attachment', 'document'].includes(input.purpose),
      maxBytes,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      missingEnv: configured ? [] : this.getMissingStorageEnv(),
      note: 'The API owns object-storage credentials. Clients must not call object storage directly.',
    };
  }

  requestEsimPlans(userId: string, input: EsimPlansInput) {
    return this.callConfiguredProvider('airalo.plans', userId, input);
  }

  async createEsimOrder(userId: string, input: EsimOrderInput) {
    return this.purchaseIntegrationProduct(
      userId,
      'airalo.order',
      input,
      this.resolveConfiguredUsdCents('ESIM_ORDER_PRICE_USD_CENTS', 'eSIM order'),
      TransactionType.ESIM_PURCHASE,
      'BP eSIM order',
      {
        countryCode: input.countryCode,
        planId: input.planId,
      },
    );
  }

  async createProxyOrder(userId: string, input: ProxyOrderInput) {
    const unitPriceUsdCents = this.resolveConfiguredUsdCents('PROXY_ORDER_DAILY_PRICE_USD_CENTS', 'proxy order');
    const durationDays = input.durationDays ?? 30;
    const totalPriceUsdCents = unitPriceUsdCents * durationDays;
    const preferredOperations: ProviderOperation[] = ['oxylabs.proxyOrder', 'smartproxy.proxyOrder'];
    const missingByProvider: Array<{ integrationId: BackendIntegrationId; missingEnv: string[] }> = [];

    await this.ensureWalletCoverage(userId, totalPriceUsdCents);

    for (const operation of preferredOperations) {
      const missingEnv = this.getMissingProviderEnv(operation);
      if (missingEnv.length) {
        missingByProvider.push({
          integrationId: PROVIDER_OPERATIONS[operation].integrationId,
          missingEnv,
        });
        continue;
      }

      try {
        return await this.purchaseIntegrationProduct(
          userId,
          operation,
          { ...input, durationDays },
          totalPriceUsdCents,
          TransactionType.PROXY_PURCHASE,
          `BP proxy order (${input.type})`,
          {
            region: input.region,
            type: input.type,
            durationDays,
          },
        );
      } catch (error) {
        this.logger.warn(`${operation} failed; falling back if another proxy provider is configured: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return {
      status: 'not_configured',
      integrationId: 'oxylabs',
      operation: 'proxy.order',
      requestAccepted: false,
      fallbackChecked: ['oxylabs', 'smartproxy'],
      missingEnvByProvider: missingByProvider,
    };
  }

  async createVpnSession(userId: string, input: VpnSessionInput) {
    return this.purchaseIntegrationProduct(
      userId,
      'wireguard.session',
      input,
      this.resolveConfiguredUsdCents('VPN_SESSION_PRICE_USD_CENTS', 'secure tunnel session'),
      TransactionType.VPN_PURCHASE,
      'BP Secure Tunnel session',
      {
        deviceName: input.deviceName,
        region: input.region ?? null,
      },
    );
  }

  private async purchaseIntegrationProduct(
    userId: string,
    operation: ProviderOperation,
    payload: object,
    amountUsdCents: number,
    transactionType: TransactionType,
    description: string,
    metadata: Record<string, unknown>,
  ) {
    await this.ensureWalletCoverage(userId, amountUsdCents);

    const providerResult = await this.callConfiguredProvider(operation, userId, payload);
    if (providerResult?.status !== 'submitted') {
      return providerResult;
    }

    const updatedUser = await this.usersService.debitWallet(userId, amountUsdCents);
    await this.billingService.recordWalletTransaction({
      userId,
      type: transactionType,
      amountKobo: -amountUsdCents,
      balanceAfterKobo: Number(updatedUser.walletBalanceKobo),
      description,
      referenceId: this.extractProviderReference(providerResult.data),
      metadata: {
        ...metadata,
        integrationId: providerResult.integrationId,
        operation: providerResult.operation,
        providerStatus: providerResult.providerStatus,
      },
    });

    return {
      ...providerResult,
      walletDebitedUsdCents: amountUsdCents,
      walletChargeRecorded: true,
    };
  }

  private async callConfiguredProvider(operation: ProviderOperation, userId: string, payload: object) {
    const cfg = PROVIDER_OPERATIONS[operation];
    const missingEnv = this.getMissingProviderEnv(operation);
    if (missingEnv.length) {
      this.logger.warn(`${operation} skipped; missing ${missingEnv.join(', ')}`);
      return {
        status: 'not_configured',
        integrationId: cfg.integrationId,
        operation,
        missingEnv,
        requestAccepted: false,
      };
    }

    const baseUrl = this.readEnv(cfg.baseUrlEnv).replace(/\/+$/, '');
    const path = this.readEnv(cfg.pathEnv).replace(/^\/?/, '/');
    const authValues = cfg.authHeaders.map((name) => this.readEnv(name));
    const response = await axios.post(
      `${baseUrl}${path}`,
      {
        ...(payload as Record<string, unknown>),
        burnerPointUserId: userId,
      },
      {
        timeout: 15000,
        headers: {
          ...this.buildProviderAuthHeaders(cfg.authKind, authValues),
          'Content-Type': 'application/json',
          'X-Burner-Point-Operation': operation,
        },
      },
    );

    this.logger.log(`${operation} completed for user ${userId}`);
    return {
      status: 'submitted',
      integrationId: cfg.integrationId,
      operation,
      providerStatus: response.status,
      data: this.sanitizeProviderResponse(response.data),
    };
  }

  private toSafeContract(contract: BackendIntegrationContract) {
    const requiredEnv = contract.secretEnv.map((name) => ({ name, configured: this.hasEnv(name) }));
    const optionalEnv = contract.optionalEnv.map((name) => ({ name, configured: this.hasEnv(name) }));
    const configuredRequired = requiredEnv.filter((env) => env.configured).length;

    return {
      id: contract.id,
      name: contract.name,
      category: contract.category,
      backendOnly: contract.backendOnly,
      frontendRule: contract.frontendRule,
      publicClientEnv: contract.publicClientEnv,
      status: requiredEnv.length === 0 || configuredRequired === requiredEnv.length
        ? 'configured'
        : configuredRequired > 0
          ? 'partial'
          : 'missing_env',
      requiredEnv,
      optionalEnv,
      endpoints: contract.endpoints,
    };
  }

  private sanitizeProviderResponse(data: unknown) {
    if (!data || typeof data !== 'object') return data;
    const blocked = ['token', 'secret', 'apiKey', 'api_key', 'password', 'privateKey', 'private_key'];
    const redact = (value: unknown): unknown => {
      if (Array.isArray(value)) return value.map(redact);
      if (!value || typeof value !== 'object') return value;
      return Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>((acc, [key, nested]) => {
        acc[key] = blocked.some((term) => key.toLowerCase().includes(term.toLowerCase())) ? '[redacted]' : redact(nested);
        return acc;
      }, {});
    };
    return redact(data);
  }

  private async ensureWalletCoverage(userId: string, amountUsdCents: number) {
    const wallet = await this.usersService.getWalletBalance(userId);
    if (wallet.balanceUsdCents < amountUsdCents) {
      throw new BadRequestException('Insufficient wallet balance');
    }
  }

  private resolveConfiguredUsdCents(envName: string, label: string) {
    const rawValue = this.config.get<string>(envName);
    const parsed = Number(rawValue);
    if (!rawValue || !Number.isFinite(parsed) || parsed <= 0) {
      throw new BadRequestException(`${label} is unavailable because ${envName} is not configured`);
    }
    return Math.round(parsed);
  }

  private extractProviderReference(data: unknown): string | undefined {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return undefined;
    const record = data as Record<string, unknown>;
    for (const key of ['id', 'orderId', 'order_id', 'sessionId', 'session_id', 'reference']) {
      const value = record[key];
      if (typeof value === 'string' && value.trim()) return value.trim();
      if (typeof value === 'number') return String(value);
    }
    return undefined;
  }

  private hasEnv(name: string): boolean {
    return Boolean(this.readOptionalEnv(name));
  }

  private getMissingProviderEnv(operation: ProviderOperation): string[] {
    const cfg = PROVIDER_OPERATIONS[operation];
    return [cfg.baseUrlEnv, cfg.pathEnv, ...cfg.authHeaders].filter((env) => !this.hasEnv(env));
  }

  private buildProviderAuthHeaders(
    authKind: 'bearer' | 'basic' | 'raw',
    values: string[],
  ): Record<string, string> {
    if (authKind === 'bearer') {
      return { Authorization: `Bearer ${values[0]}` };
    }

    if (authKind === 'basic') {
      const token = Buffer.from(`${values[0]}:${values[1] || ''}`).toString('base64');
      return { Authorization: `Basic ${token}` };
    }

    return { Authorization: values[0] };
  }

  private safeFileName(name: string) {
    return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
  }

  private isAllowedUploadType(purpose: UploadIntentInput['purpose'], contentType: string): boolean {
    const normalized = contentType.toLowerCase().split(';')[0].trim();
    return ALLOWED_UPLOAD_CONTENT_TYPES[purpose].includes(normalized);
  }

  private uploadClassification(purpose: UploadIntentInput['purpose']) {
    if (purpose === 'document') return 'sensitive_identity_or_document';
    if (purpose === 'support_attachment') return 'sensitive_support_attachment';
    if (purpose === 'voicemail' || purpose === 'mms') return 'private_communication_media';
    return 'private_export';
  }

  private maxUploadBytes(purpose: UploadIntentInput['purpose']) {
    switch (purpose) {
      case 'mms':
        return 10 * 1024 * 1024;
      case 'voicemail':
        return 25 * 1024 * 1024;
      case 'support_attachment':
      case 'document':
        return 15 * 1024 * 1024;
      case 'export':
      default:
        return 50 * 1024 * 1024;
    }
  }

  private readOptionalEnv(name: string): string | undefined {
    return resolveConfiguredEnv(name, this.config);
  }

  private readEnv(name: string): string {
    const value = this.readOptionalEnv(name);
    if (!value) {
      throw new BadRequestException(`${name} is not configured`);
    }
    return value;
  }

  private hasStorageConfigured(): boolean {
    return (
      ['AWS_BUCKET', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'].every((env) => this.hasEnv(env)) ||
      ['R2_BUCKET', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY'].every((env) => this.hasEnv(env))
    );
  }

  private getMissingStorageEnv(): string[] {
    const awsMissing = ['AWS_BUCKET', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'].filter((env) => !this.hasEnv(env));
    const r2Missing = ['R2_BUCKET', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY'].filter((env) => !this.hasEnv(env));
    return awsMissing.length === 3 ? r2Missing : awsMissing;
  }
}
