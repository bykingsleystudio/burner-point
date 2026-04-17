'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth, useClerk, useUser } from '@clerk/nextjs';
import { useAuthStore, useUIStore } from '@/store';
import { authApi, clearApiSession, setApiSession } from '@/lib/api';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, MessageSquare, Phone, PhoneIncoming,
  Voicemail, ShieldCheck, Clock, CreditCard, Key,
  HelpCircle, Wifi, Smartphone, Globe, Shield, LogOut,
  Menu, X, Bell, Settings, Ticket, LockKeyhole, Users, Repeat2, Webhook,
} from 'lucide-react';
import clsx from 'clsx';
import { BpLoadingState } from '@/components/design-system';

const NAV = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { href: '/dashboard/inbox', icon: MessageSquare, label: 'Inbox' },
  { href: '/dashboard/messages', icon: MessageSquare, label: 'Messages & Photos' },
  { href: '/dashboard/contacts', icon: Users, label: 'Contacts' },
  { href: '/dashboard/numbers', icon: Phone, label: 'Numbers' },
  { href: '/dashboard/calls', icon: PhoneIncoming, label: 'Calls' },
  { href: '/dashboard/voicemail', icon: Voicemail, label: 'Voicemail' },
  { href: '/dashboard/verification', icon: ShieldCheck, label: 'Verification' },
  { href: '/dashboard/rentals', icon: Clock, label: 'Rentals' },
  { href: '/dashboard/billing', icon: CreditCard, label: 'Credits & Billing' },
  { href: '/dashboard/subscriptions', icon: Repeat2, label: 'Subscriptions' },
  { href: '/dashboard/developer', icon: Key, label: 'API & Developer' },
  { href: '/dashboard/webhooks', icon: Webhook, label: 'Webhooks' },
  null, // divider
  { href: '/dashboard/vpn', icon: Wifi, label: 'VPN', badge: 'Beta' },
  { href: '/dashboard/esim', icon: Smartphone, label: 'eSIM', badge: 'Beta' },
  { href: '/dashboard/proxies', icon: Globe, label: 'Proxies', badge: 'Soon' },
  null,
  { href: '/dashboard/support', icon: HelpCircle, label: 'Support' },
  { href: '/dashboard/support/tickets', icon: Ticket, label: 'Support Tickets' },
  { href: '/dashboard/security', icon: LockKeyhole, label: 'Security & 2FA' },
  { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { signOut } = useClerk();
  const { user: clerkUser } = useUser();
  const { user, setAuth, clearAuth } = useAuthStore();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      clearAuth();
      clearApiSession();
      router.push('/auth/login');
      return;
    }

    let cancelled = false;
    async function exchangeSession() {
      setSessionReady(false);
      try {
        const clerkToken = await getToken();
        if (!clerkToken) throw new Error('Missing Clerk session token');
        const { data } = await authApi.exchangeClerkToken(clerkToken, {
          firstName: clerkUser?.firstName,
          lastName: clerkUser?.lastName,
          email: clerkUser?.primaryEmailAddress?.emailAddress,
          phoneNumber: clerkUser?.primaryPhoneNumber?.phoneNumber,
        });
        if (cancelled) return;
        setApiSession(data.accessToken, data.refreshToken);
        setAuth(data.user, data.accessToken, data.refreshToken);
        setAccessToken(data.accessToken);
        if (data.user?.phoneNumber && data.user?.phoneVerified === false) {
          sessionStorage.setItem('burnerPointPendingPhone', data.user.phoneNumber);
          router.replace('/auth/phone-verify?redirect=/dashboard');
          return;
        }
        setSessionReady(true);
      } catch (error: any) {
        if (cancelled) return;
        const message = error.response?.data?.message || 'Unable to start your Burner Point API session.';
        toast.error(message);
        clearApiSession();
        if (error.response?.status === 400 && /complete|terms|privacy|phone/i.test(message)) {
          router.push('/onboarding');
        }
        setSessionReady(true);
      }
    }

    exchangeSession();
    return () => { cancelled = true; };
  }, [isLoaded, isSignedIn, getToken, clerkUser?.id]);

  useEffect(() => {
    if (!accessToken) return;

    // Real-time WebSocket connection
    const s = io(`${process.env.NEXT_PUBLIC_WS_URL}/events`, {
      auth: { token: accessToken },
      transports: ['websocket'],
    });
    s.on('connect', () => console.log('[WS] Connected'));
    s.on('message.received', (data) => {
      toast((t) => (
        <div>
          <p className="font-semibold text-sm">New SMS from {data.from}</p>
          {data.otp && <p className="font-mono text-brand-green text-lg">{data.otp}</p>}
          <p className="text-xs text-brand-muted truncate">{data.body}</p>
        </div>
      ), { duration: 6000 });
    });
    s.on('call.incoming', (data) => {
      toast(`Incoming call from ${data.from}`, { duration: 8000 });
    });
    setSocket(s);
    return () => { s.disconnect(); };
  }, [accessToken]);

  const logout = async () => {
    clearAuth();
    clearApiSession();
    await signOut({ redirectUrl: '/auth/login' });
  };

  if (!isLoaded || !sessionReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-black text-white">
        <div className="w-full max-w-md px-5">
          <BpLoadingState label="Securing your Clerk session..." />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-brand-black">
      {/* Sidebar */}
      <aside className={clsx(
        'fixed inset-y-0 left-0 z-30 flex w-72 max-w-[86vw] flex-shrink-0 flex-col border-r border-brand-border bg-brand-dark shadow-[24px_0_70px_rgba(0,0,0,0.55)] transition-all duration-300 md:relative md:max-w-none md:shadow-none',
        sidebarOpen ? 'translate-x-0 md:w-56' : '-translate-x-full md:w-0 md:translate-x-0 md:overflow-hidden'
      )}>
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 h-16 border-b border-brand-border">
          <div className="w-7 h-7 rounded bg-brand-green flex items-center justify-center flex-shrink-0">
            <Shield size={14} className="text-black"/>
          </div>
          <span className="font-bold text-sm tracking-tight">Burner Point</span>
        </div>

        {/* Wallet badge */}
        <div className="px-3 py-3 border-b border-brand-border">
          <div className="bg-brand-black rounded-xl px-3 py-2.5 flex items-center justify-between">
            <span className="text-xs text-brand-muted">Balance</span>
            <span className="text-sm font-mono font-semibold text-brand-green">
              NGN {((user?.walletBalanceKobo || 0) / 100).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2 px-2">
          {NAV.map((item, i) => {
            if (!item) return <div key={i} className="my-2 border-t border-brand-border"/>;
            const active = pathname === item.href || (
              item.href !== '/dashboard' &&
              item.href !== '/dashboard/support' &&
              pathname.startsWith(`${item.href}/`)
            );
            return (
              <Link key={item.href} href={item.href}
                className={clsx(
                  'mb-0.5 flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all group',
                  active ? 'bg-brand-green/10 text-brand-green' : 'text-brand-muted hover:text-white hover:bg-brand-card'
                )}>
                <item.icon size={15} className={active ? 'text-brand-green' : ''}/>
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className={clsx('text-[10px] px-1.5 py-0.5 rounded font-medium',
                    item.badge === 'Soon' ? 'bg-brand-border text-brand-muted' : 'bg-brand-green/20 text-brand-green'
                  )}>{item.badge}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="border-t border-brand-border px-3 py-3">
          <div className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-2 py-2 hover:bg-brand-card group">
            <div className="w-7 h-7 rounded-full bg-brand-green/20 border border-brand-green/30 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-brand-green">{(user?.firstName || clerkUser?.firstName || 'B')?.[0]?.toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{user?.firstName || clerkUser?.firstName}</p>
              <p className="text-[10px] text-brand-muted truncate">{user?.email || clerkUser?.primaryEmailAddress?.emailAddress}</p>
            </div>
            <button onClick={logout} className="flex h-9 w-9 items-center justify-center rounded-bp text-brand-muted opacity-100 transition-colors hover:text-red-400 md:opacity-0 md:group-hover:opacity-100">
              <LogOut size={13}/>
            </button>
          </div>
        </div>
      </aside>
      {sidebarOpen ? (
        <button
          type="button"
          aria-label="Close dashboard navigation"
          onClick={toggleSidebar}
          className="fixed inset-0 z-20 bg-black/58 backdrop-blur-sm md:hidden"
        />
      ) : null}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="flex h-16 flex-shrink-0 items-center gap-3 border-b border-brand-border px-4 md:gap-4 md:px-6">
          <button onClick={toggleSidebar} className="flex min-h-11 min-w-11 items-center justify-center rounded-bp text-brand-muted transition-colors hover:bg-brand-card hover:text-white">
            {sidebarOpen ? <X size={18}/> : <Menu size={18}/>}
          </button>
          <div className="flex-1">
            <h2 className="text-sm font-semibold capitalize">
              {pathname.split('/').pop()?.replace('-', ' ') || 'Dashboard'}
            </h2>
          </div>
          <button className="flex min-h-11 min-w-11 items-center justify-center rounded-bp text-brand-muted transition-colors hover:bg-brand-card hover:text-white">
            <Bell size={18}/>
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
