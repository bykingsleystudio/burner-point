import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { MessageSquare, Phone, ShieldCheck, Wifi } from 'lucide-react-native';
import { BRAND } from '../../lib/brand';
import { triggerHaptic } from '../../lib/native-ux';
import { API_BASE_URL } from '../../lib/config';
import { getApiAccessToken } from '../../lib/auth';
import { formatUsdCents } from '../../lib/money';

type NumberRecord = {
  id: string;
  number: string;
  countryCode?: string;
  type?: string;
};

type CallCreditsBalance = {
  wallet?: {
    balanceUsdCents: number;
  };
  callCredits?: {
    availableBalance: number;
    equivalentUsdCents: number;
  };
};

type CallRate = {
  id: string;
  destinationCountry: string;
  destinationPrefix?: string | null;
  creditsPerMinute: number;
};

type CallRecord = {
  id: string;
  fromNumber: string;
  toNumber: string;
  status: string;
  direction: 'inbound' | 'outbound';
  durationSeconds: number;
  creditsSpent: number;
};

function normalizePhone(value: string) {
  const compact = value.trim().replace(/[^\d+]/g, '');
  if (!compact) return '';
  const normalized = compact.startsWith('00') ? `+${compact.slice(2)}` : compact;
  return normalized.startsWith('+')
    ? `+${normalized.slice(1).replace(/\+/g, '')}`
    : normalized.replace(/\+/g, '');
}

function formatDuration(seconds: number) {
  if (!seconds) return '0m';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (!mins) return `${secs}s`;
  return `${mins}m ${secs.toString().padStart(2, '0')}s`;
}

function matchRate(destinationNumber: string, rates: CallRate[]) {
  const normalized = normalizePhone(destinationNumber);
  if (!normalized) return null;

  return [...rates]
    .sort((left, right) => (right.destinationPrefix?.length ?? 0) - (left.destinationPrefix?.length ?? 0))
    .find((rate) => rate.destinationPrefix && normalized.startsWith(rate.destinationPrefix))
    ?? rates.find((rate) => rate.destinationCountry === 'GLOBAL')
    ?? null;
}

