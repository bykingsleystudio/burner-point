'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Home, MessageSquare, ShoppingCart, ActivitySquare, Settings,
  Wallet, CreditCard, ShieldCheck, Ticket, Code2, Search
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAuthStore } from '@/store';
import { formatUsdCents } from '@/lib/money';

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  section?: string;
};

const MAIN_NAV: NavItem[] = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/dashboard/messenger', label: 'BP Messenger Pro', icon: MessageSquare },
  { href: '/dashboard/verify-hub', label: 'BP Verify Hub', icon: ShieldCheck },
  { href: '/dashboard/rentals', label: 'BP Rental Hub', icon: ActivitySquare },
  { href: '/dashboard/esim', label: 'BP eSIM Store', icon: ShoppingCart },
  { href: '/dashboard/proxies', label: 'BP Proxy Store', icon: ShoppingCart },
  { href: '/dashboard/vpn', label: 'BP Secure Tunnel VPN', icon: ShieldCheck },
];

const MANAGE_NAV: NavItem[] = [
  { href: '/dashboard/wallet', label: 'Wallet', icon: Wallet, section: 'manage' },
  { href: '/dashboard/billing', label: 'Billing', icon: CreditCard, section: 'manage' },
  { href: '/dashboard/orders', label: 'Orders', icon: ShoppingCart, section: 'manage' },
];

const DEVELOPER_NAV: NavItem[] = [
  { href: '/dashboard/api-keys', label: 'API Keys', icon: Code2, section: 'developer' },
  { href: '/dashboard/webhooks', label: 'Webhooks', icon: Code2, section: 'developer' },
];

