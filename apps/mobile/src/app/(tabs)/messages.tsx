import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageSquare, Zap, Shield } from 'lucide-react-native';
import { useAuth } from '@clerk/clerk-expo';
import axios from 'axios';
import { API_BASE_URL } from '../../lib/config';
import { getApiAccessToken } from '../../lib/auth';
import { BRAND } from '../../lib/brand';

export default function MessagesScreen() {
  const { getToken } = useAuth();
  const [numbers, setNumbers] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await getApiAccessToken(getToken);
      const h = { Authorization: `Bearer ${token}` };
      const numsRes = await axios.get(`${API_BASE_URL}/numbers`, { headers: h });
      setNumbers(numsRes.data);
      if (numsRes.data.length) {
        setSelectedId(numsRes.data[0].id);
        const msgRes = await axios.get(`${API_BASE_URL}/messages?phoneNumberId=${numsRes.data[0].id}`, { headers: h });
        setMessages(msgRes.data);
      }
      setLoading(false);
    })().catch(() => setLoading(false));
  }, [getToken]);

  if (loading) return (
    <SafeAreaView style={s.container}>
      <ActivityIndicator color={BRAND.colors.cyberGreen} style={{ marginTop: 40 }}/>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}><Text style={s.title}>Inbox</Text></View>

      {/* Number tabs */}
      <FlatList horizontal data={numbers} keyExtractor={(n) => n.id}
        style={s.numList} showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        renderItem={({ item: n }) => (
          <TouchableOpacity onPress={() => setSelectedId(n.id)}
            style={[s.numTab, selectedId === n.id && s.numTabActive]}>
            <Text style={[s.numTabText, selectedId === n.id && s.numTabTextActive]}>{n.number}</Text>
          </TouchableOpacity>
        )}
      />

      {/* Messages */}
      <FlatList data={messages} keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: 16 }}
        inverted
        ListEmptyComponent={
          <View style={s.empty}>
            <MessageSquare size={28} color={BRAND.colors.muted}/>
            <Text style={s.emptyText}>No messages yet</Text>
          </View>
        }
        renderItem={({ item: m }) => (
          <View style={[s.bubble, m.direction === 'outbound' ? s.bubbleOut : s.bubbleIn]}>
            {m.extractedOtp && (
              <View style={s.otpBadge}>
                <Zap size={12} color={BRAND.colors.cyberGreen}/>
                <Text style={s.otpText}>{m.extractedOtp}</Text>
              </View>
            )}
            {m.isSpam && (
              <View style={s.spamBadge}>
                <Shield size={10} color={BRAND.colors.danger}/>
                <Text style={s.spamText}> Spam</Text>
              </View>
            )}
            <Text style={s.bubbleText}>{m.body}</Text>
            <Text style={s.bubbleTime}>{new Date(m.createdAt).toLocaleTimeString()}</Text>
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
  numList: { maxHeight: 44, marginBottom: 8 },
  numTab: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: BRAND.radii.sm, backgroundColor: BRAND.colors.surface, borderWidth: 1, borderColor: BRAND.colors.border },
  numTabActive: { backgroundColor: `${BRAND.colors.cyberGreen}15`, borderColor: `${BRAND.colors.cyberGreen}40` },
  numTabText: { color: BRAND.colors.muted, fontSize: 12, fontFamily: BRAND.typography.mono },
  numTabTextActive: { color: BRAND.colors.cyberGreen },
  bubble: { maxWidth: '80%', borderRadius: 16, padding: 12, marginBottom: 8 },
  bubbleIn: { backgroundColor: BRAND.colors.surface, alignSelf: 'flex-start', borderWidth: 1, borderColor: BRAND.colors.border },
  bubbleOut: { backgroundColor: `${BRAND.colors.cyberGreen}15`, alignSelf: 'flex-end' },
  bubbleText: { color: BRAND.colors.white, fontSize: 14, lineHeight: 20 },
  bubbleTime: { color: BRAND.colors.muted, fontSize: 10, marginTop: 4 },
  otpBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: `${BRAND.colors.cyberGreen}10`, borderRadius: BRAND.radii.sm, paddingHorizontal: 8, paddingVertical: 4, marginBottom: 6, gap: 4 },
  otpText: { color: BRAND.colors.cyberGreen, fontWeight: '900', fontSize: 18, fontFamily: BRAND.typography.mono },
  spamBadge: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  spamText: { color: BRAND.colors.danger, fontSize: 10 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: BRAND.colors.muted, fontSize: 14, marginTop: 10 },
});
