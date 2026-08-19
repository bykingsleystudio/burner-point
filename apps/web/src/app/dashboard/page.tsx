'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ArrowUpRight, CreditCard, Inbox, MessageSquareText, Phone, Plus, ShieldCheck, Ticket, Wallet } from 'lucide-react';
import { billingApi, messagesApi, numbersApi, supportApi } from '@/lib/api';
import { formatUsdCents } from '@/lib/money';
import { useAuthStore } from '@/store';

type NumberRecord = { id: string; number: string; status?: string; type?: string; countryCode?: string; expiresAt?: string; smsReceived?: number };
type BillingOverview = {
  wallet?: { balanceUsdCents?: number; lockedBalanceUsdCents?: number };
  subscriptions?: Array<{ id: string; status: string; productId: string | null; renewsAt: string | null }>;
  walletTransactions?: Array<{ id: string; type: string; status: string; amountUsdCents: number; description: string | null; createdAt: string | null }>;
};
type SupportTicket = { id: string; subject: string; status: 'open' | 'in_progress' | 'resolved' | 'closed'; updatedAt?: string };

function statusLabel(status: string) { return status.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function statusClass(status: string) {
  if (['paid', 'active', 'resolved', 'delivered'].includes(status.toLowerCase())) return 'border-brand-green/25 bg-brand-green/10 text-brand-green';
  if (['failed', 'expired', 'closed'].includes(status.toLowerCase())) return 'border-red-300/25 bg-red-400/10 text-red-200';
  return 'border-[#9FA6B2]/25 bg-[#9FA6B2]/10 text-[var(--bp-foreground-muted)]';
}
function formatDate(value?: string | null) { return value ? formatDistanceToNow(new Date(value), { addSuffix: true }) : 'Date unavailable'; }
function Skeleton({ className = '' }: { className?: string }) { return <div aria-hidden="true" className={`animate-pulse rounded-md bg-[var(--bp-surface-raised)] ${className}`} />; }
function EmptyState({ title, text, href, action }: { title: string; text: string; href?: string; action?: string }) {
  return <div className="border-t border-[var(--bp-border-subtle)] py-8"><p className="text-sm font-semibold">{title}</p><p className="mt-2 max-w-md text-sm leading-6 bp-dashboard-muted">{text}</p>{href && action ? <Link href={href} className="mt-4 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-brand-green hover:text-brand-neon"><ArrowUpRight className="h-4 w-4" />{action}</Link> : null}</div>;
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [billing, setBilling] = useState<BillingOverview | null>(null);
  const [numbers, setNumbers] = useState<NumberRecord[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let mounted = true;
    Promise.allSettled([billingApi.overview(), numbersApi.list(), supportApi.tickets()])
      .then(async ([billingResult, numbersResult, ticketsResult]) => {
        if (!mounted) return;
        const nextNumbers = numbersResult.status === 'fulfilled' && Array.isArray(numbersResult.value.data) ? numbersResult.value.data as NumberRecord[] : [];
        setBilling(billingResult.status === 'fulfilled' ? billingResult.value.data as BillingOverview : null);
        setNumbers(nextNumbers);
        setTickets(ticketsResult.status === 'fulfilled' && Array.isArray(ticketsResult.value.data) ? ticketsResult.value.data as SupportTicket[] : []);
        const messageResults = await Promise.allSettled(nextNumbers.filter((number) => number.status === 'active').slice(0, 5).map((number) => messagesApi.list(number.id, 1, 1)));
        if (!mounted) return;
        setUnreadMessages(messageResults.reduce((total, result) => total + (result.status === 'fulfilled' ? Number(result.value.data?.unreadCount ?? 0) : 0), 0));
        setLoadError([billingResult, numbersResult, ticketsResult].every((result) => result.status === 'rejected'));
      })
      .catch(() => { if (mounted) setLoadError(true); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const greeting = useMemo(() => { const hour = new Date().getHours(); return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'; }, []);
  const activeNumbers = numbers.filter((item) => item.status === 'active');
  const activeRentals = activeNumbers.filter((item) => item.type === 'rental' || item.type === 'burner');
  const activeSubscriptions = billing?.subscriptions?.filter((item) => ['active', 'trialing'].includes(item.status)) ?? [];
  const transactions = billing?.walletTransactions?.slice(0, 5) ?? [];
  const openTickets = tickets.filter((ticket) => ['open', 'in_progress'].includes(ticket.status));
  const firstName = user?.firstName || 'there';

  return (
    <div className="mx-auto max-w-[1440px] space-y-8">
      <section className="grid gap-5 border-b border-[var(--bp-border-subtle)] pb-8 xl:grid-cols-[1fr_24rem] xl:items-end">
        <div><p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-green">Burner Point overview</p><h2 className="mt-4 max-w-[15ch] text-4xl font-semibold leading-[0.96] tracking-[-0.02em] md:text-6xl">{greeting}, {firstName}.</h2><p className="mt-5 max-w-2xl text-base leading-7 bp-dashboard-muted">Your private communications, numbers, and account activity in one operational view.</p></div>
        <section className="rounded-[1.25rem] border border-brand-green/25 bg-[linear-gradient(145deg,rgba(1,50,32,0.92),var(--bp-surface))] p-5" aria-label="Wallet balance">
          <div className="flex items-start justify-between gap-4"><div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-brand-green">Available balance</p>{loading ? <Skeleton className="mt-3 h-10 w-36" /> : <p className="mt-3 font-mono text-3xl font-semibold text-white">{formatUsdCents(billing?.wallet?.balanceUsdCents)}</p>}<p className="mt-2 text-xs text-white/60">USD, canonical wallet currency</p></div><Wallet className="h-5 w-5 text-brand-green" /></div>
          <div className="mt-5 flex flex-wrap gap-2"><Link href="/dashboard/wallet" className="bp-primary-action inline-flex min-h-10 items-center gap-2 px-3 text-xs font-semibold uppercase tracking-[0.12em]"><Plus className="h-4 w-4" />Add funds</Link><Link href="/dashboard/billing" className="inline-flex min-h-10 items-center gap-2 rounded-[0.5rem] border border-white/15 px-3 text-xs font-semibold uppercase tracking-[0.12em] text-white/80 hover:border-brand-green/35 hover:text-brand-green">View wallet</Link></div>
          {billing?.wallet?.lockedBalanceUsdCents ? <p className="mt-4 text-xs text-white/55">{formatUsdCents(billing.wallet.lockedBalanceUsdCents)} currently locked</p> : null}
        </section>
      </section>

      {loadError ? <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-[0.9rem] border border-red-300/25 bg-red-400/10 px-4 py-3 text-sm text-red-100"><span>Some account data could not be loaded. Values shown below may be incomplete.</span><Link href="/dashboard/billing" className="font-semibold underline">Open billing</Link></div> : null}

      <section aria-labelledby="quick-actions-heading"><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-brand-green">Next actions</p><h3 id="quick-actions-heading" className="mt-2 text-2xl font-semibold">What do you want to do?</h3><div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[
        { href: '/dashboard/verify-hub', label: 'Get a verification', icon: ShieldCheck }, { href: '/dashboard/rentals', label: 'Get a number', icon: Phone }, { href: '/dashboard/messenger', label: 'Open BP Messenger', icon: MessageSquareText }, { href: '/dashboard/wallet', label: 'Fund wallet', icon: CreditCard },
      ].map((action) => { const Icon = action.icon; return <Link key={action.href} href={action.href} className="group flex min-h-16 items-center justify-between gap-3 border-b border-[var(--bp-border-subtle)] px-1 py-4 transition hover:border-brand-green/40"><span className="flex items-center gap-3 text-sm font-semibold"><Icon className="h-5 w-5 text-brand-green" />{action.label}</span><ArrowUpRight className="h-4 w-4 bp-dashboard-faint transition group-hover:text-brand-green" /></Link>; })}</div></section>

      <section className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
        <div><div className="flex items-end justify-between gap-4"><div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-brand-green">Connected products</p><h3 className="mt-2 text-2xl font-semibold">Active services</h3></div><Link href="/dashboard/settings" className="text-sm font-semibold text-brand-green">Manage</Link></div><div className="mt-4 divide-y divide-[var(--bp-border-subtle)] border-y border-[var(--bp-border-subtle)]">
          <div className="flex items-center justify-between gap-4 py-4"><span className="flex items-center gap-3 text-sm font-semibold"><MessageSquareText className="h-5 w-5 text-brand-green" />BP Messenger</span><span className={`rounded-full border px-2.5 py-1 text-xs ${activeNumbers.length ? statusClass('active') : statusClass('inactive')}`}>{activeNumbers.length ? `${activeNumbers.length} active number${activeNumbers.length === 1 ? '' : 's'}` : 'No active numbers'}</span></div>
          <div className="flex items-center justify-between gap-4 py-4"><span className="flex items-center gap-3 text-sm font-semibold"><Phone className="h-5 w-5 text-brand-green" />Number rentals</span><span className={`rounded-full border px-2.5 py-1 text-xs ${activeRentals.length ? statusClass('active') : statusClass('inactive')}`}>{activeRentals.length ? `${activeRentals.length} active` : 'None active'}</span></div>
          <div className="flex items-center justify-between gap-4 py-4"><span className="flex items-center gap-3 text-sm font-semibold"><CreditCard className="h-5 w-5 text-brand-green" />Subscriptions</span><span className={`rounded-full border px-2.5 py-1 text-xs ${activeSubscriptions.length ? statusClass('active') : statusClass('inactive')}`}>{activeSubscriptions.length ? `${activeSubscriptions.length} active` : 'None active'}</span></div>
        </div><p className="mt-3 text-xs leading-5 bp-dashboard-faint">Verification, eSIM, proxy, and Secure Tunnel summaries are not exposed by the current dashboard API contract.</p></div>
        <div><div className="flex items-end justify-between gap-4"><div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-brand-green">Communication</p><h3 className="mt-2 text-2xl font-semibold">Messager summary</h3></div><Link href="/dashboard/messenger" className="text-sm font-semibold text-brand-green">Open</Link></div><div className="mt-4 border-y border-[var(--bp-border-subtle)] py-5"><div className="flex items-center justify-between"><span className="flex items-center gap-3 text-sm font-semibold"><Inbox className="h-5 w-5 text-brand-green" />Unread conversations</span><span className="font-mono text-2xl font-semibold">{loading ? '...' : unreadMessages}</span></div><p className="mt-3 text-sm leading-6 bp-dashboard-muted">Unread counts are loaded from active numbers where the messaging contract is available.</p></div>{!activeNumbers.length ? <EmptyState title="No active numbers" text="Get a private number before starting a conversation." href="/dashboard/rentals" action="Get a number" /> : null}</div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
        <div><div className="flex items-end justify-between gap-4"><div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-brand-green">Wallet ledger</p><h3 className="mt-2 text-2xl font-semibold">Recent transactions</h3></div><Link href="/dashboard/billing" className="text-sm font-semibold text-brand-green">View all</Link></div><div className="mt-4 overflow-hidden border-y border-[var(--bp-border-subtle)]">{loading ? <div className="space-y-4 py-5"><Skeleton className="h-6 w-full" /><Skeleton className="h-6 w-4/5" /><Skeleton className="h-6 w-3/5" /></div> : transactions.length ? <div className="divide-y divide-[var(--bp-border-subtle)]">{transactions.map((transaction) => <div key={transaction.id} className="grid gap-2 py-4 sm:grid-cols-[1fr_auto_auto] sm:items-center sm:gap-5"><div><p className="text-sm font-semibold">{transaction.description || statusLabel(transaction.type)}</p><p className="mt-1 text-xs bp-dashboard-faint">{formatDate(transaction.createdAt)}</p></div><span className={`w-fit rounded-full border px-2.5 py-1 text-xs ${statusClass(transaction.status)}`}>{statusLabel(transaction.status)}</span><p className="font-mono text-sm">{formatUsdCents(transaction.amountUsdCents)}</p></div>)}</div> : <EmptyState title="No recent transactions" text="Your wallet activity will appear here after a payment or product purchase." href="/dashboard/wallet" action="Fund wallet" />}</div></div>
        <div><div className="flex items-end justify-between gap-4"><div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-brand-green">Support</p><h3 className="mt-2 text-2xl font-semibold">Account attention</h3></div><Link href="/dashboard/support" className="text-sm font-semibold text-brand-green">View support</Link></div>{openTickets.length ? <div className="mt-4 divide-y divide-[var(--bp-border-subtle)] border-y border-[var(--bp-border-subtle)]">{openTickets.slice(0, 3).map((ticket) => <Link key={ticket.id} href="/dashboard/support" className="flex items-center justify-between gap-4 py-4"><span className="flex min-w-0 items-center gap-3"><Ticket className="h-5 w-5 flex-none text-brand-green" /><span className="min-w-0"><span className="block truncate text-sm font-semibold">{ticket.subject}</span><span className="mt-1 block text-xs bp-dashboard-faint">Updated {formatDate(ticket.updatedAt)}</span></span></span><span className={`flex-none rounded-full border px-2.5 py-1 text-xs ${statusClass(ticket.status)}`}>{statusLabel(ticket.status)}</span></Link>)}</div> : <EmptyState title="No open support tickets" text="Support requests and replies will appear here when you need them." href="/dashboard/support" action="Contact support" />}</div>
      </section>
    </div>
  );
}
