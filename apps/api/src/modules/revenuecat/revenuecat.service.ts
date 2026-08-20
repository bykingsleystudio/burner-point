import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { DataSource, In, Repository } from 'typeorm';
import { resolveConfiguredEnv } from '../../config/runtime-env';
import {
  RevenueCatEvent,
  SubscriptionEntitlement,
  SubscriptionProvider,
  SubscriptionRecord,
  SubscriptionStatus,
} from '../../database/entities/subscription.entity';
import { User } from '../../database/entities/user.entity';
import { EventsGateway } from '../gateway/events.gateway';

type RevenueCatWebhookEnvelope = {
  api_version?: string;
  event?: Record<string, unknown>;
};

type RevenueCatActiveEntitlement = {
  entitlement_id?: string;
  expires_at?: number | string | null;
  [key: string]: unknown;
};

type NormalizedActiveEntitlement = {
  identifier: string;
  expiresAt: Date | null;
  raw: RevenueCatActiveEntitlement;
};

type RevenueCatSyncSnapshot = {
  enabled: boolean;
  provider: 'revenuecat';
  userId: string | null;
  appUserId: string;
  projectId: string | null;
  lastSyncedAt: string | null;
  entitlementConfig: {
    messenger: string;
    secureTunnel: string;
    premium: string;
  };
  offeringConfig: {
    default: string;
    messenger: string;
    vpn: string;
    premium: string;
  };
  entitlements: Array<{
    identifier: string;
    displayName: string;
    active: boolean;
    expiresAt: string | null;
    productId: string | null;
    offeringId: string | null;
    store: string | null;
    environment: string | null;
    lastUpdatedAt: string | null;
  }>;
  subscriptions: Array<{
    id: string;
    provider: SubscriptionProvider;
    productId: string | null;
    offeringId: string | null;
    status: SubscriptionStatus;
    isActive: boolean;
    willRenew: boolean;
    purchasedAt: string | null;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    renewsAt: string | null;
    cancelledAt: string | null;
    expiresAt: string | null;
    store: string | null;
    environment: string | null;
    lastSyncedAt: string | null;
    entitlements: string[];
  }>;
  summary: {
    activeEntitlements: string[];
    canAccessMessenger: boolean;
    canAccessSecureTunnel: boolean;
    canAccessPremium: boolean;
  };
};

