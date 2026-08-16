'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { synchronizeAuthSession } from '@/lib/auth-session-sync';
import { sanitizeRedirect } from '@/lib/auth';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const errorParam = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        if (errorParam) {
          throw new Error(errorDescription || errorParam);
        }

        const redirectParam = sanitizeRedirect(searchParams.get('redirect'));
        const hash = window.location.hash || '';
        const code = searchParams.get('code');

        if (code) {
          const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError || !exchangeData?.session) {
            throw new Error(exchangeError?.message || 'Failed to establish session from OAuth callback');
          }

          const result = await synchronizeAuthSession(exchangeData.session, {
            redirectTo: redirectParam,
          });

          if (!result.success) {
            throw new Error(result.error || 'Failed to sync authentication');
          }

          router.replace(result.redirectTo);
          return;
        }

        if (hash.includes('access_token')) {
          const hashParams = new URLSearchParams(hash.replace(/^#/, ''));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');

          if (accessToken && refreshToken) {
            const { data: setData, error: setError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (setError || !setData.session) {
              throw new Error(setError?.message || 'Failed to consume OAuth hash session');
            }

            const result = await synchronizeAuthSession(setData.session, {
              redirectTo: redirectParam,
            });

            if (!result.success) {
              throw new Error(result.error || 'Failed to sync authentication');
            }

            router.replace(result.redirectTo);
            return;
          }
        }

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
          throw new Error('Failed to establish session from OAuth callback');
        }

        const result = await synchronizeAuthSession(session, {
          redirectTo: redirectParam,
        });

        if (!result.success) {
          throw new Error(result.error || 'Failed to sync authentication');
        }

        router.replace(result.redirectTo);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Authentication callback failed';
        setError(message);
        toast.error(message);
        setTimeout(() => {
          router.push('/sign-in');
        }, 1500);
      } finally {
        setIsProcessing(false);
      }
    };

    void handleCallback();
  }, [router, searchParams]);

  if (isProcessing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          <p className="text-slate-400">Completing authentication...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="max-w-md text-center">
          <h1 className="mb-4 text-2xl font-bold text-red-400">Authentication Error</h1>
          <p className="mb-6 text-slate-400">{error}</p>
          <p className="text-sm text-slate-500">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  return null;
}
