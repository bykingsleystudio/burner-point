import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import axios from 'axios';
import Purchases, {
  LOG_LEVEL,
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesOfferings,
  type PurchasesPackage,
} from 'react-native-purchases';

import { getApiAccessToken } from './auth';
import { useBurnerAuth } from './auth-context';
import { API_BASE_URL } from './config';
import {
  DEFAULT_REVENUECAT_ENTITLEMENTS,
  DEFAULT_REVENUECAT_OFFERINGS,
  type RevenueCatSyncSnapshot,
  getRevenueCatDisplayName,
  getRevenueCatPhoneNumber,
  getRevenueCatPublicApiKey,
  isRevenueCatStorePlatform,
} from './revenuecat';

type RevenueCatContextValue = {
  ready: boolean;
  loading: boolean;
  syncing: boolean;
  purchasing: boolean;
  restoring: boolean;
  supported: boolean;
  configured: boolean;
  publicApiKeyPresent: boolean;
  customerInfo: CustomerInfo | null;
  offerings: PurchasesOfferings | null;
  snapshot: RevenueCatSyncSnapshot | null;
  error: string | null;
  entitlementConfig: RevenueCatSyncSnapshot['entitlementConfig'];
  offeringConfig: RevenueCatSyncSnapshot['offeringConfig'];
  canAccessMessenger: boolean;
  canAccessSecureTunnel: boolean;
  canAccessPremium: boolean;
  getOffering: (identifier?: string | null) => PurchasesOffering | null;
  purchasePackage: (pkg: PurchasesPackage) => Promise<void>;
  restorePurchases: () => Promise<void>;
  refresh: (options?: { forceServerSync?: boolean }) => Promise<void>;
};

const RevenueCatContext = createContext<RevenueCatContextValue | null>(null);

