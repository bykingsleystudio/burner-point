'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  CreditCard,
  PhoneCall,
  RefreshCw,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import { billingApi } from '@/lib/api';
import { formatNgnKobo, formatUsdCents } from '@/lib/money';

type BillingOverview = {
  wallet: {
    balanceUsdCents: number;
    lockedBalanceUsdCents: number;
    displayCurrency: 'USD';
    localDisplay: {
      currency: 'NGN';
      amountKobo: number;
      fxRateNgnPerUsd: number;
    };
    fundingMethods: Array<{
      id: 'paystack' | 'flutterwave' | 'nowpayments';
      label: string;
      description: string;
    }>;
  };
  callCredits: {
    balance: number;
    lockedBalance: number;
    availableBalance: number;
    equivalentUsdCents: number;
    lifetimePurchased: number;
    lifetimeSpent: number;
  };
  callCreditTransactions: Array<{
    id: string;
    type: string;
    creditsAmount: number;
    description: string | null;
    relatedEntityId: string | null;
    createdAt: string | null;
  }>;
  subscriptions: Array<{
    id: string;
    provider: string;
    productId: string | null;
    status: string;
    willRenew: boolean;
    renewsAt: string | null;
  }>;
  walletTransactions: Array<{
    id: string;
    type: string;
    status: string;
    amountUsdCents: number;
    description: string | null;
    gateway: string | null;
    createdAt: string | null;
  }>;
  notes: {
    mobileSubscriptions: string;
    webSubscriptions: string;
    walletSeparation: string;
    callCreditsUsage: string;
    subscriptionsSeparation: string;
  };
};

