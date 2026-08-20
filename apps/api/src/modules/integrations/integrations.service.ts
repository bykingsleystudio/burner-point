import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { createHash, randomBytes } from 'crypto';
import { Repository } from 'typeorm';
import { resolveConfiguredEnv } from '../../config/runtime-env';
import { EsimOrder, ProxyOrder, TransactionType, VpnSession } from '../../database/entities/extended-entities';
import { RevenueCatService } from '../revenuecat/revenuecat.service';
import { CreditsService } from '../credits/credits.service';
import { CredentialCipherService } from './credential-cipher.service';
import { createSupabaseFromConfig } from '../../config/supabase';
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

export interface NormalizedEsimPlan {
  id: string;
  name: string;
  countryCode: string;
  region: string | null;
  dataAmountGb: number | null;
  validityDays: number | null;
  priceUsdCents: number;
  currency: string;
  networks: string[];
  supports5g: boolean | null;
  supportsHotspot: boolean | null;
  activationPolicy: string | null;
  metadata: Record<string, unknown>;
}

export interface EsimOrderInput {
  planId: string;
  countryCode: string;
  iccid?: string;
  idempotencyKey?: string;
}

export interface ProxyOrderInput {
  region: string;
  type: 'residential' | 'mobile';
  durationDays?: number;
  protocol?: 'http' | 'https' | 'socks5';
  bandwidthGb?: number;
  ipCount?: number;
  rotationMode?: 'rotating' | 'sticky' | 'static';
  idempotencyKey?: string;
}

export interface VpnSessionInput {
  deviceName: string;
  region?: string;
  idempotencyKey?: string;
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
    private readonly creditsService: CreditsService,
    private readonly revenueCatService: RevenueCatService,
    @InjectRepository(EsimOrder) private readonly esimOrderRepo: Repository<EsimOrder>,
    @InjectRepository(ProxyOrder) private readonly proxyOrderRepo: Repository<ProxyOrder>,
    @InjectRepository(VpnSession) private readonly vpnSessionRepo: Repository<VpnSession>,
    private readonly credentialCipher: CredentialCipherService,
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
    const bucket = this.storageBucket(input.purpose);
    let upload: { token: string; path: string } | null = null;
    if (configured && this.hasSupabaseStorageConfigured()) {
      // The service-role client creates a one-use upload token; the browser never receives service credentials.
      const client = createSupabaseFromConfig(this.config);
      return client.storage.from(bucket).createSignedUploadUrl(objectKey).then(({ data, error }) => {
        if (error || !data) throw new BadRequestException('Unable to create private upload intent');
        upload = { token: data.token, path: data.path };
        return this.toUploadIntentResponse(input, objectKey, bucket, configured, upload);
      });
    }

