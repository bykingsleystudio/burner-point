export type AuthTokens = { accessToken: string; refreshToken: string; userId: string };

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

export function getAccessToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('bp_access_token');
}

export function getRefreshToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('bp_refresh_token');
}

export function storeTokens(tokens: AuthTokens) {
  window.localStorage.setItem('bp_access_token', tokens.accessToken);
  window.localStorage.setItem('bp_refresh_token', tokens.refreshToken);
  window.localStorage.setItem('bp_user_id', tokens.userId);
}

export function clearTokens() {
  window.localStorage.removeItem('bp_access_token');
  window.localStorage.removeItem('bp_refresh_token');
  window.localStorage.removeItem('bp_user_id');
}

export async function apiRequest<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  if (!API_URL) throw new Error('The web API URL is not configured.');
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  const accessToken = getAccessToken();
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  const response = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (response.status === 401 && retry) {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      const refreshed = await fetch(`${API_URL}/auth/refresh`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken }) });
      if (refreshed.ok) {
        storeTokens(await refreshed.json());
        return apiRequest<T>(path, init, false);
      }
      clearTokens();
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/sign-in')) window.location.href = `/sign-in?expired=1&next=${encodeURIComponent(window.location.pathname)}`;
    }
  }
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.message ?? 'The request could not be completed.');
  return body as T;
}

export async function signOut() {
  const refreshToken = getRefreshToken();
  if (refreshToken && API_URL) await fetch(`${API_URL}/auth/logout`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken }) }).catch(() => undefined);
  clearTokens();
}
