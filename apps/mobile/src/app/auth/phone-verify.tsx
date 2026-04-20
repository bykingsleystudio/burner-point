import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowRight, CheckCircle2, PhoneCall, ShieldCheck, Smartphone, TimerReset } from 'lucide-react-native';
import axios from 'axios';

import { getApiAccessToken } from '../../lib/auth';
import { useAuth } from '@clerk/clerk-expo';
import { API_BASE_URL } from '../../lib/config';
import { BRAND } from '../../lib/brand';
import { triggerHaptic } from '../../lib/native-ux';

type Channel = 'sms' | 'call';
type OtpStep = 'loading' | 'ready' | 'sent' | 'approved';

const e164Pattern = /^\+[1-9]\d{6,14}$/;

export default function PhoneVerifyScreen() {
  const router = useRouter();
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  const { getToken } = useAuth();
  const [step, setStep] = useState<OtpStep>('loading');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [channel, setChannel] = useState<Channel>('sms');
  const [code, setCode] = useState('');
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const redirectTarget = useMemo(
    () => (typeof redirect === 'string' && redirect.startsWith('/') ? redirect : '/(tabs)'),
    [redirect],
  );
  const normalizedPhone = useMemo(() => phoneNumber.trim().replace(/[^\d+]/g, ''), [phoneNumber]);
  const phoneIsValid = e164Pattern.test(normalizedPhone);
  const codeIsValid = /^\d{4,10}$/.test(code.trim());

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const token = await getApiAccessToken(getToken);
        const { data } = await axios.get(`${API_BASE_URL}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (cancelled) return;

        if (data?.phoneVerified) {
          router.replace(redirectTarget as any);
          return;
        }

        setPhoneNumber(data?.phoneNumber || '');
        setStep('ready');
      } catch (error: any) {
        if (cancelled) return;
        Alert.alert('Unable to verify phone', error.response?.data?.message || 'Sign in again before verifying your phone.');
        router.replace('/auth/login' as any);
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [getToken, redirectTarget, router]);

  const sendCode = async () => {
    triggerHaptic('selection');
    if (!phoneIsValid) {
      Alert.alert('Valid phone required', 'Use your Burner Point phone number in E.164 format, for example +14155550182.');
      return;
    }

    setLoading(true);
    try {
      const token = await getApiAccessToken(getToken);
      const { data } = await axios.post(
        `${API_BASE_URL}/phone-auth/send`,
        { phoneNumber: normalizedPhone, channel },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setExpiresAt(data.expiresAt);
      setAttemptsRemaining(data.attemptsRemaining);
      setStep('sent');
      Alert.alert(channel === 'sms' ? 'SMS sent' : 'Voice code sent', 'Your verification code is on the way.');
    } catch (error: any) {
      Alert.alert('Unable to send code', error.response?.data?.message || 'Phone verification is temporarily unavailable.');
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    triggerHaptic('impact');
    if (!codeIsValid) {
      Alert.alert('Verification code required', 'Enter the 4 to 10 digit code sent to your phone.');
      return;
    }

    setLoading(true);
    try {
      const token = await getApiAccessToken(getToken);
      const { data } = await axios.post(
        `${API_BASE_URL}/phone-auth/verify`,
        { phoneNumber: normalizedPhone, code: code.trim() },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setStep('approved');
      setTimeout(() => {
        router.replace(((data?.redirectTo as string) || redirectTarget) as any);
      }, 250);
    } catch (error: any) {
      setAttemptsRemaining(error.response?.data?.attemptsRemaining ?? attemptsRemaining);
      Alert.alert('Verification failed', error.response?.data?.message || 'Check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.inner}>
        <View style={s.card}>
          <View style={s.logoWrap}>
            <ShieldCheck size={24} color={BRAND.colors.dark} />
          </View>
          <Text style={s.kicker}>Twilio Verify</Text>
          <Text style={s.title}>Verify your account phone.</Text>
          <Text style={s.sub}>Burner Point sends OTP through the Railway API so Twilio credentials stay off the device.</Text>

          <Text style={s.label}>Account phone number</Text>
          <TextInput
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="+1 415 555 0182"
            placeholderTextColor={BRAND.colors.muted}
            style={s.input}
            keyboardType="phone-pad"
            autoComplete="tel"
            editable={step !== 'approved'}
          />

          <View style={s.channelRow}>
            <TouchableOpacity
              style={[s.channel, channel === 'sms' && s.channelActive]}
              onPress={() => setChannel('sms')}
              activeOpacity={0.8}
            >
              <Smartphone size={16} color={channel === 'sms' ? BRAND.colors.cyberGreen : BRAND.colors.metalStart} />
              <Text style={[s.channelLabel, channel === 'sms' && s.channelLabelActive]}>SMS</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.channel, channel === 'call' && s.channelActive]}
              onPress={() => setChannel('call')}
              activeOpacity={0.8}
            >
              <PhoneCall size={16} color={channel === 'call' ? BRAND.colors.cyberGreen : BRAND.colors.metalStart} />
              <Text style={[s.channelLabel, channel === 'call' && s.channelLabelActive]}>Voice</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[s.primaryButton, (!phoneIsValid || loading || step === 'approved' || step === 'loading') && s.disabled]}
            onPress={sendCode}
            disabled={!phoneIsValid || loading || step === 'approved' || step === 'loading'}
            activeOpacity={0.85}
          >
            {loading && step !== 'sent' ? <ActivityIndicator color={BRAND.colors.dark} /> : (
              <>
                <Text style={s.primaryText}>{step === 'sent' ? 'Send another code' : 'Send code'}</Text>
                <ArrowRight size={15} color={BRAND.colors.dark} />
              </>
            )}
          </TouchableOpacity>

          {step === 'sent' || step === 'approved' ? (
            <View style={s.stateCard}>
              <View style={s.stateRow}>
                <TimerReset size={14} color={BRAND.colors.cyberGreen} />
                <Text style={s.stateText}>
                  {expiresAt ? `Code expires ${new Date(expiresAt).toLocaleTimeString()}` : 'Code sent'}
                </Text>
                {attemptsRemaining !== null ? <Text style={s.stateMeta}>Attempts left: {attemptsRemaining}</Text> : null}
              </View>

              {step === 'approved' ? (
                <View style={s.approvedRow}>
                  <CheckCircle2 size={18} color={BRAND.colors.cyberGreen} />
                  <Text style={s.approvedText}>Approved. Opening Burner Point.</Text>
                </View>
              ) : (
                <>
                  <Text style={s.label}>Verification code</Text>
                  <TextInput
                    value={code}
                    onChangeText={setCode}
                    placeholder="Enter code"
                    placeholderTextColor={BRAND.colors.muted}
                    style={[s.input, s.codeInput]}
                    keyboardType="number-pad"
                    autoComplete="one-time-code"
                  />
                  <TouchableOpacity
                    style={[s.primaryButton, (!codeIsValid || loading) && s.disabled]}
                    onPress={verifyCode}
                    disabled={!codeIsValid || loading}
                    activeOpacity={0.85}
                  >
                    {loading ? <ActivityIndicator color={BRAND.colors.dark} /> : <Text style={s.primaryText}>Verify and continue</Text>}
                  </TouchableOpacity>
                </>
              )}
            </View>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND.colors.black },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  card: {
    backgroundColor: BRAND.colors.surface,
    borderWidth: 1,
    borderColor: BRAND.colors.border,
    borderRadius: BRAND.radii.lg,
    padding: 16,
    gap: 8,
    ...BRAND.shadows.card,
  },
  logoWrap: {
    width: 52,
    height: 52,
    borderRadius: BRAND.radii.md,
    backgroundColor: BRAND.colors.cyberGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  kicker: { color: BRAND.colors.cyberGreen, fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  title: { color: BRAND.colors.white, fontSize: 28, lineHeight: 28, fontWeight: '900', textTransform: 'uppercase' },
  sub: { color: BRAND.colors.metalStart, fontSize: 13, lineHeight: 18, marginBottom: 2 },
  label: { color: BRAND.colors.metalStart, fontSize: 11, fontWeight: '700', marginTop: 2 },
  input: {
    minHeight: 48,
    backgroundColor: BRAND.colors.black,
    borderWidth: 1,
    borderColor: BRAND.colors.border,
    borderRadius: BRAND.radii.md,
    paddingHorizontal: 12,
    color: BRAND.colors.white,
    fontSize: 14,
  },
  channelRow: { flexDirection: 'row', gap: 8, marginTop: 2 },
  channel: {
    flex: 1,
    minHeight: 48,
    borderRadius: BRAND.radii.md,
    borderWidth: 1,
    borderColor: BRAND.colors.border,
    backgroundColor: BRAND.colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  channelActive: {
    borderColor: `${BRAND.colors.cyberGreen}66`,
    backgroundColor: `${BRAND.colors.cyberGreen}10`,
  },
  channelLabel: { color: BRAND.colors.metalStart, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  channelLabelActive: { color: BRAND.colors.cyberGreen },
  primaryButton: {
    minHeight: 50,
    backgroundColor: BRAND.colors.cyberGreen,
    borderRadius: BRAND.radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  primaryText: { color: BRAND.colors.dark, fontWeight: '900', fontSize: 14, textTransform: 'uppercase' },
  disabled: { opacity: 0.55 },
  stateCard: {
    borderRadius: BRAND.radii.md,
    borderWidth: 1,
    borderColor: `${BRAND.colors.cyberGreen}22`,
    backgroundColor: `${BRAND.colors.cyberGreen}08`,
    padding: 12,
    gap: 8,
  },
  stateRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  stateText: { color: BRAND.colors.cyberGreen, fontSize: 11, fontWeight: '700' },
  stateMeta: { color: BRAND.colors.metalStart, fontSize: 11 },
  codeInput: { fontFamily: BRAND.typography.mono, fontSize: 18, letterSpacing: 1.5 },
  approvedRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  approvedText: { color: BRAND.colors.cyberGreen, fontSize: 13, fontWeight: '800' },
});
