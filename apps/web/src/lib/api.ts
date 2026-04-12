import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://burner-point-api-production.up.railway.app/api';

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

const ACCESS_TOKEN_KEYS = ['burnerpointApiAccessToken', 'accessToken'];
const REFRESH_TOKEN_KEYS = ['burnerpointApiRefreshToken', 'refreshToken'];

function getStoredToken(keys: string[]) {
  if (typeof window === 'undefined') return null;
  for (const key of keys) {
    const token = localStorage.getItem(key);
    if (token) return token;
  }
  return null;
}

export function setApiSession(accessToken: string, refreshToken: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('burnerpointApiAccessToken', accessToken);
  localStorage.setItem('burnerpointApiRefreshToken', refreshToken);
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
  api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
  document.cookie = `accessToken=${accessToken}; path=/; max-age=900; SameSite=Lax`;
}

export function clearApiSession() {
  if (typeof window === 'undefined') return;
  [...ACCESS_TOKEN_KEYS, ...REFRESH_TOKEN_KEYS].forEach((key) => localStorage.removeItem(key));
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
