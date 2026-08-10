import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreditPricingRule } from '../../database/entities/financial-ledger.entity';
import {
  calculateCallCost,
  estimateCreditsToLock,
  inferCountryFromNumber,
  normalizeOutboundNumber,
} from './call-billing';

export type NormalizedCallRate = {
  destinationCountry: string;
  destinationPrefix: string | null;
  provider: string | null;
  creditsPerMinute: number;
  usdCostPerMinuteCents: number;
};

@Injectable()
export class CallBillingService {
  constructor(
    @InjectRepository(CreditPricingRule)
    private readonly pricingRuleRepo: Repository<CreditPricingRule>,
  ) {}

  async resolveRateForDestination(destinationNumber: string, preferredProvider?: string) {
    const normalizedNumber = normalizeOutboundNumber(destinationNumber);
    const destinationCountry = inferCountryFromNumber(normalizedNumber);
    const rules = await this.pricingRuleRepo.find({
      where: { product: 'messenger_calls', isActive: true },
      order: { createdAt: 'ASC' },
    });

    const normalizedProvider = preferredProvider?.trim().toLowerCase() || null;

    let best: { rule: CreditPricingRule; score: number } | null = null;
    for (const rule of rules) {
      const provider = rule.provider?.trim().toLowerCase() || null;
      if (normalizedProvider && provider && provider !== normalizedProvider) {
        continue;
      }

      const countryCode = rule.countryCode?.trim().toUpperCase() || null;
      const destinationPrefix = typeof rule.metadata?.destinationPrefix === 'string'
        ? String(rule.metadata.destinationPrefix).trim()
        : null;

      let score = 0;
      if (provider && normalizedProvider && provider === normalizedProvider) {
        score += 8;
      }
      if (countryCode) {
        if (countryCode !== destinationCountry) continue;
        score += 4;
      }
      if (destinationPrefix) {
        if (!normalizedNumber.startsWith(destinationPrefix)) continue;
        score += 16 + destinationPrefix.length;
      }

      if (!best || score > best.score) {
        best = { rule, score };
      }
    }

    const selected = best?.rule
      ?? rules.find((rule) => !rule.countryCode && !rule.provider)
      ?? null;

    if (!selected) return null;

    const providerCostUsdCents = Number(selected.providerCostUsdCents ?? 0);
    const platformMarginUsdCents = Number(selected.platformMarginUsdCents ?? 0);
    const riskMarginUsdCents = Number(selected.riskMarginUsdCents ?? 0);
    const creditsPerMinute = Math.max(1, providerCostUsdCents + platformMarginUsdCents + riskMarginUsdCents);

    return {
      destinationCountry: selected.countryCode?.trim().toUpperCase() || destinationCountry,
      destinationPrefix: typeof selected.metadata?.destinationPrefix === 'string'
        ? String(selected.metadata.destinationPrefix)
        : null,
      provider: selected.provider?.trim() || normalizedProvider || null,
      creditsPerMinute,
      usdCostPerMinuteCents: providerCostUsdCents,
    } satisfies NormalizedCallRate;
  }

  calculateCallCost(input: { durationSeconds: number; creditsPerMinute: number }) {
    return calculateCallCost(input);
  }

  estimateCreditsToLock(rate: Pick<NormalizedCallRate, 'creditsPerMinute'>) {
    return estimateCreditsToLock(rate);
  }
}