export function RevenueCatProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, session, user } = useBurnerAuth();
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const [snapshot, setSnapshot] = useState<RevenueCatSyncSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  const supported = isRevenueCatStorePlatform();
  const publicApiKey = getRevenueCatPublicApiKey();
  const configured = supported && Boolean(publicApiKey);
  const initializedRef = useRef(false);

  const entitlementConfig = snapshot?.entitlementConfig ?? DEFAULT_REVENUECAT_ENTITLEMENTS;
  const offeringConfig = snapshot?.offeringConfig ?? DEFAULT_REVENUECAT_OFFERINGS;

  const canAccessMessenger = Boolean(snapshot?.summary.canAccessMessenger || snapshot?.summary.canAccessPremium);
  const canAccessSecureTunnel = Boolean(snapshot?.summary.canAccessSecureTunnel || snapshot?.summary.canAccessPremium);
  const canAccessPremium = Boolean(snapshot?.summary.canAccessPremium);

  const getOffering = (identifier?: string | null) => {
    if (!offerings) return null;
    if (identifier && offerings.all?.[identifier]) {
      return offerings.all[identifier] ?? null;
    }
    return offerings.current ?? null;
  };

  async function fetchBackendSnapshot(forceServerSync = false): Promise<RevenueCatSyncSnapshot | null> {
    if (!isSignedIn || !session) {
      setSnapshot(null);
      return null;
    }

    const token = await getApiAccessToken(undefined, session);
    const headers = { Authorization: `Bearer ${token}` };
    const request = forceServerSync
      ? axios.post<RevenueCatSyncSnapshot>(`${API_BASE_URL}/billing/entitlements/refresh`, {}, { headers })
      : axios.get<RevenueCatSyncSnapshot>(`${API_BASE_URL}/billing/entitlements`, { headers });

    const { data } = await request;
    setSnapshot(data);
    return data;
  }

  async function syncMobileState(options?: { forceServerSync?: boolean; silent?: boolean }) {
    if (!isLoaded) return;

    const forceServerSync = Boolean(options?.forceServerSync);
    const silent = Boolean(options?.silent);
    if (!silent) {
      setLoading(!ready);
      setSyncing(true);
    }
    setError(null);

    try {
      let nextCustomerInfo: CustomerInfo | null = null;

      if (!isSignedIn || !user) {
        if (supported) {
          const rcConfigured = await Purchases.isConfigured().catch(() => false);
          if (rcConfigured) {
            await Purchases.logOut().catch(() => undefined);
          }
        }
        setCustomerInfo(null);
        setOfferings(null);
        setSnapshot(null);
        return;
      }

      if (configured && publicApiKey) {
        await Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.INFO).catch(() => undefined);
        const rcConfigured = await Purchases.isConfigured().catch(() => false);
        if (!rcConfigured) {
          Purchases.configure({
            apiKey: publicApiKey,
            appUserID: user.id,
          });
        } else {
          const loginResult = await Purchases.logIn(user.id).catch(() => null);
          if (loginResult?.customerInfo) {
            setCustomerInfo(loginResult.customerInfo);
          }
        }

        await Promise.allSettled([
          Purchases.setEmail(user.email ?? null),
          Purchases.setDisplayName(getRevenueCatDisplayName(user)),
          Purchases.setPhoneNumber(getRevenueCatPhoneNumber(user)),
        ]);

        const [offeringsResult, customerInfoResult] = await Promise.all([
          Purchases.getOfferings(),
          Purchases.getCustomerInfo(),
        ]);

        setOfferings(offeringsResult);
        setCustomerInfo(customerInfoResult);
        nextCustomerInfo = customerInfoResult;
      } else {
        setOfferings(null);
        setCustomerInfo(null);
      }

      let nextSnapshot = await fetchBackendSnapshot(forceServerSync);

      const activeClientEntitlements = Object.keys(nextCustomerInfo?.entitlements.active ?? {});
      const activeServerEntitlements = nextSnapshot?.summary.activeEntitlements ?? [];
      if (
        configured &&
        !forceServerSync &&
        activeClientEntitlements.length > 0 &&
        activeServerEntitlements.length === 0
      ) {
        nextSnapshot = await fetchBackendSnapshot(true);
        if (nextSnapshot) {
          setSnapshot(nextSnapshot);
        }
      }
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Unable to synchronize subscription access.';
      setError(message);
    } finally {
      if (!silent) {
        setLoading(false);
        setSyncing(false);
      }
      setReady(true);
      initializedRef.current = true;
    }
  }

  useEffect(() => {
    if (!supported || !configured) return;

    const listener = (nextCustomerInfo: CustomerInfo) => {
      setCustomerInfo(nextCustomerInfo);
    };

    Purchases.addCustomerInfoUpdateListener(listener);
    return () => {
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, [configured, supported]);

  useEffect(() => {
    void syncMobileState({ silent: initializedRef.current });
  }, [configured, isLoaded, isSignedIn, session, supported, user?.id]);

  const value = useMemo<RevenueCatContextValue>(() => ({
    ready,
    loading,
    syncing,
    purchasing,
    restoring,
    supported,
    configured,
    publicApiKeyPresent: Boolean(publicApiKey),
    customerInfo,
    offerings,
    snapshot,
    error,
    entitlementConfig,
    offeringConfig,
    canAccessMessenger,
    canAccessSecureTunnel,
    canAccessPremium,
    getOffering,
    purchasePackage: async (pkg) => {
      if (!configured) {
        throw new Error('RevenueCat is not configured for this mobile build.');
      }

      setPurchasing(true);
      setError(null);
      try {
        const result = await Purchases.purchasePackage(pkg);
        setCustomerInfo(result.customerInfo);
        await syncMobileState({ forceServerSync: true, silent: true });
      } catch (caught: any) {
        if (caught?.userCancelled) {
          return;
        }
        const message = caught instanceof Error ? caught.message : 'Unable to complete the purchase.';
        setError(message);
        throw caught;
      } finally {
        setPurchasing(false);
      }
    },
    restorePurchases: async () => {
      if (!configured) {
        throw new Error('RevenueCat is not configured for this mobile build.');
      }

      setRestoring(true);
      setError(null);
      try {
        const nextCustomerInfo = await Purchases.restorePurchases();
        setCustomerInfo(nextCustomerInfo);
        await syncMobileState({ forceServerSync: true, silent: true });
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : 'Unable to restore purchases.';
        setError(message);
        throw caught;
      } finally {
        setRestoring(false);
      }
    },
    refresh: async (options) => {
      await syncMobileState({ forceServerSync: options?.forceServerSync, silent: true });
    },
  }), [
    canAccessMessenger,
    canAccessPremium,
    canAccessSecureTunnel,
    configured,
    customerInfo,
    entitlementConfig,
    error,
    loading,
    offeringConfig,
    offerings,
    publicApiKey,
    purchasing,
    ready,
    restoring,
    snapshot,
    supported,
    syncing,
  ]);

  return (
    <RevenueCatContext.Provider value={value}>
      {children}
    </RevenueCatContext.Provider>
  );
}

export function useRevenueCat() {
  const value = useContext(RevenueCatContext);
  if (!value) {
    throw new Error('useRevenueCat must be used inside RevenueCatProvider.');
  }
  return value;
}
