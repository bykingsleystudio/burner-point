/**
 * apps/mobile/src/app/(tabs)/credits.tsx
 *
 * COMPLETE REPLACEMENT FILE
 * - Removed: Stripe, Crypto (Coinbase) entries
 * - Added:   Paddle, NOWPayments entries
 * - Payment order matches web: Paystack -> Paddle -> NOWPayments
 */
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Linking,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';
const WEB_BILLING_URL = process.env.EXPO_PUBLIC_WEB_URL || 'https://burnerpoint.app/dashboard/credits';

// ─── Gateway definitions — EXACT PRIORITY ORDER ───────────────────────────
const GATEWAYS = [
  // Nigerian (1-5)
  { id: 'flutterwave',  label: 'Flutterwave',    flag: '🌍', desc: 'Cards, Bank, Mobile' },
  { id: 'paystack',     label: 'Paystack',        flag: '🇳🇬', desc: 'Cards, Bank, USSD' },
  { id: 'squad',        label: 'Squad (GTCO)',    flag: '🏦', desc: 'Fast local payments' },
  { id: 'korapay',      label: 'Korapay',         flag: '💳', desc: 'Cards, Bank, Virtual' },
  { id: 'opay',         label: 'OPay Merchant',   flag: '📱', desc: 'OPay wallet & USSD' },
  // International (6-7)
  { id: 'paddle',       label: 'Paddle',          flag: '🌐', desc: 'International cards' },
  { id: 'nowpayments',  label: 'NOWPayments',     flag: '₿',  desc: 'BTC, ETH, USDT...' },
];

