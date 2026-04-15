import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MessageSquare, Phone, ShieldCheck, Wifi } from 'lucide-react-native';

const threads = [
  ['+1 415 555 0182', 'Telegram code received', 'OTP'],
  ['+1 647 555 0198', 'Missed call routed to voicemail', 'Voice'],
  ['+1 212 555 0144', 'Photo message ready for review', 'MMS'],
];

export default function InboxScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
        <Text style={s.kicker}>Conversation inbox</Text>
        <Text style={s.title}>Calls, texts, voicemail, and MMS in one private thread.</Text>
        <Text style={s.subtitle}>
          US and Canada conversation numbers keep communication reachable without exposing your personal line.
        </Text>

        <View style={s.statusCard}>
          <View style={s.statusTop}>
            <ShieldCheck size={19} color="#00FF9D" />
            <Text style={s.statusLabel}>Private by design</Text>
          </View>
          <Text style={s.statusText}>SMS, MMS photos, voice calls, voicemail, and OTP activity stay tied to the Burner Point number that received them.</Text>
          <View style={s.pills}>
            {['No personal number', 'WiFi/Data', 'US/CA'].map((item) => <Text key={item} style={s.pill}>{item}</Text>)}
          </View>
        </View>

        <View style={s.actions}>
          <TouchableOpacity style={s.action} activeOpacity={0.78} onPress={() => router.push('/messages' as any)}>
            <MessageSquare size={20} color="#00FF9D" />
            <Text style={s.actionTitle}>Messages</Text>
            <Text style={s.actionText}>SMS and MMS threads</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.action} activeOpacity={0.78} onPress={() => router.push('/calls' as any)}>
            <Phone size={20} color="#00FF9D" />
            <Text style={s.actionTitle}>Calls</Text>
            <Text style={s.actionText}>Voice and voicemail</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.sectionTitle}>Recent private activity</Text>
        {threads.map(([number, text, type]) => (
          <View key={`${number}-${type}`} style={s.thread}>
            <View style={s.threadIcon}>
              <Wifi size={15} color="#00FF9D" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.threadNumber}>{number}</Text>
              <Text style={s.threadText}>{text}</Text>
            </View>
            <Text style={s.type}>{type}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  content: { padding: 20, paddingBottom: 36 },
  kicker: { color: '#00FF9D', fontSize: 11, fontWeight: '900', letterSpacing: 2.4, textTransform: 'uppercase' },
  title: { color: '#FFFFFF', fontSize: 34, lineHeight: 35, fontWeight: '900', textTransform: 'uppercase', marginTop: 12 },
  subtitle: { color: '#91A39A', fontSize: 14, lineHeight: 22, marginTop: 12 },
  statusCard: { marginTop: 24, borderRadius: 16, padding: 18, backgroundColor: '#07140F', borderWidth: 1, borderColor: '#123425' },
  statusTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusLabel: { color: '#00FF9D', fontSize: 11, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },
  statusText: { color: '#A7B5AE', fontSize: 13, lineHeight: 21, marginTop: 14 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  pill: { color: '#00FF9D', borderWidth: 1, borderColor: '#00FF9D30', backgroundColor: '#00FF9D10', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, fontSize: 10, fontWeight: '900' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 14 },
  action: { flex: 1, minHeight: 126, borderRadius: 16, padding: 16, backgroundColor: '#03110B', borderWidth: 1, borderColor: '#123425' },
  actionTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '900', marginTop: 16 },
  actionText: { color: '#728178', fontSize: 12, lineHeight: 18, marginTop: 4 },
  sectionTitle: { color: '#5B6A61', fontSize: 11, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase', marginTop: 28, marginBottom: 12 },
  thread: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 14, backgroundColor: '#07140F', borderWidth: 1, borderColor: '#123425', marginBottom: 10 },
  threadIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#00FF9D12', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  threadNumber: { color: '#FFFFFF', fontFamily: 'monospace', fontSize: 13, fontWeight: '800' },
  threadText: { color: '#6F8177', fontSize: 12, marginTop: 3 },
  type: { color: '#00FF9D', fontFamily: 'monospace', fontSize: 11, fontWeight: '900' },
});
