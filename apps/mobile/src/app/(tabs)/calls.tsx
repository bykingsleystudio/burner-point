import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, Vibration, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MessageSquare, Phone, ShieldCheck, Wifi } from 'lucide-react-native';

const recentCalls = [
  ['+1 415 555 0182', 'Outbound over WiFi', '2m 14s'],
  ['+1 647 555 0198', 'Voicemail saved', '0m 38s'],
  ['+1 212 555 0144', 'Inbound private call', '5m 02s'],
];

export default function CallsScreen() {
  const router = useRouter();

  const startCall = () => {
    Vibration.vibrate(35);
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
            <Wifi size={18} color="#00FF9D" />
            <Text style={s.routeLabel}>Live route</Text>
          </View>
          <Text style={s.number}>+1 415 555 0182</Text>
          <Text style={s.routeMeta}>Burner Point conversation number</Text>
          <TouchableOpacity style={s.primaryButton} activeOpacity={0.78} onPress={startCall}>
            <Phone size={18} color="#000000" />
            <Text style={s.primaryText}>Start Private Call</Text>
          </TouchableOpacity>
        </View>

        <View style={s.actions}>
          <TouchableOpacity style={s.action} activeOpacity={0.78} onPress={() => Alert.alert('Message', 'Open a private SMS/MMS thread from the inbox.')}>
            <MessageSquare size={20} color="#00FF9D" />
            <Text style={s.actionTitle}>Message</Text>
            <Text style={s.actionText}>SMS and MMS photos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.action} activeOpacity={0.78} onPress={() => Alert.alert('Voicemail', 'Voicemail routing is handled inside your conversation inbox.')}>
            <ShieldCheck size={20} color="#00FF9D" />
            <Text style={s.actionTitle}>Voicemail</Text>
            <Text style={s.actionText}>Private call backup</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.sectionTitle}>Recent activity</Text>
        {recentCalls.map(([number, label, duration]) => (
          <View key={`${number}-${label}`} style={s.callRow}>
            <View style={s.callIcon}>
              <Phone size={15} color="#00FF9D" />
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
  container: { flex: 1, backgroundColor: '#000000' },
  content: { padding: 20, paddingBottom: 32 },
  kicker: { color: '#00FF9D', fontSize: 11, fontWeight: '900', letterSpacing: 2.4, textTransform: 'uppercase' },
  title: { color: '#FFFFFF', fontSize: 36, lineHeight: 36, fontWeight: '900', textTransform: 'uppercase', marginTop: 12 },
  subtitle: { color: '#91A39A', fontSize: 14, lineHeight: 22, marginTop: 12 },
  heroCard: { marginTop: 24, borderRadius: 32, padding: 20, backgroundColor: '#07140F', borderWidth: 1, borderColor: '#123425' },
  routeTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  routeLabel: { color: '#00FF9D', fontSize: 11, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },
  number: { color: '#FFFFFF', fontSize: 26, fontFamily: 'monospace', fontWeight: '800', marginTop: 24 },
  routeMeta: { color: '#6F8177', fontSize: 12, marginTop: 6 },
  primaryButton: { marginTop: 22, minHeight: 54, borderRadius: 18, backgroundColor: '#00FF9D', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryText: { color: '#000000', fontSize: 13, fontWeight: '900', letterSpacing: 1.2, textTransform: 'uppercase' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 14 },
  action: { flex: 1, minHeight: 132, borderRadius: 24, padding: 16, backgroundColor: '#03110B', borderWidth: 1, borderColor: '#123425' },
  actionTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '900', marginTop: 18 },
  actionText: { color: '#728178', fontSize: 12, lineHeight: 18, marginTop: 4 },
  sectionTitle: { color: '#5B6A61', fontSize: 11, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase', marginTop: 28, marginBottom: 12 },
  callRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, padding: 14, backgroundColor: '#07140F', borderWidth: 1, borderColor: '#123425', marginBottom: 10 },
  callIcon: { width: 38, height: 38, borderRadius: 14, backgroundColor: '#00FF9D12', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  callNumber: { color: '#FFFFFF', fontFamily: 'monospace', fontSize: 13, fontWeight: '800' },
  callLabel: { color: '#6F8177', fontSize: 12, marginTop: 3 },
  duration: { color: '#00FF9D', fontFamily: 'monospace', fontSize: 12, fontWeight: '800' },
});
