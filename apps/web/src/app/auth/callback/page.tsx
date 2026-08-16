'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { synchronizeAuthSession } from '@/lib/auth-session-sync';
import { sanitizeRedirect } from '@/lib/auth';

/**
 * Unified auth callback handler
 * 
 * Handles:
 * - OAuth provider redirects (Google, Apple, Microsoft)
 * - Manual hash-based session URLs
 * - Session establishment and app user provisioning
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check for OAuth error
        const errorParam = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        if (errorParam) {
          throw new Error(errorDescription || errorParam);
        }

        // Extract redirect target from query params (for safety)
        const redirectTo = sanitizeRedirect(searchParams.get('redirect'));

        // Step 1: Let Supabase consume the OAuth callback
        // This handles the code/state exchange and creates the session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
          throw new Error('Failed to establish session from OAuth callback');
        }

        // Step 2: Synchronize the session with the app user
        const result = await synchronizeAuthSession(session, {
          redirectTo: redirectTo || '/dashboard',
        });

        if (!result.success) {
          throw new Error(result.error || 'Failed to sync authentication');
        }

        // Step 3: Route to the determined destination
        // (onboarding or dashboard based on account state)
        router.push(result.redirectTo);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Authentication callback failed';
        setError(message);
        toast.error(message);
        
        // Fall back to sign-in after showing error
        setTimeout(() => {
          router.push('/sign-in');
        }, 2000);
      } finally {
        setIsProcessing(false);
      }
    };

    handleCallback();
  }, [searchParams, router]);

  if (isProcessing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <div className="h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto" />
          </div>
          <p className="text-slate-400">Completing authentication...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Authentication Error</h1>
          <p className="text-slate-400 mb-6">{error}</p>
          <p className="text-sm text-slate-500">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  return null;
}
