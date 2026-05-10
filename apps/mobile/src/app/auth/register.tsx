import { useEffect, useRef, useState } from 'react';
import type { ComponentProps } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Linking, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ShieldCheck } from 'lucide-react-native';

import { AuthProviderButton } from '../../components/auth-provider-button';
import { exchangeSupabaseSession, type BurnerProfile, startOAuthSignIn } from '../../lib/auth';
import { useBurnerAuth } from '../../lib/auth-context';
import { BRAND } from '../../lib/brand';
import { WEB_APP_URL } from '../../lib/config';
import { triggerHaptic } from '../../lib/native-ux';
import { supabase } from '../../lib/supabase';

const providers = [
  ['Google', 'google'],
  ['Apple', 'apple'],
  ['Microsoft', 'microsoft'],
] as const;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^\+?[0-9\s().-]{7,24}$/;
const strongPasswordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,72}$/;

export default function RegisterScreen() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isCompletingProfile = mode === 'complete-profile';
  const { isLoaded, isSignedIn, session, user } = useBurnerAuth();
  const phoneInputRef = useRef<TextInput>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
  });

  useEffect(() => {
    const metadata = (user?.user_metadata ?? {}) as Record<string, unknown>;
    setForm((prev) => ({
      ...prev,
      firstName: prev.firstName || (typeof metadata.first_name === 'string' ? metadata.first_name : ''),
      lastName: prev.lastName || (typeof metadata.last_name === 'string' ? metadata.last_name : ''),
      email: prev.email || user?.email || '',
      phoneNumber: prev.phoneNumber || (typeof metadata.phone_number === 'string' ? metadata.phone_number : ''),
    }));
  }, [user]);

  const setField = (key: keyof typeof form) => (value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const profilePayload = (): BurnerProfile => ({
    email: form.email.trim().toLowerCase(),
    phoneNumber: form.phoneNumber.trim(),
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    acceptTerms: true,
    acceptPrivacy: true,
  });

  const validateProfile = () => {
    if (!form.firstName || !form.lastName || !form.email || !form.phoneNumber) {
      Alert.alert('Required fields', 'First name, last name, email, and phone number are all required.');
      return false;
    }
    if (!emailPattern.test(form.email.trim())) {
      Alert.alert('Valid email required', 'Enter a valid email address for account recovery.');
      return false;
    }
    if (!phonePattern.test(form.phoneNumber.trim())) {
      Alert.alert('Valid phone required', 'Enter your phone number in international format, for example +1 415 555 0182.');
      return false;
    }
    return true;
  };

  const finishBurnerSession = async (nextSession = session) => {
    if (!nextSession) {
      throw new Error('No secure session is available. Sign in again to continue.');
    }

    const data = await exchangeSupabaseSession(nextSession, profilePayload());
    if (data.needsOnboarding) {
      Alert.alert('Missing profile details', 'Add your name, email, and phone number before continuing.');
      return;
    }

    if (data.user?.phoneNumber && data.user.phoneVerified === false) {
      router.replace({ pathname: '/auth/phone-verify', params: { redirect: '/(tabs)' } } as any);
      return;
    }

    router.replace('/(tabs)' as any);
  };

  const createAccount = async () => {
    triggerHaptic('impact');
    if (!isLoaded || !validateProfile()) return;
    if (!isCompletingProfile && !strongPasswordPattern.test(form.password)) {
      Alert.alert('Stronger password required', 'Use 8 or more characters with uppercase, lowercase, and a number.');
      return;
    }

    setLoading(true);
    try {
      if (isCompletingProfile && isSignedIn && session) {
        await finishBurnerSession(session);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        options: {
          data: {
            first_name: form.firstName.trim(),
            last_name: form.lastName.trim(),
            phone_number: form.phoneNumber.trim(),
            accept_terms: true,
            accept_privacy: true,
          },
        },
      });

      if (error) throw error;

      if (data.session) {
        await finishBurnerSession(data.session);
        return;
      }

      Alert.alert('Verify your email', 'Your account was created. Open the verification email, then sign in.');
      router.replace('/auth/login' as any);
    } catch (error: any) {
      Alert.alert('Signup failed', error?.message || 'Please check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  const oauth = async (provider: (typeof providers)[number][1]) => {
    triggerHaptic('selection');
    setLoading(true);
    try {
      const oauthSession = await startOAuthSignIn(provider);
      await finishBurnerSession(oauthSession);
    } catch (error: any) {
      Alert.alert('Provider sign-up failed', error?.message || 'Unable to continue with this provider.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.screen}>
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableOpacity style={s.logoRow} onPress={() => Linking.openURL(WEB_APP_URL)} activeOpacity={0.82}>
          <View style={s.logoIcon}>
            <ShieldCheck size={22} color={BRAND.colors.dark} />
          </View>
          <Text style={s.logo}>Burner<Text style={s.green}>Point</Text></Text>
        </TouchableOpacity>

        <View style={s.card}>
          <Text style={s.kicker}>{isCompletingProfile ? 'Complete account' : 'Create account'}</Text>

          {!isCompletingProfile ? (
            <>
              <View style={s.providerGrid}>
                {providers.map(([label, provider]) => (
                  <AuthProviderButton key={label} provider={label} onPress={() => oauth(provider)} disabled={loading || !isLoaded} />
                ))}
              </View>

              <Text style={s.or}>or continue with email and phone number</Text>
            </>
          ) : null}

          <View style={s.row}>
            <Input label="First name" value={form.firstName} onChangeText={setField('firstName')} autoComplete="given-name" placeholder="First name" />
            <Input label="Last name" value={form.lastName} onChangeText={setField('lastName')} autoComplete="family-name" placeholder="Last name" />
          </View>
          <Input label="Email" value={form.email} onChangeText={setField('email')} keyboardType="email-address" autoCapitalize="none" autoComplete="email" placeholder="you@example.com" />
          <Input inputRef={phoneInputRef} label="Phone number" value={form.phoneNumber} onChangeText={setField('phoneNumber')} keyboardType="phone-pad" autoComplete="tel" placeholder="+1 415 555 0182" />
          {!isCompletingProfile ? (
            <Input label="Password" value={form.password} onChangeText={setField('password')} secureTextEntry autoCapitalize="none" autoComplete="new-password" placeholder="8+ chars, mixed case + number" />
          ) : null}

          <TouchableOpacity style={[s.btn, loading && s.disabled]} onPress={createAccount} disabled={loading || !isLoaded} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color={BRAND.colors.dark} /> : <Text style={s.btnText}>{isCompletingProfile ? 'Continue' : 'Get started'}</Text>}
          </TouchableOpacity>

          {!isCompletingProfile ? (
            <TouchableOpacity onPress={() => router.push('/auth/login' as any)} style={s.linkRow}>
              <Text style={s.linkText}>Already have an account? <Text style={s.linkStrong}>Sign in</Text></Text>
            </TouchableOpacity>
          ) : null}

          <Text style={s.legalText}>
            By continuing you agree to the
            <Text style={s.legalLink} onPress={() => Linking.openURL(`${WEB_APP_URL}/terms-of-service`)}> Terms of Service</Text>
            {' '}and
            <Text style={s.legalLink} onPress={() => Linking.openURL(`${WEB_APP_URL}/privacy-policy`)}> Privacy Policy</Text>.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Input(props: ComponentProps<typeof TextInput> & { label: string; inputRef?: React.Ref<TextInput> }) {
  const { label, placeholder, inputRef, ...inputProps } = props;
  return (
    <View style={s.inputWrap}>
      <Text style={s.label}>{label}</Text>
      <TextInput ref={inputRef} style={s.input} placeholder={placeholder || label} placeholderTextColor={BRAND.colors.muted} {...inputProps} />
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BRAND.colors.black },
  flex: { flex: 1, justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 8 },
  logoRow: { alignItems: 'center', marginBottom: 8 },
  logoIcon: { width: 38, height: 38, borderRadius: BRAND.radii.md, backgroundColor: BRAND.colors.cyberGreen, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  logo: { fontSize: 18, fontWeight: '900', color: BRAND.colors.white },
  green: { color: BRAND.colors.cyberGreen },
  card: {
    backgroundColor: BRAND.colors.surface,
    borderWidth: 1,
    borderColor: BRAND.colors.border,
    borderRadius: 18,
    padding: 12,
    gap: 7,
    ...BRAND.shadows.card,
  },
  kicker: { color: BRAND.colors.cyberGreen, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.4 },
  row: { flexDirection: 'row', gap: 8 },
  inputWrap: { flex: 1 },
  label: { color: BRAND.colors.metalStart, fontSize: 10, marginBottom: 4, fontWeight: '700' },
  input: { minHeight: 42, backgroundColor: BRAND.colors.black, borderWidth: 1, borderColor: BRAND.colors.border, borderRadius: BRAND.radii.md, paddingHorizontal: 10, color: BRAND.colors.white, fontSize: 13 },
  btn: { minHeight: 44, backgroundColor: BRAND.colors.cyberGreen, borderRadius: BRAND.radii.sm, alignItems: 'center', justifyContent: 'center', marginTop: 3 },
  disabled: { opacity: 0.55 },
  btnText: { color: BRAND.colors.dark, fontWeight: '900', fontSize: 13, textTransform: 'uppercase' },
  or: { color: BRAND.colors.muted, fontSize: 9, textAlign: 'center', marginTop: 1, textTransform: 'uppercase' },
  providerGrid: { flexDirection: 'row', gap: 7 },
  linkRow: { alignItems: 'center', paddingTop: 2 },
  linkText: { color: BRAND.colors.metalStart, fontSize: 12 },
  linkStrong: { color: BRAND.colors.cyberGreen, fontWeight: '800' },
  legalText: { color: BRAND.colors.muted, fontSize: 10, lineHeight: 14, textAlign: 'center' },
  legalLink: { color: BRAND.colors.cyberGreen, fontWeight: '800' },
});
