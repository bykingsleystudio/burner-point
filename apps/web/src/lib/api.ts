import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

function normalizeApiBaseUrl(url: string): string {
  const normalized = trimTrailingSlash(url);
  return /\/api$/i.test(normalized) ? normalized : `${normalized}/api`;
}

const apiOrigin = process.env.NEXT_PUBLIC_API_URL || 'https://api.burnerpoint.com';

const API_URL = normalizeApiBaseUrl(apiOrigin);

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
        window.location.href = '/sign-in';
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export default api;

export interface AuthExchangeResponse {
  accessToken: string;
  refreshToken: string;
  userId: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    country?: string;
    walletBalanceUsdCents: number;
    walletBalanceUsd?: number;
    walletDisplayCurrency?: 'USD';
    phoneNumber?: string;
    phoneVerified?: boolean;
    referralCode?: string;
    [key: string]: unknown;
  };
  needsOnboarding: boolean;
  needsPhoneVerification: boolean;
  onboarding: {
    complete: boolean;
    missingFields: string[];
  };
}

// Typed API methods
export const authApi = {
  register: (data: Record<string, unknown>) => api.post('/auth/register', data),
  login: (data: Record<string, unknown>) => api.post('/auth/login', data),
  logout: (refreshToken: string) => api.post('/auth/logout', { refreshToken }),
  exchangeSupabaseToken: (accessToken: string, profile?: Record<string, unknown>) =>
    api.post<AuthExchangeResponse>('/auth/supabase/exchange', { accessToken, profile }),
  verifyTurnstile: (token: string) => api.post('/auth/turnstile/verify', { token }),
  inviteUser: (email: string, redirectTo?: string) => api.post('/auth/invite', { email, redirectTo }),
  twoFactorStatus: () => api.get<{ enabled: boolean }>('/auth/2fa/status'),
  setupTwoFactor: () => api.post<{ enabled: boolean; secret: string; otpauthUrl: string; qrCodeDataUrl: string }>('/auth/2fa/setup'),
  enableTwoFactor: (code: string) => api.post<{ enabled: boolean }>('/auth/2fa/verify', { code }),
  disableTwoFactor: (code: string) => api.post<{ enabled: boolean }>('/auth/2fa/disable', { code }),
  sessions: () => api.get('/auth/sessions'),
  revokeSession: (id: string) => api.post(`/auth/sessions/${id}/revoke`),
  revokeAllSessions: () => api.post('/auth/sessions/revoke-all'),
  passkeys: () => api.get('/auth/passkeys'),
  passkeyRegistrationOptions: () => api.get('/auth/passkeys/registration/options'),
  verifyPasskeyRegistration: (response: Record<string, unknown>, name?: string) =>
    api.post('/auth/passkeys/registration/verify', { response, name }),
  removePasskey: (id: string) => api.delete(`/auth/passkeys/${id}`),
  passkeyAuthenticationOptions: () => api.get('/auth/passkey-authentication/options'),
  verifyPasskeyAuthentication: (response: Record<string, unknown>) => api.post('/auth/passkey-authentication/verify', response),
};

export type FxRateResponse = {
  available: boolean;
  baseCurrency: 'USD';
  quoteCurrency: string;
  rate?: number;
  provider?: string;
  providerTimestamp?: string;
  fetchedAt?: string;
  expiresAt?: string;
  cached?: boolean;
};

export const fxApi = {
  currencyForCountry: (country?: string) =>
    api.get<{ countryCode: string | null; currency: string; metadata: { code: string; name: string; symbol: string } }>(
      '/fx/currency-for-country',
      { params: country ? { country } : {} },
    ),
  rate: (currency: string) => api.get<FxRateResponse>('/fx/rates', { params: { currency } }),
};

