'use client';

import { useEffect, useState } from 'react';
import { Activity, ArrowDownLeft, ArrowUpRight, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { billingApi } from '@/lib/api';
import { formatUsdCents } from '@/lib/money';

interface LedgerItem {
  id: string;
  type: string;
  status: string;
  amountUsdCents: number;
  description?: string | null;
  gateway?: string | null;
  createdAt?: string | null;
}

export default function OrdersPage() {
  const [items, setItems] = useState<LedgerItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const { data } = await billingApi.ledger(1, 100);
      setItems(data?.transactions ?? []);
    } catch {
      toast.error('Unable to load activity.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-bp-lg border border-[var(--bp-border-subtle)] bg-[var(--bp-surface)] p-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-accent">Activity</p>
          <h1 className="mt-2 text-3xl font-semibold">Orders and wallet history</h1>
          <p className="mt-2 text-sm text-[var(--bp-foreground-muted)]">Deposits, purchases, refunds, and product activity in one chronological view.</p>
        </div>
        <button type="button" onClick={() => { setLoading(true); void load(); }} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-[var(--bp-border-subtle)] px-4 text-sm font-semibold hover:border-brand-accent/40">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </section>

      <section className="overflow-hidden rounded-bp-lg border border-[var(--bp-border-subtle)] bg-[var(--bp-surface)]">
        {loading ? <div className="p-8 text-sm text-[var(--bp-foreground-muted)]">Loading activity...</div> : items.length ? (
          <div className="divide-y divide-[var(--bp-border-subtle)]">
            {items.map((item) => {
              const incoming = ['deposit', 'refund', 'wallet_release'].includes(item.type);
              return (
                <div key={item.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${incoming ? 'bg-brand-accent/10 text-brand-accent' : 'bg-[var(--bp-surface-muted)] text-[var(--bp-foreground-muted)]'}`}>
                      {incoming ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{item.description || item.type.replace(/_/g, ' ')}</p>
                      <p className="mt-1 text-xs text-[var(--bp-foreground-muted)]">{item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Pending'}{item.gateway ? ` · ${item.gateway}` : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <span className="text-xs capitalize text-[var(--bp-foreground-muted)]">{item.status.replace(/_/g, ' ')}</span>
                    <span className={`font-mono text-sm font-semibold ${incoming ? 'text-brand-accent' : ''}`}>{incoming ? '+' : '-'}{formatUsdCents(item.amountUsdCents)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-10 text-center"><Activity className="mx-auto h-6 w-6 text-[var(--bp-foreground-muted)]" /><p className="mt-3 text-sm font-semibold">No activity yet</p><p className="mt-1 text-sm text-[var(--bp-foreground-muted)]">Your deposits and product purchases will appear here.</p></div>
        )}
      </section>
    </div>
  );
}
