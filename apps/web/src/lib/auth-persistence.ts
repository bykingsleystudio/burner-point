export type AuthStorageMode = 'localStorage' | 'sessionStorage';

const REMEMBER_ME_KEY = 'burnerPointRememberMe';
const AUTH_STORAGE_MODE_KEY = 'burnerPointAuthStorageMode';

export function getRememberMePreference(): boolean {
  if (typeof window === 'undefined') return false;

  const value = window.localStorage.getItem(REMEMBER_ME_KEY);
  return value === 'true';
}

export function setRememberMePreference(enabled: boolean) {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(REMEMBER_ME_KEY, String(enabled));
  window.localStorage.setItem(AUTH_STORAGE_MODE_KEY, enabled ? 'localStorage' : 'sessionStorage');
}

export function resolveAuthStorageMode(): AuthStorageMode {
  if (typeof window === 'undefined') return 'sessionStorage';

  const remembered = window.localStorage.getItem(REMEMBER_ME_KEY) === 'true';
  const mode = window.localStorage.getItem(AUTH_STORAGE_MODE_KEY) ?? (remembered ? 'localStorage' : 'sessionStorage');

  return mode === 'localStorage' ? 'localStorage' : 'sessionStorage';
}

export function persistSupabaseSession(session: { access_token?: string; refresh_token?: string } | null | undefined) {
  if (typeof window === 'undefined' || !session) return;

  const mode = resolveAuthStorageMode();
  const storage = mode === 'localStorage' ? window.localStorage : window.sessionStorage;

  const accessToken = session.access_token;
  const refreshToken = session.refresh_token;

  if (accessToken) storage.setItem('sb-access-token', accessToken);
  if (refreshToken) storage.setItem('sb-refresh-token', refreshToken);
}
