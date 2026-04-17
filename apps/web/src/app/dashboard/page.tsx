'use client';
import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useAuthStore } from '@/store';
import api, { platformApi, type PlatformStackSnapshot, type StackIntegrationStatus } from '@/lib/api';
import { Phone, MessageSquare, CreditCard, TrendingUp, Shield, Zap, Globe, Lock, Wifi, Radio, Server, Database, Activity, Users, Repeat2, Webhook } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Stats { totalNumbers: number; totalMessages: number; walletBalanceKobo: number; activeNumbers: number; }

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { user: clerkUser } = useUser();
  const [stats, setStats] = useState<Stats>({ totalNumbers: 0, totalMessages: 0, walletBalanceKobo: 0, activeNumbers: 0 });
  const [stack, setStack] = useState<PlatformStackSnapshot | null>(null);

  useEffect(() => {
    Promise.all([api.get('/numbers'), api.get('/users/me/wallet')])
      .then(([numbersRes, walletRes]) => {
        const numbers = numbersRes.data;
        setStats({
          totalNumbers: numbers.length,
          activeNumbers: numbers.filter((n: any) => n.status === 'active').length,
          totalMessages: numbers.reduce((sum: number, n: any) => sum + n.smsReceived, 0),
          walletBalanceKobo: walletRes.data.balanceKobo,
        });
      }).catch(() => {});
    platformApi.stack().then((res) => setStack(res.data)).catch(() => setStack(null));
  }, []);

  const cards = [
    { label: 'Active Numbers', value: stats.activeNumbers, icon: Phone, color: 'text-brand-green', bg: 'bg-brand-green/10' },
    { label: 'Private Messages', value: stats.totalMessages.toLocaleString(), icon: MessageSquare, color: 'text-brand-green', bg: 'bg-brand-green/10' },
    { label: 'Wallet Balance', value: `NGN ${(stats.walletBalanceKobo / 100).toLocaleString()}`, icon: CreditCard, color: 'text-brand-green', bg: 'bg-brand-green/10' },
    { label: 'Total Identities', value: stats.totalNumbers, icon: TrendingUp, color: 'text-brand-green', bg: 'bg-brand-green/10' },
  ];

  const features = [
    { icon: Shield, title: 'Private by Design', desc: 'Every core action separates your real number from public services.' },
    { icon: Zap, title: 'Verification Ready', desc: 'SMS and voice OTP flows route through server-side provider controls.' },
    { icon: Globe, title: 'Global Access', desc: 'Numbers, eSIM, proxies, and routing features are organized by region and use case.' },
    { icon: Lock, title: 'Controlled Exposure', desc: 'Tokens, payments, provider keys, and privacy controls stay backend-first.' },
  ];

  const controlModules = [
    { href: '/dashboard/rentals', label: 'Rentals', icon: Radio, text: 'Temporary and renewable number access' },
    { href: '/dashboard/contacts', label: 'Contacts', icon: Users, text: 'Private address book and aliases' },
    { href: '/dashboard/subscriptions', label: 'Subscriptions', icon: Repeat2, text: 'Monthly plan and renewal state' },
    { href: '/dashboard/webhooks', label: 'Webhooks', icon: Webhook, text: 'Signed developer event delivery' },
    { href: '/dashboard/esim', label: 'eSIM', icon: Wifi, text: 'Travel-ready data connectivity' },
    { href: '/dashboard/proxies', label: 'Proxies', icon: Globe, text: 'Location-aware routing' },
    { href: '/dashboard/vpn', label: 'VPN', icon: Lock, text: 'Built-in privacy protection' },
  ];

  const stackHighlights = stack?.integrations.filter((integration) => [
    'vercel',
    'railway',
    'neon',
    'clerk',
    'twilio-verify',
    'paystack',
    'paddle',
    'nowpayments',
    'oneglobal',
    'brightdata',
    'wireguard',
  ].includes(integration.id)) ?? [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">
          Good {getGreeting()}, <span className="text-brand-green">{user?.firstName || clerkUser?.firstName || 'there'}</span>
        </h1>
        <p className="text-brand-muted text-sm mt-1">Your private telecom control center for numbers, verification, billing, and protection.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-brand-card border border-brand-border rounded-2xl p-4">
            <div className={`w-9 h-9 ${card.bg} rounded-xl flex items-center justify-center mb-3`}>
              <card.icon size={16} className={card.color}/>
            </div>
            <p className="text-2xl font-bold mb-0.5">{card.value}</p>
            <p className="text-xs text-brand-muted">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold text-brand-muted uppercase tracking-wider mb-4">Quick actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { href: '/dashboard/numbers', label: 'Get a number', icon: Phone },
            { href: '/dashboard/verification', label: 'Quick verify', icon: Shield },
            { href: '/dashboard/credits', label: 'Add credits', icon: CreditCard },
            { href: '/dashboard/inbox', label: 'View inbox', icon: MessageSquare },
          ].map((a) => (
            <a key={a.href} href={a.href}
              className="bg-brand-card border border-brand-border rounded-xl p-4 flex items-center gap-3 hover:border-brand-green/40 hover:bg-brand-green/5 transition-all group">
              <div className="w-8 h-8 bg-brand-dark rounded-lg flex items-center justify-center group-hover:bg-brand-green/10 transition-colors">
                <a.icon size={14} className="text-brand-muted group-hover:text-brand-green transition-colors"/>
              </div>
              <span className="text-sm font-medium">{a.label}</span>
            </a>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-brand-muted uppercase tracking-wider mb-4">Product modules</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {controlModules.map((module) => (
            <a key={module.href} href={module.href}
              className="bg-brand-card border border-brand-border rounded-xl p-4 hover:border-brand-green/40 hover:bg-brand-green/5 transition-all group">
              <module.icon size={17} className="text-brand-green" />
              <p className="mt-3 text-sm font-semibold">{module.label}</p>
              <p className="mt-1 text-xs leading-5 text-brand-muted">{module.text}</p>
            </a>
          ))}
        </div>
      </div>

      <div className="rounded-bp-lg border border-brand-border bg-brand-surface p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-brand-green">
              <Server size={16} />
              <p className="text-xs font-semibold uppercase">Production stack</p>
            </div>
            <h2 className="mt-2 text-lg font-bold">Source-of-truth infrastructure</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-brand-muted">
              Vercel web, Railway API, Neon Postgres, Clerk auth, Expo mobile delivery, and backend-only providers for telecom, payments, eSIM, proxies, VPN, AI, analytics, and storage.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center sm:min-w-[280px]">
            <StackMetric icon={Activity} label="Configured" value={stack ? stack.summary.configured + stack.summary.ready : 0} />
            <StackMetric icon={Database} label="Planned" value={stack ? stack.summary.planned : 0} />
            <StackMetric icon={Shield} label="Deferred" value={stack ? stack.summary.deferred : 0} />
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {stackHighlights.length ? (
            stackHighlights.map((integration) => (
              <div key={integration.id} className="rounded-bp-md border border-white/8 bg-black/25 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">{integration.name}</p>
                  <span className={`rounded-bp px-2 py-1 text-[10px] font-semibold uppercase ${statusClass(integration.status)}`}>
                    {statusLabel(integration.status)}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-5 text-brand-muted">{integration.role}</p>
              </div>
            ))
          ) : (
            Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-24 animate-pulse rounded-bp-md border border-brand-border bg-black/20" />
            ))
          )}
        </div>

        {stack ? (
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-brand-muted">
            <span className="rounded-bp border border-white/8 px-3 py-2">Payments: {stack.policies.primaryPayments.join(', ')}</span>
            <span className="rounded-bp border border-white/8 px-3 py-2">Conversation: {stack.policies.conversationScope}</span>
            <span className="rounded-bp border border-white/8 px-3 py-2">Verification: {stack.policies.verificationScope}</span>
            <span className="rounded-bp border border-white/8 px-3 py-2">Mobile payments: {stack.policies.mobileExternalPaymentsEnabled ? 'external enabled' : 'web checkout only'}</span>
          </div>
        ) : null}
      </div>

      {/* Feature highlights */}
      <div className="bg-brand-card border border-brand-border rounded-2xl p-6">
        <h2 className="text-sm font-semibold mb-4">Why Burner Point</h2>
        <div className="grid grid-cols-2 gap-4">
          {features.map((f) => (
            <div key={f.title} className="flex items-start gap-3">
              <div className="w-7 h-7 bg-brand-green/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <f.icon size={13} className="text-brand-green"/>
              </div>
              <div>
                <p className="text-sm font-medium">{f.title}</p>
                <p className="text-xs text-brand-muted mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StackMetric({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: number }) {
  return (
    <div className="rounded-bp-md border border-white/8 bg-black/25 p-3">
      <Icon size={14} className="mx-auto text-brand-green" />
      <p className="mt-2 text-xl font-bold">{value}</p>
      <p className="mt-1 text-[10px] uppercase text-brand-muted">{label}</p>
    </div>
  );
}

function statusLabel(status: StackIntegrationStatus) {
  return status.replace('_', ' ');
}

function statusClass(status: StackIntegrationStatus) {
  switch (status) {
    case 'ready':
    case 'configured':
      return 'border border-brand-green/30 bg-brand-green/10 text-brand-green';
    case 'partial':
      return 'border border-brand-neon/30 bg-brand-neon/10 text-brand-neon';
    case 'planned':
      return 'border border-white/10 bg-white/[0.03] text-white/60';
    case 'deferred':
      return 'border border-white/10 bg-white/[0.03] text-white/40';
    case 'disabled':
      return 'border border-red-400/20 bg-red-400/10 text-red-300';
    default:
      return 'border border-red-400/20 bg-red-400/10 text-red-300';
  }
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
