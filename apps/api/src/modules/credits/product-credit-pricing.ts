import { NumberType } from '../../database/entities/phone-number.entity';

const NUMBER_PRODUCT_PRICING_USD_CENTS: Record<string, Record<string, number>> = {
  US: { burner: 599, rental: 1599, verification: 99 },
  CA: { burner: 599, rental: 1599, verification: 99 },
  default: { burner: 599, rental: 1599, verification: 99 },
};

const DEFAULT_NUMBER_DURATION_DAYS: Record<string, number> = {
  burner: 7,
  rental: 30,
  verification: 0,
  enterprise: 30,
};

export const VERIFICATION_LOCK_TIMEOUT_MINUTES = 15;

export function defaultNumberDurationDays(type: NumberType): number {
  return DEFAULT_NUMBER_DURATION_DAYS[type] ?? 30;
}

export function normalizeNumberDurationDays(type: NumberType, durationDays?: number) {
  if (type === NumberType.VERIFICATION) return 0;
  if (!durationDays || !Number.isFinite(durationDays) || durationDays < 1) {
    return defaultNumberDurationDays(type);
  }
  return Math.min(Math.round(durationDays), 365);
}

export function getNumberProductBasePriceUsdCents(
  countryCode: string,
  type: NumberType,
  durationDays?: number,
) {
  const country = countryCode.toUpperCase();
  const pricing = NUMBER_PRODUCT_PRICING_USD_CENTS[country] || NUMBER_PRODUCT_PRICING_USD_CENTS.default;
  const basePriceUsdCents = pricing[type] || pricing.burner;
  const normalizedDurationDays = normalizeNumberDurationDays(type, durationDays);
  const baseDurationDays = defaultNumberDurationDays(type);

  if (baseDurationDays <= 0 || normalizedDurationDays <= 0) {
    return basePriceUsdCents;
  }

  return Math.max(1, Math.round((basePriceUsdCents / baseDurationDays) * normalizedDurationDays));
}
