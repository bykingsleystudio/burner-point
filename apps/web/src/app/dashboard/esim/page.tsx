'use client';

import { useEffect, useMemo, useState } from 'react';
import { getCountryDataList, getEmojiFlag } from 'countries-list';
import toast from 'react-hot-toast';
import { Globe2, QrCode, ShoppingBag, Smartphone } from 'lucide-react';
import { BpEmptyState } from '@/components/design-system';
import { integrationsApi, walletApi } from '@/lib/api';

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

type PlanCard = {
  id: string;
  name: string;
  priceUsdCents: number;
  currency: string;
  coverage: string;
  dataAmount: string;
  duration: string;
};

type OrderSummary = {
  status: string;
  reference?: string;
  chargeUsdCents?: number;
};

const COUNTRIES = getCountryDataList()
  .map((item) => ({ code: item.iso2, name: item.name, flag: getEmojiFlag(item.iso2) }))
  .sort((left, right) => left.name.localeCompare(right.name));

function extractCollection(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    for (const key of ['plans', 'items', 'results', 'data']) {
      const value = record[key];
      if (Array.isArray(value)) return value;
      if (value && typeof value === 'object') {
        const nested = extractCollection(value);
        if (nested.length) return nested;
      }
    }
  }
  return [];
}

function extractString(record: Record<string, unknown>, keys: string[], fallback: string) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number') return String(value);
  }
  return fallback;
}

function normalizePlans(payload: unknown, countryLabel: string): PlanCard[] {
  return extractCollection(payload)
    .map((item, index) => {
      if (!item || typeof item !== 'object') return null;
      const record = item as Record<string, unknown>;
      return {
        id: extractString(record, ['id', 'planId', 'slug', 'package_id'], `plan-${index + 1}`),
        name: extractString(record, ['name', 'title', 'package_name'], `Plan ${index + 1}`),
        priceUsdCents: Number(record.priceUsdCents ?? 0),
        currency: extractString(record, ['currency'], 'USD'),
        coverage: extractString(record, ['country', 'coverage', 'region', 'operator'], countryLabel),
        dataAmount: extractString(record, ['data', 'dataAmount', 'gb', 'volume'], 'See plan details'),
        duration: extractString(record, ['duration', 'validity', 'days'], 'See plan details'),
      };
    })
    .filter((item): item is PlanCard => Boolean(item));
}

function extractReference(payload: unknown) {
  if (!payload || typeof payload !== 'object') return undefined;
  const record = payload as Record<string, unknown>;
  for (const key of ['reference', 'id', 'orderId', 'order_id', 'iccid']) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number') return String(value);
  }
  return undefined;
}

