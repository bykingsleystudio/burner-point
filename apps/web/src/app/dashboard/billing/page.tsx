'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { ArrowRight, CalendarDays, CreditCard, FileText, RefreshCw, ShieldCheck } from 'lucide-react';
import { billingApi, paymentsApi, type PaymentGatewayId } from '@/lib/api';
import { formatLegacyAmountPrimary, formatLegacyAmountSecondary, formatStoredKoboAsUsd } from '@/lib/money';

type Plan = {
  id: string;
  slug: string;
  name: string;
  description?: string;
  priceKoboMonthly?: number;
  priceKoboYearly?: number;
  features?: Record<string, unknown>;
};

type Subscription = {
  id?: string;
  status?: string;
  billingCycle?: string;
  currentPeriodEnd?: string;
  plan?: Plan;
};

type LedgerItem = {
  id: string;
  type?: string;
  status?: string;
  amountKobo?: number;
  balanceAfterKobo?: number;
  description?: string;
  gateway?: string;
  referenceId?: string;
  externalReference?: string;
  createdAt?: string;
};

const SUBSCRIPTION_GATEWAYS: Array<{ id: PaymentGatewayId; label: string; text: string }> = [
  { id: 'paddle', label: 'Paddle', text: 'International card and subscription checkout' },
  { id: 'paystack', label: 'Paystack', text: 'Local card path where recurring support is enabled' },
  { id: 'nowpayments', label: 'NOWPayments', text: 'Crypto checkout for supported plans' },
];