const REVENUECAT_API_BASE_URL = 'https://api.revenuecat.com/v2';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class RevenueCatService {
  private readonly logger = new Logger(RevenueCatService.name);

  constructor(
    @InjectRepository(SubscriptionRecord)
    private readonly subscriptionRepo: Repository<SubscriptionRecord>,
    @InjectRepository(SubscriptionEntitlement)
    private readonly entitlementRepo: Repository<SubscriptionEntitlement>,
    @InjectRepository(RevenueCatEvent)
    private readonly eventRepo: Repository<RevenueCatEvent>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly config: ConfigService,
    private readonly eventsGateway: EventsGateway,
    private readonly dataSource: DataSource,
  ) {}

  isConfigured() {
    return Boolean(this.readOptionalEnv('REVENUECAT_SECRET_API_KEY') && this.readOptionalEnv('REVENUECAT_PROJECT_ID'));
  }

  getEntitlementConfig() {
    return {
      messenger: this.readOptionalEnv('REVENUECAT_ENTITLEMENT_BP_MESSENGER') ?? 'bp_messenger_pro',
      secureTunnel: this.readOptionalEnv('REVENUECAT_ENTITLEMENT_BP_SECURE_TUNNEL') ?? 'bp_secure_tunnel',
      premium: this.readOptionalEnv('REVENUECAT_ENTITLEMENT_BP_PREMIUM') ?? 'bp_premium',
    };
  }

  getOfferingConfig() {
    return {
      default: this.readOptionalEnv('REVENUECAT_OFFERING_DEFAULT') ?? 'default',
      messenger: this.readOptionalEnv('REVENUECAT_OFFERING_MESSENGER') ?? 'bp_messenger',
      vpn: this.readOptionalEnv('REVENUECAT_OFFERING_VPN') ?? 'bp_secure_tunnel',
      premium: this.readOptionalEnv('REVENUECAT_OFFERING_PREMIUM') ?? 'bp_premium',
    };
  }

  async handleWebhook(
    headers: Record<string, string | string[] | undefined>,
    payload: RevenueCatWebhookEnvelope,
  ) {
    if (!this.isConfigured()) {
      this.logger.warn('RevenueCat webhook ignored because RevenueCat is not configured.');
      return { received: true, ignored: true, reason: 'not_configured' };
    }

    const expectedAuthorization = this.getExpectedWebhookAuthorization();
    const receivedAuthorization = this.readHeaderValue(headers, 'authorization');

    if (expectedAuthorization && receivedAuthorization !== expectedAuthorization) {
      throw new UnauthorizedException('Invalid RevenueCat webhook authorization');
    }

    const event = this.readWebhookEvent(payload);
    const eventId =
      this.getString(event.id)
      || `${this.getString(event.type) || 'unknown'}:${this.getString(event.transaction_id) || Date.now()}`;
    const eventType = this.getString(event.type) || 'unknown';

    const existingEvent = await this.eventRepo.findOne({ where: { eventId } });
    if (existingEvent?.processed) {
      return { received: true, duplicate: true };
    }

    const candidateUser = await this.resolveUserFromEvent(event);
    const occurredAt = this.timestampMsToDate(this.getNumber(event.event_timestamp_ms));
    const eventRecord = existingEvent
      ? existingEvent
      : await this.eventRepo.save(
          this.eventRepo.create({
            eventId,
            eventType,
            apiVersion: payload.api_version ?? null,
            appUserId: this.getString(event.app_user_id) ?? null,
            originalAppUserId: this.getString(event.original_app_user_id) ?? null,
            userId: candidateUser?.id ?? null,
            environment: this.getString(event.environment) ?? null,
            store: this.getString(event.store) ?? null,
            authorizationVerified: Boolean(expectedAuthorization),
            processed: false,
            occurredAt,
            payload: payload as Record<string, unknown>,
          }),
        );

    try {
      const appUserId = this.getPrimaryAppUserId(event, candidateUser?.id ?? null);
      const snapshot = await this.syncCustomerInternal({
        appUserId,
        userId: candidateUser?.id ?? null,
        event,
      });

      await this.eventRepo.update(eventRecord.id, {
        userId: snapshot.userId ?? candidateUser?.id ?? null,
        processed: true,
        processedAt: new Date(),
        processingError: null,
      });

      return {
        received: true,
        duplicate: false,
        userId: snapshot.userId,
        activeEntitlements: snapshot.summary.activeEntitlements,
      };
    } catch (error) {
      await this.eventRepo.update(eventRecord.id, {
        processingError: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async refreshCustomerForUser(userId: string) {
    if (!this.isConfigured()) {
      return this.getEntitlementSnapshot(userId);
    }

    return this.syncCustomerInternal({
      appUserId: userId,
      userId,
    });
  }

  async getEntitlementSnapshot(userId: string): Promise<RevenueCatSyncSnapshot> {
    const [subscriptions, entitlements] = await Promise.all([
      this.subscriptionRepo.find({
        where: { userId },
        order: { updatedAt: 'DESC' },
      }),
      this.entitlementRepo.find({
        where: { userId },
        order: { identifier: 'ASC', updatedAt: 'DESC' },
      }),
    ]);

    return this.buildSnapshot(userId, subscriptions, entitlements);
  }

  async hasAnyActiveEntitlement(userId: string, identifiers: string[]) {
    if (!identifiers.length) return false;

    const count = await this.entitlementRepo.count({
      where: {
        userId,
        identifier: In(identifiers),
        isActive: true,
      },
    });

    return count > 0;
  }

  private async syncCustomerInternal(args: {
    appUserId: string;
    userId: string | null;
    event?: Record<string, unknown>;
  }) {
    const { appUserId } = args;
    const [_customer, activeEntitlements] = await Promise.all([
      this.fetchCustomer(appUserId),
      this.fetchActiveEntitlements(appUserId),
    ]);

    const resolvedUser =
      args.userId
        ? await this.userRepo.findOne({ where: { id: args.userId } })
        : await this.resolveUserFromCandidates([
            appUserId,
            this.getString(args.event?.original_app_user_id),
            ...this.getStringArray(args.event?.aliases),
          ]);

    const resolvedUserId = resolvedUser?.id ?? null;
    if (!resolvedUserId) {
      return this.buildAnonymousSnapshot(appUserId, activeEntitlements);
    }

    const event = args.event ?? {};
    await this.dataSource.transaction(async (manager) => {
      const subscriptionRepository = manager.getRepository(SubscriptionRecord);
      const entitlementRepository = manager.getRepository(SubscriptionEntitlement);

      const subscription = await this.upsertSubscriptionRecord(
        subscriptionRepository,
        resolvedUserId,
        appUserId,
        activeEntitlements,
        event,
      );

      await this.syncEntitlementRows(
        entitlementRepository,
        resolvedUserId,
        subscription?.id ?? null,
        activeEntitlements,
        event,
      );
    });

    const snapshot = await this.getEntitlementSnapshot(resolvedUserId);
    this.eventsGateway.emitToUser(resolvedUserId, 'billing.subscription.updated', snapshot);
    this.eventsGateway.emitToUser(resolvedUserId, 'dashboard.subscription.updated', snapshot);

    return snapshot;
  }

  private async upsertSubscriptionRecord(
    repository: Repository<SubscriptionRecord>,
    userId: string,
    appUserId: string,
    activeEntitlements: Map<string, NormalizedActiveEntitlement>,
    event: Record<string, unknown>,
  ) {
    const providerReference =
      this.getString(event.original_transaction_id)
      || this.getString(event.transaction_id)
      || null;
    const productId = this.getString(event.product_id) ?? null;
    const eventEntitlementIds = this.collectEventEntitlementIds(event);

    let existing: SubscriptionRecord | null = null;
    if (providerReference) {
      existing = await repository.findOne({
        where: {
          provider: SubscriptionProvider.REVENUECAT,
          providerReference,
        },
      });
    }

    if (!existing && productId) {
      existing = await repository.findOne({
        where: {
          userId,
          provider: SubscriptionProvider.REVENUECAT,
          productId,
        },
      });
    }

    if (!existing) {
      existing = await repository.findOne({
        where: {
          userId,
          provider: SubscriptionProvider.REVENUECAT,
          providerCustomerId: appUserId,
        },
        order: { updatedAt: 'DESC' },
      });
    }

    const hasMappedActiveEntitlement = eventEntitlementIds.length
      ? eventEntitlementIds.some((identifier) => activeEntitlements.has(identifier))
      : activeEntitlements.size > 0;
    const expiresAt = this.timestampMsToDate(this.getNumber(event.expiration_at_ms));
    const purchasedAt = this.timestampMsToDate(this.getNumber(event.purchased_at_ms));

    return repository.save(
      repository.create({
        ...existing,
        userId,
        provider: SubscriptionProvider.REVENUECAT,
        providerCustomerId: appUserId,
        providerReference,
        providerEventId: this.getString(event.id) ?? existing?.providerEventId ?? null,
        originalAppUserId: this.getString(event.original_app_user_id) ?? existing?.originalAppUserId ?? null,
        productId: productId ?? existing?.productId ?? null,
        offeringId: this.getString(event.presented_offering_id) ?? existing?.offeringId ?? null,
        store: this.getString(event.store) ?? existing?.store ?? null,
        environment: this.getString(event.environment) ?? existing?.environment ?? null,
        status: this.resolveSubscriptionStatus(event, hasMappedActiveEntitlement),
        isActive: hasMappedActiveEntitlement,
        willRenew: this.resolveWillRenew(event, hasMappedActiveEntitlement),
        purchasedAt: purchasedAt ?? existing?.purchasedAt ?? null,
        currentPeriodStart: purchasedAt ?? existing?.currentPeriodStart ?? null,
        currentPeriodEnd: expiresAt ?? existing?.currentPeriodEnd ?? null,
        renewsAt: expiresAt ?? existing?.renewsAt ?? null,
        cancelledAt: this.eventImpliesCancellation(event)
          ? (expiresAt ?? new Date())
          : existing?.cancelledAt ?? null,
        expiresAt: expiresAt ?? existing?.expiresAt ?? null,
        lastSyncedAt: new Date(),
        metadata: {
          ...(existing?.metadata ?? {}),
          activeEntitlementIds: Array.from(activeEntitlements.keys()),
          aliases: this.getStringArray(event.aliases),
          lastEventType: this.getString(event.type) ?? null,
          periodType: this.getString(event.period_type) ?? null,
          transactionId: this.getString(event.transaction_id) ?? null,
          originalTransactionId: this.getString(event.original_transaction_id) ?? null,
        },
      }),
    );
  }

  private async syncEntitlementRows(
    repository: Repository<SubscriptionEntitlement>,
    userId: string,
    subscriptionId: string | null,
    activeEntitlements: Map<string, NormalizedActiveEntitlement>,
    event: Record<string, unknown>,
  ) {
    const existingRows = await repository.find({
      where: {
        userId,
        provider: SubscriptionProvider.REVENUECAT,
      },
    });
    const existingByIdentifier = new Map(existingRows.map((row) => [row.identifier, row]));
    const configuredEntitlements = Object.values(this.getEntitlementConfig());
    const allEntitlementIds = new Set([
      ...configuredEntitlements,
      ...existingRows.map((row) => row.identifier),
      ...Array.from(activeEntitlements.keys()),
      ...this.collectEventEntitlementIds(event),
    ]);
    const purchasedAt = this.timestampMsToDate(this.getNumber(event.purchased_at_ms));
    const fallbackExpiresAt = this.timestampMsToDate(this.getNumber(event.expiration_at_ms));

    for (const identifier of allEntitlementIds) {
      const existing = existingByIdentifier.get(identifier);
      const existingRecord = existing as Record<string, any> | null;
      const activeItem = activeEntitlements.get(identifier);
      const isActive = Boolean(activeItem);

      await repository.save(
        repository.create({
          ...existingRecord,
          userId,
          subscriptionId: subscriptionId ?? existingRecord?.subscriptionId ?? null,
          provider: SubscriptionProvider.REVENUECAT,
          identifier,
          displayName: this.displayNameForEntitlement(identifier),
          isActive,
          productId: this.getString(event.product_id) ?? existingRecord?.productId ?? null,
          offeringId: this.getString(event.presented_offering_id) ?? existingRecord?.offeringId ?? null,
          store: this.getString(event.store) ?? existingRecord?.store ?? null,
          environment: this.getString(event.environment) ?? existingRecord?.environment ?? null,
          purchasedAt: purchasedAt ?? existingRecord?.purchasedAt ?? null,
          expiresAt: activeItem?.expiresAt ?? fallbackExpiresAt ?? existingRecord?.expiresAt ?? null,
          revokedAt: isActive ? null : (existingRecord?.revokedAt ?? (this.eventImpliesCancellation(event) ? new Date() : null)),
          lastEventId: this.getString(event.id) ?? existingRecord?.lastEventId ?? null,
          metadata: {
            ...(existingRecord?.metadata ?? {}),
            lastEventType: this.getString(event.type) ?? null,
            revenuecatItem: activeItem?.raw ?? null,
          },
        }),
      );
    }
  }

  private async fetchCustomer(appUserId: string) {
    try {
      const response = await axios.get(
        `${REVENUECAT_API_BASE_URL}/projects/${encodeURIComponent(this.readEnv('REVENUECAT_PROJECT_ID'))}/customers/${encodeURIComponent(appUserId)}`,
        {
          headers: {
            Authorization: `Bearer ${this.readEnv('REVENUECAT_SECRET_API_KEY')}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        },
      );

      return response.data as Record<string, unknown>;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw new BadRequestException('Unable to fetch RevenueCat customer state');
    }
  }

  private async fetchActiveEntitlements(appUserId: string) {
    try {
      const response = await axios.get<{ items?: RevenueCatActiveEntitlement[] }>(
        `${REVENUECAT_API_BASE_URL}/projects/${encodeURIComponent(this.readEnv('REVENUECAT_PROJECT_ID'))}/customers/${encodeURIComponent(appUserId)}/active_entitlements`,
        {
          headers: {
            Authorization: `Bearer ${this.readEnv('REVENUECAT_SECRET_API_KEY')}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        },
      );

      const items = response.data?.items ?? [];
      return new Map(
        items
          .map((item) => {
            const identifier = this.getString(item.entitlement_id);
            if (!identifier) return null;
            return [
              identifier,
              {
                identifier,
                expiresAt: this.parseDateValue(item.expires_at),
                raw: item,
              } satisfies NormalizedActiveEntitlement,
            ] as const;
          })
          .filter((entry): entry is readonly [string, NormalizedActiveEntitlement] => Boolean(entry)),
      );
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return new Map<string, NormalizedActiveEntitlement>();
      }
      throw new BadRequestException('Unable to fetch RevenueCat entitlements');
    }
  }

  private async resolveUserFromEvent(event: Record<string, unknown>) {
    return this.resolveUserFromCandidates([
      this.getString(event.app_user_id),
      this.getString(event.original_app_user_id),
      ...this.getStringArray(event.aliases),
    ]);
  }

  private async resolveUserFromCandidates(candidateIds: Array<string | null | undefined>) {
    const uniqueIds = Array.from(
      new Set(candidateIds.filter((value): value is string => Boolean(value && UUID_PATTERN.test(value)))),
    );
    if (!uniqueIds.length) return null;

    return this.userRepo.findOne({
      where: { id: In(uniqueIds) },
      order: { createdAt: 'ASC' },
    });
  }

  private buildSnapshot(
    userId: string,
    subscriptions: SubscriptionRecord[],
    entitlements: SubscriptionEntitlement[],
  ): RevenueCatSyncSnapshot {
    const entitlementConfig = this.getEntitlementConfig();
    const offeringConfig = this.getOfferingConfig();
    const entitlementIds = new Set([
      entitlementConfig.messenger,
      entitlementConfig.secureTunnel,
      entitlementConfig.premium,
      ...entitlements.map((row) => row.identifier),
    ]);
    const entitlementMap = entitlements.reduce<Map<string, SubscriptionEntitlement[]>>((map, row) => {
      const current = map.get(row.identifier) ?? [];
      current.push(row);
      map.set(row.identifier, current);
      return map;
    }, new Map());
    const activeEntitlements = Array.from(entitlementIds)
      .map((identifier) => {
        const rows = entitlementMap.get(identifier) ?? [];
        const activeRow = rows.find((row) => row.isActive) ?? rows[0];
        return {
          identifier,
          displayName: this.displayNameForEntitlement(identifier),
          active: rows.some((row) => row.isActive),
          expiresAt: activeRow?.expiresAt?.toISOString() ?? null,
          productId: activeRow?.productId ?? null,
          offeringId: activeRow?.offeringId ?? null,
          store: activeRow?.store ?? null,
          environment: activeRow?.environment ?? null,
          lastUpdatedAt: activeRow?.updatedAt?.toISOString() ?? null,
        };
      })
      .sort((left, right) => left.identifier.localeCompare(right.identifier));

    return {
      enabled: this.isConfigured(),
      provider: 'revenuecat',
      userId,
      appUserId: userId,
      projectId: this.readOptionalEnv('REVENUECAT_PROJECT_ID') ?? null,
      lastSyncedAt: subscriptions[0]?.lastSyncedAt?.toISOString() ?? entitlements[0]?.updatedAt?.toISOString() ?? null,
      entitlementConfig,
      offeringConfig,
      entitlements: activeEntitlements,
      subscriptions: subscriptions.map((subscription) => ({
        id: subscription.id,
        provider: subscription.provider,
        productId: subscription.productId,
        offeringId: subscription.offeringId,
        status: subscription.status,
        isActive: subscription.isActive,
        willRenew: subscription.willRenew,
        purchasedAt: subscription.purchasedAt?.toISOString() ?? null,
        currentPeriodStart: subscription.currentPeriodStart?.toISOString() ?? null,
        currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
        renewsAt: subscription.renewsAt?.toISOString() ?? null,
        cancelledAt: subscription.cancelledAt?.toISOString() ?? null,
        expiresAt: subscription.expiresAt?.toISOString() ?? null,
        store: subscription.store,
        environment: subscription.environment,
        lastSyncedAt: subscription.lastSyncedAt?.toISOString() ?? null,
        entitlements: this.readStringArray(subscription.metadata?.activeEntitlementIds),
      })),
      summary: {
        activeEntitlements: activeEntitlements.filter((row) => row.active).map((row) => row.identifier),
        canAccessMessenger: this.snapshotHasAnyEntitlement(activeEntitlements, [
          entitlementConfig.messenger,
          entitlementConfig.premium,
        ]),
        canAccessSecureTunnel: this.snapshotHasAnyEntitlement(activeEntitlements, [
          entitlementConfig.secureTunnel,
          entitlementConfig.premium,
        ]),
        canAccessPremium: this.snapshotHasAnyEntitlement(activeEntitlements, [entitlementConfig.premium]),
      },
    };
  }

  private buildAnonymousSnapshot(
    appUserId: string,
    activeEntitlements: Map<string, NormalizedActiveEntitlement>,
  ): RevenueCatSyncSnapshot {
    const entitlementConfig = this.getEntitlementConfig();
    const offeringConfig = this.getOfferingConfig();
    const entitlementIds = new Set([
      entitlementConfig.messenger,
      entitlementConfig.secureTunnel,
      entitlementConfig.premium,
      ...Array.from(activeEntitlements.keys()),
    ]);
    const entitlements = Array.from(entitlementIds).map((identifier) => {
      const row = activeEntitlements.get(identifier);
      return {
        identifier,
        displayName: this.displayNameForEntitlement(identifier),
        active: Boolean(row),
        expiresAt: row?.expiresAt?.toISOString() ?? null,
        productId: null,
        offeringId: null,
        store: null,
        environment: null,
        lastUpdatedAt: null,
      };
    });

    return {
      enabled: this.isConfigured(),
      provider: 'revenuecat',
      userId: null,
      appUserId,
      projectId: this.readOptionalEnv('REVENUECAT_PROJECT_ID') ?? null,
      lastSyncedAt: new Date().toISOString(),
      entitlementConfig,
      offeringConfig,
      entitlements,
      subscriptions: [],
      summary: {
        activeEntitlements: entitlements.filter((row) => row.active).map((row) => row.identifier),
        canAccessMessenger: this.snapshotHasAnyEntitlement(entitlements, [
          entitlementConfig.messenger,
          entitlementConfig.premium,
        ]),
        canAccessSecureTunnel: this.snapshotHasAnyEntitlement(entitlements, [
          entitlementConfig.secureTunnel,
          entitlementConfig.premium,
        ]),
        canAccessPremium: this.snapshotHasAnyEntitlement(entitlements, [entitlementConfig.premium]),
      },
    };
  }

  private resolveSubscriptionStatus(event: Record<string, unknown>, hasActiveEntitlement: boolean) {
    const eventType = (this.getString(event.type) ?? '').toUpperCase();
    const periodType = (this.getString(event.period_type) ?? '').toUpperCase();

    if (eventType === 'CANCELLATION') return SubscriptionStatus.CANCELED;
    if (eventType === 'EXPIRATION') return SubscriptionStatus.EXPIRED;
    if (eventType === 'BILLING_ISSUE') return SubscriptionStatus.GRACE_PERIOD;
    if (eventType === 'SUBSCRIPTION_PAUSED') return SubscriptionStatus.PAUSED;
    if (eventType === 'TRANSFER') return SubscriptionStatus.TRANSFERRED;
    if (periodType === 'TRIAL') return SubscriptionStatus.TRIALING;
    if (hasActiveEntitlement) return SubscriptionStatus.ACTIVE;
    return SubscriptionStatus.UNKNOWN;
  }

  private resolveWillRenew(event: Record<string, unknown>, hasActiveEntitlement: boolean) {
    const eventType = (this.getString(event.type) ?? '').toUpperCase();
    if (!hasActiveEntitlement) return false;
    return !['CANCELLATION', 'EXPIRATION', 'SUBSCRIPTION_PAUSED'].includes(eventType);
  }

  private eventImpliesCancellation(event: Record<string, unknown>) {
    const eventType = (this.getString(event.type) ?? '').toUpperCase();
    return ['CANCELLATION', 'EXPIRATION'].includes(eventType);
  }

  private getPrimaryAppUserId(event: Record<string, unknown>, fallbackUserId: string | null) {
    const appUserId =
      this.getString(event.app_user_id)
      || this.getString(event.original_app_user_id)
      || this.getStringArray(event.aliases).find((value) => UUID_PATTERN.test(value))
      || fallbackUserId;

    if (!appUserId) {
      throw new BadRequestException('RevenueCat event is missing an identifiable app user id');
    }

    return appUserId;
  }

  private collectEventEntitlementIds(event: Record<string, unknown>) {
    return this.getStringArray(event.entitlement_ids);
  }

  private displayNameForEntitlement(identifier: string) {
    const configured = this.getEntitlementConfig();
    if (identifier === configured.messenger) return 'BP Messenger Pro';
    if (identifier === configured.secureTunnel) return 'BP Secure Tunnel VPN';
    if (identifier === configured.premium) return 'BP Premium';
    return identifier
      .split('_')
      .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
      .join(' ');
  }

  private readWebhookEvent(payload: RevenueCatWebhookEnvelope) {
    if (!payload || typeof payload !== 'object' || !payload.event || typeof payload.event !== 'object') {
      throw new BadRequestException('RevenueCat webhook payload is invalid');
    }
    return payload.event;
  }

  private getExpectedWebhookAuthorization() {
    const explicit = this.readOptionalEnv('REVENUECAT_WEBHOOK_AUTHORIZATION');
    if (explicit) return explicit;

    const secret = this.readOptionalEnv('REVENUECAT_WEBHOOK_SECRET');
    if (!secret) return undefined;

    return /^bearer\s+/i.test(secret) ? secret : `Bearer ${secret}`;
  }

  private readHeaderValue(
    headers: Record<string, string | string[] | undefined>,
    name: string,
  ) {
    const target = Object.entries(headers).find(([key]) => key.toLowerCase() === name.toLowerCase());
    if (!target) return undefined;
    const value = target[1];
    if (Array.isArray(value)) return value[0];
    return value;
  }

  private snapshotHasAnyEntitlement(
    entitlements: Array<{ identifier: string; active: boolean }>,
    identifiers: string[],
  ) {
    return entitlements.some((row) => row.active && identifiers.includes(row.identifier));
  }

  private parseDateValue(value: unknown) {
    if (typeof value === 'number') return this.timestampMsToDate(value);
    if (typeof value === 'string' && value.trim()) {
      const numeric = Number(value);
      if (Number.isFinite(numeric) && `${numeric}` === value.trim()) {
        return this.timestampMsToDate(numeric);
      }
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    return null;
  }

  private timestampMsToDate(value?: number | null) {
    if (!value || !Number.isFinite(value)) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private getString(value: unknown) {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }

  private getStringArray(value: unknown) {
    if (!Array.isArray(value)) return [];
    return value
      .map((entry) => this.getString(entry))
      .filter((entry): entry is string => Boolean(entry));
  }

  private readStringArray(value: unknown) {
    if (!Array.isArray(value)) return [];
    return value.filter((entry): entry is string => typeof entry === 'string' && Boolean(entry.trim()));
  }

  private getNumber(value: unknown) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  }

  private readOptionalEnv(name: string) {
    return resolveConfiguredEnv(name, this.config);
  }

  private readEnv(name: string) {
    const value = this.readOptionalEnv(name);
    if (!value) {
      throw new BadRequestException(`${name} is not configured`);
    }
    return value;
  }
}
