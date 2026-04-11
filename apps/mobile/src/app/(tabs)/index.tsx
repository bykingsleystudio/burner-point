import { useEffect, useState } from 'react';
import type { ComponentType } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, CalendarDays, CreditCard, Globe2, Lock, MessageSquare, Phone, ShieldCheck, Smartphone, Wifi } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

import { API_BASE_URL } from '../../lib/config';
type AppIcon = ComponentType<any>;

export default function HomeScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [numbers, setNumbers] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      if (!token) { router.replace('/auth/login' as any); return; }
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

  useEffect(() => { load(); }, []);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const quickActions = [
    { icon: ShieldCheck, label: 'Verify OTP', text: 'New private code', action: () => router.push('/numbers' as any) },
    { icon: CalendarDays, label: 'Rentals', text: 'Keep a number', action: () => router.push('/numbers' as any) },
    { icon: MessageSquare, label: 'Inbox', text: 'SMS and voice', action: () => router.push('/messages' as any) },
    { icon: CreditCard, label: 'Credits', text: 'Top up wallet', action: () => router.push('/credits' as any) },
  ];

  const platform = [
    { icon: Smartphone, label: 'eSIM', text: 'Travel data' },
    { icon: Globe2, label: 'Proxies', text: 'Location access' },
    { icon: Lock, label: 'VPN', text: 'Privacy layer' },
  ];

  return (
    <SafeAreaView style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00FF9D" />}>
        <View style={s.header}>
          <View>
            <Text style={s.greeting}>Good {getGreeting()}</Text>
            <Text style={s.name}>{user?.firstName || 'there'}</Text>
          </View>
          <TouchableOpacity style={s.notification} onPress={() => Alert.alert('Push alerts', 'OTP, number expiration, billing, and security alerts are enabled from the app shell.')}>
            <Bell size={18} color="#00FF9D" />
          </TouchableOpacity>
        </View>

        <View style={s.hero}>
          <View style={s.heroTop}>
            <Text style={s.heroKicker}>Private by design</Text>
            <ShieldCheck size={20} color="#00FF9D" />
          </View>
          <Text style={s.heroTitle}>Stay Anonymous. Stay Connected.</Text>
          <Text style={s.heroSub}>Quick access to verifications, rentals, inbox, wallet, and privacy add-ons.</Text>
          <View style={s.heroPills}>
            {['256-bit AES', 'No Logs', 'Real SIM'].map((item) => <Text key={item} style={s.pill}>{item}</Text>)}
          </View>
        </View>

        <Text style={s.sectionTitle}>Quick Actions</Text>
        <View style={s.quickGrid}>
          {quickActions.map((action) => <ActionCard key={action.label} {...action} />)}
        </View>

        <Text style={s.sectionTitle}>Platform Features</Text>
        <View style={s.platformRow}>
          {platform.map((item) => <PlatformCard key={item.label} {...item} />)}
        </View>

        <View style={s.offlineCard}>
          <Wifi size={18} color="#00FF9D" />
          <View style={{ flex: 1 }}>
            <Text style={s.offlineTitle}>Offline-ready account snapshot</Text>
            <Text style={s.offlineText}>Your last wallet and number state stays readable while the network reconnects.</Text>
          </View>
        </View>

        <Text style={s.sectionTitle}>Active Numbers</Text>
        {numbers.length > 0 ? numbers.map((number) => (
          <View key={number.id} style={s.numberCard}>
            <View style={s.numberIcon}><Phone size={15} color="#00FF9D" /></View>
            <View style={s.numberInfo}>
              <Text style={s.numberText}>{number.number}</Text>
              <Text style={s.numberMeta}>{number.countryCode} - {number.type} - {number.status}</Text>
            </View>
            <View style={s.statusBadge}><Text style={s.statusText}>{number.status || 'active'}</Text></View>
          </View>
        )) : (
          <TouchableOpacity style={s.emptyNumber} onPress={() => router.push('/numbers' as any)}>
            <Phone size={24} color="#00FF9D" />
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
    <TouchableOpacity style={s.quickCard} onPress={action} activeOpacity={0.78}>
      <View style={s.quickIcon}><Icon size={20} color="#00FF9D" /></View>
      <Text style={s.quickLabel}>{label}</Text>
      <Text style={s.quickSub}>{text}</Text>
    </TouchableOpacity>
  );
}

function PlatformCard({ icon: Icon, label, text }: { icon: AppIcon; label: string; text: string }) {
  return (
    <TouchableOpacity style={s.platformCard} activeOpacity={0.78} onPress={() => Alert.alert(label, `${label} purchase opens from the full Burner Point catalog.`)}>
      <Icon size={18} color="#00FF9D" />
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
  container: { flex: 1, backgroundColor: '#050807' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 8 },
  greeting: { color: '#8A978F', fontSize: 13 },
  name: { color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 2 },
  notification: { width: 42, height: 42, borderRadius: 16, backgroundColor: '#0B120F', borderWidth: 1, borderColor: '#1D2A23', alignItems: 'center', justifyContent: 'center' },
  hero: { margin: 20, marginTop: 12, backgroundColor: '#0B120F', borderRadius: 30, padding: 20, borderWidth: 1, borderColor: '#1D2A23' },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroKicker: { color: '#00FF9D', fontSize: 11, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase' },
  heroTitle: { color: '#fff', fontSize: 32, lineHeight: 34, fontWeight: '900', textTransform: 'uppercase', marginTop: 24 },
  heroSub: { color: '#95A69D', fontSize: 14, lineHeight: 22, marginTop: 10 },
  heroPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 18 },
  pill: { color: '#00FF9D', borderWidth: 1, borderColor: '#00FF9D30', backgroundColor: '#00FF9D10', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, fontSize: 10, fontWeight: '800' },
  sectionTitle: { color: '#657268', fontSize: 11, fontWeight: '800', letterSpacing: 1.6, marginLeft: 20, marginBottom: 12, marginTop: 10, textTransform: 'uppercase' },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 10 },
  quickCard: { width: '47.8%', backgroundColor: '#0B120F', borderRadius: 22, padding: 16, borderWidth: 1, borderColor: '#1D2A23' },
  quickIcon: { width: 44, height: 44, borderRadius: 16, backgroundColor: '#00FF9D10', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  quickLabel: { color: '#fff', fontSize: 14, fontWeight: '800' },
  quickSub: { color: '#7D8A82', fontSize: 12, marginTop: 4 },
  platformRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16 },
  platformCard: { flex: 1, backgroundColor: '#09100D', borderRadius: 20, padding: 14, borderWidth: 1, borderColor: '#1D2A23', minHeight: 112 },
  platformLabel: { color: '#fff', fontSize: 13, fontWeight: '800', marginTop: 12 },
  platformText: { color: '#7D8A82', fontSize: 11, marginTop: 4 },
  offlineCard: { margin: 20, flexDirection: 'row', gap: 12, backgroundColor: '#00FF9D08', borderRadius: 22, padding: 16, borderWidth: 1, borderColor: '#00FF9D25' },
  offlineTitle: { color: '#fff', fontSize: 14, fontWeight: '800' },
  offlineText: { color: '#95A69D', fontSize: 12, lineHeight: 18, marginTop: 3 },
  numberCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 8, backgroundColor: '#0B120F', borderRadius: 18, padding: 14, borderWidth: 1, borderColor: '#1D2A23' },
  numberIcon: { width: 34, height: 34, borderRadius: 12, backgroundColor: '#00FF9D10', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  numberInfo: { flex: 1 },
  numberText: { color: '#fff', fontSize: 13, fontWeight: '800', fontFamily: 'monospace' },
  numberMeta: { color: '#7D8A82', fontSize: 11, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 9, backgroundColor: '#00FF9D12' },
  statusText: { color: '#00FF9D', fontSize: 10, fontWeight: '800' },
  emptyNumber: { marginHorizontal: 20, borderRadius: 22, borderWidth: 1, borderColor: '#1D2A23', backgroundColor: '#0B120F', padding: 22, alignItems: 'center' },
  emptyTitle: { color: '#fff', fontSize: 15, fontWeight: '800', marginTop: 12 },
  emptyText: { color: '#7D8A82', fontSize: 12, marginTop: 4 },
});
