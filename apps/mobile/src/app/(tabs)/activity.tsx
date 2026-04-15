import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Activity, CheckCircle2, Clock, CreditCard, MessageSquare, ShieldCheck } from 'lucide-react-native';
import { BRAND } from '../../lib/brand';

const events = [
  ['OTP received', 'Telegram code delivered to +1 415 555 0182', '15s ago', MessageSquare],
  ['Rental renewed', 'Monthly private number extended', '12m ago', CheckCircle2],
  ['Payment routed', 'Paystack wallet top-up confirmed', '1h ago', CreditCard],
  ['Risk check passed', 'No suspicious velocity detected', '2h ago', ShieldCheck],
];

export default function ActivityScreen() {
  return (
    <SafeAreaView style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
        <Text style={s.kicker}>Activity</Text>
        <Text style={s.title}>Your privacy timeline.</Text>
        <Text style={s.subtitle}>Verification events, rental changes, billing updates, and security checks in one controlled feed.</Text>

        <View style={s.statusCard}>
          <Activity size={20} color={BRAND.colors.neonGreen} />
          <View style={{ flex: 1 }}>
            <Text style={s.statusTitle}>System healthy</Text>
            <Text style={s.statusText}>Routing, inbox, wallet, and notification services are ready.</Text>
          </View>
        </View>

        <Text style={s.sectionTitle}>Latest events</Text>
        {events.map(([title, text, time, Icon]) => (
          <View key={`${title}-${time}`} style={s.eventRow}>
            <View style={s.eventIcon}>
              <Icon size={16} color={BRAND.colors.cyberGreen} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.eventTitle}>{title as string}</Text>
              <Text style={s.eventText}>{text as string}</Text>
            </View>
            <View style={s.timePill}>
              <Clock size={10} color={BRAND.colors.cyberGreen} />
              <Text style={s.timeText}>{time as string}</Text>
            </View>
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
  statusCard: { marginTop: 24, flexDirection: 'row', gap: 12, borderRadius: BRAND.radii.lg, padding: 18, backgroundColor: `${BRAND.colors.neonGreen}0A`, borderWidth: 1, borderColor: `${BRAND.colors.neonGreen}28` },
  statusTitle: { color: BRAND.colors.white, fontSize: 15, fontWeight: '900' },
  statusText: { color: BRAND.colors.metalStart, fontSize: 12, lineHeight: 18, marginTop: 4 },
  sectionTitle: { color: BRAND.colors.muted, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', marginTop: 30, marginBottom: 12 },
  eventRow: { flexDirection: 'row', alignItems: 'center', borderRadius: BRAND.radii.lg, padding: 14, backgroundColor: BRAND.colors.surface, borderWidth: 1, borderColor: BRAND.colors.border, marginBottom: 10 },
  eventIcon: { width: 40, height: 40, borderRadius: BRAND.radii.md, backgroundColor: `${BRAND.colors.cyberGreen}12`, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  eventTitle: { color: BRAND.colors.white, fontSize: 14, fontWeight: '900' },
  eventText: { color: BRAND.colors.muted, fontSize: 12, lineHeight: 18, marginTop: 3 },
  timePill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: BRAND.radii.sm, paddingHorizontal: 8, paddingVertical: 5, backgroundColor: `${BRAND.colors.cyberGreen}10` },
  timeText: { color: BRAND.colors.cyberGreen, fontSize: 9, fontWeight: '900' },
});
