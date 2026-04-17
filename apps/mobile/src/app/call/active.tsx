import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mic, MicOff, Volume2, PhoneOff, Pause } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { BRAND } from '../../lib/brand';
import { triggerHaptic } from '../../lib/native-ux';

export default function ActiveCallScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(false);
  const [held, setHeld] = useState(false);
  const [duration, setDuration] = useState(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Pulse animation for active call indicator
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    pulse.start();

    // Call timer
    timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    triggerHaptic('success');

    return () => {
      pulse.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const hangUp = () => {
    triggerHaptic('warning');
    router.back();
  };

  const toggleMuted = () => {
    triggerHaptic('selection');
    setMuted((value) => !value);
  };

  const toggleSpeaker = () => {
    triggerHaptic('selection');
    setSpeaker((value) => !value);
  };

  const toggleHeld = () => {
    triggerHaptic('selection');
    setHeld((value) => !value);
  };

  return (
    <SafeAreaView style={s.container}>
      {/* Caller info */}
      <View style={s.callerSection}>
        <Animated.View style={[s.avatarRing, { transform: [{ scale: pulseAnim }] }]}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{(params.from as string || '+1')?.charAt(1)?.toUpperCase() || '?'}</Text>
          </View>
        </Animated.View>
        <Text style={s.callFrom}>{params.from || 'Unknown'}</Text>
        <Text style={s.callTo}>To {params.to || 'Your number'}</Text>
        <View style={s.timerBadge}>
          <View style={s.timerDot}/>
          <Text style={s.timerText}>{formatDuration(duration)}</Text>
        </View>
      </View>

      {/* Controls */}
      <View style={s.controls}>
        <View style={s.controlRow}>
          <TouchableOpacity style={[s.controlBtn, muted && s.controlActive]} onPress={toggleMuted}>
            {muted ? <MicOff size={22} color={BRAND.colors.danger}/> : <Mic size={22} color={BRAND.colors.white}/>}
            <Text style={[s.controlLabel, muted && s.controlLabelActive]}>{muted ? 'Unmute' : 'Mute'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.controlBtn, speaker && s.controlActive]} onPress={toggleSpeaker}>
            <Volume2 size={22} color={speaker ? BRAND.colors.cyberGreen : BRAND.colors.white}/>
            <Text style={[s.controlLabel, speaker && {color: BRAND.colors.cyberGreen}]}>Speaker</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.controlBtn, held && s.controlActive]} onPress={toggleHeld}>
            <Pause size={22} color={held ? BRAND.colors.neonGreen : BRAND.colors.white}/>
            <Text style={[s.controlLabel, held && { color: BRAND.colors.neonGreen }]}>{held ? 'Resume' : 'Hold'}</Text>
          </TouchableOpacity>
        </View>

        {/* End call button */}
        <TouchableOpacity style={s.endCallBtn} onPress={hangUp} activeOpacity={0.8}>
          <PhoneOff size={28} color={BRAND.colors.white}/>
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
  controls: { width: '100%', paddingHorizontal: 24, alignItems: 'center' },
  controlRow: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginBottom: 40 },
  controlBtn: { alignItems: 'center', gap: 6, backgroundColor: BRAND.colors.surface, borderRadius: BRAND.radii.lg, padding: 16, borderWidth: 1, borderColor: BRAND.colors.border, minWidth: 72 },
  controlActive: { backgroundColor: BRAND.colors.surface, borderColor: BRAND.colors.cyberGreen },
  controlLabel: { color: BRAND.colors.muted, fontSize: 11 },
  controlLabelActive: { color: BRAND.colors.danger },
  endCallBtn: { width: 72, height: 72, borderRadius: 36, backgroundColor: BRAND.colors.danger, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  endCallLabel: { color: BRAND.colors.muted, fontSize: 12 },
});