export const supportApi = {
  contact: (data: {
    name: string;
    email: string;
    message: string;
    product?: string;
    reference?: string;
    source?: string;
  }) => api.post<{ accepted: boolean }>('/messaging/support/contact', data),
  tickets: (status?: 'open' | 'in_progress' | 'resolved' | 'closed') =>
    api.get('/support/tickets', { params: status ? { status } : {} }),
  ticket: (id: string) => api.get(`/support/tickets/${id}`),
  createTicket: (data: {
    category: 'account' | 'billing' | 'verification' | 'rental' | 'messenger' | 'esim' | 'proxy' | 'vpn' | 'security' | 'other';
    product?: string;
    subject: string;
    message: string;
    priority?: 'normal' | 'high' | 'urgent';
    reference?: string;
  }) => api.post('/support/tickets', data),
  reply: (id: string, message: string) => api.post(`/support/tickets/${id}/replies`, { message }),
  feedback: (data: { rating: number; message: string; reference?: string }) => api.post('/support/feedback', data),
};

export const growthApi = {
  referralStats: () => api.get<{ totalReferrals: number; totalEarnedUsdCents: number }>('/growth/referral/stats'),
};

export const numbersApi = {
  search: (country: string, areaCode?: string, type?: 'burner' | 'rental' | 'verification' | 'enterprise') =>
    api.get('/numbers/search', { params: { country, areaCode, type } }),
  provision: (data: { phoneNumber: string; type: string; countryCode: string; durationDays?: number; idempotencyKey?: string }) =>
    api.post('/numbers/provision', data),
  list: () => api.get('/numbers'),
  get: (id: string) => api.get(`/numbers/${id}`),
  renew: (id: string) => api.post(`/numbers/${id}/renew`),
  release: (id: string) => api.delete(`/numbers/${id}`),
};

export const messagesApi = {
  list: (phoneNumberId: string, page = 1, limit = 50) =>
    api.get<MessageListResponse>('/messages', { params: { phoneNumberId, page, limit } }),
  conversation: (phoneNumberId: string, counterpart: string, page = 1, limit = 50) =>
    api.get<MessageListResponse>(`/messages/conversations/${phoneNumberId}/${encodeURIComponent(counterpart)}`, { params: { page, limit } }),
  send: (data: { to: string; from: string; body: string; mediaUrls?: string[] }) => api.post('/messages', data),
  markRead: (id: string) => api.patch(`/messages/${id}/read`),
};

export const storageApi = {
  uploadIntent: (data: { purpose: 'mms' | 'voicemail' | 'support_attachment' | 'document' | 'export'; fileName: string; contentType: string; byteSize: number }) => api.post('/integrations/storage/upload-intents', data),
  signedReadUrl: (data: { bucket: string; objectKey: string }) => api.post<{ signedUrl: string }>('/integrations/storage/signed-read-url', data),
};

export interface MessageRecord {
  id: string;
  from: string;
  to: string;
  body: string;
  direction: 'inbound' | 'outbound';
  status: 'pending' | 'queued' | 'sent' | 'delivered' | 'failed' | 'received' | 'read';
  providerMessageSid?: string;
  phoneNumberId?: string;
  userId?: string;
  readAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  extractedOtp?: string;
  isSpam?: boolean;
}

