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

  const NavLink = ({ item }: { item: NavItem }) => {
    const Icon = item.icon;
    const active = isActive(item.href);
    
    return (
      <Link
        href={item.href}
        className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
          active
            ? 'border-brand-green bg-brand-green text-black'
            : 'border-[var(--bp-border-subtle)] text-[var(--bp-foreground-muted)] hover:border-brand-green/50 hover:text-[var(--bp-foreground)]'
        }`}
      >
        <Icon className="h-4 w-4 flex-shrink-0" />
        <span>{item.label.replace('BP ', '')}</span>
      </Link>
    );
  };

  return (
    <div className="bp-dashboard-shell min-h-screen bg-[var(--bp-background)]">
      <header className="sticky top-0 z-40 border-b border-[var(--bp-border-subtle)] bg-[var(--bp-background)]/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="shrink-0" aria-label="Burner Point dashboard home">
            <span className="inline-flex items-center gap-2.5">
              <Image src="/assets/burner-point-icon-gradient.svg" alt="Burner Point" width={36} height={36} className="h-8 w-8" priority />
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/dashboard/wallet" className="hidden min-h-10 items-center gap-2 rounded-full border border-[var(--bp-border-subtle)] bg-[var(--bp-surface)] px-4 text-sm font-semibold sm:inline-flex" title="Open wallet">
              <Wallet className="h-4 w-4 text-brand-green" />
              {formatUsdCents(user?.walletBalanceUsdCents ?? 0)}
            </Link>
            <Link href="/dashboard/store" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--bp-border-subtle)] text-[var(--bp-foreground-muted)] hover:border-brand-green/50 hover:text-brand-green" aria-label="Open store" title="Open store">
              <ShoppingCart className="h-4 w-4" />
            </Link>
            <Link href="/dashboard/settings" className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-green text-sm font-bold text-black" aria-label="Open account settings" title="Account settings">
              {user?.firstName?.charAt(0) || 'U'}
            </Link>
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-3 sm:px-6 lg:px-8" aria-label="Dashboard navigation">
          {[...MAIN_NAV, ...MANAGE_NAV, ...DEVELOPER_NAV, ...ACCOUNT_NAV].map((item) => <NavLink key={item.href} item={item} />)}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-12 pt-5 sm:px-6 lg:px-8">
        <div className="relative mb-8">
          <div className="flex min-h-11 items-center gap-3 rounded-full border border-[var(--bp-border-subtle)] bg-[var(--bp-surface)] px-4 shadow-sm">
            <Search className="h-4 w-4 text-[var(--bp-foreground-muted)]" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search dashboard" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--bp-foreground-muted)]" aria-label="Search dashboard" />
          </div>
          {searchResults.length ? <div className="absolute left-0 right-0 top-14 z-30 overflow-hidden rounded-xl border border-[var(--bp-border-subtle)] bg-[var(--bp-surface)] shadow-xl">{searchResults.map((item) => <Link key={item.href} href={item.href} onClick={() => setQuery('')} className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-[var(--bp-surface-muted)]"><item.icon className="h-4 w-4 text-brand-green" />{item.label}</Link>)}</div> : null}
        </div>
        {children}
      </main>
    </div>
  );
}
