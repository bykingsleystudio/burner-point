/**
 * @burner-point/shared — Shared TypeScript types across all apps
 */

// ─── User Types ─────────────────────────────────────────────────────────────
export type UserRole = 'user' | 'admin' | 'enterprise';
export type UserStatus = 'active' | 'suspended' | 'banned' | 'pending';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName?: string;
  role: UserRole;
  status: UserStatus;
  walletBalanceKobo: number;
  emailVerified: boolean;
  phoneVerified: boolean;
  referralCode?: string;
  country?: string;
  createdAt: string;
}

// ─── Phone Number Types ──────────────────────────────────────────────────────
export type NumberStatus = 'active' | 'expired' | 'released' | 'suspended';
export type NumberType = 'burner' | 'rental' | 'verification' | 'enterprise';
export type NumberProvider = 'twilio' | 'telnyx' | 'bandwidth';

export interface PhoneNumber {
  id: string;
  number: string;
  friendlyName?: string;
  status: NumberStatus;
  type: NumberType;
  provider: NumberProvider;
  countryCode: string;
  capabilities: string[];
  expiresAt?: string;
  autoRenew: boolean;
  priceKobo: number;
  smsReceived: number;
  smsSent: number;
  userId: string;
  createdAt: string;
}

// ─── Message Types ───────────────────────────────────────────────────────────
export type MessageDirection = 'inbound' | 'outbound';
export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'received' | 'unread' | 'read';

export interface Message {
  id: string;
  from: string;
  to: string;
  body: string;
  direction: MessageDirection;
  status: MessageStatus;
  aiClassification?: string;
  extractedOtp?: string;
  spamScore: number;
  isSpam: boolean;
  userId?: string;
  phoneNumberId?: string;
  createdAt: string;
}

// ─── Payment Types ────────────────────────────────────────────────────────────
export type PaymentGateway = 'flutterwave' | 'paystack' | 'korapay' | 'paddle' | 'nowpayments';

export interface CreditPackage {
  id: string;
  name: string;
  amountKobo: number;
  bonusKobo: number;
  priceKobo: number;
  availableGateways: PaymentGateway[];
  isFeatured: boolean;
}

export interface WalletTransaction {
  id: string;
  type: string;
  status: string;
  amountKobo: number;
  balanceAfterKobo: number;
  description?: string;
  gateway?: PaymentGateway;
  createdAt: string;
}

// ─── API Response Wrappers ────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error: string;
}

// ─── WebSocket Events ─────────────────────────────────────────────────────────
export interface WsMessageReceived {
  messageId: string;
  from: string;
  to: string;
  body: string;
  otp?: string;
  classification?: string;
  receivedAt: string;
}

export interface WsCallIncoming {
  callId: string;
  from: string;
  to: string;
}

// ─── Enterprise Types ─────────────────────────────────────────────────────────
export type WorkspaceMemberRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  ownerUserId: string;
  walletBalanceKobo: number;
  isActive: boolean;
  createdAt: string;
}

// ─── Utils ────────────────────────────────────────────────────────────────────
export const KOBO_TO_NGN = (kobo: number): number => kobo / 100;
export const NGN_TO_KOBO = (ngn: number): number => Math.round(ngn * 100);
export const NGN_TO_USD = (ngn: number, rate = 1600): number => ngn / rate;
export const formatNgn = (kobo: number): string => `₦${KOBO_TO_NGN(kobo).toLocaleString('en-NG')}`;
