import { type RuntimeEnvSource } from './runtime-env';

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

export function buildWalletPresentation(balanceUsdCents: number, _source: RuntimeEnvSource) {
  const normalizedBalanceUsdCents = asMinorNumber(balanceUsdCents);
  return {
    walletBalanceUsdCents: normalizedBalanceUsdCents,
    walletBalanceUsd: normalizedBalanceUsdCents / 100,
    walletDisplayCurrency: 'USD' as const,
  };
}

export function withWalletPresentation<T extends { walletBalanceUsdCents?: number; lifetimeSpendUsdCents?: number }>(
  value: T,
  source: RuntimeEnvSource,
) {
  const wallet = buildWalletPresentation(asMinorNumber(value.walletBalanceUsdCents), source);
  const lifetimeSpendUsdCents = asMinorNumber(value.lifetimeSpendUsdCents);

  return {
    ...value,
    ...wallet,
    lifetimeSpendUsdCents,
    lifetimeSpendUsd: lifetimeSpendUsdCents / 100,
  };
}
