import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { EntitlementGate } from '../../components/EntitlementGate';
import { ProductModuleScreen } from '../../components/ProductModuleScreen';
import { BRAND } from '../../lib/brand';
import { MOBILE_PRODUCT_MODULES } from '../../lib/product-modules';
import { useRevenueCat } from '../../lib/revenuecat-context';

export default function VpnScreen() {
  const router = useRouter();
  const { ready, loading, canAccessSecureTunnel, restorePurchases, refresh } = useRevenueCat();

  if (ready && !loading && !canAccessSecureTunnel) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.gateWrap}>
          <EntitlementGate
            eyebrow="BP Secure Tunnel"
            title="Secure tunnel access needs an active subscription entitlement."
            text="Burner Point uses RevenueCat entitlements for BP Secure Tunnel and BP Premium so store-managed subscriptions unlock VPN access without exposing payment secrets inside the app."
            bullets={[
              'Open Billing to start BP Secure Tunnel or BP Premium.',
              'Restore if your App Store or Google Play account already owns access.',
              'Refresh access after purchase so the backend syncs the latest entitlement state.',
            ]}
            primaryLabel="Open Billing"
            onPrimaryPress={() => router.push('/billing' as any)}
            onSecondaryPress={() => { void restorePurchases().catch(() => undefined); }}
            onTertiaryPress={() => { void refresh({ forceServerSync: true }).catch(() => undefined); }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return <ProductModuleScreen module={MOBILE_PRODUCT_MODULES.vpn} />;
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND.colors.black },
  gateWrap: { padding: 20, paddingTop: 12 },
});
