'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { buildPostAuthRedirect, exchangeSupabaseSession, sanitizeRedirect } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

/**
 * AuthSessionRouter
 * Only handles OAuth callback hash sessions (#access_token=...)
 * Email/phone sign-up and login are handled by their respective pages.
 * This prevents race conditions and double-exchange of sessions.
 */
export function AuthSessionRouter() {
  const router = useRouter();

  useEffect(() => {
    const consumeHashSession = async () => {
      // Only consume hash sessions (from OAuth callbacks or password recovery)
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

      // Clean up the hash from the URL
      const nextUrl = new URL(window.location.href);
      nextUrl.hash = '';
      window.history.replaceState({}, '', `${nextUrl.pathname}${nextUrl.search}`);

      // Set the session in Supabase
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (!error && data.session) {
        // Exchange Supabase session for Burner Point API session
        try {
          const redirectTo = sanitizeRedirect(new URLSearchParams(window.location.search).get('redirect'));
          const result = await exchangeSupabaseSession(data.session);
          router.replace(buildPostAuthRedirect(result, redirectTo));
        } catch (error) {
          // If exchange fails, stay on current page and show error to user
          // The page-level handler will show the error toast
          console.error('Session exchange failed:', error);
        }
      }
    };

    void consumeHashSession();
  }, [router]);

  return null;
}
