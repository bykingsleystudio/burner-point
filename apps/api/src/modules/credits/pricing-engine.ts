export const BP_CREDIT_USD_CENTS_RATE = 100;

export type CreditPackageShape = {
  baseCredits: number;
  bonusCredits?: number | null;
};

export type PricingQuoteInput = {
  product: string;
  providerCostUsdCents: number;
  platformMarginUsdCents?: number | null;
  riskMarginUsdCents?: number | null;
  countryMultiplier?: number | null;
  routeQualityMultiplier?: number | null;
};

function toFiniteNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function calculateCreditsFromUsdCents(usdCents: number): number {
  const normalized = Math.max(0, Math.ceil(toFiniteNumber(usdCents, 0)));
  return normalized * (BP_CREDIT_USD_CENTS_RATE / 100);
}

export function calculatePackageTotalCredits(input: CreditPackageShape): number {
  const baseCredits = Math.max(0, Math.floor(toFiniteNumber(input.baseCredits, 0)));
  const bonusCredits = Math.max(0, Math.floor(toFiniteNumber(input.bonusCredits, 0)));
  return baseCredits + bonusCredits;
}

export function quoteCreditsPrice(input: PricingQuoteInput) {
  const providerCostUsdCents = Math.max(0, Math.ceil(toFiniteNumber(input.providerCostUsdCents, 0)));
  const platformMarginUsdCents = Math.max(0, Math.ceil(toFiniteNumber(input.platformMarginUsdCents, 0)));
  const riskMarginUsdCents = Math.max(0, Math.ceil(toFiniteNumber(input.riskMarginUsdCents, 0)));
  const countryMultiplier = Math.max(0, toFiniteNumber(input.countryMultiplier, 1) || 1);
  const routeQualityMultiplier = Math.max(0, toFiniteNumber(input.routeQualityMultiplier, 1) || 1);

  const subtotalUsdCents = providerCostUsdCents + platformMarginUsdCents + riskMarginUsdCents;
  const finalUsdCents = Math.max(0, Math.ceil(subtotalUsdCents * countryMultiplier * routeQualityMultiplier));
  const finalCredits = calculateCreditsFromUsdCents(finalUsdCents);

  return {
    product: input.product,
    subtotalUsdCents,
    finalUsdCents,
    finalCredits,
    breakdown: {
      providerCostUsdCents,
      platformMarginUsdCents,
      riskMarginUsdCents,
      countryMultiplier,
      routeQualityMultiplier,
    },
  };
}
