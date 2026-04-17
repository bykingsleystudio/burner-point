import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MessageSquare, Phone, ShieldCheck, Wifi } from 'lucide-react-native';
import { BRAND } from '../../lib/brand';
import { triggerHaptic } from '../../lib/native-ux';

const recentCalls = [
  ['+1 415 555 0182', 'Outbound over WiFi', '2m 14s'],
  ['+1 647 555 0198', 'Voicemail saved', '0m 38s'],
  ['+1 212 555 0144', 'Inbound private call', '5m 02s'],
];

export default function CallsScreen() {
  const router = useRouter();

  const startCall = () => {
    triggerHaptic('impact');
    router.push({ pathname: '/call/active', params: { from: '+1 415 555 0182', to: 'Private contact' } } as any);
  };

  return (
    <SafeAreaView style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
        <Text style={s.kicker}>US/CA conversation</Text>
        <Text style={s.title}>Calls over WiFi and mobile data.</Text>
        <Text style={s.subtitle}>SMS, MMS, calling, voicemail, and photos stay separated from your real personal number.</Text>

        <View style={s.heroCard}>
          <View style={s.routeTop}>
            <Wifi size={18} color={BRAND.colors.cyberGreen} />
            <Text style={s.routeLabel}>Live route</Text>
          </View>
          <Text style={s.number}>+1 415 555 0182</Text>
          <Text style={s.routeMeta}>Burner Point conversation number</Text>
          <TouchableOpacity style={s.primaryButton} activeOpacity={0.78} onPress={startCall}>
            <Phone size={18} color={BRAND.colors.black} />
            <Text style={s.primaryText}>Start Private Call</Text>
          </TouchableOpacity>
        </View>

        <View style={s.actions}>
          <TouchableOpacity style={s.action} activeOpacity={0.78} onPress={() => { triggerHaptic('selection'); router.push('/messages' as any); }}>
            <MessageSquare size={20} color={BRAND.colors.cyberGreen} />
            <Text style={s.actionTitle}>Message</Text>
            <Text style={s.actionText}>SMS and MMS photos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.action} activeOpacity={0.78} onPress={() => { triggerHaptic('selection'); router.push('/voicemail' as any); }}>
            <ShieldCheck size={20} color={BRAND.colors.cyberGreen} />
            <Text style={s.actionTitle}>Voicemail</Text>
            <Text style={s.actionText}>Private call backup</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.sectionTitle}>Recent activity</Text>
        {recentCalls.map(([number, label, duration]) => (
          <View key={`${number}-${label}`} style={s.callRow}>
            <View style={s.callIcon}>
              <Phone size={15} color={BRAND.colors.cyberGreen} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.callNumber}>{number}</Text>
              <Text style={s.callLabel}>{label}</Text>
            </View>
            <Text style={s.duration}>{duration}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND.colors.black },
  content: { padding: 20, paddingBottom: 32 },
  kicker: { color: BRAND.colors.cyberGreen, fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  title: { color: BRAND.colors.white, fontSize: 36, lineHeight: 36, fontWeight: '900', textTransform: 'uppercase', marginTop: 12 },
  subtitle: { color: BRAND.colors.metalStart, fontSize: 14, lineHeight: 22, marginTop: 12 },
  heroCard: { marginTop: 24, borderRadius: BRAND.radii.lg, padding: 20, backgroundColor: BRAND.colors.surface, borderWidth: 1, borderColor: BRAND.colors.border },
  routeTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  routeLabel: { color: BRAND.colors.cyberGreen, fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  number: { color: BRAND.colors.white, fontSize: 26, fontFamily: BRAND.typography.mono, fontWeight: '800', marginTop: 24 },
  routeMeta: { color: BRAND.colors.muted, fontSize: 12, marginTop: 6 },
  primaryButton: { marginTop: 22, minHeight: 54, borderRadius: BRAND.radii.sm, backgroundColor: BRAND.colors.cyberGreen, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryText: { color: BRAND.colors.black, fontSize: 13, fontWeight: '900', textTransform: 'uppercase' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 14 },
  action: { flex: 1, minHeight: 132, borderRadius: BRAND.radii.lg, padding: 16, backgroundColor: BRAND.colors.dark, borderWidth: 1, borderColor: BRAND.colors.border },
  actionTitle: { color: BRAND.colors.white, fontSize: 15, fontWeight: '900', marginTop: 18 },
  actionText: { color: BRAND.colors.metalStart, fontSize: 12, lineHeight: 18, marginTop: 4 },
  sectionTitle: { color: BRAND.colors.muted, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', marginTop: 28, marginBottom: 12 },
  callRow: { flexDirection: 'row', alignItems: 'center', borderRadius: BRAND.radii.lg, padding: 14, backgroundColor: BRAND.colors.surface, borderWidth: 1, borderColor: BRAND.colors.border, marginBottom: 10 },
  callIcon: { width: 38, height: 38, borderRadius: BRAND.radii.md, backgroundColor: `${BRAND.colors.cyberGreen}12`, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  callNumber: { color: BRAND.colors.white, fontFamily: BRAND.typography.mono, fontSize: 13, fontWeight: '800' },
  callLabel: { color: BRAND.colors.muted, fontSize: 12, marginTop: 3 },
  duration: { color: BRAND.colors.cyberGreen, fontFamily: BRAND.typography.mono, fontSize: 12, fontWeight: '800' },
});
