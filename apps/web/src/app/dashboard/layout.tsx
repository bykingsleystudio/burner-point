'use client';

import { type ComponentType, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth, useClerk, useUser } from '@clerk/nextjs';
import {
  Bell,
  ChevronDown,
  CreditCard,
  Globe2,
  HelpCircle,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareText,
  Phone,
  Settings,
  Shield,
  ShieldCheck,
  Smartphone,
  UserCircle2,
  X,
} from 'lucide-react';
import { io } from 'socket.io-client';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { authApi, clearApiSession, setApiSession } from '@/lib/api';
import { formatWalletPrimary, formatWalletSecondary } from '@/lib/money';
import { useAuthStore, useUIStore } from '@/store';
import { BpLoadingState } from '@/components/design-system';

type NavItem = {
  href: string;
  label: string;
  shortLabel: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
};

const NAV_ITEMS: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    shortLabel: 'Overview',
    description: 'Account activity, balance, and launch actions.',
    icon: LayoutDashboard,
  },
  {
    href: '/dashboard/inbox',
    label: 'BP Messenger',
    shortLabel: 'Messenger',
    description: 'Messaging, calls, contacts, and shared media.',
    icon: MessageSquareText,
  },
  {
    href: '/dashboard/verification',
    label: 'BP Verify Hub',
    shortLabel: 'Verify Hub',
    description: 'Tiered verification routing and live OTP visibility.',
    icon: ShieldCheck,
  },
  {
    href: '/dashboard/rentals',
    label: 'BP Number Rentals',
    shortLabel: 'Rentals',
    description: 'Available numbers, active rentals, and renewals.',
    icon: Phone,
  },
  {
    href: '/dashboard/esim',
    label: 'BP eSIM Store',
    shortLabel: 'eSIM Store',
    description: 'Travel-ready plans, QR delivery, and active usage.',
    icon: Smartphone,
  },
  {
    href: '/dashboard/proxies',
    label: 'BP Proxy Store',
    shortLabel: 'Proxy Store',
    description: 'Proxy plans, credentials, and active sessions.',
    icon: Globe2,
  },
  {
    href: '/dashboard/vpn',
    label: 'BP Secure Tunnel',
    shortLabel: 'Secure Tunnel',
    description: 'WireGuard access, server regions, and config export.',
    icon: Shield,
  },
  {
    href: '/dashboard/settings',
    label: 'Settings',
    shortLabel: 'Settings',
    description: 'Profile, billing, API keys, and support.',
    icon: Settings,
  },
];

const PAGE_META: Array<{ match: string; title: string; description: string }> = [
  { match: '/dashboard/inbox', title: 'BP Messenger', description: 'Messaging, calling, and contacts across your private number stack.' },
  { match: '/dashboard/calls', title: 'BP Messenger', description: 'Missed, incoming, and outgoing activity tied to Burner Point lines.' },
  { match: '/dashboard/contacts', title: 'BP Messenger', description: 'Contact control, dialing, and private communication identity.' },
  { match: '/dashboard/messages', title: 'BP Messenger', description: 'Conversation context, media, and secure message history.' },
  { match: '/dashboard/verification', title: 'BP Verify Hub', description: 'Tiered verification routing with a live OTP surface.' },
  { match: '/dashboard/rentals', title: 'BP Number Rentals', description: 'Browse inventory, activate rentals, and manage renewal timing.' },
  { match: '/dashboard/esim', title: 'BP eSIM Store', description: 'Provision travel data plans and manage installed eSIMs.' },
  { match: '/dashboard/proxies', title: 'BP Proxy Store', description: 'Filter proxy plans, reveal credentials, and review active sessions.' },
  { match: '/dashboard/vpn', title: 'BP Secure Tunnel', description: 'Secure routing, server choice, and WireGuard provisioning.' },
  { match: '/dashboard/settings', title: 'Settings', description: 'Profile, billing, API keys, support, and security controls.' },
  { match: '/dashboard/profile', title: 'Settings', description: 'Manage personal details and recovery information.' },
  { match: '/dashboard/billing', title: 'Billing & Subscription', description: 'Wallet movements, invoices, plans, and active subscriptions.' },
  { match: '/dashboard/credits', title: 'Billing & Subscription', description: 'Fund the wallet for verification, rentals, eSIM, and proxies.' },
  { match: '/dashboard/api', title: 'API & Developer', description: 'Manage API keys, docs access, and integration security.' },
  { match: '/dashboard/developer', title: 'API & Developer', description: 'Developer access, webhook control, and automation paths.' },
  { match: '/dashboard/support', title: 'Support', description: 'Tickets, Telegram, and account issue handling.' },
  { match: '/dashboard', title: 'Dashboard', description: 'Private telecom operations, funding, and account visibility.' },
];

