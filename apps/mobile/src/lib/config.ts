/**
 * Central API / web URLs for the mobile app.
 * Override with EXPO_PUBLIC_* at build time (EAS env, .env).
 */
function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

function normalizeApiBaseUrl(url: string): string {
  const normalized = trimTrailingSlash(url);
  return /\/api$/i.test(normalized) ? normalized : `${normalized}/api`;
}

const PRODUCTION_API = 'https://api.burnerpoint.com';
const PRODUCTION_WEB = 'https://burnerpoint.com';

export const API_BASE_URL = normalizeApiBaseUrl(
  process.env.EXPO_PUBLIC_API_URL?.trim() || PRODUCTION_API,
);

export const WEB_APP_URL = trimTrailingSlash(
  process.env.EXPO_PUBLIC_WEB_URL?.trim() || PRODUCTION_WEB,
);

export const WEB_BILLING_URL = `${WEB_APP_URL}/dashboard/billing`;