export default function CallsScreen() {
  const router = useRouter();
  const [numbers, setNumbers] = useState<NumberRecord[]>([]);
  const [selectedNumberId, setSelectedNumberId] = useState<string | null>(null);
  const [callBalance, setCallBalance] = useState<CallCreditsBalance | null>(null);
  const [rates, setRates] = useState<CallRate[]>([]);
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [dialNumber, setDialNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [startingCall, setStartingCall] = useState(false);

  const matchedRate = useMemo(() => matchRate(dialNumber, rates), [dialNumber, rates]);
  const selectedNumber = useMemo(() => numbers.find((item) => item.id === selectedNumberId) ?? null, [numbers, selectedNumberId]);
  const estimatedMinutes = useMemo(() => {
    const credits = callBalance?.callCredits?.availableBalance ?? 0;
    const creditsPerMinute = matchedRate?.creditsPerMinute ?? 0;
    if (!credits || !creditsPerMinute) return 0;
    return Math.floor(credits / creditsPerMinute);
  }, [callBalance?.callCredits?.availableBalance, matchedRate?.creditsPerMinute]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const token = await getApiAccessToken();
        const headers = { Authorization: `Bearer ${token}` };
        const [numbersRes, balanceRes, ratesRes, callsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/numbers`, { headers }),
          axios.get(`${API_BASE_URL}/messenger/call-credits/balance`, { headers }),
          axios.get(`${API_BASE_URL}/messenger/call-credits/rates`, { headers }),
          axios.get(`${API_BASE_URL}/messenger/calls`, { headers }),
        ]);

        if (!active) return;
        setNumbers(numbersRes.data ?? []);
        setSelectedNumberId((current) => current ?? numbersRes.data?.[0]?.id ?? null);
        setCallBalance(balanceRes.data ?? null);
        setRates(ratesRes.data ?? []);
        setCalls(callsRes.data?.calls ?? []);
      } catch (error) {
        if (active) {
          Alert.alert('Calls unavailable', 'Unable to load BP Messenger call data right now.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, []);

  const startCall = async () => {
    const normalizedNumber = normalizePhone(dialNumber);
    if (!selectedNumberId || !selectedNumber) {
      Alert.alert('Number required', 'You need an active BP Messenger number before you can place calls.');
      return;
    }
    if (!normalizedNumber) {
      Alert.alert('Destination required', 'Enter the destination number in international format.');
      return;
    }

    setStartingCall(true);
    try {
      const token = await getApiAccessToken();
      const headers = { Authorization: `Bearer ${token}` };
      const { data } = await axios.post(`${API_BASE_URL}/messenger/calls/start`, {
        to: normalizedNumber,
        fromNumberId: selectedNumberId,
        idempotencyKey: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      }, { headers });

      triggerHaptic('success');
      const call = data?.call as CallRecord | undefined;
      if (call) {
        setCalls((current) => [call, ...current.filter((item) => item.id !== call.id)]);
        router.push({
          pathname: '/call/active',
          params: {
            callId: call.id,
            from: call.fromNumber,
            to: call.toNumber,
          },
        } as never);
      }
    } catch (error: any) {
      Alert.alert(
        'Call failed',
        error?.response?.data?.message || 'Unable to start this BP Messenger call right now.',
      );
    } finally {
      setStartingCall(false);
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
        <Text style={s.kicker}>BP Messenger call credits</Text>
        <Text style={s.title}>Calls over WiFi & Data.</Text>
        <Text style={s.subtitle}>International and premium BP Messenger calls use Call Credits only. Wallet balance buys Call Credits and completed calls debit credits from actual provider duration.</Text>

        <View style={s.heroCard}>
          <View style={s.routeTop}>
            <Wifi size={18} color={BRAND.colors.cyberGreen} />
            <Text style={s.routeLabel}>Calling balance</Text>
          </View>
          <Text style={s.number}>{callBalance?.callCredits?.availableBalance ?? 0} credits</Text>
          <Text style={s.routeMeta}>Wallet {formatUsdCents(callBalance?.wallet?.balanceUsdCents)} • USD value {formatUsdCents(callBalance?.callCredits?.equivalentUsdCents)}</Text>

          <TextInput
            value={dialNumber}
            onChangeText={setDialNumber}
            placeholder="+2348012345678"
            placeholderTextColor={BRAND.colors.muted}
            style={s.input}
            autoCapitalize="none"
            keyboardType="phone-pad"
          />

          <View style={s.rateCard}>
            <Text style={s.rateLabel}>Rate preview</Text>
            <Text style={s.rateValue}>
              {matchedRate ? `${matchedRate.destinationCountry}: ${matchedRate.creditsPerMinute} credits/min` : 'Enter a supported destination'}
            </Text>
            <Text style={s.rateMeta}>Estimated balance: {estimatedMinutes} minutes</Text>
          </View>

          <TouchableOpacity style={[s.primaryButton, startingCall && { opacity: 0.6 }]} activeOpacity={0.78} onPress={startCall} disabled={startingCall || loading}>
            <Phone size={18} color={BRAND.colors.black} />
            <Text style={s.primaryText}>{startingCall ? 'Starting Call...' : 'Start Private Call'}</Text>
          </TouchableOpacity>
        </View>

        <View style={s.actions}>
          <TouchableOpacity style={s.action} activeOpacity={0.78} onPress={() => { triggerHaptic('selection'); router.push('/messages' as never); }}>
            <MessageSquare size={20} color={BRAND.colors.cyberGreen} />
            <Text style={s.actionTitle}>Message</Text>
            <Text style={s.actionText}>SMS, MMS, and thread context</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.action} activeOpacity={0.78} onPress={() => { triggerHaptic('selection'); router.push('/voicemail' as never); }}>
            <ShieldCheck size={20} color={BRAND.colors.cyberGreen} />
            <Text style={s.actionTitle}>Voicemail</Text>
            <Text style={s.actionText}>Missed call backup and playback</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.sectionTitle}>Calling line</Text>
        <View style={s.selectorList}>
          {numbers.length ? numbers.map((number) => (
            <TouchableOpacity
              key={number.id}
              style={[s.numberRow, selectedNumberId === number.id && s.numberRowActive]}
              activeOpacity={0.8}
              onPress={() => setSelectedNumberId(number.id)}
            >
              <Text style={s.callNumber}>{number.number}</Text>
              <Text style={s.callLabel}>{number.type || 'conversation'} • {number.countryCode || 'BP'}</Text>
            </TouchableOpacity>
          )) : (
            <View style={s.callRow}>
              <Text style={s.callLabel}>No active BP Messenger number is available for calling yet.</Text>
            </View>
          )}
        </View>

        <Text style={s.sectionTitle}>Recent activity</Text>
        {calls.length ? calls.slice(0, 6).map((call) => (
          <View key={call.id} style={s.callRow}>
            <View style={s.callIcon}>
              <Phone size={15} color={BRAND.colors.cyberGreen} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.callNumber}>{call.direction === 'outbound' ? call.toNumber : call.fromNumber}</Text>
              <Text style={s.callLabel}>{call.status} • {formatDuration(call.durationSeconds)} • {call.creditsSpent} credits</Text>
            </View>
          </View>
        )) : (
          <View style={s.callRow}>
            <Text style={s.callLabel}>Call history will appear here once BP Messenger call routing is active for your account.</Text>
          </View>
        )}
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
  routeMeta: { color: BRAND.colors.muted, fontSize: 12, marginTop: 6, lineHeight: 18 },
  input: { marginTop: 18, borderRadius: BRAND.radii.md, borderWidth: 1, borderColor: BRAND.colors.border, backgroundColor: BRAND.colors.dark, color: BRAND.colors.white, paddingHorizontal: 14, paddingVertical: 14, fontFamily: BRAND.typography.mono },
  rateCard: { marginTop: 14, borderRadius: BRAND.radii.md, borderWidth: 1, borderColor: BRAND.colors.border, backgroundColor: BRAND.colors.dark, padding: 14 },
  rateLabel: { color: BRAND.colors.muted, fontSize: 11, textTransform: 'uppercase', fontWeight: '900' },
  rateValue: { color: BRAND.colors.white, fontSize: 14, fontWeight: '800', marginTop: 8 },
  rateMeta: { color: BRAND.colors.cyberGreen, fontSize: 12, marginTop: 6 },
  primaryButton: { marginTop: 22, minHeight: 54, borderRadius: BRAND.radii.sm, backgroundColor: BRAND.colors.cyberGreen, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryText: { color: BRAND.colors.black, fontSize: 13, fontWeight: '900', textTransform: 'uppercase' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 14 },
  action: { flex: 1, minHeight: 132, borderRadius: BRAND.radii.lg, padding: 16, backgroundColor: BRAND.colors.dark, borderWidth: 1, borderColor: BRAND.colors.border },
  actionTitle: { color: BRAND.colors.white, fontSize: 15, fontWeight: '900', marginTop: 18 },
  actionText: { color: BRAND.colors.metalStart, fontSize: 12, lineHeight: 18, marginTop: 4 },
  sectionTitle: { color: BRAND.colors.muted, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', marginTop: 28, marginBottom: 12 },
  selectorList: { gap: 10 },
  numberRow: { borderRadius: BRAND.radii.lg, padding: 14, backgroundColor: BRAND.colors.surface, borderWidth: 1, borderColor: BRAND.colors.border },
  numberRowActive: { borderColor: BRAND.colors.cyberGreen },
  callRow: { flexDirection: 'row', alignItems: 'center', borderRadius: BRAND.radii.lg, padding: 14, backgroundColor: BRAND.colors.surface, borderWidth: 1, borderColor: BRAND.colors.border, marginBottom: 10 },
  callIcon: { width: 38, height: 38, borderRadius: BRAND.radii.md, backgroundColor: `${BRAND.colors.cyberGreen}12`, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  callNumber: { color: BRAND.colors.white, fontFamily: BRAND.typography.mono, fontSize: 13, fontWeight: '800' },
  callLabel: { color: BRAND.colors.muted, fontSize: 12, marginTop: 3 },
});
