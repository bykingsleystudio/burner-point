import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CalendarDays, Phone, Trash2, Clock, ShieldCheck } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { API_BASE_URL } from '../../lib/config';
import { getApiAccessToken } from '../../lib/auth';
import { useBurnerAuth } from '../../lib/auth-context';
import { BRAND } from '../../lib/brand';
import { triggerHaptic } from '../../lib/native-ux';
import { EmptyState, LoadingState } from '../../components/design-system';

const HIT_SLOP = { top: 8, right: 8, bottom: 8, left: 8 };

export default function NumbersScreen() {
  const router = useRouter();
  const { isLoaded, isSignedIn, session } = useBurnerAuth();
  const [numbers, setNumbers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      if (!isLoaded) return;
      if (!isSignedIn) {
        router.replace('/auth/login' as any);
        return;
      }
      const token = await getApiAccessToken(undefined, session);
      const res = await axios.get(`${API_BASE_URL}/numbers`, { headers: { Authorization: `Bearer ${token}` } });
      setNumbers(res.data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [isLoaded, isSignedIn, router, session]);

  const release = (id: string, number: string) => {
    triggerHaptic('warning');
    Alert.alert('Release Number', `Release ${number}? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Release', style: 'destructive', onPress: async () => {
        try {
          const token = await getApiAccessToken(undefined, session);
          await axios.delete(`${API_BASE_URL}/numbers/${id}`, { headers: { Authorization: `Bearer ${token}` } });
          setNumbers((n) => n.filter((num) => num.id !== id));
        } catch {}
      }},
    ]);
  };

  if (loading) return (
    <SafeAreaView style={s.container}>
      <View style={{ padding: 16 }}>
        <LoadingState label="Loading numbers..." />
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text accessibilityRole="header" style={s.title}>My Numbers</Text>
        <Text style={s.subtitle}>{numbers.length} total</Text>
      </View>
      <View style={s.actions}>
        <TouchableOpacity
          style={s.actionCard}
          activeOpacity={0.78}
          onPress={() => { triggerHaptic('impact'); router.push('/verification' as any); }}
          accessibilityRole="button"
          accessibilityLabel="Get Verification: SMS or voice OTP"
          hitSlop={HIT_SLOP}
        >
          <ShieldCheck size={18} color={BRAND.colors.cyberGreen} />
          <Text style={s.actionTitle}>Get Verification</Text>
          <Text style={s.actionText}>SMS or voice OTP</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={s.actionCard}
          activeOpacity={0.78}
          onPress={() => { triggerHaptic('impact'); router.push('/rentals' as any); }}
          accessibilityRole="button"
          accessibilityLabel="Rent A Number: Temporary or monthly"
          hitSlop={HIT_SLOP}
        >
          <CalendarDays size={18} color={BRAND.colors.cyberGreen} />
          <Text style={s.actionTitle}>Rent A Number</Text>
          <Text style={s.actionText}>Temporary or monthly</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={numbers}
        keyExtractor={(n) => n.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <EmptyState title="No numbers yet" text="Start with verification or a rental." />
        }
        renderItem={({ item: n }) => (
          <View style={s.card}>
            <View style={s.iconBox}><Phone size={16} color={BRAND.colors.cyberGreen}/></View>
            <View style={s.info}>
              <Text style={s.number}>{n.number}</Text>
              <Text style={s.meta}>{n.countryCode} - {n.type}</Text>
              {n.expiresAt && (
                <View style={s.expiryRow}>
                  <Clock size={10} color={BRAND.colors.neonGreen}/>
                  <Text style={s.expiry}> Expires {new Date(n.expiresAt).toLocaleDateString()}</Text>
                </View>
              )}
            </View>
            <View style={s.right}>
              <View style={[s.badge, n.status === 'active' ? s.badgeActive : s.badgeInactive]}>
                <Text style={[s.badgeText, n.status === 'active' ? { color: BRAND.colors.cyberGreen } : { color: BRAND.colors.muted }]}>{n.status}</Text>
              </View>
              <TouchableOpacity
                onPress={() => release(n.id, n.number)}
                style={s.deleteBtn}
                accessibilityRole="button"
                accessibilityLabel={`Release ${n.number}`}
                hitSlop={HIT_SLOP}
              >
                <Trash2 size={14} color={BRAND.colors.muted}/>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND.colors.black },
  header: { padding: 20, paddingBottom: 8 },
  title: { color: BRAND.colors.white, fontSize: 22, fontWeight: '900' },
  subtitle: { color: BRAND.colors.muted, fontSize: 13, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginTop: 8, marginBottom: 4 },
  actionCard: { flex: 1, minHeight: 112, borderRadius: BRAND.radii.lg, borderWidth: 1, borderColor: BRAND.colors.border, backgroundColor: BRAND.colors.surface, padding: 14 },
  actionTitle: { color: BRAND.colors.white, fontSize: 13, fontWeight: '900', marginTop: 12, textTransform: 'uppercase' },
  actionText: { color: BRAND.colors.metalStart, fontSize: 11, marginTop: 4 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: BRAND.colors.surface, borderRadius: BRAND.radii.lg, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: BRAND.colors.border },
  iconBox: { width: 36, height: 36, borderRadius: BRAND.radii.md, backgroundColor: `${BRAND.colors.cyberGreen}10`, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  info: { flex: 1 },
  number: { color: BRAND.colors.white, fontSize: 14, fontWeight: '700', fontFamily: BRAND.typography.mono },
  meta: { color: BRAND.colors.muted, fontSize: 11, marginTop: 2 },
  expiryRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  expiry: { color: BRAND.colors.neonGreen, fontSize: 10 },
  right: { alignItems: 'flex-end', gap: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeActive: { backgroundColor: `${BRAND.colors.cyberGreen}15` },
  badgeInactive: { backgroundColor: BRAND.colors.dark },
  badgeText: { fontSize: 10, fontWeight: '700' },
  deleteBtn: { padding: 4 },
});