export default function EsimPage() {
  const [countryCode, setCountryCode] = useState('US');
  const [region, setRegion] = useState('');
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [history, setHistory] = useState<LedgerItem[]>([]);
  const [plans, setPlans] = useState<PlanCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [orderingPlanId, setOrderingPlanId] = useState<string | null>(null);
  const [lastOrder, setLastOrder] = useState<OrderSummary | null>(null);
  const [walletBalanceCents, setWalletBalanceCents] = useState(0);

  useEffect(() => {
    let mounted = true;

    Promise.allSettled([integrationsApi.catalog(), integrationsApi.esimOrders(), walletApi.balance()])
      .then((results) => {
        if (!mounted) return;
        const nextCatalog = results[0].status === 'fulfilled' && Array.isArray(results[0].value.data)
          ? results[0].value.data
          : [];
        const nextOrders = results[1].status === 'fulfilled' && Array.isArray(results[1].value.data)
          ? results[1].value.data
          : [];
        setCatalog(nextCatalog);
        if (results[2].status === 'fulfilled') {
          const wallet = results[2].value.data?.wallet ?? results[2].value.data;
          setWalletBalanceCents(Number(wallet?.availableUsdCents ?? wallet?.balanceUsdCents ?? 0));
        }
        setHistory(nextOrders.map((item: Record<string, unknown>) => ({
          id: String(item.id),
          type: 'esim_purchase',
          description: typeof item.planName === 'string' ? item.planName : 'eSIM order',
          referenceId: typeof item.providerOrderId === 'string' ? item.providerOrderId : undefined,
          createdAt: typeof item.createdAt === 'string' ? item.createdAt : undefined,
        })));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const selectedCountry = useMemo(
    () => COUNTRIES.find((item) => item.code === countryCode),
    [countryCode],
  );

  const esimChannel = catalog.find((item) => item.id === 'airalo');
  const channelStatus = esimChannel?.status === 'configured'
    ? 'Ready'
    : esimChannel?.status === 'partial'
      ? 'Needs attention'
      : 'Unavailable';

  const loadPlans = async () => {
    setSearching(true);
    try {
      const response = await integrationsApi.esimPlans({
        countryCode,
        region: region.trim() || undefined,
      });

      if (response.data?.status === 'not_configured') {
        setPlans([]);
        toast.error('eSIM plan lookup is not available right now.');
        return;
      }

      const nextPlans = normalizePlans(
        response.data?.data ?? response.data,
        selectedCountry?.name || countryCode,
      );
      setPlans(nextPlans);
      if (!nextPlans.length) {
        toast('No plans were returned for the selected destination.');
      }
    } catch {
      toast.error('Unable to load eSIM plans right now.');
    } finally {
      setSearching(false);
    }
  };

  const purchasePlan = async (planId: string) => {
    setOrderingPlanId(planId);
    try {
      const response = await integrationsApi.esimOrder({
        planId,
        countryCode,
        idempotencyKey: crypto.randomUUID(),
      });
      if (!response.data?.id || response.data?.status === 'failed' || response.data?.status === 'refunded') {
        toast.error('eSIM checkout is not available right now.');
        return;
      }

      const summary: OrderSummary = {
        status: response.data.status || 'provisioning',
        reference: extractReference(response.data),
        chargeUsdCents: response.data.priceUsdCents,
      };
      setLastOrder(summary);
      toast.success('eSIM order submitted.');
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message || 'Unable to submit the eSIM order.');
    } finally {
      setOrderingPlanId(null);
    }
  };

  return (
    <div className="space-y-5">
      <section className="rounded-[1.7rem] border border-white/8 bg-brand-card p-5 md:p-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-green">BP eSIM Store</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Travel data search, purchase, and order visibility.</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/54">
          Search destination-ready plans, submit purchases from your Burner Point account, and keep activation support tied to one order history.
        </p>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_22rem]">
        <div className="rounded-[1.5rem] border border-white/8 bg-brand-card p-5">
          <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
            <label className="block text-sm text-white/68">
              Destination
              <select value={countryCode} onChange={(event) => setCountryCode(event.target.value)} className="bp-input mt-2">
                {COUNTRIES.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.flag} {item.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm text-white/68">
              Region
              <input
                value={region}
                onChange={(event) => setRegion(event.target.value)}
                className="bp-input mt-2"
                maxLength={80}
                placeholder="Optional region or operator"
              />
            </label>

            <div className="flex items-end">
              <button
                type="button"
                onClick={loadPlans}
                disabled={searching}
                className="inline-flex min-h-12 w-full items-center justify-center rounded-[1rem] bg-brand-green px-5 text-xs font-semibold uppercase tracking-[0.16em] text-black transition hover:bg-[#1cffac] disabled:opacity-50"
              >
                {searching ? 'Loading...' : 'Load Plans'}
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {plans.length ? (
              plans.map((plan) => (
                <article key={plan.id} className="rounded-[1.2rem] border border-white/8 bg-[#020806]/20 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-white">{plan.name}</p>
                      <p className="mt-1 text-sm text-white/46">{plan.coverage}</p>
                    </div>
                    <QrCode className="h-5 w-5 text-brand-green" />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-white/60">
                    <div className="rounded-[0.95rem] border border-white/8 bg-[#020806]/24 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-[0.12em] text-white/36">Data</p>
                      <p className="mt-2 text-white">{plan.dataAmount}</p>
                    </div>
                    <div className="rounded-[0.95rem] border border-white/8 bg-[#020806]/24 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-[0.12em] text-white/36">Duration</p>
                      <p className="mt-2 text-white">{plan.duration}</p>
                    </div>
                  </div>
                  <p className="mt-4 font-mono text-sm text-brand-green">
                    {plan.currency} {(plan.priceUsdCents / 100).toFixed(2)}
                  </p>
                  <p className="mt-2 text-xs text-white/42">
                    Wallet available: ${(walletBalanceCents / 100).toFixed(2)}
                  </p>
                  <button
                    type="button"
                    onClick={() => purchasePlan(plan.id)}
                    disabled={Boolean(orderingPlanId)}
                    className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-[0.95rem] bg-brand-green px-4 text-xs font-semibold uppercase tracking-[0.12em] text-black transition hover:bg-[#1cffac] disabled:opacity-50"
                  >
                    {orderingPlanId === plan.id ? 'Submitting...' : 'Buy eSIM'}
                  </button>
                </article>
              ))
            ) : (
              <div className="md:col-span-2 xl:col-span-3">
                <BpEmptyState
                  title="No plans loaded"
                  text="Search a destination to pull the current plan catalog into the store."
                />
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-[1.5rem] border border-white/8 bg-brand-card p-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-green">Plan channel</p>
            <div className="mt-4 rounded-[1.2rem] border border-brand-green/18 bg-brand-green/[0.05] p-4">
              <p className="text-sm text-white/58">Availability</p>
              <p className="mt-2 text-lg font-semibold text-white">{channelStatus}</p>
              <p className="mt-3 text-sm leading-6 text-white/52">
                Plan lookup and order submission stay behind Burner Point account controls and do not expose provider credentials to the client.
              </p>
            </div>

            {lastOrder ? (
              <div className="mt-4 rounded-[1.2rem] border border-white/8 bg-[#020806]/20 p-4">
                <p className="text-sm font-semibold text-white">Latest order</p>
                <p className="mt-2 text-sm text-white/60">Status: {lastOrder.status}</p>
                <p className="mt-1 text-sm text-white/60">Reference: {lastOrder.reference || 'Pending assignment'}</p>
              </div>
            ) : null}
          </div>

          <div className="rounded-[1.5rem] border border-white/8 bg-brand-card p-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-green">Recent eSIM orders</p>
            {loading ? (
              <div className="mt-4 space-y-3">
                {[1, 2].map((item) => <div key={item} className="h-20 animate-pulse rounded-[1rem] border border-white/8 bg-[#020806]/20" />)}
              </div>
            ) : history.length ? (
              <div className="mt-4 space-y-3">
                {history.slice(0, 5).map((item) => (
                  <div key={item.id} className="rounded-[1rem] border border-white/8 bg-[#020806]/20 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{item.description || 'eSIM order'}</p>
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
                  title="No eSIM orders yet"
                  text="Submitted eSIM purchases will appear here once the billing ledger records them."
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
            title: 'Country filtering',
            text: 'Search by destination first so plan coverage and pricing stay aligned with the trip or backup device.',
          },
          {
            icon: Smartphone,
            title: 'Compatible devices',
            text: 'Use eSIM on compatible devices only. Activation and order status stay visible from the same account surface.',
          },
          {
            icon: QrCode,
            title: 'Activation support',
            text: 'Open a support ticket with the order reference if QR delivery or install status needs review.',
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
