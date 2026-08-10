import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Call, CallDirection, CallStatus } from '../../database/entities/extended-entities';
import { NumberStatus, NumberType, PhoneNumber } from '../../database/entities/phone-number.entity';
import { CreditsService } from '../credits/credits.service';
import { ProviderName, ProviderService } from '../global/provider.service';
import { EventsGateway } from '../gateway/events.gateway';
import { RevenueCatService } from '../revenuecat/revenuecat.service';
import {
  buildVoiceWebhookIdempotencyKey,
  inferCountryFromNumber,
  isE164Number,
  normalizeOutboundNumber,
  pushProcessedVoiceEvent,
} from './call-billing';
import { CallBillingService, NormalizedCallRate } from './call-billing.service';

export type StartOutboundCallInput = {
  to: string;
  fromNumberId?: string;
  preferredProvider?: ProviderName;
  idempotencyKey: string;
};

export type NormalizedVoiceEvent = {
  provider: string;
  providerCallId: string;
  status: string;
  fromNumber: string;
  toNumber: string;
  durationSeconds?: number;
  answeredAt?: Date | null;
  completedAt?: Date | null;
  eventId?: string | null;
  eventTimestamp?: string | Date | null;
  signatureValid: boolean;
  failureReason?: string | null;
  rawEvent: Record<string, unknown>;
};

@Injectable()
export class CallsService {
  private readonly logger = new Logger(CallsService.name);

  constructor(
    @InjectRepository(Call)
    private readonly callRepo: Repository<Call>,
    @InjectRepository(PhoneNumber)
    private readonly phoneNumberRepo: Repository<PhoneNumber>,
    private readonly creditsService: CreditsService,
    private readonly revenueCatService: RevenueCatService,
    private readonly providerService: ProviderService,
    private readonly eventsGateway: EventsGateway,
    private readonly callBillingService: CallBillingService,
  ) {}

  async startOutboundCall(userId: string, input: StartOutboundCallInput) {
    if (!input.idempotencyKey?.trim()) {
      throw new BadRequestException('An idempotency key is required.');
    }

    const existing = await this.callRepo.findOne({
      where: { userId, idempotencyKey: input.idempotencyKey.trim() },
    });
    if (existing) {
      return {
        call: this.toCallView(existing),
        rate: this.readRateSnapshot(existing),
      };
    }

    await this.assertMessengerAccess(userId);
    const assignedNumber = await this.resolveAssignedNumber(userId, input.fromNumberId);

    const normalizedTo = normalizeOutboundNumber(input.to);
    if (!isE164Number(normalizedTo)) {
      throw new BadRequestException('Destination number must be a valid E.164 phone number.');
    }

    const rate = await this.callBillingService.resolveRateForDestination(
      normalizedTo,
      input.preferredProvider ?? assignedNumber.provider,
    );
    if (!rate) {
      throw new BadRequestException('Calling is not available for this destination right now.');
    }

    const estimatedCredits = this.callBillingService.estimateCreditsToLock(rate);
    const lock = await this.creditsService.createLock({
      userId,
      creditsAmount: estimatedCredits,
      relatedProduct: 'messenger_calls',
      reason: 'Outbound BP Messenger call credit hold',
      description: `Locked Call Credits for outbound call to ${normalizedTo}`,
      idempotencyKey: `call-lock:${input.idempotencyKey.trim()}`,
      metadata: {
        destinationNumber: normalizedTo,
        destinationCountry: rate.destinationCountry,
        provider: rate.provider,
        creditsPerMinute: rate.creditsPerMinute,
      },
    });

    const initialCall = await this.callRepo.save(this.callRepo.create({
      userId,
      phoneNumberId: assignedNumber.id,
      from: assignedNumber.number,
      to: normalizedTo,
      direction: CallDirection.OUTBOUND,
      status: CallStatus.INITIATED,
      provider: rate.provider,
      providerCallId: null,
      durationSeconds: 0,
      billableSeconds: 0,
      creditsLocked: estimatedCredits,
      creditsSpent: 0,
      destinationCountry: rate.destinationCountry,
      failureReason: null,
      idempotencyKey: input.idempotencyKey.trim(),
      startedAt: new Date(),
      answeredAt: null,
      completedAt: null,
      metadata: {
        callCreditLockId: lock.lock.id,
        processedVoiceEvents: [],
        rateSnapshot: rate,
      },
    }));

    try {
      const providerCall = await this.providerService.startCall(
        normalizedTo,
        assignedNumber.number,
        rate.destinationCountry ?? assignedNumber.countryCode,
        input.preferredProvider ?? (rate.provider as ProviderName | undefined) ?? ProviderName.TWILIO,
        {
          callId: initialCall.id,
        },
      );

      initialCall.provider = providerCall.provider;
      initialCall.providerCallId = providerCall.sid;
      initialCall.status = this.normalizeCallStatus(providerCall.status);

      const saved = await this.callRepo.save(initialCall);
      this.emitCallUpdate(saved);

      return {
        call: this.toCallView(saved),
        rate,
      };
    } catch (error) {
      await this.creditsService.releaseLock({
        userId,
        lockId: lock.lock.id,
        idempotencyKey: `call-start-release:${initialCall.id}`,
        description: 'Released Call Credits after outbound provider start failure',
        metadata: {
          callId: initialCall.id,
        },
      }).catch((releaseError) => {
        this.logger.warn(`Failed to release call credit lock after call start failure: ${releaseError instanceof Error ? releaseError.message : String(releaseError)}`);
      });

      initialCall.status = CallStatus.FAILED;
      initialCall.failureReason = error instanceof Error ? error.message : 'Unable to start outbound call';
      initialCall.completedAt = new Date();
      await this.callRepo.save(initialCall);
      this.emitCallUpdate(initialCall);

      throw error;
    }
  }

