'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import {
  ArrowRight,
  CreditCard,
  Globe2,
  MessageSquare,
  Phone,
  RadioTower,
  Receipt,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UserCircle2,
  Wifi,
} from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store';

interface Stats {
  totalNumbers: number;
  totalMessages: number;
  walletBalanceKobo: number;
  activeNumbers: number;
}

const quickActions = [
  { href: '/dashboard/numbers', label: 'Get a number', text: 'Browse inventory, choose a region, and activate private access.', icon: Phone },
  { href: '/dashboard/verification', label: 'Start verification', text: 'Receive SMS or voice codes for supported services.', icon: ShieldCheck },
  { href: '/dashboard/inbox', label: 'Open inbox', text: 'Read conversations, media, and recent communication activity.', icon: MessageSquare },
  { href: '/dashboard/credits', label: 'Add credits', text: 'Top up your wallet for rentals, verification, and renewals.', icon: CreditCard },
] as const;

const moduleCards = [
  { href: '/dashboard/rentals', title: 'Rentals', text: 'Manage active rentals, renewals, due dates, and purchase history.', icon: RadioTower },
  { href: '/dashboard/billing', title: 'Billing', text: 'Track transactions, invoices, payment methods, and plan history.', icon: Receipt },
  { href: '/dashboard/esim', title: 'eSIM', text: 'Buy plans, monitor usage, and keep travel connectivity organized.', icon: Smartphone },
  { href: '/dashboard/proxies', title: 'Proxies', text: 'View available routes, active sessions, and account-ready purchase options.', icon: Globe2 },
  { href: '/dashboard/vpn', title: 'VPN', text: 'Select a region, monitor status, and keep secure routing inside Burner Point.', icon: Wifi },
  { href: '/dashboard/settings', title: 'Profile & settings', text: 'Update account details, notifications, support preferences, and security.', icon: UserCircle2 },
] as const;

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { user: clerkUser } = useUser();
  const [stats, setStats] = useState<Stats>({
    totalNumbers: 0,
    totalMessages: 0,
    walletBalanceKobo: 0,
    activeNumbers: 0,
  });

  useEffect(() => {
    Promise.all([api.get('/numbers'), api.get('/users/me/wallet')])
      .then(([numbersRes, walletRes]) => {
        const numbers = Array.isArray(numbersRes.data) ? numbersRes.data : [];
        setStats({
          totalNumbers: numbers.length,
          activeNumbers: numbers.filter((item: any) => item.status === 'active').length,
          totalMessages: numbers.reduce((sum: number, item: any) => sum + (item.smsReceived || 0), 0),
          walletBalanceKobo: walletRes.data.balanceKobo || 0,
        });
      })
      .catch(() => undefined);
  }, []);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  }, []);

  const headlineName = user?.firstName || clerkUser?.firstName || 'there';
  const statCards = [
    { label: 'Active numbers', value: stats.activeNumbers, helper: 'Ready for messaging, calls, or verification.', icon: Phone },
    { label: 'Messages received', value: stats.totalMessages.toLocaleString(), helper: 'Conversation and OTP history linked to your numbers.', icon: MessageSquare },
    { label: 'Wallet balance', value: `NGN ${(stats.walletBalanceKobo / 100).toLocaleString()}`, helper: 'Credits available for private services and renewals.', icon: CreditCard },
    { label: 'Numbers in account', value: stats.totalNumbers, helper: 'Every active or historical number attached to this profile.', icon: ShieldCheck },
  ] as const;

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-white/8 bg-[linear-gradient(135deg,rgba(1,50,32,0.92),rgba(0,0,0,0.96)_58%)] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.32)] md:p-8">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(22rem,0.85fr)] xl:items-end">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-brand-green">Overview</p>
            <h1 className="mt-4 max-w-[14ch] text-[2.35rem] font-semibold leading-[0.94] text-white sm:text-[2.8rem] md:text-[3.5rem]">
              Good {greeting}, <span className="text-brand-green">{headlineName}</span>.
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-white/60">
              Everything you need for private numbers, verifications, conversations, billing, and secure connectivity now lives in one calmer workspace.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/dashboard/numbers" className="bp-primary-action inline-flex min-h-12 items-center justify-center px-6 py-4 text-sm font-semibold uppercase">
                Get a number
              </Link>
              <Link href="/dashboard/verification" className="bp-secondary-action inline-flex min-h-12 items-center justify-center px-6 py-4 text-sm font-semibold uppercase">
                Verify a service
              </Link>
            </div>
          </div>

          <div className="rounded-[1.6rem] border border-white/10 bg-black/28 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-green/12 text-brand-green">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Private by design</p>
                <p className="text-sm leading-6 text-white/54">Your dashboard focuses on user actions, clear next steps, and protected account outcomes.</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                ['Verification', 'Global phone-friendly onboarding and secure OTP delivery.'],
                ['Conversations', 'Messaging, calls, contacts, and voicemail in one threaded surface.'],
                ['Billing', 'Wallet, subscriptions, renewals, and receipts kept easy to scan.'],
              ].map(([title, text]) => (
                <div key={title} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="mt-2 text-sm leading-6 text-white/52">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <article key={card.label} className="rounded-[1.5rem] border border-white/8 bg-brand-card p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-green/12 text-brand-green">
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-5 text-3xl font-semibold text-white">{card.value}</p>
              <p className="mt-2 text-sm font-medium text-white/74">{card.label}</p>
              <p className="mt-2 text-sm leading-6 text-white/46">{card.helper}</p>
            </article>
          );
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.12fr)_minmax(20rem,0.88fr)]">
        <div className="rounded-[1.6rem] border border-white/8 bg-brand-card p-5 md:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-green">Quick actions</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Move faster through the tasks you repeat most.</h2>
            </div>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.href} href={action.href} className="group rounded-[1.35rem] border border-white/8 bg-black/24 p-4 transition hover:-translate-y-0.5 hover:border-brand-green/28 hover:bg-brand-green/[0.05]">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-green/12 text-brand-green">
                      <Icon className="h-5 w-5" />
                    </div>
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
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-green">Today at a glance</p>
          <div className="mt-6 space-y-4">
            {[
              'Use verification when you need a one-time code for a new service.',
              'Open inbox to review conversation history, media, or missed activity.',
              'Visit billing before purchasing rentals, renewals, or new account credits.',
            ].map((item, index) => (
              <div key={item} className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-brand-green/24 bg-brand-green/10 text-xs font-semibold text-brand-green">
                  0{index + 1}
                </div>
                <p className="pt-1 text-sm leading-6 text-white/58">{item}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-[1.35rem] border border-white/8 bg-black/24 p-4">
            <p className="text-sm font-semibold text-white">Brand message</p>
            <p className="mt-2 text-base leading-7 text-white/64">
              Stay Anonymous. Stay Connected. <span className="text-brand-green">Private by Design.</span>
            </p>
          </div>
        </aside>
      </section>

      <section className="rounded-[1.6rem] border border-white/8 bg-brand-card p-5 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-green">Modules</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Everything in your Burner Point account</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/52">
              The redesigned dashboard keeps the information user-facing and task-oriented, with each area scoped to the action a customer is actually trying to complete.
            </p>
          </div>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {moduleCards.map((module) => {
            const Icon = module.icon;
            return (
              <Link key={module.href} href={module.href} className="group rounded-[1.35rem] border border-white/8 bg-black/24 p-4 transition hover:-translate-y-0.5 hover:border-brand-green/28 hover:bg-brand-green/[0.05]">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-green/12 text-brand-green">
                    <Icon className="h-5 w-5" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-white/28 transition group-hover:translate-x-1 group-hover:text-brand-green" />
                </div>
                <p className="mt-4 text-base font-semibold text-white">{module.title}</p>
                <p className="mt-2 text-sm leading-6 text-white/50">{module.text}</p>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
