export const CALL_BILLING_INTERVAL_SECONDS = 60;
export const CALL_MINIMUM_BILLABLE_SECONDS = 60;

export type CallRateSnapshot = {
  destinationCountry?: string | null;
  destinationPrefix?: string | null;
  provider?: string | null;
  creditsPerMinute: number;
  usdCostPerMinuteCents?: number | null;
};

export type CalculateCallCostInput = {
  durationSeconds: number;
  creditsPerMinute: number;
  billingIntervalSeconds?: number;
  minimumBillableSeconds?: number;
};

export type VoiceWebhookKeyInput = {
  provider: string;
  providerCallId: string;
  status: string;
  eventId?: string | null;
  eventTimestamp?: string | Date | null;
};

export function normalizeOutboundNumber(value: string) {
  const compact = value.trim().replace(/[^\d+]/g, '');
  const normalized = compact.startsWith('00') ? `+${compact.slice(2)}` : compact;
  if (!normalized) return '';
  return normalized.startsWith('+')
    ? `+${normalized.slice(1).replace(/\+/g, '')}`
    : normalized.replace(/\+/g, '');
}

export function isE164Number(value: string) {
  return /^\+[1-9]\d{6,14}$/.test(normalizeOutboundNumber(value));
}

export function inferCountryFromNumber(phoneNumber: string) {
  const normalized = normalizeOutboundNumber(phoneNumber);
  if (normalized.startsWith('+1')) return 'US';
  if (normalized.startsWith('+234')) return 'NG';
  if (normalized.startsWith('+44')) return 'GB';
  if (normalized.startsWith('+91')) return 'IN';
  if (normalized.startsWith('+61')) return 'AU';
  if (normalized.startsWith('+49')) return 'DE';
  return 'GLOBAL';
}

export function calculateCallCost(input: CalculateCallCostInput) {
  const billingIntervalSeconds = Math.max(1, Math.round(Number(input.billingIntervalSeconds ?? CALL_BILLING_INTERVAL_SECONDS)));
  const minimumBillableSeconds = Math.max(billingIntervalSeconds, Math.round(Number(input.minimumBillableSeconds ?? CALL_MINIMUM_BILLABLE_SECONDS)));
  const durationSeconds = Math.max(0, Math.round(Number(input.durationSeconds ?? 0)));
  const creditsPerMinute = Math.max(1, Math.round(Number(input.creditsPerMinute ?? 0)));

  if (durationSeconds <= 0) {
    return {
      durationSeconds,
      billableSeconds: minimumBillableSeconds,
      billableMinutes: Math.ceil(minimumBillableSeconds / 60),
      finalCredits: Math.ceil(minimumBillableSeconds / 60) * creditsPerMinute,
    };
  }

  const roundedIntervalCount = Math.ceil(durationSeconds / billingIntervalSeconds);
  const billableSeconds = Math.max(minimumBillableSeconds, roundedIntervalCount * billingIntervalSeconds);
  const billableMinutes = Math.ceil(billableSeconds / 60);

  return {
    durationSeconds,
    billableSeconds,
    billableMinutes,
    finalCredits: billableMinutes * creditsPerMinute,
  };
}

export function estimateCreditsToLock(rate: Pick<CallRateSnapshot, 'creditsPerMinute'>, minimumBillableSeconds = CALL_MINIMUM_BILLABLE_SECONDS) {
  const billableMinutes = Math.max(1, Math.ceil(Math.max(1, minimumBillableSeconds) / 60));
  return Math.max(1, Math.round(Number(rate.creditsPerMinute ?? 0)) * billableMinutes);
}

export function buildVoiceWebhookIdempotencyKey(input: VoiceWebhookKeyInput) {
  const eventId = input.eventId?.trim();
  const eventTimestamp = typeof input.eventTimestamp === 'string'
    ? input.eventTimestamp
    : input.eventTimestamp instanceof Date
      ? input.eventTimestamp.toISOString()
      : '';

  return [
    input.provider.trim().toLowerCase(),
    input.providerCallId.trim(),
    input.status.trim().toLowerCase(),
    eventId || eventTimestamp || 'unknown-event',
  ].join(':');
}

export function pushProcessedVoiceEvent(existing: string[] | undefined, nextEventKey: string, limit = 20) {
  const events = Array.isArray(existing) ? existing.filter((value) => typeof value === 'string') : [];
  if (events.includes(nextEventKey)) return events;
  return [...events, nextEventKey].slice(-limit);
}
