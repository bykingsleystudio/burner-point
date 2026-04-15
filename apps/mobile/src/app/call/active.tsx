import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Vibration } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mic, MicOff, Volume2, PhoneOff, Pause } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

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
    Vibration.vibrate([0, 200, 100, 200]);

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
    Vibration.vibrate(100);
    router.back();
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
          <TouchableOpacity style={[s.controlBtn, muted && s.controlActive]} onPress={() => setMuted(!muted)}>
            {muted ? <MicOff size={22} color="#FF4444"/> : <Mic size={22} color="#fff"/>}
            <Text style={[s.controlLabel, muted && s.controlLabelActive]}>{muted ? 'Unmute' : 'Mute'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.controlBtn, speaker && s.controlActive]} onPress={() => setSpeaker(!speaker)}>
            <Volume2 size={22} color={speaker ? '#00FF9D' : '#fff'}/>
            <Text style={[s.controlLabel, speaker && {color:'#00FF9D'}]}>Speaker</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.controlBtn, held && s.controlActive]} onPress={() => setHeld(!held)}>
            <Pause size={22} color={held ? '#FBBF24' : '#fff'}/>
            <Text style={[s.controlLabel, held && {color:'#FBBF24'}]}>{held ? 'Resume' : 'Hold'}</Text>
          </TouchableOpacity>
        </View>

        {/* End call button */}
        <TouchableOpacity style={s.endCallBtn} onPress={hangUp} activeOpacity={0.8}>
          <PhoneOff size={28} color="#fff"/>
        </TouchableOpacity>
        <Text style={s.endCallLabel}>End call</Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 40 },
  callerSection: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  avatarRing: { width: 120, height: 120, borderRadius: 60, borderWidth: 2, borderColor: '#00FF9D40', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#2A2A2A' },
  avatarText: { fontSize: 36, fontWeight: 'bold', color: '#00FF9D' },
  callFrom: { color: '#fff', fontSize: 26, fontWeight: 'bold', marginBottom: 4 },
  callTo: { color: '#666', fontSize: 14, fontFamily: 'monospace' },
  timerBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, backgroundColor: '#00FF9D15', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#00FF9D30' },
  timerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#00FF9D' },
  timerText: { color: '#00FF9D', fontFamily: 'monospace', fontSize: 16, fontWeight: '600' },
  controls: { width: '100%', paddingHorizontal: 24, alignItems: 'center' },
  controlRow: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginBottom: 40 },
  controlBtn: { alignItems: 'center', gap: 6, backgroundColor: '#1A1A1A', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#2A2A2A', minWidth: 72 },
  controlActive: { backgroundColor: '#1A1A1A', borderColor: '#3A3A3A' },
  controlLabel: { color: '#666', fontSize: 11 },
  controlLabelActive: { color: '#FF4444' },
  endCallBtn: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#FF3B30', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  endCallLabel: { color: '#666', fontSize: 12 },
});
