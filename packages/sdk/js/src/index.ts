/**
 * BurnerPoint JavaScript/TypeScript SDK
 * @version 1.0.0
 */
import type { PhoneNumber, Message, CreditPackage } from '@burner-point/shared';

export interface BurnerPointConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
}

export interface MessagePage<TMessage = Message> {
  data: TMessage[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  unreadCount: number;
}

function normalizeBaseUrl(baseUrl: string): string {
  const normalized = baseUrl.replace(/\/+$/, '');
  return /\/api$/i.test(normalized) ? normalized : `${normalized}/api`;
}

class BurnerPointError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'BurnerPointError';
  }
}

export class BurnerPoint {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeout: number;

  constructor(config: BurnerPointConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = normalizeBaseUrl(config.baseUrl || 'https://api.burnerpoint.com');
    this.timeout = config.timeout || 30000;
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), this.timeout);

    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      const data = await res.json();
      if (!res.ok) throw new BurnerPointError(res.status, data.message || 'Request failed');
      return data as T;
    } finally {
      clearTimeout(tid);
    }
  }

  /** Numbers API */
  numbers = {
    /** Search available numbers in a country */
    search: (country: string, areaCode?: string) =>
      this.request<{ number: string; countryCode: string }[]>('GET', `/numbers/search?country=${country}${areaCode ? `&areaCode=${areaCode}` : ''}`),

    /** Provision a number */
    provision: (phoneNumber: string, type: 'burner' | 'rental' | 'verification', countryCode: string) =>
      this.request<PhoneNumber>('POST', '/numbers/provision', { phoneNumber, type, countryCode }),

    /** List provisioned numbers */
    list: () => this.request<PhoneNumber[]>('GET', '/numbers'),

    /** Get specific number */
    get: (id: string) => this.request<PhoneNumber>('GET', `/numbers/${id}`),

    /** Renew a number */
    renew: (id: string) => this.request<PhoneNumber>('POST', `/numbers/${id}/renew`),

    /** Release a number */
    release: (id: string) => this.request<{ success: boolean }>('DELETE', `/numbers/${id}`),
  };

  /** Messages API */
  messages = {
    /** List messages for a number */
    list: (phoneNumberId: string, page = 1, limit = 50) =>
      this.request<MessagePage>('GET', `/messages?phoneNumberId=${encodeURIComponent(phoneNumberId)}&page=${page}&limit=${limit}`),

    /** Retrieve one conversation for an owned number. */
    conversation: (phoneNumberId: string, counterpart: string, page = 1, limit = 50) =>
      this.request<MessagePage>('GET', `/messages/conversations/${encodeURIComponent(phoneNumberId)}/${encodeURIComponent(counterpart)}?page=${page}&limit=${limit}`),

    /** Send an SMS */
    send: (to: string, from: string, body: string) =>
      this.request<Message>('POST', '/messages', { to, from, body }),

    /** Mark an inbound message as read. */
    markRead: (id: string) => this.request<Message>('PATCH', `/messages/${encodeURIComponent(id)}/read`),
  };

  /** Payments API */
  payments = {
    /** List credit packages */
    packages: () => this.request<CreditPackage[]>('GET', '/payments/packages'),

    /** Initialize a payment */
    initialize: (packageId: string, gateway: string) =>
      this.request<{ reference: string; checkoutUrl: string }>('POST', '/payments/initialize', { packageId, gateway }),
  };

  /** Wallet API */
  wallet = {
    balance: () => this.request<{ balanceUsdCents: number; balanceUsd: number; displayCurrency: 'USD' }>('GET', '/users/me/wallet'),
  };
}

export default BurnerPoint;
export { BurnerPointError };
export type { PhoneNumber, Message, CreditPackage };