const QUICK_ACTIONS = [
  { href: '/dashboard/rentals', label: 'Buy Number' },
  { href: '/dashboard/inbox', label: 'Start Chat' },
  { href: '/dashboard/verification', label: 'Run Verification' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { signOut } = useClerk();
  const { user: clerkUser } = useUser();
  const { user, setAuth, clearAuth } = useAuthStore();
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useUIStore();
  const [sessionReady, setSessionReady] = useState(false);
  const [fatalSessionError, setFatalSessionError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const unsafePhoneNumber =
    typeof clerkUser?.unsafeMetadata?.phoneNumber === 'string'
      ? clerkUser.unsafeMetadata.phoneNumber
      : undefined;

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      clearAuth();
      clearApiSession();
      router.replace('/auth/login');
      return;
    }

    let cancelled = false;
    async function exchangeSession() {
      setSessionReady(false);
      setFatalSessionError(null);

      try {
        const clerkToken = await getToken();
        if (!clerkToken) throw new Error('Missing secure session token');

        const { data } = await authApi.exchangeClerkToken(clerkToken, {
          firstName: clerkUser?.firstName,
          lastName: clerkUser?.lastName,
          email: clerkUser?.primaryEmailAddress?.emailAddress,
          phoneNumber: clerkUser?.primaryPhoneNumber?.phoneNumber || unsafePhoneNumber,
        });

        if (cancelled) return;

        setApiSession(data.accessToken, data.refreshToken);
        setAuth(data.user, data.accessToken, data.refreshToken);
        setAccessToken(data.accessToken);
        setSessionReady(true);
      } catch (error: unknown) {
        if (cancelled) return;
        const responseError = error as Error & {
          response?: {
            status?: number;
            data?: { message?: string };
          };
        };

        const message =
          responseError.response?.status === 401
            ? 'Your secure session could not be refreshed. Sign in again to reopen the dashboard.'
            : responseError.response?.data?.message || 'Unable to start the Burner Point dashboard session.';

        clearApiSession();

        if (responseError.response?.status === 401) {
          clearAuth();
          setFatalSessionError(message);
          setSessionReady(true);
          return;
        }

        toast.error(message);
        setFatalSessionError(message);
        setSessionReady(true);
      }
    }

    exchangeSession();
    return () => {
      cancelled = true;
    };
  }, [clearAuth, getToken, isLoaded, isSignedIn, clerkUser?.id, clerkUser?.firstName, clerkUser?.lastName, clerkUser?.primaryEmailAddress?.emailAddress, clerkUser?.primaryPhoneNumber?.phoneNumber, router, setAuth, unsafePhoneNumber]);

  useEffect(() => {
    if (!accessToken) return;

    const socket = io(`${process.env.NEXT_PUBLIC_WS_URL}/events`, {
      auth: { token: accessToken },
      transports: ['websocket'],
    });

    socket.on('message.received', (data) => {
      toast(
        <div>
          <p className="text-sm font-semibold text-white">New message from {data.from}</p>
          {data.otp ? <p className="font-mono text-lg text-brand-green">{data.otp}</p> : null}
          <p className="mt-1 text-xs text-white/60">{data.body}</p>
        </div>,
        { duration: 5000 },
      );
    });

    socket.on('call.incoming', (data) => {
      toast.success(`Incoming call from ${data.from}`);
    });

    return () => {
      socket.disconnect();
    };
  }, [accessToken]);

  useEffect(() => {
    if (!pathname.startsWith('/dashboard')) return;
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, [pathname, setSidebarOpen]);

  const currentPage = useMemo(() => {
    return PAGE_META.find((item) => pathname.startsWith(item.match)) ?? PAGE_META[PAGE_META.length - 1];
  }, [pathname]);

  const handleSignOut = async () => {
    clearAuth();
    clearApiSession();
    await signOut({ redirectUrl: '/' });
  };

  if (!isLoaded || !sessionReady) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-brand-black px-4 text-white">
        <div className="w-full max-w-md">
          <BpLoadingState label="Securing your Burner Point workspace..." />
        </div>
      </main>
    );
  }

  if (fatalSessionError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-brand-black px-4 text-white">
        <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[0.03] p-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-green">Session attention</p>
          <h1 className="mt-3 text-2xl font-semibold text-white">Sign in again to continue</h1>
          <p className="mt-3 text-sm leading-6 text-white/62">{fatalSessionError}</p>
          <button
            type="button"
            onClick={handleSignOut}
            className="bp-button-glow mt-6 flex min-h-12 w-full items-center justify-center rounded-[1.1rem] bg-brand-green px-5 text-sm font-semibold uppercase tracking-[0.18em] text-black transition hover:-translate-y-0.5 hover:bg-[#1cffac]"
          >
            Return to sign in
          </button>
        </div>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen bg-brand-black text-white">
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-40 flex w-[19rem] max-w-[88vw] flex-col border-r border-white/8 bg-[linear-gradient(180deg,rgba(1,50,32,0.94),rgba(0,0,0,0.98))] shadow-[28px_0_80px_rgba(0,0,0,0.48)] transition-transform duration-300 md:static md:max-w-none',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        )}
      >
        <div className="border-b border-white/8 px-5 py-5">
          <Link href="/" className="inline-flex items-center gap-3" aria-label="Burner Point home">
            <span className="flex h-11 w-11 items-center justify-center rounded-[1rem] border border-brand-green/25 bg-brand-green/10 shadow-[0_0_26px_rgba(0,255,157,0.16)]">
              <Image src="/assets/logo-mark.svg" alt="" width={24} height={24} />
            </span>
            <span>
              <Image src="/assets/wordmark-white.svg" alt="Burner Point" width={138} height={26} className="h-auto w-auto" />
              <span className="mt-1 block text-[11px] text-white/48">Private telecom control surface</span>
            </span>
          </Link>
        </div>

        <div className="border-b border-white/8 px-5 py-4">
          <div className="rounded-[1.25rem] border border-brand-green/18 bg-brand-green/[0.06] p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-brand-green">Credits balance</span>
              <CreditCard className="h-4 w-4 text-brand-green" />
            </div>
            <p className="mt-3 font-mono text-2xl text-white">{formatWalletPrimary(user)}</p>
            <p className="mt-2 text-xs leading-5 text-white/48">Local convenience value: {formatWalletSecondary(user)}</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Dashboard">
          <div className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const active =
                item.href === '/dashboard'
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    'group flex items-start gap-3 rounded-[1.15rem] px-3 py-3 transition',
                    active
                      ? 'border border-brand-green/24 bg-brand-green/[0.09] text-white'
                      : 'border border-transparent text-white/56 hover:border-white/8 hover:bg-white/[0.03] hover:text-white',
                  )}
                >
                  <span
                    className={clsx(
                      'mt-0.5 flex h-10 w-10 flex-none items-center justify-center rounded-[0.95rem] border transition',
                      active
                        ? 'border-brand-green/28 bg-brand-green/12 text-brand-green'
                        : 'border-white/8 bg-black/20 text-white/44 group-hover:border-brand-green/20 group-hover:text-brand-green',
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className={clsx('block text-sm font-semibold', active ? 'text-white' : 'text-white/82')}>{item.label}</span>
                    <span className="mt-1 block text-xs leading-5 text-white/42">{item.description}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="border-t border-white/8 px-4 py-4">
          <details className="group [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex min-h-12 cursor-pointer list-none items-center gap-3 rounded-[1.15rem] border border-white/8 bg-white/[0.03] px-3 py-3 transition hover:border-brand-green/22 hover:bg-brand-green/[0.05]">
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-brand-green/24 bg-brand-green/10 text-sm font-semibold text-brand-green">
                {(user?.firstName || clerkUser?.firstName || 'B').slice(0, 1).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-white">
                  {user?.firstName || clerkUser?.firstName || 'Burner Point user'}
                </span>
                <span className="block truncate text-xs text-white/46">
                  {user?.email || clerkUser?.primaryEmailAddress?.emailAddress || 'Private account'}
                </span>
              </span>
              <ChevronDown className="h-4 w-4 text-white/42 transition group-open:rotate-180" />
            </summary>
            <div className="mt-2 rounded-[1.15rem] border border-white/8 bg-black/36 p-2">
              <Link href="/dashboard/profile" className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm text-white/68 transition hover:bg-white/[0.04] hover:text-white">
                <UserCircle2 className="h-4 w-4 text-brand-green" />
                Profile
              </Link>
              <Link href="/dashboard/billing" className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm text-white/68 transition hover:bg-white/[0.04] hover:text-white">
                <CreditCard className="h-4 w-4 text-brand-green" />
                Billing
              </Link>
              <Link href="/dashboard/api" className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm text-white/68 transition hover:bg-white/[0.04] hover:text-white">
                <KeyRound className="h-4 w-4 text-brand-green" />
                API Keys
              </Link>
              <Link href="/dashboard/support" className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm text-white/68 transition hover:bg-white/[0.04] hover:text-white">
                <HelpCircle className="h-4 w-4 text-brand-green" />
                Support
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm text-white/68 transition hover:bg-white/[0.04] hover:text-red-300"
              >
                <LogOut className="h-4 w-4 text-red-300" />
                Sign Out
              </button>
            </div>
          </details>
        </div>
      </aside>

      {sidebarOpen ? (
        <button
          type="button"
          aria-label="Close dashboard navigation"
          onClick={toggleSidebar}
          className="fixed inset-0 z-30 bg-black/58 backdrop-blur-sm md:hidden"
        />
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-white/8 bg-brand-black/86 px-4 py-4 backdrop-blur-xl md:px-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={toggleSidebar}
                className="flex min-h-11 min-w-11 items-center justify-center rounded-[1rem] border border-white/10 bg-white/[0.03] text-white/72 transition hover:border-brand-green/22 hover:text-brand-green md:hidden"
              >
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-green">{currentPage.title}</p>
                <h1 className="mt-2 text-2xl font-semibold text-white">{currentPage.title}</h1>
                <p className="mt-1 text-sm leading-6 text-white/54">{currentPage.description}</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="flex items-center gap-3 rounded-[1.15rem] border border-white/8 bg-white/[0.03] px-4 py-3">
                <CreditCard className="h-4 w-4 text-brand-green" />
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-brand-green">Credits balance</p>
                  <p className="text-sm font-semibold text-white">{formatWalletPrimary(user)}</p>
                  <p className="mt-1 text-[11px] text-white/42">{formatWalletSecondary(user)}</p>
                </div>
              </div>

              <button
                type="button"
                className="flex min-h-12 min-w-12 items-center justify-center rounded-[1rem] border border-white/8 bg-white/[0.03] text-white/70 transition hover:border-brand-green/22 hover:text-brand-green"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
              </button>

              <div className="flex flex-wrap gap-2">
                {QUICK_ACTIONS.map((action, index) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className={clsx(
                      'inline-flex min-h-12 items-center justify-center rounded-[1rem] px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] transition',
                      index === 0
                        ? 'bg-brand-green text-black hover:bg-[#1cffac]'
                        : 'border border-white/10 bg-white/[0.03] text-white/74 hover:border-brand-green/24 hover:text-white',
                    )}
                  >
                    {action.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-5 md:px-6 md:py-6">{children}</main>
      </div>
    </div>
  );
}
