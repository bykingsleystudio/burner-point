/**
 * Centralized auth session synchronizer for Burner Point
 * 
 * All authentication flows (email, phone OTP, Google OAuth) converge here.
 * This ensures consistent provisioning, onboarding determination, and routing.
 * 
 * Architecture:
 * 1. Supabase auth establishes a session (email/phone/Google)
 * 2. This synchronizer receives the session
 * 3. It exchanges the Supabase session for app tokens
 * 4. It fetches onboarding state from the app user
 * 5. It routes to /onboarding or /dashboard based on that state
 */

import { Session } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { exchangeSupabaseSession, buildPostAuthRedirect, getErrorMessage, sanitizeRedirect } from '@/lib/auth';

interface AuthSyncResult {
  success: boolean;
  redirectTo: string;
  error?: string;
}

const pendingSessionSyncs = new Map<string, Promise<AuthSyncResult>>();

function getSessionSyncKey(session: Session): string {
  const userId = session.user?.id ?? 'unknown-user';
  const accessToken = session.access_token ?? '';
  return `${userId}:${accessToken.slice(0, 32)}:${accessToken.length}`;
}

/**
 * Exchange a Supabase session for app tokens and determine post-auth route.
 * This is the single source of truth for all auth flows.
 */
export async function synchronizeAuthSession(
  session: Session,
  options?: {
    redirectTo?: string;
    profileData?: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phoneNumber?: string;
      country?: string;
      acceptTerms?: boolean;
      acceptPrivacy?: boolean;
    };
  }
): Promise<AuthSyncResult> {
  if (!session?.access_token) {
    return {
      success: false,
      redirectTo: '/sign-in',
      error: 'No active Supabase session',
    };
  }

  const syncKey = getSessionSyncKey(session);
  const existing = pendingSessionSyncs.get(syncKey);
  if (existing) {
    return existing;
  }

  const syncPromise = (async (): Promise<AuthSyncResult> => {
    try {
      const result = await exchangeSupabaseSession(session, options?.profileData);

      // Determine routing based on onboarding state
      const redirectTo = buildPostAuthRedirect(
        result,
        sanitizeRedirect(options?.redirectTo) || '/dashboard'
      );

      return {
        success: true,
        redirectTo,
      };
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error, 'Authentication failed');
      return {
        success: false,
        redirectTo: '/sign-in',
        error: errorMessage,
      };
    }
  })();

  pendingSessionSyncs.set(syncKey, syncPromise);

  try {
    return await syncPromise;
  } finally {
    pendingSessionSyncs.delete(syncKey);
  }
}

/**
 * Hook to consume an active Supabase session and sync with app
 * Useful after OAuth callbacks or direct session establishment
 */
export function useAuthSessionSync(
  session: Session | null,
  options?: {
    redirectTo?: string;
    enabled?: boolean;
    onError?: (error: string) => void;
  }
) {
  const router = useRouter();
  const syncedRef = useRef(false);
  const syncInProgressRef = useRef(false);

  useEffect(() => {
    if (!session || !options?.enabled) return;

    // Prevent double-sync (React strict mode, etc)
    if (syncInProgressRef.current || syncedRef.current) return;

    const performSync = async () => {
      syncInProgressRef.current = true;
      try {
        const result = await synchronizeAuthSession(session, {
          redirectTo: options?.redirectTo,
        });

        if (result.success) {
          syncedRef.current = true;
          router.push(result.redirectTo);
        } else {
          options?.onError?.(result.error || 'Sync failed');
          toast.error(result.error || 'Authentication sync failed');
        }
      } finally {
        syncInProgressRef.current = false;
      }
    };

    performSync();
  }, [session, options?.redirectTo, options?.enabled, router, options?.onError]);
}

/**
 * Hook for manual auth completion (e.g., in sign-up or login pages)
 * Returns a function to call when auth is complete
 */
export function useManualAuthCompletion() {
  const router = useRouter();

  return useCallback(
    async (
      session: Session,
      options?: {
        redirectTo?: string;
        profileData?: {
          firstName?: string;
          lastName?: string;
          email?: string;
          phoneNumber?: string;
          country?: string;
          acceptTerms?: boolean;
          acceptPrivacy?: boolean;
        };
      }
    ) => {
      const result = await synchronizeAuthSession(session, options);

      if (!result.success) {
        throw new Error(result.error || 'Authentication sync failed');
      }

      router.push(result.redirectTo);
    },
    [router]
  );
}
