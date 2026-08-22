'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import {
  ArrowUpRight,
  Phone,
  Plus,
  ShieldCheck,
  Wallet,
  Zap,
  Globe,
  Smartphone,
  Shield,
} from 'lucide-react';
import { billingApi, numbersApi, supportApi } from '@/lib/api';
import { formatUsdCents } from '@/lib/money';
import { useAuthStore } from '@/store';

type NumberRecord = {
  id: string;
  number: string;
  status?: string;
  type?: string;
  countryCode?: string;
  expiresAt?: string;
  smsReceived?: number;
};
type BillingOverview = {
  wallet?: { balanceUsdCents?: number; lockedBalanceUsdCents?: number };
  subscriptions?: Array<{ id: string; status: string; productId: string | null; renewsAt: string | null }>;
  walletTransactions?: Array<{
    id: string;
    type: string;
    status: string;
    amountUsdCents: number;
    description: string | null;
    createdAt: string | null;
  }>;
};
type SupportTicket = {
  id: string;
  subject: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  updatedAt?: string;
};

function statusLabel(status: string) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusClass(status: string) {
  if (['paid', 'active', 'resolved', 'delivered'].includes(status.toLowerCase()))
    return 'border-brand-accent/25 bg-brand-accent/10 text-brand-accent';
  if (['failed', 'expired', 'closed'].includes(status.toLowerCase()))
    return 'border-red-300/25 bg-red-400/10 text-red-200';
  return 'border-[#9FA6B2]/25 bg-[#9FA6B2]/10 text-[var(--bp-foreground-muted)]';
}

