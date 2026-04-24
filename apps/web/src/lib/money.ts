const DEFAULT_USD_TO_NGN_RATE = Number(process.env.NEXT_PUBLIC_PAYMENT_USD_TO_NGN_RATE ?? 1600);

type WalletLike = {
  walletBalanceUsdCents?: number | null;
  walletBalanceKobo?: number | null;
  walletFxRateNgnPerUsd?: number | null;
};

type LegacyAmountLike = {
  amountUsdCents?: number | null;
  amountKobo?: number | null;
  walletFxRateNgnPerUsd?: number | null;
};

function finiteNumber(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function resolveUsdToNgnRate(rate?: number | null): number {
  const direct = finiteNumber(rate);
  if (direct && direct > 0) return direct;
  return Number.isFinite(DEFAULT_USD_TO_NGN_RATE) && DEFAULT_USD_TO_NGN_RATE > 0
    ? DEFAULT_USD_TO_NGN_RATE
    : 1600;
}

export function legacyNgnKoboToUsdCents(kobo?: number | null, rate?: number | null): number {
  const amountKobo = finiteNumber(kobo) ?? 0;
  const fx = resolveUsdToNgnRate(rate);
  return Math.round((amountKobo / 100 / fx) * 100);
}

export function usdCentsToNgnKobo(usdCents?: number | null, rate?: number | null): number {
  const cents = finiteNumber(usdCents) ?? 0;
  const fx = resolveUsdToNgnRate(rate);
  return Math.round((cents / 100) * fx * 100);
}

export function formatUsdCents(cents?: number | null): string {
  const value = (finiteNumber(cents) ?? 0) / 100;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

export function formatNgnKobo(kobo?: number | null): string {
  const value = (finiteNumber(kobo) ?? 0) / 100;
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(value);
}

export function getWalletUsdCents(wallet?: WalletLike | null): number {
  if (!wallet) return 0;
  return finiteNumber(wallet.walletBalanceUsdCents)
    ?? legacyNgnKoboToUsdCents(wallet.walletBalanceKobo, wallet.walletFxRateNgnPerUsd);
}

export function formatWalletPrimary(wallet?: WalletLike | null): string {
  return formatUsdCents(getWalletUsdCents(wallet));
}

export function formatWalletSecondary(wallet?: WalletLike | null): string {
  if (!wallet) return formatNgnKobo(0);
  const amountKobo = finiteNumber(wallet.walletBalanceKobo)
    ?? usdCentsToNgnKobo(wallet.walletBalanceUsdCents, wallet.walletFxRateNgnPerUsd);
  return formatNgnKobo(amountKobo);
}

export function formatLegacyAmountPrimary(amount?: LegacyAmountLike | null): string {
  if (!amount) return formatUsdCents(0);
  const usdCents = finiteNumber(amount.amountUsdCents)
    ?? legacyNgnKoboToUsdCents(amount.amountKobo, amount.walletFxRateNgnPerUsd);
  return formatUsdCents(usdCents);
}

export function formatLegacyAmountSecondary(amount?: LegacyAmountLike | null): string {
  if (!amount) return formatNgnKobo(0);
  const amountKobo = finiteNumber(amount.amountKobo)
    ?? usdCentsToNgnKobo(amount.amountUsdCents, amount.walletFxRateNgnPerUsd);
  return formatNgnKobo(amountKobo);
}

export function formatStoredKoboAsUsd(kobo?: number | null, rate?: number | null): string {
  return formatUsdCents(legacyNgnKoboToUsdCents(kobo, rate));
}
