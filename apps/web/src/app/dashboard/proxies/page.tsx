'use client';

import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Globe2, Lock, Radio, ShoppingBag } from 'lucide-react';
import { BpEmptyState } from '@/components/design-system';
import { billingApi, integrationsApi } from '@/lib/api';

type CatalogItem = {
  id: string;
  status?: 'configured' | 'partial' | 'missing_env' | 'planned';
};

type LedgerItem = {
  id: string;
  type?: string;
  description?: string;
  referenceId?: string;
  createdAt?: string;
};

type ProxySummary = {
  status: string;
  reference?: string;
  chargeUsdCents?: number;
};

function extractReference(payload: unknown) {
  if (!payload || typeof payload !== 'object') return undefined;
  const record = payload as Record<string, unknown>;
  for (const key of ['reference', 'id', 'orderId', 'order_id', 'username']) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number') return String(value);
  }
  return undefined;
}

export default function ProxiesPage() {
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [history, setHistory] = useState<LedgerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [lastOrder, setLastOrder] = useState<ProxySummary | null>(null);
  const [form, setForm] = useState({
    region: 'United States',
    type: 'residential' as 'residential' | 'mobile',
    durationDays: 30,
  });

  useEffect(() => {
    let mounted = true;

    Promise.allSettled([integrationsApi.catalog(), billingApi.ledger(1, 20)])
      .then((results) => {
        if (!mounted) return;
        const nextCatalog = results[0].status === 'fulfilled' && Array.isArray(results[0].value.data)
          ? results[0].value.data
          : [];
        const nextLedger = results[1].status === 'fulfilled'
          ? results[1].value.data?.transactions ?? []
          : [];
        setCatalog(nextCatalog);
        setHistory(nextLedger.filter((item: LedgerItem) => item.type === 'proxy_purchase'));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const primaryChannel = useMemo(
    () => catalog.find((item) => item.id === 'oxylabs'),
    [catalog],
  );
  const fallbackChannel = useMemo(
    () => catalog.find((item) => item.id === 'smartproxy'),
    [catalog],
  );

  const submitOrder = async () => {
    setSubmitting(true);
    try {
      const response = await integrationsApi.proxyOrder(form);
      if (response.data?.status !== 'submitted') {
        toast.error('Proxy ordering is not available right now.');
        return;
      }

      setLastOrder({
        status: 'Submitted',
        reference: extractReference(response.data?.data),
        chargeUsdCents: response.data?.walletDebitedUsdCents,
      });
      toast.success('Proxy order submitted.');
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message || 'Unable to submit the proxy order.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <section className="rounded-[1.7rem] border border-white/8 bg-brand-card p-5 md:p-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-green">BP Proxy Store</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Approved routing access with clear purchase controls.</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/54">
          Choose a region, proxy type, and duration, then submit the order from your Burner Point wallet. Setup and support stay inside your account history.
        </p>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_22rem]">
        <div className="rounded-[1.5rem] border border-white/8 bg-brand-card p-5">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="block text-sm text-white/68">
              Region
              <input
                value={form.region}
                onChange={(event) => setForm((current) => ({ ...current, region: event.target.value }))}
                className="bp-input mt-2"
                maxLength={80}
                placeholder="United States"
              />
            </label>

            <label className="block text-sm text-white/68">
              Proxy type
              <select
                value={form.type}
                onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as 'residential' | 'mobile' }))}
                className="bp-input mt-2"
              >
                <option value="residential">Residential</option>
                <option value="mobile">Mobile</option>
              </select>
            </label>

            <label className="block text-sm text-white/68">
              Duration
              <select
                value={String(form.durationDays)}
                onChange={(event) => setForm((current) => ({ ...current, durationDays: Number(event.target.value) }))}
                className="bp-input mt-2"
              >
                {[7, 30, 90].map((days) => (
                  <option key={days} value={String(days)}>{days} days</option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-5 rounded-[1.2rem] border border-brand-green/18 bg-brand-green/[0.05] p-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-brand-green">Order summary</p>
            <p className="mt-2 text-sm text-white/72">
              {form.type === 'mobile' ? 'Mobile proxy routing' : 'Residential proxy routing'} for {form.region} over {form.durationDays} days.
            </p>
            <p className="mt-3 text-sm leading-6 text-white/52">
              Proxy access is for lawful, approved use cases only and remains subject to Burner Point acceptable use and provider availability.
            </p>
          </div>

          <button
            type="button"
            onClick={submitOrder}
            disabled={submitting}
            className="mt-5 inline-flex min-h-12 items-center justify-center rounded-[1rem] bg-brand-green px-5 text-xs font-semibold uppercase tracking-[0.16em] text-black transition hover:bg-[#1cffac] disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Create Proxy Order'}
          </button>
        </div>

        <aside className="space-y-4">
          <div className="rounded-[1.5rem] border border-white/8 bg-brand-card p-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-green">Order channels</p>
            <div className="mt-4 space-y-3">
              <div className="rounded-[1rem] border border-white/8 bg-black/20 p-4">
                <p className="text-sm font-semibold text-white">Primary order path</p>
                <p className="mt-2 text-sm text-white/52">
                  {primaryChannel?.status === 'configured' ? 'Ready' : primaryChannel?.status === 'partial' ? 'Needs attention' : 'Unavailable'}
                </p>
              </div>
              <div className="rounded-[1rem] border border-white/8 bg-black/20 p-4">
                <p className="text-sm font-semibold text-white">Fallback routing</p>
                <p className="mt-2 text-sm text-white/52">
                  {fallbackChannel?.status === 'configured' ? 'Ready' : fallbackChannel?.status === 'partial' ? 'Needs attention' : 'Unavailable'}
                </p>
              </div>
            </div>

            {lastOrder ? (
              <div className="mt-4 rounded-[1rem] border border-brand-green/18 bg-brand-green/[0.05] p-4">
                <p className="text-sm font-semibold text-white">Latest order</p>
                <p className="mt-2 text-sm text-white/60">Status: {lastOrder.status}</p>
                <p className="mt-1 text-sm text-white/60">Reference: {lastOrder.reference || 'Pending assignment'}</p>
              </div>
            ) : null}
          </div>

          <div className="rounded-[1.5rem] border border-white/8 bg-brand-card p-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-green">Recent proxy orders</p>
            {loading ? (
              <div className="mt-4 space-y-3">
                {[1, 2].map((item) => <div key={item} className="h-20 animate-pulse rounded-[1rem] border border-white/8 bg-black/20" />)}
              </div>
            ) : history.length ? (
              <div className="mt-4 space-y-3">
                {history.slice(0, 5).map((item) => (
                  <div key={item.id} className="rounded-[1rem] border border-white/8 bg-black/20 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{item.description || 'Proxy order'}</p>
                        <p className="mt-1 font-mono text-[11px] text-brand-green">{item.referenceId || item.id}</p>
                      </div>
                      <ShoppingBag className="h-4 w-4 text-brand-green" />
                    </div>
                    <p className="mt-2 text-xs text-white/42">
                      {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Pending'}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4">
                <BpEmptyState
                  title="No proxy orders yet"
                  text="Proxy purchases will appear here once the ledger records a completed order."
                />
              </div>
            )}
          </div>
        </aside>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          {
            icon: Globe2,
            title: 'Geo selection',
            text: 'Choose the routing region that matches the workflow instead of switching accounts or leaking your primary connection.',
          },
          {
            icon: Radio,
            title: 'Fallback routing',
            text: 'Burner Point can route orders through an alternate approved path when the primary channel is unavailable.',
          },
          {
            icon: Lock,
            title: 'Acceptable use',
            text: 'Use proxy access lawfully and keep abusive, deceptive, or platform-breaking activity out of the order flow.',
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.title} className="rounded-[1.4rem] border border-white/8 bg-brand-card p-5">
              <Icon className="h-5 w-5 text-brand-green" />
              <h2 className="mt-4 text-sm font-semibold uppercase tracking-[0.12em] text-white">{item.title}</h2>
              <p className="mt-3 text-sm leading-6 text-white/50">{item.text}</p>
            </article>
          );
        })}
      </section>
    </div>
  );
}