export default function CreditsScreen() {
  const [packages, setPackages] = useState<any[]>([]);
  const [selectedPkg, setSelectedPkg] = useState<any>(null);
  const [gateway, setGateway] = useState('paystack');
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    axios
      .get(`${API_URL}/payments/packages`)
      .then((r) => setPackages(r.data))
      .catch(() => Alert.alert('Error', 'Failed to load packages'))
      .finally(() => setLoading(false));
  }, []);

  const pay = async () => {
    if (!selectedPkg) {
      Alert.alert('Select Package', 'Please select a credit package first');
      return;
    }
    setPaying(true);
    try {
      const url = `${WEB_BILLING_URL}?packageId=${encodeURIComponent(selectedPkg.id)}&gateway=${encodeURIComponent(gateway)}`;
      await Linking.openURL(url);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Unable to open secure web checkout');
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={s.container}>
        <ActivityIndicator color="#00FF9D" style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <FlatList
        data={packages}
        keyExtractor={(p) => p.id}
        ListHeaderComponent={
          <View>
            <View style={s.header}>
              <Text style={s.title}>Buy Credits</Text>
              <Text style={s.subtitle}>₦1,600 ≈ $1 USD</Text>
            </View>
            <Text style={s.sectionLabel}>SELECT PACKAGE</Text>
          </View>
        }
        renderItem={({ item: pkg }) => (
          <TouchableOpacity
            onPress={() => setSelectedPkg(pkg)}
            style={[s.card, selectedPkg?.id === pkg.id && s.cardSelected]}
          >
            {pkg.isFeatured && (
              <View style={s.featuredBadge}>
                <Text style={s.featuredText}>POPULAR</Text>
              </View>
            )}
            <Text style={s.pkgName}>{pkg.name}</Text>
            <Text style={s.pkgPrice}>₦{(pkg.priceKobo / 100).toLocaleString()}</Text>
            <Text style={s.pkgCredits}>
              ₦{(pkg.amountKobo / 100).toLocaleString()} credits
              {pkg.bonusKobo > 0 &&
                ` + ₦${(pkg.bonusKobo / 100).toLocaleString()} bonus`}
            </Text>
          </TouchableOpacity>
        )}
        numColumns={2}
        columnWrapperStyle={{ gap: 8, paddingHorizontal: 16, marginBottom: 8 }}
        ListFooterComponent={
          <View style={s.footer}>
            {/* Nigerian gateways */}
            <Text style={s.sectionLabel}>🇳🇬 NIGERIAN PAYMENTS</Text>
            <View style={s.gatewayGrid}>
              {GATEWAYS.filter((g) =>
                ['paystack'].includes(g.id),
              ).map((gw) => (
                <TouchableOpacity
                  key={gw.id}
                  onPress={() => setGateway(gw.id)}
                  style={[s.gwBtn, gateway === gw.id && s.gwBtnActive]}
                >
                  <Text style={s.gwFlag}>{gw.flag}</Text>
                  <View>
                    <Text
                      style={[s.gwLabel, gateway === gw.id && s.gwLabelActive]}
                    >
                      {gw.label}
                    </Text>
                    <Text style={s.gwDesc}>{gw.desc}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* International gateways */}
            <Text style={[s.sectionLabel, { marginTop: 16 }]}>🌐 INTERNATIONAL</Text>
            <View style={s.gatewayGrid}>
              {GATEWAYS.filter((g) =>
                ['paddle', 'nowpayments'].includes(g.id),
              ).map((gw) => (
                <TouchableOpacity
                  key={gw.id}
                  onPress={() => setGateway(gw.id)}
                  style={[s.gwBtn, gateway === gw.id && s.gwBtnActive]}
                >
                  <Text style={s.gwFlag}>{gw.flag}</Text>
                  <View>
                    <Text
                      style={[s.gwLabel, gateway === gw.id && s.gwLabelActive]}
                    >
                      {gw.label}
                    </Text>
                    <Text style={s.gwDesc}>{gw.desc}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* NOWPayments crypto info */}
            {gateway === 'nowpayments' && (
              <View style={s.infoBox}>
                <Text style={s.infoText}>
                  ₿ Crypto payment: You'll choose your coin on the next screen.
                  BTC, ETH, USDT and 300+ others accepted.
                </Text>
              </View>
            )}

            {/* Pay button */}
            <TouchableOpacity
              onPress={pay}
              disabled={!selectedPkg || paying}
              style={[s.payBtn, (!selectedPkg || paying) && s.payBtnDisabled]}
            >
              {paying ? (
                <ActivityIndicator color="#000" size="small" />
              ) : (
                <Text style={s.payBtnText}>
                  Pay Now •{' '}
                  {GATEWAYS.find((g) => g.id === gateway)?.label ?? gateway}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  header: { padding: 20, paddingBottom: 8 },
  title: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  subtitle: { color: '#666', fontSize: 13, marginTop: 2 },
  sectionLabel: {
    color: '#444',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginHorizontal: 16,
    marginBottom: 10,
    marginTop: 16,
  },
  card: {
    flex: 1,
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  cardSelected: { borderColor: '#00FF9D', backgroundColor: '#00FF9D08' },
  featuredBadge: {
    backgroundColor: '#00FF9D',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  featuredText: { color: '#000', fontSize: 8, fontWeight: '900' },
  pkgName: { color: '#fff', fontSize: 13, fontWeight: '600', marginBottom: 4 },
  pkgPrice: {
    color: '#00FF9D',
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  pkgCredits: { color: '#666', fontSize: 10, marginTop: 2 },
  footer: { padding: 16 },
  gatewayGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gwBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#111',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  gwBtnActive: { borderColor: '#00FF9D', backgroundColor: '#00FF9D10' },
  gwFlag: { fontSize: 16 },
  gwLabel: { color: '#666', fontSize: 12, fontWeight: '600' },
  gwLabelActive: { color: '#00FF9D' },
  gwDesc: { color: '#444', fontSize: 9, marginTop: 1 },
  infoBox: {
    backgroundColor: '#00FF9D08',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#00FF9D25',
    padding: 12,
    marginTop: 12,
  },
  infoText: { color: '#00FF9D', fontSize: 11 },
  payBtn: {
    backgroundColor: '#00FF9D',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  payBtnDisabled: { opacity: 0.4 },
  payBtnText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
});
