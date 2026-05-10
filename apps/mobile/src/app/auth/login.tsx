import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Linking, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Eye, EyeOff, ShieldCheck, Zap } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';

import { AuthProviderButton } from '../../components/auth-provider-button';
import { exchangeSupabaseSession, startOAuthSignIn } from '../../lib/auth';
import { useBurnerAuth } from '../../lib/auth-context';
import { BRAND } from '../../lib/brand';
import { API_BASE_URL, WEB_APP_URL } from '../../lib/config';
import { triggerHaptic } from '../../lib/native-ux';
import { supabase } from '../../lib/supabase';

const providers = [
  ['Google', 'google'],
  ['Apple', 'apple'],
  ['Microsoft', 'microsoft'],
] as const;

type AuthStep = 'sign-in' | 'reset-request';

function normalizeIdentifier(identifier: string) {
  const trimmed = identifier.trim();
  return trimmed.includes('@')
    ? trimmed.toLowerCase()
    : trimmed.replace(/[^\d+]/g, '');
}

function classifyIdentifier(identifier: string) {
  return normalizeIdentifier(identifier).includes('@') ? 'email' : 'phone';
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export default function LoginScreen() {
  const router = useRouter();
  const { isLoaded } = useBurnerAuth();
  const identifierInputRef = useRef<TextInput>(null);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authStep, setAuthStep] = useState<AuthStep>('sign-in');
  const [resetEmail, setResetEmail] = useState('');

  const normalizedIdentifier = useMemo(() => normalizeIdentifier(identifier), [identifier]);

  const completeBurnerSession = async (sessionOverride?: Parameters<typeof exchangeSupabaseSession>[0]) => {
    const activeSession = sessionOverride ?? (await supabase.auth.getSession()).data.session;
    if (!activeSession) {
      throw new Error('Unable to establish a secure session. Please sign in again.');
    }

    const data = await exchangeSupabaseSession(activeSession);
    if (data.needsOnboarding) {
      router.replace('/auth/register?mode=complete-profile' as any);
      return;
    }
    if (data.user?.phoneNumber && data.user.phoneVerified === false) {
      router.replace({ pathname: '/auth/phone-verify', params: { redirect: '/(tabs)' } } as any);
      return;
    }
    router.replace('/(tabs)' as any);
  };

  const login = async () => {
    triggerHaptic('impact');
    if (!isLoaded) return;
    if (!identifier.trim() || !password) {
      Alert.alert('Required fields', 'Enter your email or phone number and password.');
      return;
    }

    setLoading(true);
    try {
      const identifierType = classifyIdentifier(identifier);
      const { data, error } = await supabase.auth.signInWithPassword(
        identifierType === 'phone'
          ? { phone: normalizedIdentifier, password }
          : { email: normalizedIdentifier, password },
      );

      if (error || !data.session) {
        throw error ?? new Error('Unable to sign in.');
      }

      await completeBurnerSession(data.session);
    } catch (error: any) {
      Alert.alert(
        'Sign in failed',
        error?.message || 'Check your credentials and try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const requestPasswordReset = async () => {
    triggerHaptic('selection');
    if (!isLoaded) return;
    if (!isEmail(resetEmail)) {
      Alert.alert('Email required', 'Enter the account email address you use with Burner Point.');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/auth/password/reset`, {
        email: resetEmail.trim().toLowerCase(),
      });
      Alert.alert('Reset link sent', 'Check your email for the password reset link.');
      setAuthStep('sign-in');
      setResetEmail('');
    } catch (error: any) {
      Alert.alert('Reset failed', error?.response?.data?.message || 'Unable to send a reset email right now.');
    } finally {
      setLoading(false);
    }
  };

  const oauth = async (provider: (typeof providers)[number][1]) => {
    triggerHaptic('selection');
    setLoading(true);
    try {
      const session = await startOAuthSignIn(provider);
      const data = await exchangeSupabaseSession(session);
      if (data.needsOnboarding) {
        router.replace('/auth/register?mode=complete-profile' as any);
        return;
      }
      if (data.user?.phoneNumber && data.user.phoneVerified === false) {
        router.replace({ pathname: '/auth/phone-verify', params: { redirect: '/(tabs)' } } as any);
        return;
      }
      router.replace('/(tabs)' as any);
    } catch (error: any) {
      Alert.alert('Provider sign-in failed', error?.message || 'Unable to continue with this provider.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.inner}>
        <TouchableOpacity style={s.logo} onPress={() => Linking.openURL(WEB_APP_URL)} activeOpacity={0.82}>
          <View style={s.logoIcon}>
            <ShieldCheck size={24} color={BRAND.colors.dark} />
          </View>
          <Text style={s.logoText}>Burner<Text style={s.green}>Point</Text></Text>
        </TouchableOpacity>

        <View style={s.form}>
          <Text style={s.kicker}>
            {authStep === 'reset-request' ? 'Reset password' : 'Secure sign in'}
          </Text>

          {authStep === 'reset-request' ? (
            <>
              <Text style={s.label}>Account email address</Text>
              <TextInput
                value={resetEmail}
                onChangeText={setResetEmail}
                placeholder="you@example.com"
                placeholderTextColor={BRAND.colors.muted}
                style={s.input}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
              />
              <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={requestPasswordReset} disabled={loading || !isLoaded} activeOpacity={0.85}>
                {loading ? <ActivityIndicator color={BRAND.colors.dark} /> : <Text style={s.btnText}>Send reset email</Text>}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setAuthStep('sign-in')} style={s.textLink}>
                <Text style={s.textLinkLabel}>Back to sign in</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={s.providerGrid}>
                {providers.map(([label, provider]) => (
                  <AuthProviderButton key={label} provider={label} onPress={() => oauth(provider)} disabled={loading || !isLoaded} />
                ))}
              </View>

              <Text style={s.or}>or continue with email and phone number</Text>

              <Text style={s.label}>Email or phone number</Text>
              <TextInput
                ref={identifierInputRef}
                value={identifier}
                onChangeText={setIdentifier}
                placeholder="you@example.com or +1 415 555 0182"
                placeholderTextColor={BRAND.colors.muted}
                style={s.input}
                keyboardType="default"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="username"
              />

              <Text style={s.label}>Password</Text>
              <View style={s.passwordWrap}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Password"
                  placeholderTextColor={BRAND.colors.muted}
                  style={[s.input, s.passwordInput]}
                  secureTextEntry={!showPassword}
                  autoComplete="current-password"
                />
                <TouchableOpacity style={s.eye} onPress={() => setShowPassword((value) => !value)}>
                  {showPassword ? <EyeOff size={18} color={BRAND.colors.metalStart} /> : <Eye size={18} color={BRAND.colors.metalStart} />}
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={login} disabled={loading || !isLoaded} activeOpacity={0.85}>
                {loading ? (
                  <ActivityIndicator color={BRAND.colors.dark} />
                ) : (
                  <>
                    <Zap size={16} color={BRAND.colors.dark} />
                    <Text style={s.btnText}>Sign In</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setAuthStep('reset-request')} style={s.textLink}>
                <Text style={s.textLinkLabel}>Forgot password?</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => router.push('/auth/register' as any)} style={s.textLink}>
                <Text style={s.registerText}>No account? <Text style={s.registerHighlight}>Create one free</Text></Text>
              </TouchableOpacity>

              <Text style={s.legalText}>
                By continuing you agree to the
                <Text style={s.legalLink} onPress={() => Linking.openURL(`${WEB_APP_URL}/terms-of-service`)}> Terms of Service</Text>
                {' '}and
                <Text style={s.legalLink} onPress={() => Linking.openURL(`${WEB_APP_URL}/privacy-policy`)}> Privacy Policy</Text>.
              </Text>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND.colors.black },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 8 },
  logo: { alignItems: 'center', marginBottom: 8 },
  logoIcon: {
    width: 38,
    height: 38,
    borderRadius: BRAND.radii.md,
    backgroundColor: BRAND.colors.cyberGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  logoText: { color: BRAND.colors.white, fontSize: 18, fontWeight: '900' },
  green: { color: BRAND.colors.cyberGreen },
  form: {
    backgroundColor: BRAND.colors.surface,
    borderWidth: 1,
    borderColor: BRAND.colors.border,
    borderRadius: 18,
    padding: 12,
    gap: 7,
    ...BRAND.shadows.card,
  },
  kicker: { color: BRAND.colors.cyberGreen, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.4 },
  label: { color: BRAND.colors.metalStart, fontSize: 10, fontWeight: '700', marginTop: 1 },
  input: {
    minHeight: 42,
    backgroundColor: BRAND.colors.black,
    borderWidth: 1,
    borderColor: BRAND.colors.border,
    borderRadius: BRAND.radii.md,
    paddingHorizontal: 10,
    color: BRAND.colors.white,
    fontSize: 13,
  },
  passwordWrap: { position: 'relative' },
  passwordInput: { paddingRight: 44 },
  eye: { position: 'absolute', right: 4, top: 1, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  btn: {
    minHeight: 44,
    backgroundColor: BRAND.colors.cyberGreen,
    borderRadius: BRAND.radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 3,
  },
  btnDisabled: { opacity: 0.55 },
  btnText: { color: BRAND.colors.dark, fontWeight: '900', fontSize: 13, textTransform: 'uppercase' },
  textLink: { alignItems: 'center', paddingTop: 2 },
  textLinkLabel: { color: BRAND.colors.cyberGreen, fontSize: 12, fontWeight: '800' },
  or: { color: BRAND.colors.muted, fontSize: 9, textAlign: 'center', marginTop: 1, textTransform: 'uppercase' },
  providerGrid: { flexDirection: 'row', gap: 7 },
  registerText: { color: BRAND.colors.metalStart, fontSize: 12 },
  registerHighlight: { color: BRAND.colors.cyberGreen, fontWeight: '800' },
  legalText: { color: BRAND.colors.muted, fontSize: 10, lineHeight: 14, textAlign: 'center' },
  legalLink: { color: BRAND.colors.cyberGreen, fontWeight: '800' },
});
