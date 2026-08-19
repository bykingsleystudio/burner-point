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
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <p className="text-sm font-mono uppercase tracking-widest text-brand-accent/70">Burner Point</p>
        <h1 className="text-4xl font-bold tracking-tight">{greeting}, {firstName}.</h1>
        <p className="text-[var(--bp-foreground-muted)] max-w-2xl">
          Private communication, connectivity, and verification in one operational platform.
        </p>
      </div>

      {/* Wallet Card */}
      <div className="bg-[var(--bp-surface)] rounded-2xl border border-[var(--bp-border-subtle)] p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-brand-accent uppercase tracking-wider">Available balance</p>
            {loading ? (
              <Skeleton className="mt-3 h-12 w-48" />
            ) : (
              <p className="mt-3 text-5xl font-bold font-mono">{formatUsdCents(billing?.wallet?.balanceUsdCents)}</p>
            )}
            <p className="mt-2 text-xs text-[var(--bp-foreground-muted)]">USD canonical | Real-time balance</p>
          </div>
          <Wallet className="w-6 h-6 text-brand-accent opacity-60" />
        </div>

        <div className="flex flex-wrap gap-3 pt-4 border-t border-[var(--bp-border-subtle)]">
          <Link
            href="/dashboard/wallet"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-accent text-black text-sm font-semibold rounded-lg hover:bg-brand-accent/90 transition"
          >
            <Plus className="w-4 h-4" />
            Add funds
          </Link>
          <Link
            href="/dashboard/billing"
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-[var(--bp-border-subtle)] text-sm font-semibold rounded-lg hover:bg-[var(--bp-surface-muted)] transition"
          >
            View wallet
          </Link>
        </div>

        {billing?.wallet?.lockedBalanceUsdCents ? (
          <p className="text-xs text-[var(--bp-foreground-muted)]">
            {formatUsdCents(billing.wallet.lockedBalanceUsdCents)} currently locked in orders
          </p>
        ) : null}
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-brand-accent uppercase tracking-wider">Quick actions</p>
        <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <QuickActionButton href="/dashboard/verify-hub" icon={ShieldCheck} label="Get verification" />
          <QuickActionButton href="/dashboard/rentals" icon={Phone} label="Rent number" />
          <QuickActionButton href="/dashboard/esim" icon={Smartphone} label="Buy eSIM" />
          <QuickActionButton href="/dashboard/proxies" icon={Globe} label="Buy proxy" />
          <QuickActionButton href="/dashboard/vpn" icon={Shield} label="Secure tunnel" />
          <QuickActionButton href="/dashboard/wallet" icon={Zap} label="Add funds" />
        </div>
      </div>

      {/* Active Products */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-brand-accent">Your Burner Point</h2>
        <div className="bg-[var(--bp-surface)] rounded-lg border border-[var(--bp-border-subtle)] divide-y divide-[var(--bp-border-subtle)]">
          {activeNumbers.length > 0 ? (
            activeNumbers.slice(0, 3).map((number) => (
              <div key={number.id} className="p-4 flex items-center justify-between hover:bg-[var(--bp-surface-muted)] transition">
                <div>
                  <p className="font-semibold">{number.number}</p>
                  <p className="text-sm text-[var(--bp-foreground-muted)]">BP Messenger Pro • Active</p>
                  {number.expiresAt && <p className="text-xs text-[var(--bp-foreground-muted)] mt-1">Expires {formatDate(number.expiresAt)}</p>}
                </div>
                <Link href="/dashboard/messenger" className="text-xs font-semibold text-brand-accent hover:text-brand-accent/80">
                  Open →
                </Link>
              </div>
            ))
          ) : (
            <div className="p-8 text-center">
              <p className="text-sm font-semibold">No active numbers</p>
              <p className="text-sm text-[var(--bp-foreground-muted)] mt-1">Get a number to start messaging</p>
              <Link href="/dashboard/rentals" className="text-sm font-semibold text-brand-accent mt-3 inline-block">
                Rent a number →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Transactions */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-brand-accent">Wallet activity</h2>
          <div className="bg-[var(--bp-surface)] rounded-lg border border-[var(--bp-border-subtle)]">
            {loading ? (
              <div className="space-y-4 p-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : transactions.length > 0 ? (
              <div className="divide-y divide-[var(--bp-border-subtle)]">
                {transactions.map((tx) => (
                  <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-[var(--bp-surface-muted)] transition">
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{tx.description || statusLabel(tx.type)}</p>
                      <p className="text-xs text-[var(--bp-foreground-muted)] mt-1">{formatDate(tx.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm font-semibold">{formatUsdCents(tx.amountUsdCents)}</p>
                      <p className={`text-xs mt-1 ${tx.status === 'completed' ? 'text-brand-accent' : 'text-[var(--bp-foreground-muted)]'}`}>
                        {statusLabel(tx.status)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No transactions" text="Fund your wallet to get started." href="/dashboard/wallet" action="Add funds" />
            )}
          </div>
          <Link href="/dashboard/billing" className="text-sm font-semibold text-brand-accent inline-flex items-center gap-1 hover:gap-2 transition-all">
            View all activity <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Support Tickets */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-brand-accent">Support</h2>
          <div className="bg-[var(--bp-surface)] rounded-lg border border-[var(--bp-border-subtle)]">
            {openTickets.length > 0 ? (
              <div className="divide-y divide-[var(--bp-border-subtle)]">
                {openTickets.slice(0, 3).map((ticket) => (
                  <Link key={ticket.id} href="/dashboard/support" className="p-4 flex items-center justify-between hover:bg-[var(--bp-surface-muted)] transition">
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{ticket.subject}</p>
                      <p className="text-xs text-[var(--bp-foreground-muted)] mt-1">Updated {formatDate(ticket.updatedAt)}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusClass(ticket.status)}`}>
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
      </div>

      {loadError && (
        <div role="alert" className="bg-red-500/10 border border-red-500/25 rounded-lg p-4 text-red-100 text-sm">
          <p className="font-semibold">Some data could not be loaded</p>
          <p className="mt-1 text-red-100/80">Please check your connection or contact support if the problem persists.</p>
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
      className="flex items-center gap-3 p-4 bg-[var(--bp-surface)] border border-[var(--bp-border-subtle)] rounded-lg hover:border-brand-accent/50 hover:bg-[var(--bp-surface-muted)] transition group"
    >
      <Icon className="w-5 h-5 text-brand-accent flex-shrink-0" />
      <span className="text-sm font-semibold group-hover:text-brand-accent transition">{label}</span>
      <ArrowUpRight className="w-4 h-4 text-brand-accent opacity-0 group-hover:opacity-100 ml-auto transition" />
    </Link>
  );
}
