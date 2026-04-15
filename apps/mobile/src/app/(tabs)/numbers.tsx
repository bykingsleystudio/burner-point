import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Phone, Plus, Trash2, Clock } from 'lucide-react-native';
import { useAuth } from '@clerk/clerk-expo';
import axios from 'axios';
import { API_BASE_URL } from '../../lib/config';
import { getApiAccessToken } from '../../lib/auth';
import { BRAND } from '../../lib/brand';

export default function NumbersScreen() {
  const { getToken } = useAuth();
  const [numbers, setNumbers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const token = await getApiAccessToken(getToken);
      const res = await axios.get(`${API_BASE_URL}/numbers`, { headers: { Authorization: `Bearer ${token}` } });
      setNumbers(res.data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const release = (id: string, number: string) => {
    Alert.alert('Release Number', `Release ${number}? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Release', style: 'destructive', onPress: async () => {
        try {
          const token = await getApiAccessToken(getToken);
          await axios.delete(`${API_BASE_URL}/numbers/${id}`, { headers: { Authorization: `Bearer ${token}` } });
          setNumbers((n) => n.filter((num) => num.id !== id));
        } catch {}
      }},
    ]);
  };

  if (loading) return (
    <SafeAreaView style={s.container}>
      <ActivityIndicator color={BRAND.colors.cyberGreen} style={{ marginTop: 40 }}/>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>My Numbers</Text>
        <Text style={s.subtitle}>{numbers.length} total</Text>
      </View>
      <FlatList
        data={numbers}
        keyExtractor={(n) => n.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <View style={s.empty}>
            <Phone size={32} color={BRAND.colors.muted}/>
            <Text style={s.emptyText}>No numbers yet</Text>
            <Text style={s.emptySub}>Get one from the web app</Text>
          </View>
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
              <TouchableOpacity onPress={() => release(n.id, n.number)} style={s.deleteBtn}>
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
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: BRAND.colors.muted, fontSize: 16, fontWeight: '600', marginTop: 12 },
  emptySub: { color: BRAND.colors.metalStart, fontSize: 13, marginTop: 4 },
});
