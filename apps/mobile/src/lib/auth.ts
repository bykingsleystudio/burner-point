import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import type { Session } from '@supabase/supabase-js';
import { API_BASE_URL } from './config';
import { supabase } from './supabase';

const SECURE_STORE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

const API_ACCESS_TOKEN_TTL_MS = 14 * 60 * 1000;

export type BurnerProfile = Partial<{
  email: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  country: string;
  acceptTerms: boolean;
  acceptPrivacy: boolean;
}>;

type BurnerAuthExchangeResponse = {
  accessToken: string;
  refreshToken: string;
  userId: string;
  user?: {
    phoneNumber?: string;
    phoneVerified?: boolean;
    [key: string]: unknown;
  };
  needsOnboarding?: boolean;
  needsPhoneVerification?: boolean;
  onboarding?: {
    complete: boolean;
    missingFields: string[];
  };
};

async function persistApiSession(accessToken: string, refreshToken: string) {
  await SecureStore.setItemAsync('accessToken', accessToken, SECURE_STORE_OPTIONS);
  await SecureStore.setItemAsync('refreshToken', refreshToken, SECURE_STORE_OPTIONS);
  await SecureStore.setItemAsync('accessTokenIssuedAt', String(Date.now()), SECURE_STORE_OPTIONS);
}

async function readApiSession() {
  const [accessToken, refreshToken, issuedAtRaw] = await Promise.all([
    SecureStore.getItemAsync('accessToken', SECURE_STORE_OPTIONS),
    SecureStore.getItemAsync('refreshToken', SECURE_STORE_OPTIONS),
    SecureStore.getItemAsync('accessTokenIssuedAt', SECURE_STORE_OPTIONS),
  ]);

  return {
    accessToken,
    refreshToken,
    issuedAtMs: issuedAtRaw ? Number(issuedAtRaw) : NaN,
  };
}

function hasFreshApiToken(accessToken?: string | null, issuedAtMs?: number) {
  if (!accessToken || !issuedAtMs || Number.isNaN(issuedAtMs)) return false;
  return Date.now() - issuedAtMs < API_ACCESS_TOKEN_TTL_MS;
}

export async function exchangeSupabaseSession(session: Session, profile?: BurnerProfile) {
  if (!session.access_token) throw new Error('Missing Supabase access token.');

  const { data } = await axios.post<BurnerAuthExchangeResponse>(`${API_BASE_URL}/auth/supabase/exchange`, {
    accessToken: session.access_token,
    profile,
  });

  await persistApiSession(data.accessToken, data.refreshToken);
  return data;
}

async function refreshApiAccessToken(refreshToken: string) {
  const { data } = await axios.post<Pick<BurnerAuthExchangeResponse, 'accessToken' | 'refreshToken'>>(
    `${API_BASE_URL}/auth/refresh`,
    { refreshToken },
  );
  await persistApiSession(data.accessToken, data.refreshToken);
  return data.accessToken;
}

export async function getApiAccessToken(profile?: BurnerProfile, sessionOverride?: Session | null) {
  const { accessToken, refreshToken, issuedAtMs } = await readApiSession();
  if (hasFreshApiToken(accessToken, issuedAtMs)) {
    return accessToken as string;
  }

  if (refreshToken) {
    try {
      return await refreshApiAccessToken(refreshToken);
    } catch {
      await clearApiSession();
    }
  }

  const { data, error } = sessionOverride
    ? { data: { session: sessionOverride }, error: null }
    : await supabase.auth.getSession();

  if (error || !data.session) {
    throw new Error('Sign in again to continue.');
  }

  const exchanged = await exchangeSupabaseSession(data.session, profile);
  return exchanged.accessToken;
}

export async function clearApiSession() {
  await Promise.all([
    SecureStore.deleteItemAsync('accessToken', SECURE_STORE_OPTIONS),
    SecureStore.deleteItemAsync('refreshToken', SECURE_STORE_OPTIONS),
    SecureStore.deleteItemAsync('accessTokenIssuedAt', SECURE_STORE_OPTIONS),
  ]);
}

async function createSessionFromUrl(url: string) {
  const { params, errorCode } = QueryParams.getQueryParams(url);
  if (errorCode) {
    throw new Error(errorCode);
  }

  const accessToken = typeof params.access_token === 'string' ? params.access_token : '';
  const refreshToken = typeof params.refresh_token === 'string' ? params.refresh_token : '';

  if (!accessToken || !refreshToken) {
    throw new Error('OAuth redirect did not return a usable session.');
  }

  const { data, error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (error || !data.session) {
    throw error ?? new Error('Unable to establish a Supabase session.');
  }

  return data.session;
}

export async function startOAuthSignIn(provider: 'google' | 'apple' | 'microsoft') {
  const oauthProvider = provider === 'microsoft' ? 'azure' : provider;
  const redirectTo = makeRedirectUri({ scheme: 'burnerpoint' });
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: oauthProvider,
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error) {
    throw error;
  }

  if (!data?.url) {
    throw new Error('OAuth provider did not return a login URL.');
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success' || !result.url) {
    throw new Error('Sign-in was cancelled before completion.');
  }

  return createSessionFromUrl(result.url);
}
