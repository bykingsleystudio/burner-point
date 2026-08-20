type WalletLike = { walletBalanceUsdCents?: number | null };

function finiteNumber(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatUsdCents(cents?: number | null): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format((finiteNumber(cents) ?? 0) / 100);
}

export function getWalletUsdCents(wallet?: WalletLike | null): number {
  return finiteNumber(wallet?.walletBalanceUsdCents) ?? 0;
}

export function formatStoredUsdCents(cents?: number | null): string {
  return formatUsdCents(cents);
}
