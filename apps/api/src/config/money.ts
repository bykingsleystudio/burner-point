import { type RuntimeEnvSource } from './runtime-env';

const DEFAULT_USD_TO_NGN_RATE = 1600;

function readEnv(source: RuntimeEnvSource, name: string): string | undefined {
  if (typeof (source as { get?: unknown }).get === 'function') {
    const value = (source as { get<T = string>(key: string): T | undefined }).get(name);
    if (typeof value === 'string') return value;
    if (value === null || value === undefined) return undefined;
    return String(value);
  }

  const value = (source as Record<string, unknown>)[name];
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return undefined;
  return String(value);
}

function asMinorNumber(value: unknown): number {
  const parsed = Number(value ?? 0);
  if (!Number.isFinite(parsed)) return 0;
  return parsed;
}

export function resolveUsdToNgnRate(source: RuntimeEnvSource): number {
  const configured = Number(
    readEnv(source, 'PAYMENT_USD_TO_NGN_RATE')
      ?? readEnv(source, 'NEXT_PUBLIC_PAYMENT_USD_TO_NGN_RATE')
      ?? readEnv(source, 'EXPO_PUBLIC_PAYMENT_USD_TO_NGN_RATE'),
  );

  return Number.isFinite(configured) && configured > 0
    ? configured
    : DEFAULT_USD_TO_NGN_RATE;
}

export function ngnKoboToUsdCents(ngnKobo: number, source: RuntimeEnvSource): number {
  const rate = resolveUsdToNgnRate(source);
  // ngnKobo = NGN minor units (kobo). Convert to USD cents at current display rate.
  return Math.max(0, Math.round((asMinorNumber(ngnKobo) / 100 / rate) * 100));
}

export function usdCentsToNgnKobo(usdCents: number, source: RuntimeEnvSource): number {
  const rate = resolveUsdToNgnRate(source);
  return Math.max(0, Math.round((asMinorNumber(usdCents) / 100) * rate * 100));
}

export function buildWalletPresentation(balanceKobo: number, source: RuntimeEnvSource) {
  // NOTE: Burner Point stores wallet balance in USD cents.
  // Historical column names still reference "kobo" for backwards compatibility.
  const walletBalanceUsdCents = asMinorNumber(balanceKobo);
  const walletFxRateNgnPerUsd = resolveUsdToNgnRate(source);
  const walletBalanceNgnKobo = usdCentsToNgnKobo(walletBalanceUsdCents, source);

  return {
    walletBalanceUsdCents,
    walletBalanceUsd: walletBalanceUsdCents / 100,
    walletDisplayCurrency: 'USD' as const,
    walletFxRateNgnPerUsd,
    // Legacy fields kept for client compatibility (represent local display only).
    walletBalanceKobo: walletBalanceNgnKobo,
    walletBalanceNgn: walletBalanceNgnKobo / 100,
  };
}

export function withWalletPresentation<T extends { walletBalanceKobo?: number; lifetimeSpendKobo?: number }>(
  value: T,
  source: RuntimeEnvSource,
) {
  const wallet = buildWalletPresentation(asMinorNumber(value.walletBalanceKobo), source);
  // Lifetime spend is stored in USD cents (legacy column name "kobo").
  const lifetimeSpendUsdCents = asMinorNumber(value.lifetimeSpendKobo);
  const lifetimeSpendKobo = usdCentsToNgnKobo(lifetimeSpendUsdCents, source);

  return {
    ...value,
    ...wallet,
    lifetimeSpendKobo,
    lifetimeSpendUsdCents,
    lifetimeSpendUsd: lifetimeSpendUsdCents / 100,
  };
}
