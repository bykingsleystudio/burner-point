import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mic, MicOff, Volume2, PhoneOff, Pause } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import axios from 'axios';
import { BRAND } from '../../lib/brand';
import { triggerHaptic } from '../../lib/native-ux';
import { API_BASE_URL } from '../../lib/config';
import { getApiAccessToken } from '../../lib/auth';

type CallRecord = {
  id: string;
  fromNumber: string;
  toNumber: string;
  status: string;
  durationSeconds: number;
  billableSeconds: number;
  creditsSpent: number;
};

const TERMINAL_STATUSES = new Set(['completed', 'failed', 'busy', 'no-answer', 'canceled']);

export default function ActiveCallScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ callId?: string; from?: string; to?: string }>();
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(false);
  const [held, setHeld] = useState(false);
  const [call, setCall] = useState<CallRecord | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
    );
    pulse.start();
    triggerHaptic('success');

    return () => {
      pulse.stop();
    };
  }, [pulseAnim]);

  useEffect(() => {
    if (!params.callId) return;
    let active = true;

    const loadCall = async () => {
      try {
        const token = await getApiAccessToken();
        const { data } = await axios.get<CallRecord>(`${API_BASE_URL}/messenger/calls/${params.callId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!active) return;
        setCall(data);
      } catch {
        if (active) {
          router.back();
        }
      }
    };

    void loadCall();
    const interval = setInterval(() => {
      void loadCall();
    }, 5000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [params.callId, router]);

  useEffect(() => {
    if (call?.status && TERMINAL_STATUSES.has(call.status)) {
      triggerHaptic(call.status === 'completed' ? 'success' : 'warning');
    }
  }, [call?.status]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const callerTitle = useMemo(() => call?.fromNumber || params.from || 'Burner Point', [call?.fromNumber, params.from]);
  const callTarget = useMemo(() => call?.toNumber || params.to || 'Private contact', [call?.toNumber, params.to]);

  const hangUp = () => {
    triggerHaptic('warning');
    router.back();
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.callerSection}>
        <Animated.View style={[s.avatarRing, { transform: [{ scale: pulseAnim }] }]}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{String(callerTitle).charAt(1)?.toUpperCase() || '?'}</Text>
          </View>
        </Animated.View>
        <Text style={s.callFrom}>{callerTitle}</Text>
        <Text style={s.callTo}>To {callTarget}</Text>
        <View style={s.timerBadge}>
          <View style={s.timerDot} />
          <Text style={s.timerText}>{formatDuration(call?.durationSeconds ?? 0)}</Text>
        </View>
        <Text style={s.statusText}>Status: {call?.status || 'initiated'}</Text>
        <Text style={s.metaText}>Billable {formatDuration(call?.billableSeconds ?? 0)} • {call?.creditsSpent ?? 0} Call Credits used</Text>
      </View>

      <View style={s.controls}>
        <View style={s.controlRow}>
          <TouchableOpacity style={[s.controlBtn, muted && s.controlActive]} onPress={() => { triggerHaptic('selection'); setMuted((value) => !value); }}>
            {muted ? <MicOff size={22} color={BRAND.colors.danger} /> : <Mic size={22} color={BRAND.colors.white} />}
            <Text style={[s.controlLabel, muted && s.controlLabelActive]}>{muted ? 'Unmute' : 'Mute'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.controlBtn, speaker && s.controlActive]} onPress={() => { triggerHaptic('selection'); setSpeaker((value) => !value); }}>
            <Volume2 size={22} color={speaker ? BRAND.colors.cyberGreen : BRAND.colors.white} />
            <Text style={[s.controlLabel, speaker && { color: BRAND.colors.cyberGreen }]}>Speaker</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.controlBtn, held && s.controlActive]} onPress={() => { triggerHaptic('selection'); setHeld((value) => !value); }}>
            <Pause size={22} color={held ? BRAND.colors.neonGreen : BRAND.colors.white} />
            <Text style={[s.controlLabel, held && { color: BRAND.colors.neonGreen }]}>{held ? 'Resume' : 'Hold'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={s.endCallBtn} onPress={hangUp} activeOpacity={0.8}>
          <PhoneOff size={28} color={BRAND.colors.white} />
        </TouchableOpacity>
        <Text style={s.endCallLabel}>End call</Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND.colors.black, alignItems: 'center', justifyContent: 'space-between', paddingVertical: 40 },
  callerSection: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  avatarRing: { width: 120, height: 120, borderRadius: 60, borderWidth: 2, borderColor: `${BRAND.colors.cyberGreen}40`, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: BRAND.colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: BRAND.colors.border },
  avatarText: { fontSize: 36, fontWeight: '900', color: BRAND.colors.cyberGreen },
  callFrom: { color: BRAND.colors.white, fontSize: 26, fontWeight: '900', marginBottom: 4 },
  callTo: { color: BRAND.colors.muted, fontSize: 14, fontFamily: BRAND.typography.mono },
  timerBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, backgroundColor: `${BRAND.colors.cyberGreen}15`, paddingHorizontal: 12, paddingVertical: 6, borderRadius: BRAND.radii.md, borderWidth: 1, borderColor: `${BRAND.colors.cyberGreen}30` },
  timerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: BRAND.colors.cyberGreen },
  timerText: { color: BRAND.colors.cyberGreen, fontFamily: BRAND.typography.mono, fontSize: 16, fontWeight: '600' },
  statusText: { color: BRAND.colors.white, fontSize: 14, marginTop: 12, textTransform: 'uppercase', fontWeight: '800' },
  metaText: { color: BRAND.colors.muted, fontSize: 12, marginTop: 6 },
  controls: { width: '100%', paddingHorizontal: 24, alignItems: 'center' },
  controlRow: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginBottom: 40 },
  controlBtn: { alignItems: 'center', gap: 6, backgroundColor: BRAND.colors.surface, borderRadius: BRAND.radii.lg, padding: 16, borderWidth: 1, borderColor: BRAND.colors.border, minWidth: 72 },
  controlActive: { backgroundColor: BRAND.colors.surface, borderColor: BRAND.colors.cyberGreen },
  controlLabel: { color: BRAND.colors.muted, fontSize: 11 },
  controlLabelActive: { color: BRAND.colors.danger },
  endCallBtn: { width: 72, height: 72, borderRadius: 36, backgroundColor: BRAND.colors.danger, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  endCallLabel: { color: BRAND.colors.muted, fontSize: 12 },
});
