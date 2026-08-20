import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CalendarDays, CreditCard, ExternalLink, RefreshCw, ShieldCheck } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import type { PurchasesOffering, PurchasesPackage } from 'react-native-purchases';

import { EntitlementGate } from '../../components/EntitlementGate';
import { BRAND } from '../../lib/brand';
import { WEB_APP_URL } from '../../lib/config';
import { triggerHaptic } from '../../lib/native-ux';
import { useRevenueCat } from '../../lib/revenuecat-context';

const HIT_SLOP = { top: 8, right: 8, bottom: 8, left: 8 };

const billingModules = [
  {
    icon: CreditCard,
    title: 'Available balance',
    text: 'Fund verifications, rentals, eSIM, proxy, dedicated VPN IP purchases, and one-time access with Burner Point web checkout.',
    action: 'Open wallet billing',
  },
  {
    icon: CalendarDays,
    title: 'Store subscriptions',
    text: 'RevenueCat manages BP Messenger Pro, BP Secure Tunnel VPN, and BP Premium across the App Store and Google Play.',
    action: 'Manage subscriptions',
  },
  {
    icon: CreditCard,
    title: 'Receipts',
    text: 'Payment references, subscription access, and support-ready ledger history stay in one account.',
    action: 'Open receipts',
  },
];

