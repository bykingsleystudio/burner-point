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
  Menu, X, Bell, ChevronRight,
} from 'lucide-react';
import clsx from 'clsx';

const NAV = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { href: '/dashboard/inbox', icon: MessageSquare, label: 'Inbox' },
  { href: '/dashboard/numbers', icon: Phone, label: 'Numbers' },
  { href: '/dashboard/calls', icon: PhoneIncoming, label: 'Calls' },
  { href: '/dashboard/voicemail', icon: Voicemail, label: 'Voicemail' },
  { href: '/dashboard/verification', icon: ShieldCheck, label: 'Verification' },
  { href: '/dashboard/rentals', icon: Clock, label: 'Rentals' },
  { href: '/dashboard/credits', icon: CreditCard, label: 'Buy Credits' },
  { href: '/dashboard/api', icon: Key, label: 'API' },
  null, // divider
  { href: '/dashboard/vpn', icon: Wifi, label: 'VPN', badge: 'Beta' },
  { href: '/dashboard/esim', icon: Smartphone, label: 'eSIM', badge: 'Beta' },
  { href: '/dashboard/proxies', icon: Globe, label: 'Proxies', badge: 'Soon' },
  null,
  { href: '/dashboard/support', icon: HelpCircle, label: 'Support' },
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
        setSessionReady(true);
      } catch (error: any) {
        if (cancelled) return;
        toast.error(error.response?.data?.message || 'Unable to start your Burner Point API session.');
        clearApiSession();
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
      toast(`📞 Incoming call from ${data.from}`, { duration: 8000 });
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
        <div className="rounded-3xl border border-brand-green/20 bg-brand-green/10 px-6 py-5 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-brand-green">Burner Point</p>
          <p className="mt-2 text-sm text-white/60">Securing your Clerk session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-brand-black overflow-hidden">
      {/* Sidebar */}
      <aside className={clsx(
        'flex-shrink-0 flex flex-col bg-brand-dark border-r border-brand-border transition-all duration-300 z-30',
        sidebarOpen ? 'w-56' : 'w-0 overflow-hidden'
      )}>
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 h-16 border-b border-brand-border">
          <div className="w-7 h-7 rounded bg-brand-green flex items-center justify-center flex-shrink-0">
            <Shield size={14} className="text-black"/>
          </div>
          <span className="font-bold text-sm tracking-tight">BurnerPoint</span>
        </div>

        {/* Wallet badge */}
        <div className="px-3 py-3 border-b border-brand-border">
          <div className="bg-brand-black rounded-xl px-3 py-2.5 flex items-center justify-between">
            <span className="text-xs text-brand-muted">Balance</span>
            <span className="text-sm font-mono font-semibold text-brand-green">
              ₦{((user?.walletBalanceKobo || 0) / 100).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2 px-2">
          {NAV.map((item, i) => {
            if (!item) return <div key={i} className="my-2 border-t border-brand-border"/>;
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm mb-0.5 transition-all group',
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
          <div className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-brand-card cursor-pointer group">
            <div className="w-7 h-7 rounded-full bg-brand-green/20 border border-brand-green/30 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-brand-green">{(user?.firstName || clerkUser?.firstName || 'B')?.[0]?.toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{user?.firstName || clerkUser?.firstName}</p>
              <p className="text-[10px] text-brand-muted truncate">{user?.email || clerkUser?.primaryEmailAddress?.emailAddress}</p>
            </div>
            <button onClick={logout} className="text-brand-muted hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
              <LogOut size={13}/>
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 border-b border-brand-border flex items-center gap-4 px-6 flex-shrink-0">
          <button onClick={toggleSidebar} className="text-brand-muted hover:text-white transition-colors">
            {sidebarOpen ? <X size={18}/> : <Menu size={18}/>}
          </button>
          <div className="flex-1">
            <h2 className="text-sm font-semibold capitalize">
              {pathname.split('/').pop()?.replace('-', ' ') || 'Dashboard'}
            </h2>
          </div>
          <button className="text-brand-muted hover:text-white transition-colors">
            <Bell size={18}/>
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
