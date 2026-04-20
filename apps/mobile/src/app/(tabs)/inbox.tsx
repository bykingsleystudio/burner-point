import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MessageSquare, Phone, ShieldCheck, Wifi } from 'lucide-react-native';
import { BRAND } from '../../lib/brand';

const threads = [
  ['+1 415 555 0182', 'Telegram code received', 'OTP'],
  ['+1 647 555 0198', 'Missed call routed to voicemail', 'Voice'],
  ['+1 212 555 0144', 'Media message ready for review', 'MMS'],
];

export default function InboxScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
        <Text style={s.kicker}>Conversation inbox</Text>
        <Text style={s.title}>Calls, texts, voicemail, and private communication in one thread.</Text>
        <Text style={s.subtitle}>
          US and Canada conversation numbers keep communication reachable without exposing your personal line.
        </Text>

        <View style={s.statusCard}>
          <View style={s.statusTop}>
            <ShieldCheck size={19} color={BRAND.colors.cyberGreen} />
            <Text style={s.statusLabel}>Private By Design</Text>
          </View>
          <Text style={s.statusText}>SMS, MMS, voice calls, voicemail, secure audio, photo and video activity, and OTPs stay tied to the Burner Point number that received them.</Text>
          <View style={s.pills}>
            {['No personal number', 'WiFi & Data', 'US/CA'].map((item) => <Text key={item} style={s.pill}>{item}</Text>)}
          </View>
        </View>

        <View style={s.actions}>
          <TouchableOpacity style={s.action} activeOpacity={0.78} onPress={() => router.push('/messages' as any)}>
            <MessageSquare size={20} color={BRAND.colors.cyberGreen} />
            <Text style={s.actionTitle}>Messages</Text>
            <Text style={s.actionText}>SMS and messaging threads</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.action} activeOpacity={0.78} onPress={() => router.push('/calls' as any)}>
            <Phone size={20} color={BRAND.colors.cyberGreen} />
            <Text style={s.actionTitle}>Calls</Text>
            <Text style={s.actionText}>Voice and voicemail</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.sectionTitle}>Recent private activity</Text>
        {threads.map(([number, text, type]) => (
          <View key={`${number}-${type}`} style={s.thread}>
            <View style={s.threadIcon}>
              <Wifi size={15} color={BRAND.colors.cyberGreen} />
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
  container: { flex: 1, backgroundColor: BRAND.colors.black },
  content: { padding: 20, paddingBottom: 36 },
  kicker: { color: BRAND.colors.cyberGreen, fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  title: { color: BRAND.colors.white, fontSize: 34, lineHeight: 35, fontWeight: '900', textTransform: 'uppercase', marginTop: 12 },
  subtitle: { color: BRAND.colors.metalStart, fontSize: 14, lineHeight: 22, marginTop: 12 },
  statusCard: { marginTop: 24, borderRadius: BRAND.radii.lg, padding: 18, backgroundColor: BRAND.colors.surface, borderWidth: 1, borderColor: BRAND.colors.border },
  statusTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusLabel: { color: BRAND.colors.cyberGreen, fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  statusText: { color: BRAND.colors.metalEnd, fontSize: 13, lineHeight: 21, marginTop: 14 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  pill: { color: BRAND.colors.cyberGreen, borderWidth: 1, borderColor: `${BRAND.colors.cyberGreen}30`, backgroundColor: `${BRAND.colors.cyberGreen}10`, paddingHorizontal: 10, paddingVertical: 6, borderRadius: BRAND.radii.sm, fontSize: 10, fontWeight: '900' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 14 },
  action: { flex: 1, minHeight: 126, borderRadius: BRAND.radii.lg, padding: 16, backgroundColor: BRAND.colors.dark, borderWidth: 1, borderColor: BRAND.colors.border },
  actionTitle: { color: BRAND.colors.white, fontSize: 15, fontWeight: '900', marginTop: 16 },
  actionText: { color: BRAND.colors.metalStart, fontSize: 12, lineHeight: 18, marginTop: 4 },
  sectionTitle: { color: BRAND.colors.muted, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', marginTop: 28, marginBottom: 12 },
  thread: { flexDirection: 'row', alignItems: 'center', borderRadius: BRAND.radii.lg, padding: 14, backgroundColor: BRAND.colors.surface, borderWidth: 1, borderColor: BRAND.colors.border, marginBottom: 10 },
  threadIcon: { width: 38, height: 38, borderRadius: BRAND.radii.md, backgroundColor: `${BRAND.colors.cyberGreen}12`, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  threadNumber: { color: BRAND.colors.white, fontFamily: BRAND.typography.mono, fontSize: 13, fontWeight: '800' },
  threadText: { color: BRAND.colors.muted, fontSize: 12, marginTop: 3 },
  type: { color: BRAND.colors.cyberGreen, fontFamily: BRAND.typography.mono, fontSize: 11, fontWeight: '900' },
});
