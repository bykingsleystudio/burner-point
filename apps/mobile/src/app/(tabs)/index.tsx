import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shield, Phone, MessageSquare, Zap, CreditCard } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

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
        axios.get(`${API_URL}/users/me`, { headers }),
        axios.get(`${API_URL}/numbers`, { headers }),
      ]);
      setUser(userRes.data);
      setNumbers(numsRes.data.slice(0, 3));
    } catch {}
  };

  useEffect(() => { load(); }, []);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const quickActions = [
    { icon: Phone, label: 'New Number', color: '#00FF9D', action: () => router.push('/numbers' as any) },
    { icon: Shield, label: 'Verify OTP', color: '#60A5FA', action: () => {} },
    { icon: CreditCard, label: 'Add Credits', color: '#FBBF24', action: () => router.push('/credits' as any) },
    { icon: MessageSquare, label: 'Inbox', color: '#A78BFA', action: () => router.push('/messages' as any) },
  ];

  return (
    <SafeAreaView style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00FF9D"/>}>
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.greeting}>Good {getGreeting()}</Text>
            <Text style={s.name}>{user?.firstName || 'there'} 👋</Text>
          </View>
          <View style={s.logoMark}>
            <Shield size={18} color="#0A0A0A"/>
          </View>
        </View>

        {/* Wallet card */}
        <View style={s.walletCard}>
          <Text style={s.walletLabel}>Wallet Balance</Text>
          <Text style={s.walletBalance}>₦{((user?.walletBalanceKobo || 0) / 100).toLocaleString()}</Text>
          <Text style={s.walletSub}>Available credits</Text>
        </View>

        {/* Quick actions */}
        <Text style={s.sectionTitle}>Quick Actions</Text>
        <View style={s.quickGrid}>
          {quickActions.map((a) => (
            <TouchableOpacity key={a.label} style={s.quickCard} onPress={a.action} activeOpacity={0.7}>
              <View style={[s.quickIcon, { backgroundColor: `${a.color}20` }]}>
                <a.icon size={20} color={a.color}/>
              </View>
              <Text style={s.quickLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Active numbers */}
        {numbers.length > 0 && (
          <>
            <Text style={s.sectionTitle}>Active Numbers</Text>
            {numbers.map((n) => (
              <View key={n.id} style={s.numberCard}>
                <View style={s.numberIcon}>
                  <Phone size={14} color="#00FF9D"/>
                </View>
                <View style={s.numberInfo}>
                  <Text style={s.numberText}>{n.number}</Text>
                  <Text style={s.numberMeta}>{n.countryCode} · {n.type} · {n.status}</Text>
                </View>
                <View style={[s.statusBadge, n.status === 'active' ? s.statusActive : s.statusInactive]}>
                  <Text style={[s.statusText, n.status === 'active' ? {color:'#00FF9D'} : {color:'#666'}]}>{n.status}</Text>
                </View>
              </View>
            ))}
          </>
        )}

        <View style={{ height: 24 }}/>
      </ScrollView>
    </SafeAreaView>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 8 },
  greeting: { color: '#666', fontSize: 13 },
  name: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginTop: 2 },
  logoMark: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#00FF9D', alignItems: 'center', justifyContent: 'center' },
  walletCard: { margin: 20, marginTop: 12, backgroundColor: '#111', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#2A2A2A' },
  walletLabel: { color: '#666', fontSize: 12, marginBottom: 6 },
  walletBalance: { color: '#00FF9D', fontSize: 36, fontWeight: 'bold', fontFamily: 'monospace' },
  walletSub: { color: '#666', fontSize: 12, marginTop: 4 },
  sectionTitle: { color: '#666', fontSize: 11, fontWeight: '600', letterSpacing: 1, marginLeft: 20, marginBottom: 12, marginTop: 8 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 8 },
  quickCard: { width: '47%', backgroundColor: '#111', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#2A2A2A', alignItems: 'center' },
  quickIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  quickLabel: { color: '#fff', fontSize: 12, fontWeight: '600' },
  numberCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 8, backgroundColor: '#111', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#2A2A2A' },
  numberIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#00FF9D10', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  numberInfo: { flex: 1 },
  numberText: { color: '#fff', fontSize: 13, fontWeight: '600', fontFamily: 'monospace' },
  numberMeta: { color: '#666', fontSize: 11, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusActive: { backgroundColor: '#00FF9D15' },
  statusInactive: { backgroundColor: '#2A2A2A' },
  statusText: { fontSize: 10, fontWeight: '700' },
});
