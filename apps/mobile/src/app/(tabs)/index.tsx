import { useEffect, useState } from 'react';
import type { ComponentType } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Activity, Bell, CalendarDays, CreditCard, Globe2, Lock, MessageSquare, Phone, ShieldCheck, Smartphone, Wifi } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';

import { API_BASE_URL } from '../../lib/config';
import { getApiAccessToken } from '../../lib/auth';
import { useBurnerAuth } from '../../lib/auth-context';
import { BRAND } from '../../lib/brand';
import { triggerHaptic } from '../../lib/native-ux';
type AppIcon = ComponentType<any>;

const HIT_SLOP = { top: 8, right: 8, bottom: 8, left: 8 };

export default function HomeScreen() {
  const router = useRouter();
  const { isLoaded, isSignedIn, session } = useBurnerAuth();
  const [user, setUser] = useState<any>(null);
  const [numbers, setNumbers] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      if (!isLoaded) return;
      if (!isSignedIn) { router.replace('/auth/login' as any); return; }
      const token = await getApiAccessToken(undefined, session);
      const headers = { Authorization: `Bearer ${token}` };
      const [userRes, numsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/users/me`, { headers }),
        axios.get(`${API_BASE_URL}/numbers`, { headers }),
      ]);
      setUser(userRes.data);
      setNumbers(numsRes.data.slice(0, 3));
    } catch {
      // Keep the cached screen structure visible if the network is unavailable.
    }
  };

  useEffect(() => { load(); }, [isLoaded, isSignedIn, session]);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const quickActions = [
    { icon: ShieldCheck, label: 'Verify OTP', text: 'New private code', action: () => router.push('/verification' as any) },
    { icon: Phone, label: 'Calls', text: 'WiFi & Data voice', action: () => router.push('/calls' as any) },
    { icon: MessageSquare, label: 'Inbox', text: 'SMS, MMS, audio & video', action: () => router.push('/messages' as any) },
    { icon: CalendarDays, label: 'Rentals', text: 'Keep a number', action: () => router.push('/rentals' as any) },
    { icon: Phone, label: 'Numbers', text: 'Active inventory', action: () => router.push('/numbers' as any) },
    { icon: CreditCard, label: 'Billing', text: 'Credits and plans', action: () => router.push('/billing' as any) },
  ];

  const platform = [
    { icon: Activity, label: 'Activity', text: 'Audit timeline', action: () => router.push('/activity' as any) },
    { icon: Smartphone, label: 'eSIM', text: 'Travel data', action: () => router.push('/esim' as any) },
    { icon: Globe2, label: 'Proxies', text: 'Location access', action: () => router.push('/proxies' as any) },
    { icon: Lock, label: 'VPN', text: 'Privacy layer', action: () => router.push('/vpn' as any) },
  ];

  return (
    <SafeAreaView style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND.colors.cyberGreen} />}>
        <View style={s.header}>
          <View>
            <Text style={s.greeting}>Good {getGreeting()}</Text>
            <Text style={s.name}>{user?.firstName || 'there'}</Text>
          </View>
          <TouchableOpacity
            style={s.notification}
            onPress={() => { triggerHaptic('selection'); Alert.alert('Push alerts', 'OTP, number expiration, billing, and security alerts are enabled from the app shell.'); }}
            accessibilityRole="button"
            accessibilityLabel="Open push alert settings"
            hitSlop={HIT_SLOP}
          >
            <Bell size={18} color={BRAND.colors.cyberGreen} />
          </TouchableOpacity>
        </View>

        <View style={s.hero}>
          <View style={s.heroTop}>
            <Text style={s.heroKicker}>Stay Anonymous. Stay Connected.</Text>
            <ShieldCheck size={20} color={BRAND.colors.cyberGreen} />
          </View>
          <Text style={s.heroTitle}>Private By Design.</Text>
          <Text style={s.heroSub}>Quick access to verifications, rentals, inbox, wallet, and privacy add-ons.</Text>
          <View style={s.heroPills}>
            {['Private numbers', 'OTP tools', 'Secure access'].map((item) => <Text key={item} style={s.pill}>{item}</Text>)}
          </View>
        </View>

        <Text accessibilityRole="header" style={s.sectionTitle}>Quick Actions</Text>
        <View style={s.quickGrid}>
          {quickActions.map((action) => <ActionCard key={action.label} {...action} />)}
        </View>

        <Text accessibilityRole="header" style={s.sectionTitle}>Platform Features</Text>
        <View style={s.platformRow}>
          {platform.map((item) => <PlatformCard key={item.label} {...item} />)}
        </View>

        <View style={s.offlineCard}>
          <Wifi size={18} color={BRAND.colors.cyberGreen} />
          <View style={{ flex: 1 }}>
            <Text style={s.offlineTitle}>Offline-ready account snapshot</Text>
            <Text style={s.offlineText}>Your last wallet and number state stays readable while the network reconnects.</Text>
          </View>
        </View>

        <Text accessibilityRole="header" style={s.sectionTitle}>Active Numbers</Text>
        {numbers.length > 0 ? numbers.map((number) => (
          <View key={number.id} style={s.numberCard}>
            <View style={s.numberIcon}><Phone size={15} color={BRAND.colors.cyberGreen} /></View>
            <View style={s.numberInfo}>
              <Text style={s.numberText}>{number.number}</Text>
              <Text style={s.numberMeta}>{number.countryCode} - {number.type} - {number.status}</Text>
            </View>
            <View style={s.statusBadge}><Text style={s.statusText}>{number.status || 'active'}</Text></View>
          </View>
        )) : (
          <TouchableOpacity
            style={s.emptyNumber}
            onPress={() => { triggerHaptic('selection'); router.push('/numbers' as any); }}
            accessibilityRole="button"
            accessibilityLabel="Get verification or rent a number"
            hitSlop={HIT_SLOP}
          >
            <Phone size={24} color={BRAND.colors.cyberGreen} />
            <Text style={s.emptyTitle}>No active number yet</Text>
            <Text style={s.emptyText}>Get verification or rent a number to start.</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function ActionCard({ icon: Icon, label, text, action }: { icon: AppIcon; label: string; text: string; action: () => void }) {
  return (
    <TouchableOpacity
      style={s.quickCard}
      onPress={() => { triggerHaptic('impact'); action(); }}
      activeOpacity={0.78}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${text}`}
      hitSlop={HIT_SLOP}
    >
      <View style={s.quickIcon}><Icon size={20} color={BRAND.colors.cyberGreen} /></View>
      <Text style={s.quickLabel}>{label}</Text>
      <Text style={s.quickSub}>{text}</Text>
    </TouchableOpacity>
  );
}

