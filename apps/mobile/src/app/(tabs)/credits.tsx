import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';

import { API_BASE_URL, WEB_BILLING_URL } from '../../lib/config';
import { BRAND } from '../../lib/brand';
import { formatNgnKobo, formatStoredKoboAsUsd } from '../../lib/money';
import { triggerHaptic } from '../../lib/native-ux';

type GatewayId = 'paystack' | 'paddle' | 'nowpayments';
type FundingPackage = {
  id: string;
  name: string;
  amountKobo: number;
  bonusKobo: number;
  priceKobo: number;
  isFeatured?: boolean;
};

const GATEWAYS: Array<{ id: GatewayId; label: string; code: string; desc: string }> = [
  { id: 'paystack', label: 'Paystack', code: 'NG', desc: 'Cards, Bank, USSD' },
  { id: 'paddle', label: 'Paddle', code: 'INTL', desc: 'International cards' },
  { id: 'nowpayments', label: 'NOWPayments', code: 'BTC', desc: 'BTC, ETH, USDT' },
];

export default function CreditsScreen() {
  const [packages, setPackages] = useState<FundingPackage[]>([]);
  const [selectedPkg, setSelectedPkg] = useState<FundingPackage | null>(null);
  const [gateway, setGateway] = useState<GatewayId>('paystack');
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  const activeGateway = useMemo(
    () => GATEWAYS.find((item) => item.id === gateway) ?? GATEWAYS[0],
    [gateway],
  );

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/payments/packages`)
      .then((response) => setPackages(response.data))
      .catch(() => Alert.alert('Error', 'Failed to load packages'))
      .finally(() => setLoading(false));
  }, []);

  const pay = async () => {
    triggerHaptic('impact');
    if (!selectedPkg) {
      Alert.alert('Select Amount', 'Please select a funding amount first');
      return;
    }

    setPaying(true);
    try {
      const url = `${WEB_BILLING_URL}?packageId=${encodeURIComponent(selectedPkg.id)}&gateway=${encodeURIComponent(gateway)}`;
      await Linking.openURL(url);
    } catch (error: unknown) {
      const message = (error as Error)?.message ?? 'Unable to open secure web checkout';
      Alert.alert('Error', message);
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={s.container}>
        <ActivityIndicator color={BRAND.colors.cyberGreen} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <FlatList
        data={packages}
        keyExtractor={(pkg) => pkg.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 8, paddingHorizontal: 16, marginBottom: 8 }}
        ListHeaderComponent={
          <View>
            <View style={s.header}>
              <Text style={s.title}>Add Funds</Text>
              <Text style={s.subtitle}>Wallet funding is normalized to USD, with local checkout shown for convenience.</Text>
            </View>
            <Text style={s.sectionLabel}>Select Amount</Text>
          </View>
        }
        renderItem={({ item: pkg }) => (
          <TouchableOpacity
            onPress={() => { triggerHaptic('selection'); setSelectedPkg(pkg); }}
            style={[s.card, selectedPkg?.id === pkg.id && s.cardSelected]}
            activeOpacity={0.78}
          >
            {pkg.isFeatured ? (
              <View style={s.featuredBadge}>
                <Text style={s.featuredText}>Popular</Text>
              </View>
            ) : null}
            <Text style={s.pkgName}>{pkg.name}</Text>
            <Text style={s.pkgPrice}>{formatStoredKoboAsUsd(pkg.priceKobo)}</Text>
            <Text style={s.pkgLocal}>{formatNgnKobo(pkg.priceKobo)} local checkout</Text>
            <Text style={s.pkgCredits}>
              {formatStoredKoboAsUsd(pkg.amountKobo)} added to available balance
            </Text>
          </TouchableOpacity>
        )}
        ListFooterComponent={
          <View style={s.footer}>
            <Text style={s.sectionLabel}>Nigerian Payments</Text>
            <GatewayPicker ids={['paystack']} gateway={gateway} onChange={setGateway} />

            <Text style={[s.sectionLabel, { marginTop: 16 }]}>International</Text>
            <GatewayPicker ids={['paddle', 'nowpayments']} gateway={gateway} onChange={setGateway} />

            {gateway === 'nowpayments' ? (
              <View style={s.infoBox}>
                <Text style={s.infoText}>
                  Crypto payment opens on secure web checkout. BTC, ETH, USDT and 300+ others are supported.
                </Text>
              </View>
            ) : null}

            <TouchableOpacity
              onPress={pay}
              disabled={!selectedPkg || paying}
              style={[s.payBtn, (!selectedPkg || paying) && s.payBtnDisabled]}
              activeOpacity={0.85}
            >
              {paying ? (
                <ActivityIndicator color={BRAND.colors.black} size="small" />
              ) : (
                <Text style={s.payBtnText}>Pay Now - {activeGateway.label}</Text>
              )}
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}

function GatewayPicker({
  ids,
  gateway,
  onChange,
}: {
  ids: GatewayId[];
  gateway: GatewayId;
  onChange: (gateway: GatewayId) => void;
}) {
  return (
    <View style={s.gatewayGrid}>
      {GATEWAYS.filter((item) => ids.includes(item.id)).map((gw) => {
        const active = gateway === gw.id;
        return (
          <TouchableOpacity
            key={gw.id}
            onPress={() => { triggerHaptic('selection'); onChange(gw.id); }}
            style={[s.gwBtn, active && s.gwBtnActive]}
            activeOpacity={0.78}
          >
            <Text style={[s.gwCode, active && s.gwCodeActive]}>{gw.code}</Text>
            <View>
              <Text style={[s.gwLabel, active && s.gwLabelActive]}>{gw.label}</Text>
              <Text style={s.gwDesc}>{gw.desc}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND.colors.black },
  header: { padding: 20, paddingBottom: 8 },
  title: { color: BRAND.colors.white, fontSize: 22, fontWeight: '900' },
  subtitle: { color: BRAND.colors.muted, fontSize: 13, marginTop: 2 },
  sectionLabel: {
    color: BRAND.colors.muted,
    fontSize: 10,
    fontWeight: '900',
    marginHorizontal: 16,
    marginBottom: 10,
    marginTop: 16,
    textTransform: 'uppercase',
  },
  card: {
    flex: 1,
    backgroundColor: BRAND.colors.surface,
    borderRadius: BRAND.radii.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: BRAND.colors.border,
  },
  cardSelected: { borderColor: BRAND.colors.cyberGreen, backgroundColor: `${BRAND.colors.cyberGreen}08` },
  featuredBadge: {
    backgroundColor: BRAND.colors.cyberGreen,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  featuredText: { color: BRAND.colors.black, fontSize: 8, fontWeight: '900', textTransform: 'uppercase' },
  pkgName: { color: BRAND.colors.white, fontSize: 13, fontWeight: '700', marginBottom: 4 },
  pkgPrice: {
    color: BRAND.colors.cyberGreen,
    fontSize: 22,
    fontWeight: '900',
    fontFamily: BRAND.typography.mono,
  },
  pkgLocal: { color: BRAND.colors.metalStart, fontSize: 10, marginTop: 2 },
  pkgCredits: { color: BRAND.colors.muted, fontSize: 10, marginTop: 2 },
  footer: { padding: 16 },
  gatewayGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gwBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: BRAND.colors.surface,
    borderRadius: BRAND.radii.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: BRAND.colors.border,
  },
  gwBtnActive: { borderColor: BRAND.colors.cyberGreen, backgroundColor: `${BRAND.colors.cyberGreen}10` },
  gwCode: { color: BRAND.colors.muted, fontSize: 12, fontWeight: '900', minWidth: 28 },
  gwCodeActive: { color: BRAND.colors.cyberGreen },
  gwLabel: { color: BRAND.colors.muted, fontSize: 12, fontWeight: '700' },
  gwLabelActive: { color: BRAND.colors.cyberGreen },
  gwDesc: { color: BRAND.colors.metalStart, fontSize: 9, marginTop: 1 },
  infoBox: {
    backgroundColor: `${BRAND.colors.cyberGreen}08`,
    borderRadius: BRAND.radii.md,
    borderWidth: 1,
    borderColor: `${BRAND.colors.cyberGreen}25`,
    padding: 12,
    marginTop: 12,
  },
  infoText: { color: BRAND.colors.cyberGreen, fontSize: 11, lineHeight: 18 },
  payBtn: {
    backgroundColor: BRAND.colors.cyberGreen,
    borderRadius: BRAND.radii.sm,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  payBtnDisabled: { opacity: 0.4 },
  payBtnText: { color: BRAND.colors.black, fontWeight: '900', fontSize: 16, textTransform: 'uppercase' },
});
