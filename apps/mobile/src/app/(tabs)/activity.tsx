import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Activity, CheckCircle2, Clock, CreditCard, MessageSquare, ShieldCheck } from 'lucide-react-native';

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
          <Activity size={20} color="#39FF14" />
          <View style={{ flex: 1 }}>
            <Text style={s.statusTitle}>System healthy</Text>
            <Text style={s.statusText}>Routing, inbox, wallet, and notification services are ready.</Text>
          </View>
        </View>

        <Text style={s.sectionTitle}>Latest events</Text>
        {events.map(([title, text, time, Icon]) => (
          <View key={`${title}-${time}`} style={s.eventRow}>
            <View style={s.eventIcon}>
              <Icon size={16} color="#00FF9D" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.eventTitle}>{title as string}</Text>
              <Text style={s.eventText}>{text as string}</Text>
            </View>
            <View style={s.timePill}>
              <Clock size={10} color="#00FF9D" />
              <Text style={s.timeText}>{time as string}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  content: { padding: 20, paddingBottom: 32 },
  kicker: { color: '#00FF9D', fontSize: 11, fontWeight: '900', letterSpacing: 2.4, textTransform: 'uppercase' },
  title: { color: '#FFFFFF', fontSize: 36, lineHeight: 36, fontWeight: '900', textTransform: 'uppercase', marginTop: 12 },
  subtitle: { color: '#91A39A', fontSize: 14, lineHeight: 22, marginTop: 12 },
  statusCard: { marginTop: 24, flexDirection: 'row', gap: 12, borderRadius: 26, padding: 18, backgroundColor: '#39FF140A', borderWidth: 1, borderColor: '#39FF1428' },
  statusTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  statusText: { color: '#8EA097', fontSize: 12, lineHeight: 18, marginTop: 4 },
  sectionTitle: { color: '#5B6A61', fontSize: 11, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase', marginTop: 30, marginBottom: 12 },
  eventRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 22, padding: 14, backgroundColor: '#07140F', borderWidth: 1, borderColor: '#123425', marginBottom: 10 },
  eventIcon: { width: 40, height: 40, borderRadius: 15, backgroundColor: '#00FF9D12', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  eventTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  eventText: { color: '#6F8177', fontSize: 12, lineHeight: 18, marginTop: 3 },
  timePill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5, backgroundColor: '#00FF9D10' },
  timeText: { color: '#00FF9D', fontSize: 9, fontWeight: '900' },
});
