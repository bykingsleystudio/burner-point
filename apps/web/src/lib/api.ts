import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://burner-point-api-production.up.railway.app/api';

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

const ACCESS_TOKEN_KEYS = ['burnerpointApiAccessToken', 'accessToken'];
const REFRESH_TOKEN_KEYS = ['burnerpointApiRefreshToken', 'refreshToken'];
const LEGACY_TOKEN_KEYS = [...ACCESS_TOKEN_KEYS, ...REFRESH_TOKEN_KEYS];

function getStoredToken(keys: string[]) {
  if (typeof window === 'undefined') return null;
  for (const key of keys) {
    const token = sessionStorage.getItem(key);
    if (token) return token;
  }
  return null;
}

export function setApiSession(accessToken: string, refreshToken: string) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem('burnerpointApiAccessToken', accessToken);
  sessionStorage.setItem('burnerpointApiRefreshToken', refreshToken);
  sessionStorage.setItem('accessToken', accessToken);
  sessionStorage.setItem('refreshToken', refreshToken);
  LEGACY_TOKEN_KEYS.forEach((key) => localStorage.removeItem(key));
  api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
}

export function clearApiSession() {
  if (typeof window === 'undefined') return;
  LEGACY_TOKEN_KEYS.forEach((key) => {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  });
  delete api.defaults.headers.common.Authorization;
  document.cookie = 'accessToken=; max-age=0; path=/';
}

// Request interceptor: attach access token
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getStoredToken(ACCESS_TOKEN_KEYS);
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: auto-refresh on 401
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = getStoredToken(REFRESH_TOKEN_KEYS);
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        setApiSession(data.accessToken, data.refreshToken);

        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch {
        clearApiSession();
        window.location.href = '/auth/login';
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Typed API methods
export const authApi = {
  register: (data: Record<string, unknown>) => api.post('/auth/register', data),
  login: (data: Record<string, unknown>) => api.post('/auth/login', data),
  logout: (refreshToken: string) => api.post('/auth/logout', { refreshToken }),
  exchangeClerkToken: (clerkToken: string, profile?: Record<string, unknown>) =>
    api.post('/auth/clerk/exchange', { clerkToken, profile }),
};

export const numbersApi = {
  search: (country: string, areaCode?: string) =>
    api.get('/numbers/search', { params: { country, areaCode } }),
  provision: (data: { phoneNumber: string; type: string; countryCode: string }) =>
    api.post('/numbers/provision', data),
  list: () => api.get('/numbers'),
  get: (id: string) => api.get(`/numbers/${id}`),
  renew: (id: string) => api.post(`/numbers/${id}/renew`),
  release: (id: string) => api.delete(`/numbers/${id}`),
};

export const messagesApi = {
  list: (phoneNumberId: string) => api.get('/messages', { params: { phoneNumberId } }),
  send: (data: { to: string; from: string; body: string }) => api.post('/messages', data),
  markRead: (id: string) => api.patch(`/messages/${id}/read`),
};

export type PaymentGatewayId =
  | 'flutterwave'
  | 'paystack'
  | 'squad'
  | 'korapay'
  | 'opay'
  | 'paddle'
  | 'nowpayments';

export type PaymentType = 'credits' | 'rental' | 'subscription';

export interface InitPaymentParams {
  paymentType: PaymentType;
  gateway: PaymentGatewayId;
  rentalDays?: number; // Only for rental payments
  packageId?: string;
  clientPlatform?: 'web' | 'mobile';
}

export interface PaymentResponse {
  checkoutUrl: string;
  reference: string;
  amount: number;
  currency: string;
}

export const paymentsApi = {
  packages: () => api.get('/payments/packages'),
  initialize: (data: InitPaymentParams) =>
    api.post<PaymentResponse>('/payments/initialize', data),
  history: () => api.get('/payments/history'),
};

export const phoneAuthApi = {
  send: (data: { phoneNumber: string; channel: 'sms' | 'call' }) =>
    api.post<{ success: boolean; channel: string; expiresInMinutes: number }>('/phone-auth/send', data),
  verify: (data: { phoneNumber: string; code: string }) =>
    api.post<{ success: boolean; phoneNumber: string }>('/phone-auth/verify', data),
};

export type StackIntegrationStatus =
  | 'ready'
  | 'configured'
  | 'partial'
  | 'missing_env'
  | 'planned'
  | 'deferred'
  | 'disabled';

export type StackCategory =
  | 'frontend'
  | 'backend'
  | 'data'
  | 'auth'
  | 'payments'
  | 'telecom'
  | 'connectivity'
  | 'privacy'
  | 'observability'
  | 'operations';

export interface StackIntegrationSnapshot {
  id: string;
  name: string;
  category: StackCategory;
  priority: 'core' | 'primary' | 'fallback' | 'secondary' | 'supporting' | 'planned';
  exposure: 'public-client' | 'server-only' | 'deployment' | 'operator-tooling';
  role: string;
  productSurface: string;
  status: StackIntegrationStatus;
  requiredEnv: Array<{ name: string; configured: boolean }>;
  optionalEnv: Array<{ name: string; configured: boolean }>;
}

export interface PlatformStackSnapshot {
  product: 'Burner Point';
  generatedAt: string;
  environment: string;
  policies: {
    webHosting: 'Vercel';
    apiHosting: 'Railway';
    database: 'Neon Postgres';
    mobileDelivery: 'Expo / EAS';
    primaryPayments: readonly string[];
    secondaryPayments: readonly string[];
    secondaryGatewaysEnabled: boolean;
    mobileExternalPaymentsEnabled: boolean;
    conversationScope: 'US/Canada only';
    verificationScope: 'Global SMS and voice';
    aiKillSwitchEnabled: boolean;
  };
  summary: Record<StackIntegrationStatus, number> & { total: number };
  groups: Partial<Record<StackCategory, StackIntegrationSnapshot[]>>;
  integrations: StackIntegrationSnapshot[];
}

export const platformApi = {
  stack: () => api.get<PlatformStackSnapshot>('/platform/stack'),
  readiness: () => api.get('/platform/readiness'),
};

export const usersApi = {
  me: () => api.get('/users/me'),
  update: (data: Record<string, unknown>) => api.patch('/users/me', data),
  wallet: () => api.get('/users/me/wallet'),
};

export const developerApi = {
  keys: () => api.get('/developer/keys'),
  createKey: (data: { name: string; scopes: string[] }) => api.post('/developer/keys', data),
  revokeKey: (id: string) => api.delete(`/developer/keys/${id}`),
  webhooks: () => api.get('/developer/webhooks'),
  createWebhook: (data: { name: string; url: string; events: string[] }) =>
    api.post('/developer/webhooks', data),
};
