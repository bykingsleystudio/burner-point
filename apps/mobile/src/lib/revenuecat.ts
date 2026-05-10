import { Platform } from 'react-native';
import type { User } from '@supabase/supabase-js';

export const DEFAULT_REVENUECAT_ENTITLEMENTS = {
  messenger: 'bp_messenger_pro',
  secureTunnel: 'bp_secure_tunnel',
  premium: 'bp_premium',
} as const;

export const DEFAULT_REVENUECAT_OFFERINGS = {
  default: 'default',
  messenger: 'bp_messenger',
  vpn: 'bp_secure_tunnel',
} as const;

export type RevenueCatSyncSnapshot = {
  enabled: boolean;
  provider: 'revenuecat';
  userId: string | null;
  appUserId: string;
  projectId: string | null;
  lastSyncedAt: string | null;
  entitlementConfig: {
    messenger: string;
    secureTunnel: string;
    premium: string;
  };
  offeringConfig: {
    default: string;
    messenger: string;
    vpn: string;
  };
  entitlements: Array<{
    identifier: string;
    displayName: string;
    active: boolean;
    expiresAt: string | null;
    productId: string | null;
    offeringId: string | null;
    store: string | null;
    environment: string | null;
    lastUpdatedAt: string | null;
  }>;
  subscriptions: Array<{
    id: string;
    provider: string;
    productId: string | null;
    offeringId: string | null;
    status: string;
    isActive: boolean;
    willRenew: boolean;
    purchasedAt: string | null;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    renewsAt: string | null;
    cancelledAt: string | null;
    expiresAt: string | null;
    store: string | null;
    environment: string | null;
    lastSyncedAt: string | null;
    entitlements: string[];
  }>;
  summary: {
    activeEntitlements: string[];
    canAccessMessenger: boolean;
    canAccessSecureTunnel: boolean;
    canAccessPremium: boolean;
  };
};

export function isRevenueCatStorePlatform() {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

export function getRevenueCatPublicApiKey() {
  if (Platform.OS === 'ios') {
    return process.env.EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY?.trim() || undefined;
  }

  if (Platform.OS === 'android') {
    return process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY?.trim() || undefined;
  }

  return undefined;
}

export function getRevenueCatDisplayName(user?: User | null) {
  const userMetadata = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const firstName = typeof userMetadata.first_name === 'string' ? userMetadata.first_name.trim() : '';
  const lastName = typeof userMetadata.last_name === 'string' ? userMetadata.last_name.trim() : '';
  return [firstName, lastName].filter(Boolean).join(' ') || null;
}

export function getRevenueCatPhoneNumber(user?: User | null) {
  const userMetadata = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const metadataPhone =
    (typeof userMetadata.phone_number === 'string' && userMetadata.phone_number.trim())
    || (typeof userMetadata.phoneNumber === 'string' && userMetadata.phoneNumber.trim())
    || null;
  return user?.phone?.trim() || metadataPhone || null;
}