    return this.toUploadIntentResponse(input, objectKey, bucket, configured, upload);
  }

  async createSignedReadUrl(userId: string, bucket: string, objectKey: string) {
    if (!this.hasSupabaseStorageConfigured()) throw new BadRequestException('Supabase private storage is not configured');
    const safeKey = objectKey.replace(/\\/g, '/');
    const userShard = createHash('sha256').update(userId).digest('hex').slice(0, 16);
    if (!safeKey.includes(`/${userShard}/`)) throw new BadRequestException('Storage object is not owned by this user');
    const { data, error } = await createSupabaseFromConfig(this.config).storage.from(bucket).createSignedUrl(safeKey, 60 * 60);
    if (error || !data?.signedUrl) throw new BadRequestException('Unable to create private media URL');
    return { signedUrl: data.signedUrl, expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString() };
  }

  private toUploadIntentResponse(
    input: UploadIntentInput,
    objectKey: string,
    bucket: string,
    configured: boolean,
    upload: { token: string; path: string } | null,
  ) {
    const maxBytes = this.maxUploadBytes(input.purpose);
    return {
      status: configured ? 'ready' : 'not_configured',
      objectKey,
      bucket,
      upload,
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

  private storageBucket(purpose: UploadIntentInput['purpose']) {
    if (purpose === 'mms' || purpose === 'voicemail') return this.readOptionalEnv('SUPABASE_STORAGE_MEDIA_BUCKET') ?? 'bp-media';
    if (purpose === 'document') return this.readOptionalEnv('SUPABASE_STORAGE_DOCUMENTS_BUCKET') ?? 'bp-documents';
    if (purpose === 'support_attachment') return this.readOptionalEnv('SUPABASE_STORAGE_USER_UPLOADS_BUCKET') ?? 'bp-user-uploads';
    return this.readOptionalEnv('SUPABASE_STORAGE_USER_UPLOADS_BUCKET') ?? 'bp-user-uploads';
  }

  private hasSupabaseStorageConfigured() {
    return ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'].every((env) => this.hasEnv(env));
  }

  async requestEsimPlans(userId: string, input: EsimPlansInput) {
    const result = await this.callConfiguredProvider('airalo.plans', userId, input);
    if (result.status !== 'submitted') return result;
    return { ...result, data: this.normalizeEsimPlans(result.data, input.countryCode) };
  }

  async createEsimOrder(userId: string, input: EsimOrderInput) {
    const idempotencyKey = this.integrationIdempotencyKey('esim', input, input.idempotencyKey);
    const existing = await this.esimOrderRepo.findOne({ where: { userId, idempotencyKey } });
    if (existing) return this.toPublicEsimOrder(existing);

    const catalogResult = await this.callConfiguredProvider('airalo.plans', userId, {
      countryCode: input.countryCode,
    });
    if (catalogResult.status !== 'submitted') {
      throw new BadRequestException('eSIM catalog provider is not configured');
    }
    const plan = this.normalizeEsimPlans(catalogResult.data, input.countryCode)
      .find((item) => item.id === input.planId);
    if (!plan) throw new BadRequestException('eSIM plan is no longer available');

    const order = await this.esimOrderRepo.save(this.esimOrderRepo.create({
      userId,
      provider: 'airalo',
      planId: input.planId,
      planName: plan.name,
      country: input.countryCode,
      dataAmountGb: plan.dataAmountGb,
      validityDays: plan.validityDays,
      priceUsdCents: plan.priceUsdCents,
      idempotencyKey,
      status: 'pending',
      metadata: { plan, walletCurrency: plan.currency },
    }));

    try {
      const result = await this.purchaseIntegrationProduct(
        userId,
        'airalo.order',
        { ...input, idempotencyKey, plan },
        plan.priceUsdCents,
        'esim_store',
        TransactionType.ESIM_PURCHASE,
        'BP eSIM order',
        { countryCode: input.countryCode, planId: input.planId, orderId: order.id },
        idempotencyKey,
        async (safeData, rawData) => this.persistEsimAcceptance(order, safeData, rawData),
      );

      if (result.status !== 'submitted') {
        await this.esimOrderRepo.update(order.id, {
          status: 'failed',
          failureReason: 'Airalo order provider is not configured',
        });
      } else {
        await this.esimOrderRepo.update(order.id, {
          walletTransactionId: 'walletTransactionId' in result ? result.walletTransactionId ?? null : null,
        });
      }
    } catch (error) {
      await this.markConnectivityFailure(this.esimOrderRepo, order.id, error);
      throw error;
    }

    return this.toPublicEsimOrder(await this.esimOrderRepo.findOneByOrFail({ id: order.id }));
  }

  async createProxyOrder(userId: string, input: ProxyOrderInput) {
    const unitPriceUsdCents = this.resolveConfiguredUsdCents('PROXY_ORDER_DAILY_PRICE_USD_CENTS', 'proxy order');
    const durationDays = input.durationDays ?? 30;
    const totalPriceUsdCents = unitPriceUsdCents * durationDays;
    const idempotencyKey = this.integrationIdempotencyKey('proxy', { ...input, durationDays }, input.idempotencyKey);
    const existing = await this.proxyOrderRepo.findOne({ where: { userId, idempotencyKey } });
    if (existing) return this.toPublicProxyOrder(existing);

    const order = await this.proxyOrderRepo.save(this.proxyOrderRepo.create({
      userId,
      provider: 'pending',
      planType: input.type,
      location: input.region,
      ipCount: input.ipCount ?? null,
      bandwidthGb: input.bandwidthGb ?? null,
      priceUsdCents: totalPriceUsdCents,
      idempotencyKey,
      status: 'pending',
      metadata: {
        durationDays,
        protocol: input.protocol ?? 'https',
        rotationMode: input.rotationMode ?? 'rotating',
      },
    }));
    const preferredOperations: ProviderOperation[] = ['oxylabs.proxyOrder', 'smartproxy.proxyOrder'];
    const missingByProvider: Array<{ integrationId: BackendIntegrationId; missingEnv: string[] }> = [];

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
        const result = await this.purchaseIntegrationProduct(
          userId,
          operation,
          { ...input, durationDays, idempotencyKey },
          totalPriceUsdCents,
          'proxy_store',
          TransactionType.PROXY_PURCHASE,
          `BP proxy order (${input.type})`,
          {
            region: input.region,
            type: input.type,
            durationDays,
            orderId: order.id,
          },
          idempotencyKey,
          async (safeData, rawData) => this.persistProxyAcceptance(order, operation, safeData, rawData),
        );
        if (result.status === 'submitted') {
          await this.proxyOrderRepo.update(order.id, {
            walletTransactionId: 'walletTransactionId' in result ? result.walletTransactionId ?? null : null,
          });
          return this.toPublicProxyOrder(await this.proxyOrderRepo.findOneByOrFail({ id: order.id }));
        }
      } catch (error) {
        this.logger.warn(`${operation} failed; falling back if another proxy provider is configured: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    await this.proxyOrderRepo.update(order.id, {
      status: 'failed',
      failureReason: 'No configured proxy provider accepted the order',
      metadata: { durationDays, missingEnvByProvider: missingByProvider },
    });
    return this.toPublicProxyOrder(await this.proxyOrderRepo.findOneByOrFail({ id: order.id }));
  }

  async createVpnSession(userId: string, input: VpnSessionInput) {
    const entitlementConfig = this.revenueCatService.getEntitlementConfig();
    const hasSubscriptionAccess = await this.revenueCatService.hasAnyActiveEntitlement(userId, [
      entitlementConfig.secureTunnel,
      entitlementConfig.premium,
    ]);
    if (!hasSubscriptionAccess) {
      throw new BadRequestException('An active BP Secure Tunnel VPN subscription is required');
    }
    const entitlementSnapshot = await this.revenueCatService.getEntitlementSnapshot(userId);
    const entitlementSource = entitlementSnapshot.summary.activeEntitlements.includes(entitlementConfig.secureTunnel)
      ? 'secure_tunnel_standalone_or_addon'
      : 'premium_bundle';

    const idempotencyKey = this.integrationIdempotencyKey('vpn', input, input.idempotencyKey);
    const existing = await this.vpnSessionRepo.findOne({ where: { userId, idempotencyKey } });
    if (existing) return this.toPublicVpnSession(existing);

    const session = await this.vpnSessionRepo.save(this.vpnSessionRepo.create({
      userId,
      provider: 'wireguard',
      deviceName: input.deviceName,
      serverLocation: input.region ?? null,
      priceUsdCents: 0,
      idempotencyKey,
      status: 'pending',
      entitlementSource,
      metadata: { subscriptionAccess: true, entitlementSource },
    }));

    try {
      const providerResult = await this.callConfiguredProvider(
        'wireguard.session',
        userId,
        { ...input, idempotencyKey, subscriptionAccess: true },
        async (rawData) => this.persistVpnAcceptance(session, this.sanitizeProviderResponse(rawData), rawData),
      );
      if (providerResult.status !== 'submitted') {
        await this.vpnSessionRepo.update(session.id, {
          status: 'failed',
          failureReason: 'WireGuard control-plane provider is not configured',
        });
      }
    } catch (error) {
      await this.markConnectivityFailure(this.vpnSessionRepo, session.id, error);
      throw error;
    }

    return this.toPublicVpnSession(await this.vpnSessionRepo.findOneByOrFail({ id: session.id }));
  }

  async listEsimOrders(userId: string) {
    return (await this.esimOrderRepo.find({ where: { userId }, order: { createdAt: 'DESC' } }))
      .map((order) => this.toPublicEsimOrder(order));
  }

  async listProxyOrders(userId: string) {
    return (await this.proxyOrderRepo.find({ where: { userId }, order: { createdAt: 'DESC' } }))
      .map((order) => this.toPublicProxyOrder(order));
  }

  async listVpnSessions(userId: string) {
    return (await this.vpnSessionRepo.find({ where: { userId }, order: { createdAt: 'DESC' } }))
      .map((session) => this.toPublicVpnSession(session));
  }

  /** Applies a verified provider lifecycle webhook without exposing credentials. */
  async applyProviderLifecycleEvent(
    source: 'airalo' | 'oxylabs' | 'smartproxy' | 'wireguard',
    payload: Record<string, unknown>,
  ): Promise<boolean> {
    const providerReference = this.extractProviderReference(payload);
    if (!providerReference) return false;

    const status = this.mapProviderLifecycleStatus(source, payload);
    if (!status) return false;
    const safePayload = this.sanitizeProviderResponse(payload);
    const now = new Date();

    if (source === 'airalo') {
      const order = await this.esimOrderRepo.findOne({ where: { provider: source, providerOrderId: providerReference } });
      if (!order) return false;
      const activation = this.pickSensitiveProviderFields(payload, [
        'activation_code', 'activationcode', 'qr_code', 'qrcode', 'smdp_address', 'matching_id',
      ]);
      await this.esimOrderRepo.update(order.id, {
        status,
        iccid: this.providerString(payload, ['iccid']) ?? order.iccid,
        activationDataEncrypted: Object.keys(activation).length
          ? this.credentialCipher.encrypt(activation)
          : order.activationDataEncrypted,
        failureReason: status === 'failed' ? this.providerString(payload, ['error', 'message', 'reason']) ?? 'Provider reported failure' : null,
        activatedAt: ['active', 'completed'].includes(status) ? now : order.activatedAt,
        metadata: { ...(order.metadata ?? {}), lastProviderEvent: safePayload },
      });
      if (status === 'failed' && order.status !== 'failed' && order.status !== 'refunded') {
        await this.creditsService.refundWallet({
          userId: order.userId,
          amountUsdCents: Number(order.priceUsdCents ?? 0),
          type: TransactionType.PRODUCT_REFUND,
          relatedProduct: 'esim_store',
          relatedEntityId: order.id,
          description: `Refunded failed eSIM order ${order.id}`,
          idempotencyKey: `esim-refund:${order.id}`,
          metadata: { providerOrderId: providerReference, reason: 'provider_failed' },
        });
        await this.esimOrderRepo.update(order.id, { status: 'refunded', refundedAt: now });
      }
      return true;
    }

    if (source === 'wireguard') {
      const session = await this.vpnSessionRepo.findOne({ where: { provider: source, providerSessionId: providerReference } });
      if (!session) return false;
      const config = this.pickSensitiveProviderFields(payload, ['config', 'config_content', 'wireguard_config']);
      const privateKey = this.pickSensitiveProviderFields(payload, ['private_key', 'privatekey']);
      await this.vpnSessionRepo.update(session.id, {
        status,
        configEncrypted: Object.keys(config).length ? this.credentialCipher.encrypt(config) : session.configEncrypted,
        privateKeyEncrypted: Object.keys(privateKey).length ? this.credentialCipher.encrypt(privateKey) : session.privateKeyEncrypted,
        connectedAt: status === 'active' ? now : session.connectedAt,
        disconnectedAt: status === 'disconnected' ? now : session.disconnectedAt,
        revokedAt: status === 'revoked' ? now : session.revokedAt,
        metadata: { ...(session.metadata ?? {}), lastProviderEvent: safePayload },
      });
      return true;
    }

    const order = await this.proxyOrderRepo.findOne({ where: { provider: source, providerOrderId: providerReference } });
    if (!order) return false;
    const credentials = this.pickSensitiveProviderFields(payload, [
      'username', 'password', 'proxy_endpoint', 'proxyendpoint', 'host', 'port', 'credential',
    ]);
    await this.proxyOrderRepo.update(order.id, {
      status,
      credentialsEncrypted: Object.keys(credentials).length ? this.credentialCipher.encrypt(credentials) : order.credentialsEncrypted,
      failureReason: status === 'failed' ? this.providerString(payload, ['error', 'message', 'reason']) ?? 'Provider reported failure' : null,
      activatedAt: status === 'active' ? now : order.activatedAt,
      metadata: { ...(order.metadata ?? {}), lastProviderEvent: safePayload },
    });
    if (status === 'failed' && order.status !== 'failed' && order.status !== 'refunded') {
      await this.creditsService.refundWallet({
        userId: order.userId,
        amountUsdCents: Number(order.priceUsdCents ?? 0),
        type: TransactionType.PRODUCT_REFUND,
        relatedProduct: 'proxy_store',
        relatedEntityId: order.id,
        description: `Refunded failed proxy order ${order.id}`,
        idempotencyKey: `proxy-refund:${order.id}`,
        metadata: { providerOrderId: providerReference, reason: 'provider_failed' },
      });
      await this.proxyOrderRepo.update(order.id, { status: 'refunded', refundedAt: now });
    }
    return true;
  }

  private async persistEsimAcceptance(order: EsimOrder, safeData: unknown, rawData: unknown) {
    const sensitive = this.pickSensitiveProviderFields(rawData, [
      'activation_code', 'activationcode', 'qr_code', 'qrcode', 'smdp_address', 'matching_id',
    ]);
    await this.esimOrderRepo.update(order.id, {
      status: 'provisioning',
      providerOrderId: this.extractProviderReference(rawData) ?? null,
      iccid: this.providerString(rawData, ['iccid']) ?? null,
      activationDataEncrypted: Object.keys(sensitive).length ? this.credentialCipher.encrypt(sensitive) : null,
      metadata: { providerResponse: safeData },
    });
  }

  private async persistProxyAcceptance(
    order: ProxyOrder,
    operation: ProviderOperation,
    safeData: unknown,
    rawData: unknown,
  ) {
    const sensitive = this.pickSensitiveProviderFields(rawData, [
      'username', 'password', 'proxy_endpoint', 'proxyendpoint', 'host', 'port', 'credential',
    ]);
    await this.proxyOrderRepo.update(order.id, {
      status: 'provisioning',
      provider: PROVIDER_OPERATIONS[operation].integrationId,
      providerOrderId: this.extractProviderReference(rawData) ?? null,
      credentialsEncrypted: Object.keys(sensitive).length ? this.credentialCipher.encrypt(sensitive) : null,
      metadata: { ...(order.metadata ?? {}), providerResponse: safeData },
    });
  }

  private async persistVpnAcceptance(session: VpnSession, safeData: unknown, rawData: unknown) {
    const config = this.pickSensitiveProviderFields(rawData, ['config', 'config_content', 'wireguard_config']);
    const privateKey = this.pickSensitiveProviderFields(rawData, ['private_key', 'privatekey']);
    await this.vpnSessionRepo.update(session.id, {
      status: 'provisioning',
      providerSessionId: this.extractProviderReference(rawData) ?? null,
      serverId: this.providerString(rawData, ['server_id', 'serverid']) ?? null,
      configEncrypted: Object.keys(config).length ? this.credentialCipher.encrypt(config) : null,
      privateKeyEncrypted: Object.keys(privateKey).length ? this.credentialCipher.encrypt(privateKey) : null,
      metadata: { ...(session.metadata ?? {}), providerResponse: safeData },
    });
  }

  private async markConnectivityFailure(repo: Repository<any>, id: string, error: unknown) {
    await repo.update(id, {
      status: 'failed',
      failureReason: error instanceof Error ? error.message.slice(0, 500) : String(error).slice(0, 500),
    }).catch((updateError) => this.logger.error(`Unable to record connectivity failure: ${String(updateError)}`));
  }

  private integrationIdempotencyKey(prefix: string, payload: object, supplied?: string) {
    const normalized = supplied?.trim();
    if (normalized) return normalized.slice(0, 180);
    return `${prefix}:${createHash('sha256').update(JSON.stringify(payload)).digest('hex').slice(0, 48)}`;
  }

  private pickSensitiveProviderFields(rawData: unknown, allowedKeys: string[]): Record<string, unknown> {
    const allowed = new Set(allowedKeys.map((key) => key.toLowerCase()));
    const output: Record<string, unknown> = {};
    const visit = (value: unknown, path = '', depth = 0) => {
      if (!value || typeof value !== 'object' || depth > 3) return;
      for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
        const normalizedKey = key.toLowerCase();
        const nextPath = path ? `${path}.${key}` : key;
        if (allowed.has(normalizedKey) && (typeof nested === 'string' || typeof nested === 'number')) {
          output[nextPath] = nested;
        }
        visit(nested, nextPath, depth + 1);
      }
    };
    visit(rawData);
    return output;
  }

  private providerString(rawData: unknown, names: string[]): string | undefined {
    const wanted = new Set(names.map((name) => name.toLowerCase()));
    const find = (value: unknown, depth = 0): string | undefined => {
      if (!value || typeof value !== 'object' || depth > 3) return undefined;
      for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
        if (wanted.has(key.toLowerCase()) && (typeof nested === 'string' || typeof nested === 'number')) {
          return String(nested);
        }
        const nestedResult = find(nested, depth + 1);
        if (nestedResult) return nestedResult;
      }
      return undefined;
    };
    return find(rawData);
  }

  private mapProviderLifecycleStatus(
    source: 'airalo' | 'oxylabs' | 'smartproxy' | 'wireguard',
    payload: Record<string, unknown>,
  ): string | undefined {
    const value = this.providerString(payload, ['status', 'state', 'event_type', 'eventtype', 'type'])?.toLowerCase() ?? '';
    if (/(fail|error|reject)/.test(value)) return 'failed';
    if (/(cancel)/.test(value)) return source === 'wireguard' ? 'revoked' : 'cancelled';
    if (/(revoke)/.test(value)) return 'revoked';
    if (/(expire)/.test(value)) return 'expired';
    if (/(disconnect)/.test(value)) return 'disconnected';
    if (/(suspend)/.test(value)) return 'suspended';
    if (/(complete)/.test(value)) return source === 'airalo' ? 'completed' : 'active';
    if (/(active|enable|provisioned|ready)/.test(value)) return 'active';
    if (/(process|provision|pending|created|queued)/.test(value)) return 'provisioning';
    return undefined;
  }

  private toPublicEsimOrder(order: EsimOrder) {
    return {
      id: order.id,
      provider: order.provider,
      providerOrderId: order.providerOrderId,
      planId: order.planId,
      planName: order.planName,
      country: order.country,
      dataAmountGb: order.dataAmountGb,
      validityDays: order.validityDays,
      iccid: order.iccid,
      status: order.status,
      priceUsdCents: Number(order.priceUsdCents ?? 0),
      failureReason: order.failureReason,
      activatedAt: order.activatedAt,
      expiresAt: order.expiresAt,
      createdAt: order.createdAt,
    };
  }

  private normalizeEsimPlans(payload: unknown, countryCode: string): NormalizedEsimPlan[] {
    return this.extractCollection(payload).map((item, index) => {
      const record = item && typeof item === 'object' ? item as Record<string, unknown> : {};
      const rawPrice = this.readNumber(record, ['price', 'price_usd', 'priceUsd', 'amount', 'retail_price']);
      const priceUsdCents = rawPrice === null ? 0 : Math.round(rawPrice < 100 ? rawPrice * 100 : rawPrice);
      return {
        id: this.readString(record, ['id', 'planId', 'package_id', 'slug']) ?? `airalo-${countryCode}-${index + 1}`,
        name: this.readString(record, ['name', 'title', 'package_name']) ?? `eSIM ${countryCode}`,
        countryCode,
        region: this.readString(record, ['region', 'coverage']),
        dataAmountGb: this.readNumber(record, ['data_gb', 'dataAmountGb', 'gb', 'volume', 'data']),
        validityDays: this.readNumber(record, ['validity_days', 'validityDays', 'days', 'duration']),
        priceUsdCents,
        currency: (this.readString(record, ['currency', 'currency_code']) ?? 'USD').toUpperCase(),
        networks: this.readStringArray(record, ['networks', 'operators', 'network']),
        supports5g: this.readBoolean(record, ['supports_5g', 'supports5g', 'five_g']),
        supportsHotspot: this.readBoolean(record, ['supports_hotspot', 'supportsHotspot', 'hotspot']),
        activationPolicy: this.readString(record, ['activation_policy', 'activationPolicy']),
        metadata: this.sanitizeProviderResponse(record) as Record<string, unknown>,
      };
    }).filter((item) => item.priceUsdCents > 0);
  }

  private extractCollection(payload: unknown): unknown[] {
    if (Array.isArray(payload)) return payload;
    if (!payload || typeof payload !== 'object') return [];
    const record = payload as Record<string, unknown>;
    for (const key of ['plans', 'items', 'results', 'data']) {
      const nested = this.extractCollection(record[key]);
      if (nested.length) return nested;
    }
    return [];
  }

  private readString(record: Record<string, unknown>, keys: string[]): string | null {
    for (const key of keys) {
      if (typeof record[key] === 'string' && record[key].trim()) return record[key].trim();
    }
    return null;
  }

  private readNumber(record: Record<string, unknown>, keys: string[]): number | null {
    for (const key of keys) {
      const value = typeof record[key] === 'string' ? Number(record[key]) : record[key];
      if (typeof value === 'number' && Number.isFinite(value)) return value;
    }
    return null;
  }

  private readBoolean(record: Record<string, unknown>, keys: string[]): boolean | null {
    for (const key of keys) {
      if (typeof record[key] === 'boolean') return record[key];
      if (record[key] === 'true' || record[key] === 'false') return record[key] === 'true';
    }
    return null;
  }

  private readStringArray(record: Record<string, unknown>, keys: string[]): string[] {
    for (const key of keys) {
      const value = record[key];
      if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string');
      if (typeof value === 'string' && value.trim()) return [value.trim()];
    }
    return [];
  }

  private toPublicProxyOrder(order: ProxyOrder) {
    return {
      id: order.id,
      provider: order.provider,
      providerOrderId: order.providerOrderId,
      type: order.planType,
      region: order.location,
      status: order.status,
      priceUsdCents: Number(order.priceUsdCents ?? 0),
      renewalAt: order.renewalAt,
      expiresAt: order.expiresAt,
      failureReason: order.failureReason,
      walletTransactionId: order.walletTransactionId,
      createdAt: order.createdAt,
    };
  }

  private toPublicVpnSession(session: VpnSession) {
    return {
      id: session.id,
      provider: session.provider,
      providerSessionId: session.providerSessionId,
      deviceName: session.deviceName,
      serverId: session.serverId,
      region: session.serverLocation,
      status: session.status,
      priceUsdCents: Number(session.priceUsdCents ?? 0),
      connectedAt: session.connectedAt,
      disconnectedAt: session.disconnectedAt,
      expiresAt: session.expiresAt,
      revokedAt: session.revokedAt,
      createdAt: session.createdAt,
    };
  }

  private async purchaseIntegrationProduct(
    userId: string,
    operation: ProviderOperation,
    payload: object,
    amountUsdCents: number,
    creditProduct: string,
    walletTransactionType: TransactionType,
    description: string,
    metadata: Record<string, unknown>,
    idempotencyKey?: string,
    onProviderAccepted?: (safeData: unknown, rawData: unknown) => Promise<void>,
  ) {
    const requestKey = idempotencyKey?.trim()
      || `integration:${creditProduct}:${createHash('sha256').update(JSON.stringify(payload)).digest('hex').slice(0, 24)}`;
    const quote = await this.creditsService.quote({
      product: creditProduct,
      basePriceUsdCents: amountUsdCents,
      relatedEntityId: this.extractProviderReference(payload) ?? null,
    }, userId);

    const lock = await this.creditsService.createWalletLock({
      userId,
      amountUsdCents: quote.usdValueCents,
      relatedProduct: creditProduct,
      relatedEntityId: this.extractProviderReference(payload) ?? null,
      reason: `${description} wallet hold`,
      description: `Locked wallet balance for ${description}`,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      idempotencyKey: `integration-lock:${requestKey}`,
      metadata: {
        ...metadata,
        operation,
      },
    });

    try {
      const providerPayload = { ...(payload as Record<string, unknown>) };
      delete providerPayload.idempotencyKey;
      let rawProviderData: unknown;
      const providerResult = await this.callConfiguredProvider(
        operation,
        userId,
        providerPayload,
        async (rawData) => { rawProviderData = rawData; },
      );
      if (providerResult?.status !== 'submitted') {
        await this.creditsService.releaseWalletLock({
          userId,
          lockId: lock.lock.id,
          description: `Released wallet hold after ${description} was not accepted`,
          idempotencyKey: `integration-release:${requestKey}:not-submitted`,
        }).catch(() => null);
        return providerResult;
      }

      if (onProviderAccepted) {
        await onProviderAccepted(providerResult.data, rawProviderData);
      }

      const spent = await this.creditsService.spendWalletLock({
        userId,
        lockId: lock.lock.id,
        type: walletTransactionType,
        relatedProduct: creditProduct,
        relatedEntityId: this.extractProviderReference(providerResult.data) ?? null,
        description,
        idempotencyKey: `integration-spend:${requestKey}`,
        metadata: {
          ...metadata,
          integrationId: providerResult.integrationId,
          operation: providerResult.operation,
          providerStatus: providerResult.providerStatus,
        },
      });

      return {
        ...providerResult,
        walletDebitedUsdCents: quote.usdValueCents,
        walletChargeRecorded: true,
        walletTransactionId: spent.transaction.id,
      };
    } catch (error) {
      await this.creditsService.releaseWalletLock({
        userId,
        lockId: lock.lock.id,
        description: `Released wallet hold after failed ${description}`,
        idempotencyKey: `integration-release:${requestKey}:failed`,
      }).catch(() => null);
      throw error;
    }
  }

  private async callConfiguredProvider(
    operation: ProviderOperation,
    userId: string,
    payload: object,
    onProviderAccepted?: (rawData: unknown) => Promise<void>,
  ) {
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

    if (onProviderAccepted) await onProviderAccepted(response.data);

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
    const blocked = [
      'token', 'secret', 'apiKey', 'api_key', 'password', 'privateKey', 'private_key',
      'activation_code', 'activationCode', 'qr_code', 'qrCode', 'config_content', 'config',
      'credential', 'proxy_endpoint', 'proxyEndpoint', 'matching_id', 'matchingId',
    ];
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

  private resolveConfiguredUsdCents(envName: string, label: string) {
    const rawValue = this.config.get<string>(envName);
    const parsed = Number(rawValue);
    if (!rawValue || !Number.isFinite(parsed) || parsed <= 0) {
      throw new BadRequestException(`${label} is unavailable because ${envName} is not configured`);
    }
    return Math.round(parsed);
  }

  private extractProviderReference(data: unknown): string | undefined {
    return this.providerString(data, [
      'provider_order_id', 'providerorderid', 'order_id', 'orderid',
      'provider_session_id', 'providersessionid', 'session_id', 'sessionid',
      'reference', 'id',
    ]);
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
      [
        'SUPABASE_URL',
        'SUPABASE_SERVICE_ROLE_KEY',
        'SUPABASE_STORAGE_USER_UPLOADS_BUCKET',
        'SUPABASE_STORAGE_MEDIA_BUCKET',
        'SUPABASE_STORAGE_VERIFICATION_ASSETS_BUCKET',
        'SUPABASE_STORAGE_DOCUMENTS_BUCKET',
      ].every((env) => this.hasEnv(env)) ||
      ['AWS_BUCKET', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'].every((env) => this.hasEnv(env)) ||
      ['R2_BUCKET', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY'].every((env) => this.hasEnv(env))
    );
  }

  private getMissingStorageEnv(): string[] {
    const supabaseMissing = [
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'SUPABASE_STORAGE_USER_UPLOADS_BUCKET',
      'SUPABASE_STORAGE_MEDIA_BUCKET',
      'SUPABASE_STORAGE_VERIFICATION_ASSETS_BUCKET',
      'SUPABASE_STORAGE_DOCUMENTS_BUCKET',
    ].filter((env) => !this.hasEnv(env));
    const awsMissing = ['AWS_BUCKET', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'].filter((env) => !this.hasEnv(env));
    const r2Missing = ['R2_BUCKET', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY'].filter((env) => !this.hasEnv(env));
    if (supabaseMissing.length && supabaseMissing.length < 6) return supabaseMissing;
    if (supabaseMissing.length === 0) return [];
    return awsMissing.length === 3 ? r2Missing : awsMissing;
  }
}