export default function BillingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [ledger, setLedger] = useState<LedgerItem[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [gateway, setGateway] = useState<PaymentGatewayId>('paddle');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    let mounted = true;
    Promise.allSettled([
      billingApi.plans(),
      billingApi.subscription(),
      billingApi.ledger(1, 12),
    ]).then((results) => {
      if (!mounted) return;
      const planData = results[0].status === 'fulfilled' ? results[0].value.data : [];
      const subData = results[1].status === 'fulfilled' ? results[1].value.data : null;
      const ledgerData = results[2].status === 'fulfilled' ? results[2].value.data?.transactions ?? [] : [];
      setPlans(planData);
      setSubscription(subData);
      setLedger(ledgerData);
      setSelectedPlanId(subData?.plan?.id ?? planData.find((plan: Plan) => plan.slug !== 'free')?.id ?? planData[0]?.id ?? null);
    }).catch(() => toast.error('Unable to load billing state')).finally(() => {
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const selectedPlan = useMemo(() => plans.find((plan) => plan.id === selectedPlanId) ?? null, [plans, selectedPlanId]);

  const startSubscription = async () => {
    setProcessing(true);
    try {
      const response = await paymentsApi.initialize({
        paymentType: 'subscription',
        gateway,
        planId: selectedPlanId ?? undefined,
        clientPlatform: 'web',
      });
      if (response.data.checkoutUrl) {
        window.location.href = response.data.checkoutUrl;
        return;
      }
      toast.success('Subscription checkout created.');
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message ?? 'Unable to start subscription checkout');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="rounded-bp-lg border border-brand-border bg-brand-card p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-green">Credits and Billing</p>
            <h1 className="mt-2 text-3xl font-black uppercase leading-none text-white md:text-5xl">
              Wallet, subscriptions, and payment history.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-brand-muted">
              Manage verification credits, rental purchases, monthly plans, receipts, and payment history from one controlled billing surface.
            </p>
          </div>
          <Link href="/dashboard/billing" className="bp-primary-action inline-flex min-h-12 items-center justify-center gap-2 px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em]">
            Buy Credits
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.75fr_1.25fr]">
        <div className="rounded-bp-lg border border-brand-green/16 bg-brand-green/[0.045] p-5">
          <ShieldCheck className="h-6 w-6 text-brand-green" />
          <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.22em] text-brand-green">Current subscription</p>
          <h2 className="mt-3 text-xl font-semibold uppercase text-white">
            {subscription?.plan?.name ?? 'No active monthly plan'}
          </h2>
          <p className="mt-3 text-sm leading-6 text-white/62">
            {subscription
              ? `${subscription.status ?? 'active'} - ${subscription.billingCycle ?? 'monthly'}${subscription.currentPeriodEnd ? ` - renews ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}` : ''}`
              : 'Start a monthly plan when you need renewable number access, continuity, and account recovery support.'}
          </p>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <div className="rounded-bp border border-white/8 bg-black/20 p-3">
              <p className="font-mono text-lg text-brand-green">$15.99</p>
              <p className="text-[10px] uppercase text-white/38">monthly target</p>
            </div>
            <div className="rounded-bp border border-white/8 bg-black/20 p-3">
              <p className="font-mono text-lg text-brand-green">Protected</p>
              <p className="text-[10px] uppercase text-white/38">checkout</p>
            </div>
          </div>
        </div>

        <div className="rounded-bp-lg border border-brand-border bg-brand-card p-5">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-brand-green" />
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-white">Subscription management</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-brand-muted">
            Choose a plan, pick a payment option, and keep your monthly access, receipts, and renewal timing easy to track.
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {loading ? (
              [1, 2, 3].map((item) => <div key={item} className="h-36 animate-pulse rounded-bp border border-brand-border bg-black/20" />)
            ) : (
              plans.map((plan) => {
                const selected = selectedPlanId === plan.id;
                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`rounded-bp-lg border p-4 text-left transition ${
                      selected ? 'border-brand-green bg-brand-green/10' : 'border-brand-border bg-black/18 hover:border-brand-green/30'
                    }`}
                  >
                    <p className="text-sm font-semibold uppercase text-white">{plan.name}</p>
                    <p className="mt-2 font-mono text-2xl text-brand-green">{formatStoredKoboAsUsd(plan.priceKoboMonthly)}</p>
                    <p className="mt-2 text-xs leading-5 text-brand-muted">{plan.description ?? 'Monthly privacy and telecom access plan.'}</p>
                  </button>
                );
              })
            )}
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {SUBSCRIPTION_GATEWAYS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setGateway(item.id)}
                className={`rounded-bp border p-3 text-left transition ${
                  gateway === item.id ? 'border-brand-green bg-brand-green/10 text-brand-green' : 'border-white/10 text-white/62 hover:border-brand-green/30 hover:text-white'
                }`}
              >
                <p className="text-xs font-semibold uppercase">{item.label}</p>
                <p className="mt-1 text-[11px] leading-4 text-white/42">{item.text}</p>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={startSubscription}
            disabled={processing || !selectedPlan}
            className="bp-primary-action mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 px-6 py-4 text-sm font-semibold uppercase tracking-[0.16em] disabled:opacity-50 md:w-auto"
          >
            {processing ? 'Opening checkout...' : 'Start Monthly Plan'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      <section className="rounded-bp-lg border border-brand-border bg-brand-card p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-green">Transaction history</p>
            <h2 className="mt-2 text-lg font-semibold uppercase text-white">Ledger and receipts</h2>
          </div>
          <Link href="/dashboard/support" className="inline-flex min-h-11 items-center justify-center rounded-bp border border-white/10 px-4 py-2 text-xs font-semibold uppercase text-white/70 transition hover:border-brand-green/30 hover:text-brand-green">
            Billing Support
          </Link>
        </div>

        <div className="mt-5 overflow-hidden rounded-bp-lg border border-white/8">
          {loading ? (
            <div className="space-y-2 p-4">
              {[1, 2, 3].map((item) => <div key={item} className="h-14 animate-pulse rounded-bp bg-black/24" />)}
            </div>
          ) : ledger.length ? (
            <div className="divide-y divide-white/7">
              {ledger.map((item) => (
                <div key={item.id} className="grid gap-3 p-4 md:grid-cols-[1fr_auto_auto] md:items-center">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-bp border border-brand-green/18 bg-brand-green/8">
                      <FileText className="h-4 w-4 text-brand-green" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold uppercase text-white">{item.description ?? item.type ?? 'Wallet transaction'}</p>
                      <p className="mt-1 font-mono text-[11px] text-white/40">{item.referenceId ?? item.externalReference ?? item.id}</p>
                    </div>
                  </div>
                  <div className="text-sm text-white/62 md:text-right">
                    <p className="font-mono text-brand-green">{formatLegacyAmountPrimary(item)}</p>
                    <p className="mt-1 text-[11px] text-white/36">{formatLegacyAmountSecondary(item)}</p>
                    <p className="text-[11px] uppercase">{item.gateway ?? 'ledger'} - {item.status ?? 'recorded'}</p>
                  </div>
                  <div className="text-xs text-white/40 md:text-right">
                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Pending date'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center">
              <CreditCard className="mx-auto h-8 w-8 text-brand-muted" />
              <p className="mt-3 text-sm text-brand-muted">No billing history yet. Purchases and confirmed credits will appear here.</p>
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        {[
          ['Credits', 'Wallet balance funds verifications, rentals, eSIM, proxies, and renewals across your account.'],
          ['Rentals', 'Rental purchases stay visible with billing history, due dates, and support references.'],
          ['Connectivity', 'eSIM, proxy, and secure-tunnel purchases are recorded with billing history and provider references once access is assigned.'],
        ].map(([title, text]) => (
          <article key={title} className="rounded-bp-lg border border-brand-border bg-brand-card p-5">
            <CalendarDays className="h-5 w-5 text-brand-green" />
            <h2 className="mt-4 text-sm font-semibold uppercase tracking-[0.12em] text-white">{title}</h2>
            <p className="mt-3 text-sm leading-6 text-brand-muted">{text}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