  async getCall(userId: string, callId: string) {
    const call = await this.callRepo.findOne({
      where: { id: callId, userId },
    });
    if (!call) {
      throw new NotFoundException('Call not found');
    }

    return this.toCallView(call);
  }

  async listCalls(userId: string, page = 1, limit = 20) {
    const [calls, total] = await this.callRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      calls: calls.map((call) => this.toCallView(call)),
      total,
      page,
      limit,
    };
  }

  async handleProviderVoiceEvent(event: NormalizedVoiceEvent) {
    const call = await this.callRepo.findOne({
      where: { providerCallId: event.providerCallId },
    });
    if (!call) {
      return {
        success: true,
        ignored: true,
      };
    }

    const eventKey = buildVoiceWebhookIdempotencyKey({
      provider: event.provider,
      providerCallId: event.providerCallId,
      status: event.status,
      eventId: event.eventId ?? null,
      eventTimestamp: event.eventTimestamp ?? null,
    });
    const processedVoiceEvents = this.readProcessedVoiceEvents(call);

    if (processedVoiceEvents.includes(eventKey)) {
      return {
        success: true,
        duplicate: true,
        call: this.toCallView(call),
      };
    }

    call.provider = event.provider;
    call.status = this.normalizeCallStatus(event.status);
    if (event.answeredAt) call.answeredAt = event.answeredAt;
    if (event.completedAt) call.completedAt = event.completedAt;
    if (typeof event.durationSeconds === 'number' && Number.isFinite(event.durationSeconds)) {
      call.durationSeconds = Math.max(0, Math.round(event.durationSeconds));
    }

    const lockId = typeof call.metadata?.callCreditLockId === 'string'
      ? call.metadata.callCreditLockId
      : null;

    if (this.isCompletedStatus(call.status)) {
      await this.settleCompletedCall(call, event, lockId, eventKey);
    } else if (this.isFailedStatus(call.status) && lockId) {
      await this.creditsService.releaseLock({
        userId: call.userId,
        lockId,
        idempotencyKey: `call-release:${call.id}:${eventKey}`,
        description: `Released Call Credits for ${call.status} outbound call`,
        metadata: {
          callId: call.id,
          provider: event.provider,
          providerCallId: event.providerCallId,
        },
      });
      call.failureReason = event.failureReason ?? call.status;
      call.creditsSpent = 0;
      call.billableSeconds = 0;
    }

    call.metadata = {
      ...(call.metadata ?? {}),
      processedVoiceEvents: pushProcessedVoiceEvent(processedVoiceEvents, eventKey),
      lastVoiceEvent: {
        provider: event.provider,
        status: event.status,
        eventId: event.eventId ?? null,
        eventTimestamp: event.eventTimestamp instanceof Date
          ? event.eventTimestamp.toISOString()
          : event.eventTimestamp ?? null,
      },
    };

    const saved = await this.callRepo.save(call);
    this.emitCallUpdate(saved);
    await this.logRepeatedFailures(saved);

    return {
      success: true,
      duplicate: false,
      call: this.toCallView(saved),
    };
  }

  private async settleCompletedCall(
    call: Call,
    event: NormalizedVoiceEvent,
    lockId: string | null,
    eventKey: string,
  ) {
    const rate = this.readRateSnapshot(call)
      ?? await this.callBillingService.resolveRateForDestination(call.to, call.provider ?? undefined);

    if (!rate) {
      throw new BadRequestException('Missing call rate snapshot for outbound call billing.');
    }

    const cost = this.callBillingService.calculateCallCost({
      durationSeconds: call.durationSeconds,
      creditsPerMinute: rate.creditsPerMinute,
    });

    let totalSpent = 0;

    if (lockId && Number(call.creditsLocked) > 0) {
      const lockedCredits = Math.max(0, Math.round(Number(call.creditsLocked)));
      const spendFromLock = Math.min(lockedCredits, cost.finalCredits);

      if (spendFromLock > 0) {
        await this.creditsService.spendLock({
          userId: call.userId,
          lockId,
          creditsAmount: spendFromLock,
          usdValueCents: spendFromLock,
          relatedProduct: 'messenger_calls',
          relatedEntityId: call.id,
          description: `BP Messenger outbound call to ${call.to}`,
          idempotencyKey: `call-spend:${call.id}:${eventKey}`,
          metadata: {
            provider: event.provider,
            providerCallId: event.providerCallId,
            durationSeconds: call.durationSeconds,
            billableSeconds: cost.billableSeconds,
          },
        });
        totalSpent += spendFromLock;
      }
    }

    const additionalCreditsNeeded = cost.finalCredits - totalSpent;
    if (additionalCreditsNeeded > 0) {
      try {
        const extraLock = await this.creditsService.createLock({
          userId: call.userId,
          creditsAmount: additionalCreditsNeeded,
          relatedProduct: 'messenger_calls',
          relatedEntityId: call.id,
          reason: 'Additional outbound BP Messenger call debit',
          description: `Additional Call Credits for completed call to ${call.to}`,
          idempotencyKey: `call-extra-lock:${call.id}:${eventKey}`,
          metadata: {
            provider: event.provider,
            providerCallId: event.providerCallId,
          },
        });

        await this.creditsService.spendLock({
          userId: call.userId,
          lockId: extraLock.lock.id,
          creditsAmount: additionalCreditsNeeded,
          usdValueCents: additionalCreditsNeeded,
          relatedProduct: 'messenger_calls',
          relatedEntityId: call.id,
          description: `Additional Call Credits for completed call to ${call.to}`,
          idempotencyKey: `call-extra-spend:${call.id}:${eventKey}`,
          metadata: {
            provider: event.provider,
            providerCallId: event.providerCallId,
            durationSeconds: call.durationSeconds,
            billableSeconds: cost.billableSeconds,
          },
        });
        totalSpent += additionalCreditsNeeded;
      } catch (error) {
        call.failureReason = `Uncollected Call Credit shortfall: ${additionalCreditsNeeded}`;
        this.logger.warn(`Unable to collect additional Call Credits for call ${call.id}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    call.status = CallStatus.COMPLETED;
    call.billableSeconds = cost.billableSeconds;
    call.creditsSpent = totalSpent;
    call.completedAt = event.completedAt ?? call.completedAt ?? new Date();
    call.answeredAt = event.answeredAt ?? call.answeredAt ?? call.completedAt ?? new Date();
    call.metadata = {
      ...(call.metadata ?? {}),
      billing: {
        rateSnapshot: rate,
        billableMinutes: cost.billableMinutes,
        finalCredits: cost.finalCredits,
        collectedCredits: totalSpent,
      },
    };
  }

  private async assertMessengerAccess(userId: string) {
    const entitlements = this.revenueCatService.getEntitlementConfig();
    const hasAccess = await this.revenueCatService.hasAnyActiveEntitlement(userId, [
      entitlements.messenger,
      entitlements.premium,
    ]);

    if (!hasAccess) {
      throw new ForbiddenException('An active BP Messenger subscription is required to place calls.');
    }
  }

  private async resolveAssignedNumber(userId: string, fromNumberId?: string) {
    if (fromNumberId) {
      const requested = await this.phoneNumberRepo.findOne({
        where: { id: fromNumberId, userId, status: NumberStatus.ACTIVE },
      });
      if (!requested || !this.isCallableNumber(requested)) {
        throw new BadRequestException('You need an active BP Messenger number before you can place calls.');
      }
      return requested;
    }

    const candidate = await this.phoneNumberRepo.findOne({
      where: { userId, status: NumberStatus.ACTIVE },
      order: { createdAt: 'ASC' },
    });
    if (!candidate || !this.isCallableNumber(candidate)) {
      throw new BadRequestException('You need an assigned BP Messenger number before you can place calls.');
    }

    return candidate;
  }

  private isCallableNumber(number: PhoneNumber) {
    if (!number) return false;
    if (number.type === NumberType.VERIFICATION) return false;
    if (number.status !== NumberStatus.ACTIVE) return false;
    if (!Array.isArray(number.capabilities) || number.capabilities.length === 0) return true;
    return number.capabilities.includes('voice');
  }

  private normalizeCallStatus(status: string) {
    const normalized = String(status ?? '').trim().toLowerCase();

    switch (normalized) {
      case 'queued':
      case 'initiated':
        return CallStatus.INITIATED;
      case 'ringing':
        return CallStatus.RINGING;
      case 'answered':
      case 'in-progress':
      case 'in_progress':
      case 'inprogress':
        return CallStatus.ANSWERED;
      case 'completed':
        return CallStatus.COMPLETED;
      case 'busy':
        return CallStatus.BUSY;
      case 'no-answer':
      case 'no_answer':
      case 'unanswered':
        return CallStatus.NO_ANSWER;
      case 'canceled':
      case 'cancelled':
        return CallStatus.CANCELED;
      case 'failed':
      default:
        return CallStatus.FAILED;
    }
  }

  private isCompletedStatus(status: CallStatus) {
    return status === CallStatus.COMPLETED;
  }

  private isFailedStatus(status: CallStatus) {
    return [
      CallStatus.FAILED,
      CallStatus.BUSY,
      CallStatus.NO_ANSWER,
      CallStatus.CANCELED,
    ].includes(status);
  }

  private readProcessedVoiceEvents(call: Call) {
    const events = call.metadata?.processedVoiceEvents;
    return Array.isArray(events) ? events.filter((value): value is string => typeof value === 'string') : [];
  }

  private readRateSnapshot(call: Call): NormalizedCallRate | null {
    const snapshot = call.metadata?.rateSnapshot;
    if (!snapshot || typeof snapshot !== 'object') return null;

    const creditsPerMinute = Number((snapshot as Record<string, unknown>).creditsPerMinute ?? 0);
    if (!Number.isFinite(creditsPerMinute) || creditsPerMinute <= 0) return null;

    return {
      destinationCountry: String((snapshot as Record<string, unknown>).destinationCountry ?? call.destinationCountry ?? inferCountryFromNumber(call.to)),
      destinationPrefix: typeof (snapshot as Record<string, unknown>).destinationPrefix === 'string'
        ? String((snapshot as Record<string, unknown>).destinationPrefix)
        : null,
      provider: typeof (snapshot as Record<string, unknown>).provider === 'string'
        ? String((snapshot as Record<string, unknown>).provider)
        : call.provider ?? null,
      creditsPerMinute,
      usdCostPerMinuteCents: Number((snapshot as Record<string, unknown>).usdCostPerMinuteCents ?? creditsPerMinute),
    };
  }

  private emitCallUpdate(call: Call) {
    if (!call.userId) return;
    this.eventsGateway.emitToUser(call.userId, 'messenger.call.updated', this.toCallView(call));
  }

  private async logRepeatedFailures(call: Call) {
    if (!call.userId || !this.isFailedStatus(call.status)) return;

    const recentFailures = await this.callRepo.count({
      where: {
        userId: call.userId,
        status: call.status,
      },
    }).catch(() => 0);

    if (recentFailures >= 3) {
      this.logger.warn(`Potential outbound call abuse for user ${call.userId}: ${recentFailures} ${call.status} call events logged.`);
    }
  }

  private toCallView(call: Call) {
    return {
      id: call.id,
      userId: call.userId,
      phoneNumberId: call.phoneNumberId ?? null,
      fromNumber: call.from,
      toNumber: call.to,
      provider: call.provider ?? null,
      providerCallId: call.providerCallId ?? null,
      status: call.status,
      direction: call.direction,
      destinationCountry: call.destinationCountry ?? inferCountryFromNumber(call.to),
      durationSeconds: Number(call.durationSeconds ?? 0),
      billableSeconds: Number(call.billableSeconds ?? 0),
      creditsLocked: Number(call.creditsLocked ?? 0),
      creditsSpent: Number(call.creditsSpent ?? 0),
      failureReason: call.failureReason ?? null,
      startedAt: call.startedAt?.toISOString() ?? call.createdAt?.toISOString() ?? null,
      answeredAt: call.answeredAt?.toISOString() ?? null,
      completedAt: call.completedAt?.toISOString() ?? null,
      createdAt: call.createdAt?.toISOString() ?? null,
      updatedAt: call.updatedAt?.toISOString() ?? null,
      metadata: call.metadata ?? {},
    };
  }
}
