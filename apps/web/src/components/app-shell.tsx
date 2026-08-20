'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Home, MessageSquare, ShoppingCart, ActivitySquare, Settings, 
  Wallet, CreditCard, ShieldCheck, Ticket, Code2, Menu, X, Search, UserRound
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAuthStore } from '@/store';

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [query, setQuery] = useState('');
  const searchItems = useMemo(() => [...MAIN_NAV, ...MANAGE_NAV, ...DEVELOPER_NAV, ...ACCOUNT_NAV], []);
  const searchResults = query.trim()
    ? searchItems.filter((item) => item.label.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 6)
    : [];

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const NavLink = ({ item, mobile }: { item: NavItem; mobile?: boolean }) => {
    const Icon = item.icon;
    const active = isActive(item.href);
    
    return (
      <Link
        href={item.href}
        onClick={() => mobile && setSidebarOpen(false)}
        className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
          active
            ? 'bg-brand-accent/10 text-brand-accent'
            : 'text-[var(--bp-foreground-muted)] hover:text-[var(--bp-foreground)] hover:bg-[var(--bp-surface-muted)]'
        }`}
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        <span className={mobile ? '' : 'truncate'}>{item.label}</span>
      </Link>
    );
  };

  return (
    <div className="flex min-h-screen flex-col lg:flex-row bg-[var(--bp-background)]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-[var(--bp-surface)] border-r border-[var(--bp-border-subtle)] sticky top-0 h-screen overflow-y-auto">
        <div className="p-4 space-y-6 flex-1">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 px-2">
            <div className="w-8 h-8 rounded-lg bg-brand-accent/10 flex items-center justify-center text-brand-accent font-bold">
              BP
            </div>
            <span className="font-bold text-[var(--bp-foreground)]">Burner Point</span>
          </Link>

          {/* Main Navigation */}
          <nav className="space-y-1">
            <div className="px-2 text-xs font-semibold text-[var(--bp-foreground-muted)] uppercase tracking-wider mb-2">
              Products
            </div>
            {MAIN_NAV.map(item => (
              <NavLink key={item.href} item={item} />
            ))}
          </nav>

          {/* Manage Section */}
          <nav className="space-y-1 pt-4 border-t border-[var(--bp-border-subtle)]">
            <div className="px-2 text-xs font-semibold text-[var(--bp-foreground-muted)] uppercase tracking-wider mb-2">
              Manage
            </div>
            {MANAGE_NAV.map(item => (
              <NavLink key={item.href} item={item} />
            ))}
          </nav>

          {/* Developer Section */}
          <nav className="space-y-1 pt-4 border-t border-[var(--bp-border-subtle)]">
            <div className="px-2 text-xs font-semibold text-[var(--bp-foreground-muted)] uppercase tracking-wider mb-2">
              Developer
            </div>
            {DEVELOPER_NAV.map(item => (
              <NavLink key={item.href} item={item} />
            ))}
          </nav>

          {/* Account Section */}
          <nav className="space-y-1 pt-4 border-t border-[var(--bp-border-subtle)]">
            <div className="px-2 text-xs font-semibold text-[var(--bp-foreground-muted)] uppercase tracking-wider mb-2">
              Account
            </div>
            {ACCOUNT_NAV.map(item => (
              <NavLink key={item.href} item={item} />
            ))}
          </nav>
        </div>

        {/* User Profile */}
        {user && (
          <div className="p-4 border-t border-[var(--bp-border-subtle)]">
            <Link 
              href="/dashboard/settings"
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--bp-surface-muted)] transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-brand-accent/20 flex items-center justify-center text-brand-accent font-bold text-sm flex-shrink-0">
                {user.firstName?.charAt(0) || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[var(--bp-foreground)] truncate">
                  {user.firstName} {user.lastName || ''}
                </p>
                <p className="text-xs text-[var(--bp-foreground-muted)] truncate">{user.email}</p>
              </div>
            </Link>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 bg-[var(--bp-surface)] border-b border-[var(--bp-border-subtle)] sticky top-0 z-30">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-accent/10 flex items-center justify-center text-brand-accent font-bold text-sm">
              BP
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-[var(--bp-surface-muted)] rounded-lg transition-colors"
            aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
          >
            {sidebarOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Drawer Navigation */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 top-16 bg-black/50 z-40" onClick={() => setSidebarOpen(false)}>
            <nav className="bg-[var(--bp-surface)] w-full max-h-[calc(100vh-4rem)] overflow-y-auto space-y-1 p-4">
              {MAIN_NAV.map(item => (
                <NavLink key={item.href} item={item} mobile />
              ))}
              <div className="my-4 pt-4 border-t border-[var(--bp-border-subtle)]" />
              {MANAGE_NAV.map(item => (
                <NavLink key={item.href} item={item} mobile />
              ))}
              <div className="my-4 pt-4 border-t border-[var(--bp-border-subtle)]" />
              {DEVELOPER_NAV.map(item => (
                <NavLink key={item.href} item={item} mobile />
              ))}
              <div className="my-4 pt-4 border-t border-[var(--bp-border-subtle)]" />
              {ACCOUNT_NAV.map(item => (
                <NavLink key={item.href} item={item} mobile />
              ))}
            </nav>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-auto pb-20 lg:pb-0">
          <div className="sticky top-0 z-20 border-b border-[var(--bp-border-subtle)] bg-[var(--bp-background)]/90 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
            <div className="relative mx-auto max-w-7xl">
              <div className="flex min-h-11 items-center gap-3 rounded-md border border-[var(--bp-border-subtle)] bg-[var(--bp-surface)] px-3">
                <Search className="h-4 w-4 text-[var(--bp-foreground-muted)]" />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search dashboard" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--bp-foreground-muted)]" aria-label="Search dashboard" />
                <Link href="/dashboard/settings" aria-label="Open account settings" className="hidden rounded-full p-1.5 text-[var(--bp-foreground-muted)] hover:bg-[var(--bp-surface-muted)] hover:text-brand-accent sm:block"><UserRound className="h-4 w-4" /></Link>
              </div>
              {searchResults.length ? <div className="absolute left-0 right-0 top-14 z-30 overflow-hidden rounded-md border border-[var(--bp-border-subtle)] bg-[var(--bp-surface)] shadow-xl">{searchResults.map((item) => <Link key={item.href} href={item.href} onClick={() => setQuery('')} className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-[var(--bp-surface-muted)]"><item.icon className="h-4 w-4 text-brand-accent" />{item.label}</Link>)}</div> : null}
            </div>
          </div>
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[var(--bp-surface)] border-t border-[var(--bp-border-subtle)] flex items-center z-40">
          <Link href="/dashboard" className={`flex-1 flex flex-col items-center justify-center py-3 text-xs font-medium gap-1 transition-colors ${isActive('/dashboard') ? 'text-brand-accent' : 'text-[var(--bp-foreground-muted)]'}`}>
            <Home className="w-5 h-5" />
            <span>Home</span>
          </Link>
          <Link href="/dashboard/messenger" className={`flex-1 flex flex-col items-center justify-center py-3 text-xs font-medium gap-1 transition-colors ${isActive('/dashboard/messenger') ? 'text-brand-accent' : 'text-[var(--bp-foreground-muted)]'}`}>
            <MessageSquare className="w-5 h-5" />
            <span>Messages</span>
          </Link>
          <Link href="/dashboard/store" className={`flex-1 flex flex-col items-center justify-center py-3 text-xs font-medium gap-1 transition-colors ${isActive('/dashboard/store') ? 'text-brand-accent' : 'text-[var(--bp-foreground-muted)]'}`}>
            <ShoppingCart className="w-5 h-5" />
            <span>Store</span>
          </Link>
          <Link href="/dashboard/orders" className={`flex-1 flex flex-col items-center justify-center py-3 text-xs font-medium gap-1 transition-colors ${isActive('/dashboard/orders') ? 'text-brand-accent' : 'text-[var(--bp-foreground-muted)]'}`}>
            <ActivitySquare className="w-5 h-5" />
            <span>Activity</span>
          </Link>
          <Link href="/dashboard/settings" className={`flex-1 flex flex-col items-center justify-center py-3 text-xs font-medium gap-1 transition-colors ${isActive('/dashboard/settings') ? 'text-brand-accent' : 'text-[var(--bp-foreground-muted)]'}`}>
            <Settings className="w-5 h-5" />
            <span>Account</span>
          </Link>
        </nav>
      </div>
    </div>
  );
}
