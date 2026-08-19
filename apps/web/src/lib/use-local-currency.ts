'use client';

import { useEffect, useState } from 'react';
import { fxApi } from './api';
import { useAuthStore } from '@/store';

type LocalCurrencyState = {
  currency: string;
  symbol: string;
  rate: number | null;
  providerTimestamp: string | null;
  fetchedAt: string | null;
  available: boolean;
  loading: boolean;
  formatUsdCents: (amountUsdCents: number | null | undefined) => string | null;
};

export function useLocalCurrency(): LocalCurrencyState {
  const country = useAuthStore((state) => state.user?.country);
  const [state, setState] = useState<Omit<LocalCurrencyState, 'formatUsdCents'>>({
    currency: 'USD', symbol: '$', rate: 1, providerTimestamp: null,
    fetchedAt: null, available: true, loading: true,
  });

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const countryResponse = await fxApi.currencyForCountry(country);
        const currency = countryResponse.data.currency || 'USD';
        const rateResponse = await fxApi.rate(currency);
        if (!active) return;
        setState({
          currency,
          symbol: countryResponse.data.metadata.symbol,
          rate: rateResponse.data.rate ?? null,
          providerTimestamp: rateResponse.data.providerTimestamp ?? null,
          fetchedAt: rateResponse.data.fetchedAt ?? null,
          available: Boolean(rateResponse.data.available && rateResponse.data.rate),
          loading: false,
        });
      } catch {
        if (active) setState((current) => ({ ...current, rate: null, available: false, loading: false }));
      }
    };
    void load();
    return () => { active = false; };
  }, [country]);

  return {
    ...state,
    formatUsdCents: (amountUsdCents) => {
      if (amountUsdCents === null || amountUsdCents === undefined || !state.available || !state.rate) return null;
      return new Intl.NumberFormat('en', { style: 'currency', currency: state.currency, maximumFractionDigits: 2 })
        .format((Number(amountUsdCents) / 100) * state.rate);
    },
  };
}