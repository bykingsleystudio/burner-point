import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://burner-point-api-production.up.railway.app/api';

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach access token
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
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
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);

        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch {
        localStorage.clear();
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
