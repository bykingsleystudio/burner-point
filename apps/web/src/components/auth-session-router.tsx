'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { buildPostAuthRedirect, exchangeSupabaseSession, sanitizeRedirect } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

const AUTH_ROUTE_SET = new Set([
  '/sign-in',
  '/sign-up',
  '/forgot-password',
  '/reset-password',
  '/update-password',
  '/auth/callback',
]);

export function AuthSessionRouter() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const consumeHashSession = async () => {
      const hash = window.location.hash;
      if (!hash || !hash.includes('access_token')) {
        return;
      }

      const params = new URLSearchParams(hash.replace(/^#/, ''));
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (!accessToken || !refreshToken) {
        return;
      }

      const nextUrl = new URL(window.location.href);
      nextUrl.hash = '';
      window.history.replaceState({}, '', `${nextUrl.pathname}${nextUrl.search}`);

      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (!error && data.session) {
        const redirectTo = sanitizeRedirect(new URLSearchParams(window.location.search).get('redirect'));
        const result = await exchangeSupabaseSession(data.session);
        router.replace(buildPostAuthRedirect(result, redirectTo));
      }
    };

    void consumeHashSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!session || !['SIGNED_IN', 'INITIAL_SESSION'].includes(event)) {
        return;
      }

      const isAuthRoute = AUTH_ROUTE_SET.has(pathname);
      if (!isAuthRoute) {
        return;
      }

      try {
        const redirectTo = sanitizeRedirect(new URLSearchParams(window.location.search).get('redirect'));
        const result = await exchangeSupabaseSession(session);
        router.replace(buildPostAuthRedirect(result, redirectTo));
      } catch {
        router.replace('/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [pathname, router]);

  return null;
}
