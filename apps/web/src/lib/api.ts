export type AuthTokens = { accessToken: string; refreshToken: string; userId: string };

export class ApiRequestError extends Error {
  status: number;
  technicalMessage: string;

  constructor(status: number, message: string, technicalMessage: string) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.technicalMessage = technicalMessage;
  }
}

function userFacingError(status: number, fallback: string) {
  if (status === 401) return 'Your session has expired. Sign in again to continue.';
  if (status === 403) return 'You do not have permission to do that with this account.';
  if (status === 404) return 'That information is no longer available.';
  if (status === 409) return 'This request conflicts with a recent account change. Refresh and try again.';
  if (status === 429) return 'Too many requests were made. Wait a moment and try again.';
  if (status >= 500) return 'The service is temporarily unavailable. Try again in a moment.';
  return fallback;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';
const inFlightGetRequests = new Map<string, Promise<unknown>>();

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

export async function verifyTurnstile(token: string) {
  return apiRequest<{ success: boolean }>('/auth/turnstile/verify', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}

export async function apiRequest<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const method = (init.method ?? 'GET').toUpperCase();
  if (method === 'GET' && retry) {
    const key = `${getAccessToken() ?? 'anonymous'}:${path}`;
    const existing = inFlightGetRequests.get(key);
    if (existing) return existing as Promise<T>;
    const request = requestApi<T>(path, init, retry);
    inFlightGetRequests.set(key, request);
    request.then(() => inFlightGetRequests.delete(key), () => inFlightGetRequests.delete(key));
    return request;
  }
  return requestApi<T>(path, init, retry);
}

async function requestApi<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  if (!API_URL) throw new ApiRequestError(0, 'This workspace is not connected to its service yet.', 'The web API URL is not configured.');
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
  if (!response.ok) {
    const technicalMessage = typeof body?.message === 'string' ? body.message : 'The request could not be completed.';
    throw new ApiRequestError(response.status, userFacingError(response.status, 'We could not complete that request. Check your details and try again.'), technicalMessage);
  }
  return body as T;
}

export async function signOut() {
  const refreshToken = getRefreshToken();
  if (refreshToken && API_URL) await fetch(`${API_URL}/auth/logout`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken }) }).catch(() => undefined);
  clearTokens();
}
