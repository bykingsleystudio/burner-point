type WalletLike = { walletBalanceUsdCents?: number | null };
type AmountLike = { amountUsdCents?: number | null };

function finiteNumber(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatUsdCents(cents?: number | null): string {
  const value = (finiteNumber(cents) ?? 0) / 100;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

export function formatLocalAmount(amountUsdCents: number | null | undefined, currency: string, rate?: number | null): string | null {
  const usdCents = finiteNumber(amountUsdCents);
  const fx = finiteNumber(rate);
  if (usdCents === null || !fx || fx <= 0) return null;
  return new Intl.NumberFormat('en', { style: 'currency', currency, maximumFractionDigits: 2 }).format((usdCents / 100) * fx);
}

export function getWalletUsdCents(wallet?: WalletLike | null): number {
  return finiteNumber(wallet?.walletBalanceUsdCents) ?? 0;
}

export function formatWalletPrimary(wallet?: WalletLike | null): string {
  return formatUsdCents(getWalletUsdCents(wallet));
}

export function formatWalletSecondary(wallet?: WalletLike | null): string {
  return wallet?.walletBalanceUsdCents == null ? '' : formatUsdCents(wallet.walletBalanceUsdCents);
}

export function formatAmountPrimary(amount?: AmountLike | null): string {
  return formatUsdCents(amount?.amountUsdCents);
}

export function formatStoredUsdCents(cents?: number | null): string {
  return formatUsdCents(cents);
}
