import type { Session } from '@supabase/supabase-js';
import { authApi, setApiSession, type AuthExchangeResponse } from '@/lib/api';
import { useAuthStore } from '@/store';

export function sanitizeRedirect(value?: string | null) {
  if (value && value.startsWith('/') && !value.startsWith('//')) return value;
  return '/dashboard';
}

export async function exchangeSupabaseSession(
  session: Session,
  profile?: Record<string, unknown>,
) {
  const { data } = await authApi.exchangeSupabaseToken(session.access_token, profile);
  setApiSession(data.accessToken, data.refreshToken);
  useAuthStore.getState().setAuth(data.user, data.accessToken, data.refreshToken);
  return data;
}

export function buildPostAuthRedirect(
  result: AuthExchangeResponse,
  redirectTo?: string | null,
) {
  const safeRedirect = sanitizeRedirect(redirectTo);

  if (result.needsOnboarding) {
    return `/onboarding?redirect=${encodeURIComponent(safeRedirect)}`;
  }

  if (result.needsPhoneVerification && result.user?.phoneNumber) {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('burnerPointPendingPhone', result.user.phoneNumber);
    }
    return `/verify-phone?redirect=${encodeURIComponent(safeRedirect)}`;
  }

  return safeRedirect;
}

export function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}