export interface MessageListResponse {
  data: MessageRecord[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  unreadCount: number;
}

export type PaymentGatewayId =
  | 'flutterwave'
  | 'paystack'
  | 'korapay'
  | 'paddle'
  | 'nowpayments';

export type PaymentType = 'wallet' | 'rental' | 'subscription' | 'credits';

export interface InitPaymentParams {
  paymentType: PaymentType;
  gateway: PaymentGatewayId;
  rentalDays?: number; // Only for rental payments
  packageId?: string;
  planId?: string;
  phoneNumber?: string;
  countryCode?: string;
  numberType?: 'burner' | 'rental' | 'verification' | 'enterprise';
  clientPlatform?: 'web' | 'mobile';
}

export interface PaymentResponse {
  checkoutUrl: string;
  reference: string;
  amount: number;
  currency: string;
  gateway?: PaymentGatewayId;
  paymentType?: PaymentType;
  expiresAt?: string;
}

export const paymentsApi = {
  packages: () => api.get('/payments/packages'),
  initialize: (data: InitPaymentParams) =>
    api.post<PaymentResponse>('/payments/initialize', data),
  history: () => api.get('/payments/history'),
};

export const walletApi = {
  balance: () => api.get('/wallet/balance'),
  transactions: (page = 1, limit = 20) => api.get('/wallet/transactions', { params: { page, limit } }),
};

export const callCreditsApi = {
  balance: () => api.get('/messenger/call-credits/balance'),
  packages: () => api.get('/messenger/call-credits/packages'),
  purchase: (data: { packageId: string; idempotencyKey: string }) => api.post('/messenger/call-credits/purchase', data),
  transactions: (page = 1, limit = 20) => api.get('/messenger/call-credits/transactions', { params: { page, limit } }),
  rates: () => api.get('/messenger/call-credits/rates'),
};

export const callsApi = {
  start: (data: { to: string; fromNumberId?: string; preferredProvider?: string; idempotencyKey: string }) =>
    api.post('/messenger/calls/start', data),
  list: (page = 1, limit = 20) => api.get('/messenger/calls', { params: { page, limit } }),
  get: (id: string) => api.get(`/messenger/calls/${id}`),
};

export const billingApi = {
  overview: () => api.get('/billing/overview'),
  ledger: (page = 1, limit = 20) => api.get('/billing/ledger', { params: { page, limit } }),
  plans: () => api.get('/billing/plans'),
  subscription: () => api.get('/billing/subscription'),
  entitlements: () => api.get('/billing/entitlements'),
  refreshEntitlements: () => api.post('/billing/entitlements/refresh'),
};

export const phoneAuthApi = {
  send: (data: { phoneNumber: string; channel: 'sms' | 'call' }) =>
    api.post<{
      success: boolean;
      channel: string;
      phoneNumber: string;
      status: 'pending';
      expiresInMinutes: number;
      expiresAt: string;
      attemptsRemaining: number;
    }>('/phone-auth/send', data),
  verify: (data: { phoneNumber: string; code: string }) =>
    api.post<{ success: boolean; phoneNumber: string; status: 'approved'; redirectTo: string }>('/phone-auth/verify', data),
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
    database: 'Supabase Postgres';
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
  delete: () => api.delete('/users/me'),
};

export const developerApi = {
  keys: () => api.get('/developer/keys'),
  createKey: (data: { name: string; scopes: string[] }) => api.post('/developer/keys', data),
  revokeKey: (id: string) => api.delete(`/developer/keys/${id}`),
  webhooks: () => api.get('/developer/webhooks'),
  createWebhook: (data: { name: string; url: string; events: string[] }) =>
    api.post('/developer/webhooks', data),
  deleteWebhook: (id: string) => api.delete(`/developer/webhooks/${id}`),
};

export const integrationsApi = {
  catalog: () => api.get('/integrations/catalog'),
  esimPlans: (data: { countryCode: string; region?: string }) =>
    api.post('/integrations/esim/plans', data),
  esimOrders: () => api.get('/integrations/esim/orders'),
  esimOrder: (data: { planId: string; countryCode: string; iccid?: string; idempotencyKey?: string }) =>
    api.post('/integrations/esim/orders', data),
  proxyOrders: () => api.get('/integrations/proxies/orders'),
  proxyOrder: (data: { region: string; type: 'residential' | 'mobile'; durationDays?: number; idempotencyKey?: string }) =>
    api.post('/integrations/proxies/orders', data),
  vpnSessions: () => api.get('/integrations/vpn/sessions'),
  vpnSession: (data: { deviceName: string; region?: string; idempotencyKey?: string }) =>
    api.post('/integrations/vpn/sessions', data),
};

export const verificationHubApi = {
  services: (country?: string) => api.get('/verify-hub/services', { params: country ? { country } : {} }),
  orders: () => api.get('/verify-hub/orders'),
  createOrder: (data: {
    channel: 'sms' | 'voice';
    serviceCode: string;
    countryCode: string;
    phoneNumber: string;
    areaCode?: string;
    carrier?: string;
    tier: 'premium' | 'standard' | 'economy';
    idempotencyKey: string;
  }) => api.post('/verify-hub/orders', data),
  cancelOrder: (id: string) => api.delete(`/verify-hub/orders/${id}`),
};
