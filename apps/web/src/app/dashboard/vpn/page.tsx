'use client';

import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Globe2, MonitorSmartphone, ShieldCheck, ShoppingBag } from 'lucide-react';
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

type SessionSummary = {
  status: string;
  reference?: string;
  chargeUsdCents?: number;
};

function extractReference(payload: unknown) {
  if (!payload || typeof payload !== 'object') return undefined;
  const record = payload as Record<string, unknown>;
  for (const key of ['reference', 'id', 'sessionId', 'session_id', 'clientId']) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number') return String(value);
  }
  return undefined;
}

export default function VpnPage() {
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [history, setHistory] = useState<LedgerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [lastSession, setLastSession] = useState<SessionSummary | null>(null);
  const [form, setForm] = useState({
    deviceName: 'Primary device',
    region: 'United States',
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
        setHistory(nextLedger.filter((item: LedgerItem) => item.type === 'vpn_purchase'));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const secureTunnelChannel = useMemo(
    () => catalog.find((item) => item.id === 'wireguard'),
    [catalog],
  );

  const requestSession = async () => {
    setSubmitting(true);
    try {
      const response = await integrationsApi.vpnSession({
        deviceName: form.deviceName,
        region: form.region.trim() || undefined,
        idempotencyKey: crypto.randomUUID(),
      });

      if (response.data?.status !== 'submitted') {
        toast.error('Secure tunnel session creation is not available right now.');
        return;
      }

      setLastSession({
        status: 'Submitted',
        reference: extractReference(response.data?.data),
        chargeUsdCents: response.data?.walletDebitedUsdCents,
      });
      toast.success('Secure tunnel session requested.');
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message || 'Unable to create the secure tunnel session.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <section className="rounded-[1.7rem] border border-white/8 bg-brand-card p-5 md:p-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-green">BP Secure Tunnel</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Protected session requests with device and region assignment.</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/54">
          Request a secure tunnel session, attach it to a device label, and keep purchase and status history in one account surface without exposing private configuration details in the UI.
        </p>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_22rem]">
        <div className="rounded-[1.5rem] border border-white/8 bg-brand-card p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm text-white/68">
              Device name
              <input
                value={form.deviceName}
                onChange={(event) => setForm((current) => ({ ...current, deviceName: event.target.value }))}
                className="bp-input mt-2"
                maxLength={80}
                placeholder="Primary device"
              />
            </label>

            <label className="block text-sm text-white/68">
              Preferred region
              <input
                value={form.region}
                onChange={(event) => setForm((current) => ({ ...current, region: event.target.value }))}
                className="bp-input mt-2"
                maxLength={80}
                placeholder="United States"
              />
            </label>
          </div>

          <div className="mt-5 rounded-[1.2rem] border border-brand-green/18 bg-brand-green/[0.05] p-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-brand-green">Session scope</p>
            <p className="mt-2 text-sm text-white/72">
              {form.deviceName || 'Primary device'} targeting {form.region || 'the default region'}.
            </p>
            <p className="mt-3 text-sm leading-6 text-white/52">
              Dedicated device assignment and region preferences are stored on the account side. Sensitive tunnel credentials stay server-controlled until an approved delivery path is configured.
            </p>
          </div>

          <button
            type="button"
            onClick={requestSession}
            disabled={submitting}
            className="mt-5 inline-flex min-h-12 items-center justify-center rounded-[1rem] bg-brand-green px-5 text-xs font-semibold uppercase tracking-[0.16em] text-black transition hover:bg-[#1cffac] disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Request Secure Tunnel Session'}
          </button>
        </div>

        <aside className="space-y-4">
          <div className="rounded-[1.5rem] border border-white/8 bg-brand-card p-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-green">Session channel</p>
            <div className="mt-4 rounded-[1rem] border border-white/8 bg-[#020806]/20 p-4">
              <p className="text-sm font-semibold text-white">Control plane</p>
              <p className="mt-2 text-sm text-white/52">
                {secureTunnelChannel?.status === 'configured' ? 'Ready' : secureTunnelChannel?.status === 'partial' ? 'Needs attention' : 'Unavailable'}
              </p>
            </div>

            {lastSession ? (
              <div className="mt-4 rounded-[1rem] border border-brand-green/18 bg-brand-green/[0.05] p-4">
                <p className="text-sm font-semibold text-white">Latest request</p>
                <p className="mt-2 text-sm text-white/60">Status: {lastSession.status}</p>
                <p className="mt-1 text-sm text-white/60">Reference: {lastSession.reference || 'Pending assignment'}</p>
              </div>
            ) : null}
          </div>

          <div className="rounded-[1.5rem] border border-white/8 bg-brand-card p-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-green">Recent secure tunnel activity</p>
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
                        <p className="text-sm font-semibold text-white">{item.description || 'Secure tunnel session'}</p>
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
                  title="No secure tunnel sessions yet"
                  text="Requested sessions will appear here once the billing ledger records them."
                />
              </div>
            )}
          </div>
        </aside>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          {
            icon: ShieldCheck,
            title: 'Protected by default',
            text: 'Session requests stay tied to the authenticated account and do not expose internal control-plane details to the customer surface.',
          },
          {
            icon: MonitorSmartphone,
            title: 'Device assignment',
            text: 'Label the device clearly so support, billing, and renewal actions stay attached to the correct session.',
          },
          {
            icon: Globe2,
            title: 'Region-aware setup',
            text: 'Use region preferences where available and open support when location, status, or delivery needs review.',
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
