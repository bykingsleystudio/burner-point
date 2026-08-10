const test = require('node:test');
const assert = require('node:assert/strict');

const {
  BP_CREDIT_USD_CENTS_RATE,
  calculateCreditsFromUsdCents,
  calculatePackageTotalCredits,
  quoteCreditsPrice,
} = require('../src/modules/credits/pricing-engine.ts');

test('uses 100 BP Credits per USD for conversion', () => {
  assert.equal(BP_CREDIT_USD_CENTS_RATE, 100);
  assert.equal(calculateCreditsFromUsdCents(99), 99);
  assert.equal(calculateCreditsFromUsdCents(599), 599);
});

test('adds configurable bonus credits to package totals', () => {
  assert.equal(
    calculatePackageTotalCredits({
      baseCredits: 2500,
      bonusCredits: 100,
    }),
    2600,
  );

  assert.equal(
    calculatePackageTotalCredits({
      baseCredits: 5000,
      bonusCredits: 0,
    }),
    5000,
  );
});

test('applies pricing margins and multipliers before converting to credits', () => {
  const quote = quoteCreditsPrice({
    product: 'verify_hub',
    providerCostUsdCents: 60,
    platformMarginUsdCents: 20,
    riskMarginUsdCents: 19,
    countryMultiplier: 1,
    routeQualityMultiplier: 1,
  });

  assert.equal(quote.finalUsdCents, 99);
  assert.equal(quote.finalCredits, 99);
  assert.equal(quote.breakdown.providerCostUsdCents, 60);
  assert.equal(quote.breakdown.platformMarginUsdCents, 20);
  assert.equal(quote.breakdown.riskMarginUsdCents, 19);
});

test('rounds quote results up after multipliers are applied', () => {
  const quote = quoteCreditsPrice({
    product: 'proxy_store',
    providerCostUsdCents: 500,
    platformMarginUsdCents: 50,
    riskMarginUsdCents: 15,
    countryMultiplier: 1.05,
    routeQualityMultiplier: 1.1,
  });

  assert.equal(quote.finalUsdCents, 653);
  assert.equal(quote.finalCredits, 653);
});
