import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { createHash, randomBytes } from 'crypto';
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
  | 'oneglobal.plans'
  | 'oneglobal.order'
  | 'brightdata.proxyOrder'
  | 'wireguard.session';

const PROVIDER_OPERATIONS: Record<ProviderOperation, {
  integrationId: BackendIntegrationId;
  baseUrlEnv: string;
  pathEnv: string;
  apiKeyEnv: string;
  authHeader: string;
}> = {
  'oneglobal.plans': {
    integrationId: 'oneglobal',
    baseUrlEnv: 'ONEGLOBAL_BASE_URL',
    pathEnv: 'ONEGLOBAL_PLANS_PATH',
    apiKeyEnv: 'ONEGLOBAL_API_KEY',
    authHeader: 'Authorization',
  },
  'oneglobal.order': {
    integrationId: 'oneglobal',
    baseUrlEnv: 'ONEGLOBAL_BASE_URL',
    pathEnv: 'ONEGLOBAL_ORDER_PATH',
    apiKeyEnv: 'ONEGLOBAL_API_KEY',
    authHeader: 'Authorization',
  },
  'brightdata.proxyOrder': {
    integrationId: 'brightdata',
    baseUrlEnv: 'BRIGHTDATA_BASE_URL',
    pathEnv: 'BRIGHTDATA_PROXY_ORDER_PATH',
    apiKeyEnv: 'BRIGHTDATA_API_KEY',
    authHeader: 'Authorization',
  },
  'wireguard.session': {
    integrationId: 'wireguard',
    baseUrlEnv: 'WIREGUARD_CONTROL_BASE_URL',
    pathEnv: 'WIREGUARD_SESSION_PATH',
    apiKeyEnv: 'WIREGUARD_CONTROL_API_KEY',
    authHeader: 'Authorization',
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

  constructor(private readonly config: ConfigService) {}

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

    const apiKey = this.config.get<string>('POSTHOG_API_KEY');
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
      this.logger.warn(`PostHog event skipped because POSTHOG_API_KEY is missing: ${input.event}`);
      return {
        queued: false,
        status: 'not_configured',
        missingEnv: ['POSTHOG_API_KEY'],
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

    const configured = ['S3_BUCKET', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY'].every((env) => this.hasEnv(env));
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
      missingEnv: configured ? [] : ['S3_BUCKET', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY'].filter((env) => !this.hasEnv(env)),
      note: 'The API owns object-storage credentials. Clients must not call object storage directly.',
    };
  }

  requestEsimPlans(userId: string, input: EsimPlansInput) {
    return this.callConfiguredProvider('oneglobal.plans', userId, input);
  }

  createEsimOrder(userId: string, input: EsimOrderInput) {
    return this.callConfiguredProvider('oneglobal.order', userId, input);
  }

  createProxyOrder(userId: string, input: ProxyOrderInput) {
    return this.callConfiguredProvider('brightdata.proxyOrder', userId, input);
  }

  createVpnSession(userId: string, input: VpnSessionInput) {
    return this.callConfiguredProvider('wireguard.session', userId, input);
  }

  private async callConfiguredProvider(operation: ProviderOperation, userId: string, payload: object) {
    const cfg = PROVIDER_OPERATIONS[operation];
    const missingEnv = [cfg.baseUrlEnv, cfg.pathEnv, cfg.apiKeyEnv].filter((env) => !this.hasEnv(env));
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

    const baseUrl = this.config.get<string>(cfg.baseUrlEnv).replace(/\/+$/, '');
    const path = this.config.get<string>(cfg.pathEnv).replace(/^\/?/, '/');
    const apiKey = this.config.get<string>(cfg.apiKeyEnv);
    const response = await axios.post(
      `${baseUrl}${path}`,
      {
        ...(payload as Record<string, unknown>),
        burnerPointUserId: userId,
      },
      {
        timeout: 15000,
        headers: {
          [cfg.authHeader]: `Bearer ${apiKey}`,
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

  private hasEnv(name: string): boolean {
    const value = this.config.get<string>(name);
    if (!value) return false;
    const normalized = value.trim().toLowerCase();
    return normalized !== 'replace_me' && !normalized.includes('replace_me');
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
}