function PlatformCard({ icon: Icon, label, text, action }: { icon: AppIcon; label: string; text: string; action: () => void }) {
  return (
    <TouchableOpacity
      style={s.platformCard}
      activeOpacity={0.78}
      onPress={() => { triggerHaptic('selection'); action(); }}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${text}`}
      hitSlop={HIT_SLOP}
    >
      <Icon size={18} color={BRAND.colors.cyberGreen} />
      <Text style={s.platformLabel}>{label}</Text>
      <Text style={s.platformText}>{text}</Text>
    </TouchableOpacity>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND.colors.black },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 8 },
  greeting: { color: BRAND.colors.metalStart, fontSize: 13 },
  name: { color: BRAND.colors.white, fontSize: 24, fontWeight: '900', marginTop: 2 },
  notification: { width: 42, height: 42, borderRadius: BRAND.radii.md, backgroundColor: BRAND.colors.surface, borderWidth: 1, borderColor: BRAND.colors.border, alignItems: 'center', justifyContent: 'center' },
  hero: { margin: 20, marginTop: 12, backgroundColor: BRAND.colors.surface, borderRadius: BRAND.radii.lg, padding: 20, borderWidth: 1, borderColor: BRAND.colors.border },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroKicker: { color: BRAND.colors.cyberGreen, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  heroTitle: { color: BRAND.colors.white, fontSize: 32, lineHeight: 34, fontWeight: '900', textTransform: 'uppercase', marginTop: 24 },
  heroSub: { color: BRAND.colors.metalStart, fontSize: 14, lineHeight: 22, marginTop: 10 },
  heroPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 18 },
  pill: { color: BRAND.colors.cyberGreen, borderWidth: 1, borderColor: `${BRAND.colors.cyberGreen}30`, backgroundColor: `${BRAND.colors.cyberGreen}10`, paddingHorizontal: 10, paddingVertical: 6, borderRadius: BRAND.radii.sm, fontSize: 10, fontWeight: '800' },
  sectionTitle: { color: BRAND.colors.muted, fontSize: 11, fontWeight: '800', marginLeft: 20, marginBottom: 12, marginTop: 10, textTransform: 'uppercase' },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 10 },
  quickCard: { width: '47.8%', backgroundColor: BRAND.colors.surface, borderRadius: BRAND.radii.lg, padding: 16, borderWidth: 1, borderColor: BRAND.colors.border },
  quickIcon: { width: 44, height: 44, borderRadius: BRAND.radii.md, backgroundColor: `${BRAND.colors.cyberGreen}10`, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  quickLabel: { color: BRAND.colors.white, fontSize: 14, fontWeight: '800' },
  quickSub: { color: BRAND.colors.metalStart, fontSize: 12, marginTop: 4 },
  platformRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 16 },
  platformCard: { width: '47.8%', backgroundColor: BRAND.colors.dark, borderRadius: BRAND.radii.lg, padding: 14, borderWidth: 1, borderColor: BRAND.colors.border, minHeight: 112 },
  platformLabel: { color: BRAND.colors.white, fontSize: 13, fontWeight: '800', marginTop: 12 },
  platformText: { color: BRAND.colors.metalStart, fontSize: 11, marginTop: 4 },
  offlineCard: { margin: 20, flexDirection: 'row', gap: 12, backgroundColor: `${BRAND.colors.cyberGreen}08`, borderRadius: BRAND.radii.lg, padding: 16, borderWidth: 1, borderColor: `${BRAND.colors.cyberGreen}25` },
  offlineTitle: { color: BRAND.colors.white, fontSize: 14, fontWeight: '800' },
  offlineText: { color: BRAND.colors.metalStart, fontSize: 12, lineHeight: 18, marginTop: 3 },
  numberCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 8, backgroundColor: BRAND.colors.surface, borderRadius: BRAND.radii.lg, padding: 14, borderWidth: 1, borderColor: BRAND.colors.border },
  numberIcon: { width: 34, height: 34, borderRadius: BRAND.radii.md, backgroundColor: `${BRAND.colors.cyberGreen}10`, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  numberInfo: { flex: 1 },
  numberText: { color: BRAND.colors.white, fontSize: 13, fontWeight: '800', fontFamily: BRAND.typography.mono },
  numberMeta: { color: BRAND.colors.metalStart, fontSize: 11, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: BRAND.radii.sm, backgroundColor: `${BRAND.colors.cyberGreen}12` },
  statusText: { color: BRAND.colors.cyberGreen, fontSize: 10, fontWeight: '800' },
  emptyNumber: { marginHorizontal: 20, borderRadius: BRAND.radii.lg, borderWidth: 1, borderColor: BRAND.colors.border, backgroundColor: BRAND.colors.surface, padding: 22, alignItems: 'center' },
  emptyTitle: { color: BRAND.colors.white, fontSize: 15, fontWeight: '800', marginTop: 12 },
  emptyText: { color: BRAND.colors.metalStart, fontSize: 12, marginTop: 4 },
});