export default function BillingPage() {
  const [overview, setOverview] = useState<BillingOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadOverview = async () => {
    try {
      const response = await billingApi.overview();
      setOverview(response.data as BillingOverview);
    } catch {
      toast.error('Unable to load billing overview.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadOverview();
  }, []);

  const refreshOverview = async () => {
    setRefreshing(true);
    await loadOverview();
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="rounded-bp-lg border border-brand-border bg-brand-card p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-green">Billing Model</p>
            <h1 className="mt-2 text-3xl font-black uppercase leading-none text-white md:text-5xl">
              Subscriptions = access
              <br />
              Available Balance = purchases
              <br />
              Call Credits = Messenger calls
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-brand-muted">
              {overview?.notes.walletSeparation ?? 'Your Burner Point wallet is stored in USD and is used for verifications, rentals, eSIMs, proxies, and pay-as-you-go purchases.'}
            </p>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/54">
              {overview?.notes.callCreditsUsage ?? 'Call Credits are used only for BP Messenger international calls and premium voice routes.'}
            </p>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/54">
              {overview?.notes.subscriptionsSeparation ?? 'Subscriptions are billed separately and are not paid from wallet balance or Call Credits.'}
            </p>
          </div>
          <button
            type="button"
            onClick={refreshOverview}
            disabled={refreshing}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-bp border border-white/10 px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white/70 transition hover:border-brand-green/30 hover:text-brand-green disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Billing
          </button>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-bp-lg border border-brand-green/16 bg-brand-green/[0.045] p-5">
          <div className="flex items-center justify-between">
            <Wallet className="h-6 w-6 text-brand-green" />
            <Link href="/dashboard/wallet" className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-green">
              Add Funds
            </Link>
          </div>
          <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.22em] text-brand-green">Available Balance</p>
          <h2 className="mt-2 font-mono text-4xl font-black text-white">
            {loading ? '...' : formatUsdCents(overview?.wallet.balanceUsdCents)}
          </h2>
          <p className="mt-2 text-sm text-white/58">
            {loading ? 'Loading local display...' : `${formatNgnKobo(overview?.wallet.localDisplay.amountKobo)} local estimate`}
          </p>
          <p className="mt-4 text-xs leading-6 text-white/46">
            Locked: {loading ? '...' : formatUsdCents(overview?.wallet.lockedBalanceUsdCents)}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/dashboard/wallet" className="bp-primary-action inline-flex min-h-11 items-center gap-2 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em]">
              Add Funds
            </Link>
            <a href="#wallet-history" className="inline-flex min-h-11 items-center gap-2 rounded-bp border border-white/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white/70 transition hover:border-brand-green/30 hover:text-brand-green">
              View Wallet History
            </a>
          </div>
        </article>

        <article className="rounded-bp-lg border border-brand-border bg-brand-card p-5">
          <div className="flex items-center justify-between">
            <PhoneCall className="h-6 w-6 text-brand-green" />
            <Link href="/dashboard/messenger" className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-green">
              Open Messenger
            </Link>
          </div>
          <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.22em] text-brand-green">Call Credits</p>
          <h2 className="mt-2 font-mono text-4xl font-black text-white">
            {loading ? '...' : `${overview?.callCredits.balance ?? 0}`}
          </h2>
          <p className="mt-2 text-sm text-white/58">
            {loading ? 'Loading call credit value...' : `${formatUsdCents(overview?.callCredits.equivalentUsdCents)} equivalent`}
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {[
              { label: 'Available', value: `${overview?.callCredits.availableBalance ?? 0}` },
              { label: 'Locked', value: `${overview?.callCredits.lockedBalance ?? 0}` },
              { label: 'Lifetime Spent', value: `${overview?.callCredits.lifetimeSpent ?? 0}` },
            ].map((item) => (
              <div key={item.label} className="rounded-bp border border-white/8 bg-[#020806]/20 p-4">
                <p className="text-[11px] uppercase tracking-[0.12em] text-white/38">{item.label}</p>
                <p className="mt-2 text-lg font-semibold text-white">{loading ? '...' : item.value}</p>
              </div>
            ))}
          </div>
          <p className="mt-5 text-xs leading-6 text-white/46">
            Buy and manage Call Credits inside BP Messenger when you need outbound international calling.
          </p>
        </article>
      </section>

      <section id="wallet-history" className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <article className="rounded-bp-lg border border-brand-border bg-brand-card p-5">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-brand-green" />
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-white">Wallet History</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-brand-muted">
            Wallet balance directly pays for BP Verify Hub, Rentals, eSIM, Proxy Store, dedicated VPN IP purchases, and renewals.
          </p>
          <div className="mt-5 space-y-3">
            {(overview?.walletTransactions ?? []).slice(0, 10).map((item) => (
              <div key={item.id} className="rounded-bp border border-white/8 bg-[#020806]/20 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase text-white">{item.description ?? item.type}</p>
                    <p className="mt-1 text-[11px] text-white/40">
                      {item.gateway ?? 'wallet'} • {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Pending'}
                    </p>
                  </div>
                  <p className="font-mono text-sm text-brand-green">{formatUsdCents(item.amountUsdCents)}</p>
                </div>
              </div>
            ))}
            {!overview?.walletTransactions?.length ? (
              <div className="rounded-bp border border-white/8 bg-[#020806]/20 p-6 text-sm text-white/48">
                No wallet activity has been recorded yet.
              </div>
            ) : null}
          </div>
        </article>

        <article className="rounded-bp-lg border border-brand-border bg-brand-card p-5">
          <div className="flex items-center gap-2">
            <PhoneCall className="h-5 w-5 text-brand-green" />
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-white">Call Credit Activity</h2>
          </div>
          <div className="mt-5 space-y-3">
            {(overview?.callCreditTransactions ?? []).slice(0, 8).map((item) => (
              <div key={item.id} className="rounded-bp border border-white/8 bg-[#020806]/20 p-4">
                <p className="text-sm font-semibold uppercase text-white">{item.description ?? item.type}</p>
                <p className="mt-2 font-mono text-sm text-brand-green">{item.creditsAmount} call credits</p>
                <p className="mt-1 text-[11px] text-white/40">
                  {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Pending'}
                </p>
              </div>
            ))}
            {!overview?.callCreditTransactions?.length ? (
              <div className="rounded-bp border border-white/8 bg-[#020806]/20 p-6 text-sm text-white/48">
                No call credit activity has been recorded yet.
              </div>
            ) : null}
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <article className="rounded-bp-lg border border-brand-border bg-brand-card p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-brand-green" />
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-white">Subscriptions</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-brand-muted">
            {overview?.notes.mobileSubscriptions ?? 'Subscriptions are billed separately through Apple App Store or Google Play.'}
            {' '}
            {overview?.notes.webSubscriptions ?? 'Subscriptions are billed separately through Paddle.'}
          </p>
          <div className="mt-5 space-y-3">
            {(overview?.subscriptions ?? []).length ? (overview?.subscriptions ?? []).map((subscription) => (
              <div key={subscription.id} className="rounded-bp border border-white/8 bg-[#020806]/20 p-4">
                <p className="text-sm font-semibold uppercase text-white">{subscription.productId ?? 'Subscription'}</p>
                <p className="mt-1 text-xs text-white/46">
                  {subscription.provider} • {subscription.status} • {subscription.willRenew ? 'auto-renew on' : 'auto-renew off'}
                </p>
                <p className="mt-2 text-xs text-white/46">
                  {subscription.renewsAt ? `Renews ${new Date(subscription.renewsAt).toLocaleDateString()}` : 'Renewal pending'}
                </p>
              </div>
            )) : (
              <div className="rounded-bp border border-white/8 bg-[#020806]/20 p-6 text-sm text-white/48">
                No recurring subscription is active yet.
              </div>
            )}
          </div>
        </article>

        <article className="rounded-bp-lg border border-brand-border bg-brand-card p-5">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-brand-green" />
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-white">Funding Methods</h2>
          </div>
          <div className="mt-5 grid gap-3">
            {(overview?.wallet.fundingMethods ?? []).map((method) => (
              <div key={method.id} className="rounded-bp border border-white/8 bg-[#020806]/20 p-4">
                <p className="text-sm font-semibold uppercase text-white">{method.label}</p>
                <p className="mt-2 text-sm leading-6 text-white/50">{method.description}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
