'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { clearApiSession } from '@/lib/api';
import { exchangeSupabaseSession } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store';
import { BpLoadingState } from '@/components/design-system';
import { AppShell } from '@/components/app-shell';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const authCheckRef = useRef(false);
  const sessionExchangeRef = useRef<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { user: storedUser, clearAuth, updateUser } = useAuthStore();
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    if (authCheckRef.current) return;

    const checkAuth = async () => {
      try {
        authCheckRef.current = true;
        const sessionResult = await Promise.race([
          supabase.auth.getSession(),
          new Promise<never>((_, reject) => {
            window.setTimeout(() => reject(new Error('Auth session lookup timed out')), 8000);
          }),
        ]);
        const { data: { session } } = sessionResult;

        if (!session) {
          clearAuth();
          clearApiSession();
          router.replace('/sign-in');
          return;
        }

        let storedAccessToken: string | null = null;

        if (typeof window !== 'undefined') {
          storedAccessToken =
            window.sessionStorage.getItem('burnerpointApiAccessToken') ||
            window.sessionStorage.getItem('accessToken');
        }

        const sessionExchangeKey = `${session.user.id}:${session.access_token.slice(0, 16)}`;
        if ((!storedAccessToken || !storedUser) && sessionExchangeRef.current !== sessionExchangeKey) {
          sessionExchangeRef.current = sessionExchangeKey;
          const exchange = await exchangeSupabaseSession(session);
          storedAccessToken = exchange.accessToken;
          sessionExchangeRef.current = null;
        }

        if (storedAccessToken) {
          setAccessToken(storedAccessToken);
        }

        setLoading(false);
      } catch {
        clearAuth();
        clearApiSession();
        await supabase.auth.signOut();
        router.replace('/sign-in');
      }
    };

    void checkAuth();
  }, [clearAuth, router, storedUser]);

  useEffect(() => {
    if (!accessToken) return;

    const socket = io(`${process.env.NEXT_PUBLIC_WS_URL}/events`, {
      auth: { token: accessToken },
      transports: ['websocket'],
    });

    socket.on('message.received', (data) => {
      toast(
        <div>
          <p className="text-sm font-semibold text-[var(--bp-foreground)]">New message from {data.from}</p>
          <p className="mt-1 text-xs text-[var(--bp-foreground-muted)]">{data.body}</p>
        </div>,
        { duration: 5000 },
      );
    });

    socket.on('call.incoming', (data) => {
      toast.success(`Incoming call from ${data.from}`);
    });

    socket.on('messenger.call.updated', (data) => {
      window.dispatchEvent(new CustomEvent('bp:call-updated', { detail: data }));

      if (data?.status === 'completed') {
        toast.success(`Call completed • ${data.creditsSpent ?? 0} Call Credits used.`);
        return;
      }

      if (['failed', 'busy', 'no-answer', 'canceled'].includes(data?.status)) {
        toast.error(`Call ${String(data.status).replace(/-/g, ' ')}.`);
      }
    });

    socket.on('billing.balance.updated', (data) => {
      const wallet = data?.wallet;
      if (wallet) {
        updateUser({ walletBalanceUsdCents: wallet.balanceUsdCents ?? 0 });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [accessToken, updateUser]);

  if (loading) {
    return <BpLoadingState />;
  }

  return <AppShell>{children}</AppShell>;
}
