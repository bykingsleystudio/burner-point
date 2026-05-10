'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BellRing,
  CreditCard,
  MessageSquareText,
  Phone,
  RadioTower,
  Route,
  Server,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import { billingApi, numbersApi } from '@/lib/api';
import { formatLegacyAmountPrimary, formatLegacyAmountSecondary, formatWalletPrimary, formatWalletSecondary } from '@/lib/money';
import { SUPPORT_EMAIL, SUPPORT_EMAIL_HREF } from '@/lib/support';
import { useAuthStore } from '@/store';

type NumberRecord = {
  id: string;
  number: string;
  status?: string;
  type?: string;
  smsReceived?: number;
  createdAt?: string;
  updatedAt?: string;
};

type LedgerItem = {
  id: string;
  description?: string;
  type?: string;
  status?: string;
  amountKobo?: number;
  createdAt?: string;
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [numbers, setNumbers] = useState<NumberRecord[]>([]);
  const [activity, setActivity] = useState<LedgerItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    Promise.allSettled([numbersApi.list(), billingApi.ledger(1, 6)])
      .then((results) => {
        if (!mounted) return;

        const nextNumbers = results[0].status === 'fulfilled' && Array.isArray(results[0].value.data)
          ? results[0].value.data
          : [];
        const nextLedger = results[1].status === 'fulfilled'
          ? results[1].value.data?.transactions ?? []
          : [];

        setNumbers(nextNumbers);
        setActivity(nextLedger);
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
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const activeNumbers = numbers.filter((item) => item.status === 'active').length;
  const messagesToday = numbers.reduce((sum, item) => sum + Number(item.smsReceived ?? 0), 0);
  const activeRentals = numbers.filter((item) => item.type === 'rental' || item.type === 'burner').length;
  const headlineName = user?.firstName || 'there';

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-white/8 bg-[linear-gradient(135deg,rgba(1,50,32,0.94),rgba(0,0,0,0.98)_62%)] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.38)] md:p-8">
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr] xl:items-end">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-green">Burner Point overview</p>
            <h2 className="mt-4 max-w-[14ch] text-[2.45rem] font-semibold leading-[0.94] text-white sm:text-[3rem] md:text-[3.7rem]">
              {greeting}, <span className="text-brand-green">{headlineName}</span>.
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-8 text-white/58">
              Stay Anonymous. Stay Connected. Private By Design. This workspace keeps your messaging, verification, rentals, billing activity, and privacy controls in one place.
            </p>
          </div>

          <div className="rounded-[1.6rem] border border-white/10 bg-black/28 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-green">Credits balance</p>
                <p className="mt-3 font-mono text-3xl text-white">{formatWalletPrimary(user)}</p>
                <p className="mt-2 text-sm text-white/42">{formatWalletSecondary(user)}</p>
              </div>
              <span className="flex h-12 w-12 items-center justify-center rounded-[1rem] border border-brand-green/24 bg-brand-green/10">
                <CreditCard className="h-5 w-5 text-brand-green" />
              </span>
            </div>
            <p className="mt-4 text-sm leading-6 text-white/52">
              Wallet-backed services cover BP Verify Hub, BP Number Rentals, BP eSIM Store, and BP Proxy Store. Recurring subscriptions remain inside billing and subscriptions.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        {[
          {
            label: 'Active Numbers',
            value: activeNumbers,
            text: 'Lines currently active across verification, messaging, or rentals.',
            icon: Phone,
          },
          {
            label: 'Messages Today',
            value: messagesToday,
            text: 'Inbound message volume currently attached to your live number inventory.',
            icon: MessageSquareText,
          },
          {
            label: 'Active Rentals',
            value: activeRentals,
            text: 'Numbers currently assigned to short-term or renewable rental workflows.',
            icon: RadioTower,
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <article key={stat.label} className="rounded-[1.5rem] border border-white/8 bg-brand-card p-5">
              <span className="flex h-11 w-11 items-center justify-center rounded-[1rem] border border-brand-green/20 bg-brand-green/10">
                <Icon className="h-5 w-5 text-brand-green" />
              </span>
              <p className="mt-5 text-4xl font-semibold text-white">{loading ? '...' : stat.value}</p>
              <p className="mt-2 text-sm font-semibold uppercase tracking-[0.12em] text-white/78">{stat.label}</p>
              <p className="mt-3 text-sm leading-6 text-white/50">{stat.text}</p>
            </article>
          );
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[1.6rem] border border-white/8 bg-brand-card p-5 md:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-green">Quick actions</p>
              <h3 className="mt-3 text-2xl font-semibold text-white">Move into the next task without hunting for it.</h3>
            </div>
            <span className="hidden h-12 w-12 items-center justify-center rounded-[1rem] border border-brand-green/20 bg-brand-green/10 lg:flex">
              <Sparkles className="h-5 w-5 text-brand-green" />
            </span>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {[
              {
                href: '/dashboard/rentals',
                label: 'Buy Number',
                text: 'Browse inventory, choose duration, and assign a line to your account.',
                icon: Phone,
              },
              {
                href: '/dashboard/messenger',
                label: 'Start Chat',
                text: 'Open BP Messenger and continue an existing conversation or create a new one.',
                icon: MessageSquareText,
              },
              {
                href: '/dashboard/verify-hub',
                label: 'Run Verification',
                text: 'Pick a tier, select a service, and watch live OTP updates in the hub.',
                icon: ShieldCheck,
              },
            ].map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="group rounded-[1.35rem] border border-white/8 bg-black/24 p-4 transition hover:-translate-y-0.5 hover:border-brand-green/28 hover:bg-brand-green/[0.05]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-[1rem] border border-brand-green/18 bg-brand-green/10">
                      <Icon className="h-5 w-5 text-brand-green" />
                    </span>
                    <ArrowRight className="h-4 w-4 text-white/28 transition group-hover:translate-x-1 group-hover:text-brand-green" />
                  </div>
                  <p className="mt-4 text-base font-semibold text-white">{action.label}</p>
                  <p className="mt-2 text-sm leading-6 text-white/50">{action.text}</p>
                </Link>
              );
            })}
          </div>
        </div>

        <aside className="rounded-[1.6rem] border border-white/8 bg-brand-card p-5 md:p-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-green">Recent activity</p>
          <div className="mt-5 space-y-3">
            {activity.length ? (
              activity.map((item) => (
                <div key={item.id} className="rounded-[1.25rem] border border-white/8 bg-black/24 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{item.description || item.type || 'Wallet event'}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.12em] text-white/42">{item.status || 'Recorded'}</p>
                    </div>
                    <BellRing className="h-4 w-4 text-brand-green" />
                  </div>
                  <p className="mt-3 font-mono text-sm text-brand-green">{formatLegacyAmountPrimary(item)}</p>
                  <p className="mt-1 text-xs text-white/40">{formatLegacyAmountSecondary(item)}</p>
                  <p className="mt-2 text-xs text-white/42">
                    {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Pending timestamp'}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-[1.25rem] border border-white/8 bg-black/24 p-5 text-sm leading-6 text-white/52">
                Recent verification events, rentals, and wallet activity will appear here once the account starts transacting.
              </div>
            )}
          </div>
        </aside>
      </section>

      <section className="rounded-[1.6rem] border border-white/8 bg-[linear-gradient(180deg,rgba(1,50,32,0.78),rgba(0,0,0,0.94))] p-5 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-green">Platform map</p>
            <h3 className="mt-3 text-2xl font-semibold text-white">Move across every Burner Point module from one shell.</h3>
          </div>
          <div className="text-sm text-white/48">
            Email support: <a href={SUPPORT_EMAIL_HREF} className="text-brand-green transition hover:text-[#39FF14]">{SUPPORT_EMAIL}</a>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {[
            { href: '/dashboard/messenger', title: 'BP Messenger', text: 'Private threads, media context, and conversation continuity.', icon: MessageSquareText },
            { href: '/dashboard/verify-hub', title: 'BP Verify Hub', text: 'Codes, status, and number activity in one place.', icon: ShieldCheck },
            { href: '/dashboard/rentals', title: 'BP Number Rentals', text: 'Temporary and renewable number lifecycle management.', icon: Phone },
            { href: '/dashboard/esim', title: 'BP eSIM Store', text: 'Travel data plans and activation state inside the platform.', icon: Smartphone },
            { href: '/dashboard/proxy', title: 'BP Proxy Store', text: 'Secure routing options and location-aware connection control.', icon: Server },
            { href: '/dashboard/secure-tunnel', title: 'BP Secure Tunnel', text: 'Integrated protection and private session continuity.', icon: Route },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group rounded-[1.35rem] border border-white/8 bg-black/24 p-4 transition hover:-translate-y-0.5 hover:border-brand-green/28 hover:bg-brand-green/[0.05]"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-[1rem] border border-brand-green/18 bg-brand-green/10">
                    <Icon className="h-5 w-5 text-brand-green" />
                  </span>
                  <ArrowRight className="h-4 w-4 text-white/28 transition group-hover:translate-x-1 group-hover:text-brand-green" />
                </div>
                <p className="mt-4 text-base font-semibold text-white">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-white/50">{item.text}</p>
              </Link>
            );
          })}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/dashboard/support" className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-4 text-sm text-white/70 transition hover:border-brand-green/24 hover:text-brand-green">
            Support
          </Link>
          <Link href="/dashboard/security" className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-4 text-sm text-white/70 transition hover:border-brand-green/24 hover:text-brand-green">
            2FA and security
          </Link>
          <Link href="/dashboard/settings" className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-4 text-sm text-white/70 transition hover:border-brand-green/24 hover:text-brand-green">
            Account settings
          </Link>
        </div>
      </section>
    </div>
  );
}