function formatDate(value?: string | null) {
  return value ? formatDistanceToNow(new Date(value), { addSuffix: true }) : 'Date unavailable';
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-md bg-[var(--bp-surface-raised)] ${className}`} />;
}

function EmptyState({
  title,
  text,
  href,
  action,
}: {
  title: string;
  text: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="border-t border-[var(--bp-border-subtle)] py-8">
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-2 max-w-md text-sm leading-6 text-[var(--bp-foreground-muted)]">{text}</p>
      {href && action ? (
        <Link
          href={href}
          className="mt-4 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-brand-accent hover:text-brand-accent/80"
        >
          <ArrowUpRight className="h-4 w-4" />
          {action}
        </Link>
      ) : null}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [billing, setBilling] = useState<BillingOverview | null>(null);
  const [numbers, setNumbers] = useState<NumberRecord[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let mounted = true;
    Promise.allSettled([billingApi.overview(), numbersApi.list(), supportApi.tickets()])
      .then(async ([billingResult, numbersResult, ticketsResult]) => {
        if (!mounted) return;
        const nextNumbers =
          numbersResult.status === 'fulfilled' && Array.isArray(numbersResult.value.data)
            ? (numbersResult.value.data as NumberRecord[])
            : [];
        setBilling(billingResult.status === 'fulfilled' ? (billingResult.value.data as BillingOverview) : null);
        setNumbers(nextNumbers);
        setTickets(
          ticketsResult.status === 'fulfilled' && Array.isArray(ticketsResult.value.data)
            ? (ticketsResult.value.data as SupportTicket[])
            : []
        );
        setLoadError([billingResult, numbersResult, ticketsResult].every((result) => result.status === 'rejected'));
      })
      .catch(() => {
        if (mounted) setLoadError(true);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  }, []);
  const activeNumbers = numbers.filter((item) => item.status === 'active');
  const transactions = billing?.walletTransactions?.slice(0, 5) ?? [];
  const openTickets = tickets.filter((ticket) => ['open', 'in_progress'].includes(ticket.status));
  const firstName = user?.firstName || 'there';

  return (
    <div className="space-y-6">
      <section className="rounded-[1.5rem] border border-[var(--bp-border-subtle)] bg-[var(--bp-surface)] p-5 shadow-[var(--bp-shadow-card)] sm:p-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-brand-green">Burner Point / Overview</p>
        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">{greeting}, {firstName}.</h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--bp-foreground-muted)]">
              Private communication, connectivity, and verification in one operational platform.
            </p>
          </div>
          <Link href="/dashboard/wallet" className="inline-flex items-center gap-2 self-start rounded-full bg-[rgba(0,255,157,0.1)] px-3 py-2 text-sm font-semibold text-brand-green ring-1 ring-[rgba(0,255,157,0.18)] hover:bg-[rgba(0,255,157,0.14)]">
            <Plus className="h-4 w-4" />
            Add funds
          </Link>
        </div>
      </section>

      <section className="space-y-3 rounded-[1.5rem] border border-[var(--bp-border-subtle)] bg-[var(--bp-surface)] p-4 sm:p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--bp-foreground-muted)]">Available balance</p>
            {loading ? <Skeleton className="mt-2 h-9 w-28" /> : <p className="mt-2 text-3xl font-semibold tracking-[-0.05em]">{formatUsdCents(billing?.wallet?.balanceUsdCents)}</p>}
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[rgba(0,255,157,0.1)] text-brand-green">
            <Wallet className="h-5 w-5" />
          </div>
        </div>

        <div className="flex flex-wrap gap-3 border-t border-[var(--bp-border-subtle)] pt-4">
          <Link href="/dashboard/wallet" className="inline-flex min-h-11 items-center justify-center rounded-full bg-brand-green px-4 text-sm font-semibold text-black">View wallet</Link>
          <Link href="/dashboard/billing" className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--bp-border-subtle)] px-4 text-sm font-semibold text-[var(--bp-foreground)]">Billing</Link>
        </div>

        {billing?.wallet?.lockedBalanceUsdCents ? (
          <p className="text-xs text-[var(--bp-foreground-muted)]">
            {formatUsdCents(billing.wallet.lockedBalanceUsdCents)} currently locked in orders
          </p>
        ) : null}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-brand-green">Quick access</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <QuickActionButton href="/dashboard/verify-hub" icon={ShieldCheck} label="Get verification" />
          <QuickActionButton href="/dashboard/rentals" icon={Phone} label="Rent number" />
          <QuickActionButton href="/dashboard/esim" icon={Smartphone} label="Buy eSIM" />
          <QuickActionButton href="/dashboard/proxies" icon={Globe} label="Buy proxy" />
          <QuickActionButton href="/dashboard/vpn" icon={Shield} label="Secure tunnel" />
          <QuickActionButton href="/dashboard/wallet" icon={Zap} label="Add funds" />
        </div>
      </section>

      <section className="space-y-3 rounded-[1.5rem] border border-[var(--bp-border-subtle)] bg-[var(--bp-surface)] p-4 sm:p-5">
        <div className="flex items-center justify-between gap-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-brand-green">Your Burner Point</p>
          <span className="text-xs text-[var(--bp-foreground-muted)]">{Math.min(activeNumbers.length, 3)} active</span>
        </div>
        {activeNumbers.length > 0 ? (
          activeNumbers.slice(0, 3).map((number) => (
            <div key={number.id} className="bp-row-item">
              <div>
                <p className="font-semibold">{number.number}</p>
                <p className="mt-1 text-sm text-[var(--bp-foreground-muted)]">BP Messenger Pro • Active</p>
                {number.expiresAt ? <p className="mt-1 text-xs text-[var(--bp-foreground-muted)]">Expires {formatDate(number.expiresAt)}</p> : null}
              </div>
              <Link href="/dashboard/messenger" className="text-sm font-semibold text-brand-green">Open</Link>
            </div>
          ))
        ) : (
          <div className="rounded-[1rem] border border-dashed border-[var(--bp-border-subtle)] bg-[var(--bp-surface-muted)] p-5 text-sm text-[var(--bp-foreground-muted)]">
            No active numbers yet. <Link href="/dashboard/rentals" className="font-semibold text-brand-green">Get one</Link>
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3 rounded-[1.5rem] border border-[var(--bp-border-subtle)] bg-[var(--bp-surface)] p-4 sm:p-5">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.22em] text-brand-green">Wallet activity</h2>
          {loading ? (
            <div className="space-y-3 pt-1">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : transactions.length > 0 ? (
            <div>
              {transactions.map((tx) => (
                <div key={tx.id} className="bp-row-item">
                  <div>
                    <p className="text-sm font-semibold">{tx.description || statusLabel(tx.type)}</p>
                    <p className="mt-1 text-xs text-[var(--bp-foreground-muted)]">{formatDate(tx.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm font-semibold">{formatUsdCents(tx.amountUsdCents)}</p>
                    <p className={`mt-1 text-[10px] uppercase tracking-[0.12em] ${tx.status === 'completed' ? 'text-brand-green' : 'text-[var(--bp-foreground-muted)]'}`}>
                      {statusLabel(tx.status)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No transactions" text="Fund your wallet to get started." href="/dashboard/wallet" action="Add funds" />
          )}
          <Link href="/dashboard/billing" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-green">
            View all activity <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="space-y-3 rounded-[1.5rem] border border-[var(--bp-border-subtle)] bg-[var(--bp-surface)] p-4 sm:p-5">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.22em] text-brand-green">Support</h2>
          {openTickets.length > 0 ? (
            <div>
              {openTickets.slice(0, 3).map((ticket) => (
                <Link key={ticket.id} href="/dashboard/support" className="bp-row-item">
                  <div>
                    <p className="text-sm font-semibold">{ticket.subject}</p>
                    <p className="mt-1 text-xs text-[var(--bp-foreground-muted)]">Updated {formatDate(ticket.updatedAt)}</p>
                  </div>
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] ${statusClass(ticket.status)}`}>
                    {statusLabel(ticket.status)}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState title="No open tickets" text="Contact support if you need help." href="/dashboard/support" action="Open support" />
          )}
        </div>
      </div>

      {loadError && (
        <div role="alert" className="rounded-[1rem] border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-900">
          <p className="font-semibold">Some data could not be loaded</p>
          <p className="mt-1 text-red-800/80">Please check your connection or contact support if the problem persists.</p>
        </div>
      )}
    </div>
  );
}

function QuickActionButton({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-[1rem] border border-[var(--bp-border-subtle)] bg-[var(--bp-surface)] p-4 transition hover:border-[rgba(0,255,157,0.24)] hover:bg-[rgba(0,255,157,0.03)]"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(0,255,157,0.08)] text-brand-green">
        <Icon className="h-4 w-4" />
      </div>
      <span className="text-sm font-semibold">{label}</span>
      <ArrowUpRight className="ml-auto h-4 w-4 text-brand-green" />
    </Link>
  );
}