export default function BillingScreen() {
  const router = useRouter();
  const {
    ready,
    loading,
    syncing,
    purchasing,
    restoring,
    supported,
    configured,
    snapshot,
    error,
    offeringConfig,
    canAccessMessenger,
    canAccessSecureTunnel,
    canAccessPremium,
    getOffering,
    purchasePackage,
    restorePurchases,
    refresh,
  } = useRevenueCat();

  const openWebBilling = async () => {
    triggerHaptic('impact');
    try {
      await Linking.openURL(`${WEB_APP_URL}/dashboard/billing`);
    } catch (caught: any) {
      Alert.alert('Billing', caught?.message ?? 'Unable to open secure web billing.');
    }
  };

  const orderedOfferings = [
    getOffering(offeringConfig.default),
    getOffering(offeringConfig.messenger),
    getOffering(offeringConfig.vpn),
    getOffering(offeringConfig.premium),
  ].filter((offering, index, list): offering is PurchasesOffering => Boolean(offering) && list.indexOf(offering) === index);

  const activeEntitlements = snapshot?.entitlements.filter((item) => item.active) ?? [];
  const isBusy = loading || syncing || purchasing || restoring;

  const startPackagePurchase = async (pkg: PurchasesPackage) => {
    triggerHaptic('impact');
    try {
      await purchasePackage(pkg);
      await refresh({ forceServerSync: true });
      Alert.alert('Subscription active', 'Your subscription access has been refreshed.');
    } catch (caught: any) {
      if (caught?.userCancelled) return;
      Alert.alert('Purchase failed', caught?.message ?? 'Unable to complete the subscription purchase.');
    }
  };

  const restoreStorePurchases = async () => {
    triggerHaptic('selection');
    try {
      await restorePurchases();
      await refresh({ forceServerSync: true });
      Alert.alert('Purchases restored', 'Your RevenueCat entitlements have been refreshed.');
    } catch (caught: any) {
      Alert.alert('Restore failed', caught?.message ?? 'Unable to restore purchases.');
    }
  };

  const refreshAccess = async () => {
    triggerHaptic('selection');
    try {
      await refresh({ forceServerSync: true });
    } catch (caught: any) {
      Alert.alert('Refresh failed', caught?.message ?? 'Unable to refresh subscription access.');
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
        <View style={s.hero}>
        <View style={s.heroTop}>
            <Text style={s.kicker}>Billing</Text>
            <ShieldCheck size={20} color={BRAND.colors.cyberGreen} />
          </View>
          <Text accessibilityRole="header" style={s.title}>Available balance and store subscriptions.</Text>
          <Text style={s.subtitle}>
            Burner Point keeps wallet funding on secure web checkout, reserves Call Credits for BP Messenger international calling, and uses RevenueCat for App Store and Google Play subscription entitlements.
          </Text>
          <View style={s.heroActions}>
            <TouchableOpacity
              style={s.primaryButton}
              activeOpacity={0.84}
              onPress={openWebBilling}
              accessibilityRole="button"
              accessibilityLabel="Open secure wallet billing"
              hitSlop={HIT_SLOP}
            >
              <Text style={s.primaryText}>Open Wallet Billing</Text>
              <ExternalLink size={15} color={BRAND.colors.black} />
            </TouchableOpacity>
            <TouchableOpacity
              style={s.secondaryButton}
              activeOpacity={0.84}
              onPress={refreshAccess}
              accessibilityRole="button"
              accessibilityLabel="Refresh subscription access"
              hitSlop={HIT_SLOP}
            >
              <RefreshCw size={15} color={BRAND.colors.cyberGreen} />
              <Text style={s.secondaryText}>{isBusy ? 'Syncing...' : 'Refresh Access'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={s.sectionLabel}>Mobile subscriptions</Text>
        <View style={s.accessCard}>
          <Text style={s.accessTitle}>Current premium access</Text>
          <Text style={s.accessText}>
            {activeEntitlements.length
              ? `Active: ${activeEntitlements.map((item) => item.displayName).join(', ')}`
              : 'No active store subscription yet. Start a plan below or restore an existing purchase.'}
          </Text>
          <View style={s.statusRow}>
            {[
              { label: 'Messenger', active: canAccessMessenger },
              { label: 'Secure Tunnel', active: canAccessSecureTunnel },
              { label: 'Premium', active: canAccessPremium },
            ].map((item) => (
              <View key={item.label} style={[s.statusPill, item.active && s.statusPillActive]}>
                <Text style={[s.statusPillText, item.active && s.statusPillTextActive]}>{item.label}</Text>
              </View>
            ))}
          </View>
          {snapshot?.subscriptions?.[0]?.renewsAt ? (
            <Text style={s.syncText}>Next renewal: {new Date(snapshot.subscriptions[0].renewsAt).toLocaleDateString()}</Text>
          ) : null}
          {snapshot?.lastSyncedAt ? (
            <Text style={s.syncText}>Last sync: {new Date(snapshot.lastSyncedAt).toLocaleString()}</Text>
          ) : null}
          {error ? <Text style={s.errorText}>{error}</Text> : null}
        </View>

        {!supported ? (
          <EntitlementGate
            eyebrow="RevenueCat"
            title="Store subscriptions require a native mobile build."
            text="Use iOS or Android to buy or restore App Store / Google Play subscriptions. Available balance remains available on the secure web app."
            bullets={[
              'Use a native Burner Point build for App Store or Google Play purchases.',
              'Wallet top-ups, receipts, and support stay available on burnerpoint.com.',
            ]}
            primaryLabel="Open Web Billing"
            onPrimaryPress={openWebBilling}
            onTertiaryPress={refreshAccess}
          />
        ) : configured && orderedOfferings.length ? (
          <View style={s.offerings}>
            {orderedOfferings.map((offering) => (
              <View key={offering.identifier} style={s.offeringCard}>
                <Text style={s.offeringKicker}>{labelForOffering(offering.identifier, offeringConfig)}</Text>
                <Text style={s.offeringTitle}>{offering.serverDescription || offering.identifier}</Text>
                <Text style={s.offeringText}>
                  {offering.availablePackages.length
                    ? 'Choose a package and RevenueCat will route the purchase through the App Store or Google Play.'
                    : 'Products are attached remotely in RevenueCat. No packages are currently available for this offering.'}
                </Text>
                <View style={s.packageList}>
                  {offering.availablePackages.map((pkg) => (
                    <TouchableOpacity
                      key={`${offering.identifier}-${pkg.identifier}`}
                      style={s.packageCard}
                      activeOpacity={0.82}
                      onPress={() => startPackagePurchase(pkg)}
                      accessibilityRole="button"
                      accessibilityLabel={`Purchase ${pkg.product.title}`}
                      hitSlop={HIT_SLOP}
                      disabled={isBusy}
                    >
                      <Text style={s.packageTitle}>{pkg.product.title}</Text>
                      <Text style={s.packagePrice}>{pkg.product.priceString}</Text>
                      <Text style={s.packageText}>{pkg.product.description || pkg.packageType}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
            <View style={s.storeActions}>
              <TouchableOpacity
                style={s.secondaryButton}
                activeOpacity={0.84}
                onPress={restoreStorePurchases}
                accessibilityRole="button"
                accessibilityLabel="Restore store purchases"
                hitSlop={HIT_SLOP}
              >
                <Text style={s.secondaryText}>{restoring ? 'Restoring...' : 'Restore Purchases'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : supported && configured ? (
          <EntitlementGate
            eyebrow="RevenueCat"
            title={ready ? 'Offerings are not live yet.' : 'Loading subscriptions...'}
            text="RevenueCat is configured, but the current build cannot see any active offering packages yet. Check the offering setup in the RevenueCat dashboard and confirm App Store / Google Play products are attached."
            bullets={[
              'Make sure the default offering is set in RevenueCat.',
              'Attach products to BP Messenger Pro, BP Secure Tunnel VPN, or BP Premium packages.',
              'Use restore if this account already owns a store subscription.',
            ]}
            primaryLabel="Open Web Billing"
            onPrimaryPress={openWebBilling}
            onSecondaryPress={restoreStorePurchases}
            onTertiaryPress={refreshAccess}
            disabled={isBusy}
          />
        ) : (
          <EntitlementGate
            eyebrow="RevenueCat"
            title="Store subscription keys are missing in this mobile build."
            text="The native build does not have RevenueCat public SDK keys yet, so App Store and Google Play purchases cannot start from this screen. Available balance still uses the secure web app."
            bullets={[
              'Add EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY for iOS.',
              'Add EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY for Android.',
              'Keep REVENUECAT_SECRET_API_KEY on Railway only.',
            ]}
            primaryLabel="Open Web Billing"
            onPrimaryPress={openWebBilling}
            onTertiaryPress={refreshAccess}
          />
        )}

        <Text style={s.sectionLabel}>Billing modules</Text>
        <View style={s.cards}>
          {billingModules.map(({ icon: Icon, title, text, action }) => (
            <TouchableOpacity
              key={title}
              style={s.card}
              activeOpacity={0.78}
              onPress={title === 'Store subscriptions' ? () => router.push('/billing' as any) : openWebBilling}
              accessibilityRole="button"
              accessibilityLabel={`${action}: ${title}`}
              hitSlop={HIT_SLOP}
            >
              <View style={s.iconBox}>
                <Icon size={18} color={BRAND.colors.cyberGreen} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.cardTitle}>{title}</Text>
                <Text style={s.cardText}>{text}</Text>
                <Text style={s.cardAction}>{action}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={s.policyCard}>
          <Text style={s.policyTitle}>Production billing split</Text>
          <Text style={s.policyText}>
            RevenueCat manages App Store and Google Play entitlements for BP Messenger Pro, BP Secure Tunnel VPN, and BP Premium. Wallet top-ups stay on secure Burner Point checkout through Paystack, Flutterwave, and NOWPayments, Call Credits are scoped to BP Messenger Pro international calling, and web subscriptions are managed through Paddle.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function labelForOffering(identifier: string, offeringConfig: { default: string; messenger: string; vpn: string; premium: string }) {
  if (identifier === offeringConfig.messenger) return 'BP Messenger Pro';
  if (identifier === offeringConfig.vpn) return 'BP Secure Tunnel VPN';
  if (identifier === offeringConfig.premium) return 'BP Premium';
  if (identifier === offeringConfig.default) return 'Default offering';
  return identifier;
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND.colors.black },
  content: { padding: 20, paddingBottom: 36 },
  hero: {
    borderRadius: BRAND.radii.lg,
    borderWidth: 1,
    borderColor: BRAND.colors.border,
    backgroundColor: BRAND.colors.surface,
    padding: 20,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  kicker: { color: BRAND.colors.cyberGreen, fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  title: { color: BRAND.colors.white, fontSize: 30, lineHeight: 32, fontWeight: '900', textTransform: 'uppercase', marginTop: 22 },
  subtitle: { color: BRAND.colors.metalStart, fontSize: 13, lineHeight: 21, marginTop: 12 },
  heroActions: { gap: 10, marginTop: 20 },
  primaryButton: {
    minHeight: 54,
    borderRadius: BRAND.radii.sm,
    backgroundColor: BRAND.colors.cyberGreen,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryText: { color: BRAND.colors.black, fontSize: 13, fontWeight: '900', textTransform: 'uppercase' },
  secondaryButton: {
    minHeight: 50,
    borderRadius: BRAND.radii.sm,
    borderWidth: 1,
    borderColor: BRAND.colors.border,
    backgroundColor: BRAND.colors.black,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
  },
  secondaryText: { color: BRAND.colors.cyberGreen, fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  sectionLabel: { color: BRAND.colors.muted, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', marginTop: 24, marginBottom: 12 },
  accessCard: {
    borderRadius: BRAND.radii.lg,
    borderWidth: 1,
    borderColor: `${BRAND.colors.cyberGreen}22`,
    backgroundColor: `${BRAND.colors.cyberGreen}08`,
    padding: 16,
  },
  accessTitle: { color: BRAND.colors.white, fontSize: 15, fontWeight: '900', textTransform: 'uppercase' },
  accessText: { color: BRAND.colors.metalStart, fontSize: 12, lineHeight: 19, marginTop: 8 },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  statusPill: {
    borderRadius: BRAND.radii.sm,
    borderWidth: 1,
    borderColor: BRAND.colors.border,
    backgroundColor: BRAND.colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusPillActive: {
    borderColor: `${BRAND.colors.cyberGreen}36`,
    backgroundColor: `${BRAND.colors.cyberGreen}12`,
  },
  statusPillText: { color: BRAND.colors.muted, fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  statusPillTextActive: { color: BRAND.colors.cyberGreen },
  syncText: { color: BRAND.colors.metalStart, fontSize: 11, marginTop: 8 },
  errorText: { color: BRAND.colors.danger, fontSize: 11, marginTop: 10 },
  offerings: { gap: 12 },
  offeringCard: {
    borderRadius: BRAND.radii.lg,
    borderWidth: 1,
    borderColor: BRAND.colors.border,
    backgroundColor: BRAND.colors.surface,
    padding: 16,
  },
  offeringKicker: { color: BRAND.colors.cyberGreen, fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  offeringTitle: { color: BRAND.colors.white, fontSize: 18, fontWeight: '900', textTransform: 'uppercase', marginTop: 8 },
  offeringText: { color: BRAND.colors.metalStart, fontSize: 12, lineHeight: 19, marginTop: 8 },
  packageList: { gap: 10, marginTop: 14 },
  packageCard: {
    borderRadius: BRAND.radii.md,
    borderWidth: 1,
    borderColor: `${BRAND.colors.cyberGreen}22`,
    backgroundColor: BRAND.colors.dark,
    padding: 14,
  },
  packageTitle: { color: BRAND.colors.white, fontSize: 13, fontWeight: '900' },
  packagePrice: { color: BRAND.colors.cyberGreen, fontFamily: BRAND.typography.mono, fontSize: 18, fontWeight: '900', marginTop: 8 },
  packageText: { color: BRAND.colors.metalStart, fontSize: 11, lineHeight: 18, marginTop: 6 },
  storeActions: { gap: 10 },
  cards: { gap: 10 },
  card: {
    minHeight: 112,
    borderRadius: BRAND.radii.lg,
    borderWidth: 1,
    borderColor: BRAND.colors.border,
    backgroundColor: BRAND.colors.dark,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: BRAND.radii.md,
    backgroundColor: `${BRAND.colors.cyberGreen}12`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { color: BRAND.colors.white, fontSize: 15, fontWeight: '900', textTransform: 'uppercase' },
  cardText: { color: BRAND.colors.metalStart, fontSize: 12, lineHeight: 19, marginTop: 5 },
  cardAction: { color: BRAND.colors.cyberGreen, fontSize: 10, fontWeight: '900', marginTop: 9, textTransform: 'uppercase' },
  policyCard: {
    marginTop: 16,
    borderRadius: BRAND.radii.lg,
    borderWidth: 1,
    borderColor: `${BRAND.colors.cyberGreen}25`,
    backgroundColor: `${BRAND.colors.cyberGreen}08`,
    padding: 16,
  },
  policyTitle: { color: BRAND.colors.white, fontSize: 14, fontWeight: '900', textTransform: 'uppercase' },
  policyText: { color: BRAND.colors.metalStart, fontSize: 12, lineHeight: 19, marginTop: 8 },
});