const ACCOUNT_NAV: NavItem[] = [
  { href: '/dashboard/support', label: 'Support', icon: Ticket, section: 'account' },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings, section: 'account' },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const [query, setQuery] = useState('');
  const searchItems = useMemo(() => [...MAIN_NAV, ...MANAGE_NAV, ...DEVELOPER_NAV, ...ACCOUNT_NAV], []);
  const searchResults = query.trim()
    ? searchItems.filter((item) => item.label.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 6)
    : [];

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const mobileTabs = MAIN_NAV.slice(0, 5);

  const NavLink = ({ item }: { item: NavItem }) => {
    const Icon = item.icon;
    const active = isActive(item.href);

    return (
      <Link
        href={item.href}
        className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition-colors ${
          active
            ? 'border-[rgba(0,255,157,0.3)] bg-[rgba(0,255,157,0.09)] text-[var(--bp-foreground)]'
            : 'border-[var(--bp-border-subtle)] bg-transparent text-[var(--bp-foreground-muted)] hover:border-[rgba(0,255,157,0.24)] hover:text-[var(--bp-foreground)]'
        }`}
      >
        <Icon className="h-4 w-4 flex-shrink-0" />
        <span>{item.label.replace('BP ', '')}</span>
      </Link>
    );
  };

  return (
    <div className="bp-dashboard-shell min-h-screen">
      <header className="sticky top-0 z-40 border-b border-[var(--bp-border-subtle)] bg-[rgba(245,248,246,0.88)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="shrink-0" aria-label="Burner Point dashboard home">
            <Image src="/assets/burner-point-icon-gradient.svg" alt="Burner Point" width={32} height={32} className="h-8 w-8" priority />
          </Link>

          <div className="hidden flex-1 items-center gap-3 md:flex">
            <div className="relative w-full max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--bp-foreground-muted)]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search dashboard"
                className="h-10 w-full rounded-full border border-[var(--bp-border-subtle)] bg-[var(--bp-surface)] pl-9 pr-3 text-sm text-[var(--bp-foreground)] outline-none placeholder:text-[var(--bp-foreground-muted)] focus:border-[rgba(0,255,157,0.35)]"
                aria-label="Search dashboard"
              />
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Link href="/dashboard/wallet" className="hidden items-center gap-2 rounded-full border border-[var(--bp-border-subtle)] bg-[var(--bp-surface)] px-3 py-2 text-sm font-semibold text-[var(--bp-foreground)] sm:inline-flex" title="Open wallet">
              <Wallet className="h-4 w-4 text-brand-green" />
              {formatUsdCents(user?.walletBalanceUsdCents ?? 0)}
            </Link>
            <Link href="/dashboard/store" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--bp-border-subtle)] bg-[var(--bp-surface)] text-[var(--bp-foreground-muted)] transition hover:border-[rgba(0,255,157,0.24)] hover:text-brand-green" aria-label="Open store" title="Open store">
              <ShoppingCart className="h-4 w-4" />
            </Link>
            <Link href="/dashboard/support" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--bp-border-subtle)] bg-[var(--bp-surface)] text-[var(--bp-foreground-muted)] transition hover:border-[rgba(0,255,157,0.24)] hover:text-brand-green" aria-label="Support" title="Support">
              <Ticket className="h-4 w-4" />
            </Link>
            <Link href="/dashboard/settings" className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,#00FF9D,#39FF14)] text-sm font-bold text-black shadow-[0_0_18px_rgba(0,255,157,0.22)]" aria-label="Open account settings" title="Account settings">
              {user?.firstName?.charAt(0) || 'U'}
            </Link>
          </div>
        </div>

        <div className="mx-auto hidden max-w-7xl gap-2 overflow-x-auto px-4 pb-3 sm:px-6 lg:flex lg:px-8" aria-label="Dashboard navigation">
          {[...MAIN_NAV, ...MANAGE_NAV, ...DEVELOPER_NAV, ...ACCOUNT_NAV].map((item) => <NavLink key={item.href} item={item} />)}
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 pb-24 pt-5 sm:px-6 lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-6 lg:px-8">
        <aside className="hidden lg:block">
          <div className="bp-dashboard-sidebar sticky top-24 rounded-[1.5rem] border bg-[rgba(255,255,255,0.02)] p-3">
            <div className="mb-3 px-2 py-1">
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-brand-green">Navigation</p>
            </div>
            <nav className="space-y-1.5">
              {[...MAIN_NAV, ...MANAGE_NAV, ...DEVELOPER_NAV].map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link key={item.href} href={item.href} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${active ? 'bg-[rgba(0,255,157,0.09)] text-[var(--bp-foreground)]' : 'text-[var(--bp-foreground-muted)] hover:bg-[var(--bp-surface-muted)] hover:text-[var(--bp-foreground)]'}`}>
                    <Icon className="h-4 w-4 text-brand-green" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        <main className="min-w-0">
          <div className="relative mb-6 md:hidden">
            <div className="flex min-h-11 items-center gap-3 rounded-full border border-[var(--bp-border-subtle)] bg-[var(--bp-surface)] px-4 shadow-sm">
              <Search className="h-4 w-4 text-[var(--bp-foreground-muted)]" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search dashboard" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--bp-foreground-muted)]" aria-label="Search dashboard" />
            </div>
            {searchResults.length ? <div className="absolute left-0 right-0 top-14 z-30 overflow-hidden rounded-xl border border-[var(--bp-border-subtle)] bg-[var(--bp-surface)] shadow-xl">{searchResults.map((item) => <Link key={item.href} href={item.href} onClick={() => setQuery('')} className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-[var(--bp-surface-muted)]"><item.icon className="h-4 w-4 text-brand-green" />{item.label}</Link>)}</div> : null}
          </div>
          {children}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--bp-border-subtle)] bg-[rgba(245,248,246,0.92)] px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 backdrop-blur-xl lg:hidden" aria-label="Mobile navigation">
        <div className="mx-auto grid max-w-xl grid-cols-5 gap-1">
          {mobileTabs.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href} className={`flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-medium ${active ? 'bg-[rgba(0,255,157,0.08)] text-[var(--bp-foreground)]' : 'text-[var(--bp-foreground-muted)]'}`}>
                <Icon className="h-4 w-4" />
                <span>{item.label.replace('BP ', '').replace(' Secure Tunnel VPN', 'VPN')}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
