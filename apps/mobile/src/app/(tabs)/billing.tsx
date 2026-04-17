import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CalendarDays, CreditCard, ExternalLink, ShieldCheck } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { BRAND } from '../../lib/brand';
import { WEB_APP_URL } from '../../lib/config';
import { triggerHaptic } from '../../lib/native-ux';

const HIT_SLOP = { top: 8, right: 8, bottom: 8, left: 8 };

const billingModules = [
  {
    icon: CreditCard,
    title: 'Credits',
    text: 'Wallet balance for verifications, rentals, eSIM, proxies, and renewals.',
    action: 'Buy credits',
  },
  {
    icon: CalendarDays,
    title: 'Subscriptions',
    text: '$15.99/month plan path for renewable access and continuity.',
    action: 'Manage plan',
  },
  {
    icon: CreditCard,
    title: 'Receipts',
    text: 'Payment references, gateway status, and support-ready ledger events.',
    action: 'Open billing',
  },
];

export default function BillingScreen() {
  const router = useRouter();

  const openWebBilling = async () => {
    triggerHaptic('impact');
    try {
      await Linking.openURL(`${WEB_APP_URL}/dashboard/billing`);
    } catch (error: any) {
      Alert.alert('Billing', error?.message ?? 'Unable to open secure billing checkout');
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
        <View style={s.hero}>
          <View style={s.heroTop}>
            <Text style={s.kicker}>Credits and Billing</Text>
            <ShieldCheck size={20} color={BRAND.colors.cyberGreen} />
          </View>
          <Text accessibilityRole="header" style={s.title}>Wallet, plans, and receipts.</Text>
          <Text style={s.subtitle}>
            Mobile keeps billing readable and sends purchases to secure web checkout until app-store billing rules are fully mapped for every digital product.
          </Text>
          <TouchableOpacity
            style={s.primaryButton}
            activeOpacity={0.84}
            onPress={openWebBilling}
            accessibilityRole="button"
            accessibilityLabel="Open secure web billing"
            hitSlop={HIT_SLOP}
          >
            <Text style={s.primaryText}>Open Secure Billing</Text>
            <ExternalLink size={15} color={BRAND.colors.black} />
          </TouchableOpacity>
        </View>

        <Text style={s.sectionLabel}>Billing modules</Text>
        <View style={s.cards}>
          {billingModules.map(({ icon: Icon, title, text, action }) => (
            <TouchableOpacity
              key={title}
              style={s.card}
              activeOpacity={0.78}
              onPress={title === 'Credits' ? () => router.push('/credits' as any) : openWebBilling}
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
          <Text style={s.policyTitle}>Store-policy safe architecture</Text>
          <Text style={s.policyText}>
            External Paystack, Paddle, and NOWPayments checkout remains web-routed from native mobile until Apple and Google billing requirements are enabled for the exact digital goods being sold.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
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
  title: { color: BRAND.colors.white, fontSize: 32, lineHeight: 34, fontWeight: '900', textTransform: 'uppercase', marginTop: 22 },
  subtitle: { color: BRAND.colors.metalStart, fontSize: 13, lineHeight: 21, marginTop: 12 },
  primaryButton: {
    minHeight: 54,
    borderRadius: BRAND.radii.sm,
    backgroundColor: BRAND.colors.cyberGreen,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 20,
  },
  primaryText: { color: BRAND.colors.black, fontSize: 13, fontWeight: '900', textTransform: 'uppercase' },
  sectionLabel: { color: BRAND.colors.muted, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', marginTop: 24, marginBottom: 12 },
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
