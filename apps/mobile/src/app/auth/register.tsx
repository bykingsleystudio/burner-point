import { useRef, useState } from 'react';
import type { ComponentProps } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Linking, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ExpoLinking from 'expo-linking';
import { useAuth, useSignUp, useSSO } from '@clerk/clerk-expo';
import { ShieldCheck } from 'lucide-react-native';

import { AuthProviderButton } from '../../components/auth-provider-button';
import { exchangeClerkForApiSession } from '../../lib/auth';
import { BRAND } from '../../lib/brand';
import { WEB_APP_URL } from '../../lib/config';
import { triggerHaptic } from '../../lib/native-ux';

const providers = [
  ['Google', 'oauth_google'],
  ['Apple', 'oauth_apple'],
  ['Microsoft', 'oauth_microsoft'],
] as const;

type PendingVerification = 'email' | 'phone';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^\+?[0-9\s().-]{7,24}$/;
const strongPasswordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,72}$/;

export default function RegisterScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const { getToken } = useAuth();
  const { startSSOFlow } = useSSO();
  const phoneInputRef = useRef<TextInput>(null);
  const [loading, setLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [pendingVerification, setPendingVerification] = useState<PendingVerification | null>(null);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
  });

  const setField = (key: keyof typeof form) => (value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

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

  const finishBurnerSession = async (sessionId: string) => {
    await setActive({ session: sessionId });
    const data = await exchangeClerkForApiSession(getToken, {
      email: form.email.trim(),
      phoneNumber: form.phoneNumber.trim(),
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      acceptTerms: true,
      acceptPrivacy: true,
    });

    if (data.user?.phoneNumber && data.user.phoneVerified === false) {
      router.replace({ pathname: '/auth/phone-verify', params: { redirect: '/(tabs)' } } as any);
      return;
    }

    router.replace('/(tabs)' as any);
  };

  const continueVerification = async (result: any) => {
    if (result.status === 'complete' && result.createdSessionId) {
      await finishBurnerSession(result.createdSessionId);
      return;
    }

    if (result.unverifiedFields?.includes('email_address')) {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification('email');
      setVerificationCode('');
      Alert.alert('Check your email', 'Enter the email verification code to continue.');
      return;
    }

    if (result.unverifiedFields?.includes('phone_number')) {
      await signUp.preparePhoneNumberVerification({ strategy: 'phone_code' });
      setPendingVerification('phone');
      setVerificationCode('');
      Alert.alert('Check your phone', 'Enter the phone verification code to finish signup.');
      return;
    }

    Alert.alert('Verification required', 'Another verification step is required before this account can be completed.');
  };

  const createAccount = async () => {
    triggerHaptic('impact');
    if (!isLoaded || !validateProfile()) return;
    if (!strongPasswordPattern.test(form.password)) {
      Alert.alert('Stronger password required', 'Use 8 or more characters with uppercase, lowercase, and a number.');
      return;
    }

    setLoading(true);
    try {
      const result = await signUp.create({
        emailAddress: form.email.trim(),
        phoneNumber: form.phoneNumber.trim(),
        password: form.password,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        legalAccepted: true,
        unsafeMetadata: {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          acceptTerms: true,
          acceptPrivacy: true,
        },
      });

      await continueVerification(result);
    } catch (error: any) {
      Alert.alert('Signup failed', error.errors?.[0]?.longMessage || error.errors?.[0]?.message || 'Please check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    triggerHaptic('impact');
    if (!isLoaded || !pendingVerification || !verificationCode.trim()) return;

    setLoading(true);
    try {
      const code = verificationCode.trim();
      const result =
        pendingVerification === 'email'
          ? await signUp.attemptEmailAddressVerification({ code })
          : await signUp.attemptPhoneNumberVerification({ code });

      await continueVerification(result);
    } catch (error: any) {
      Alert.alert('Verification failed', error.errors?.[0]?.message || 'Unable to verify this code.');
    } finally {
      setLoading(false);
    }
  };

  const oauth = async (strategy: (typeof providers)[number][1]) => {
    triggerHaptic('selection');

    try {
      const { createdSessionId, setActive: setOAuthActive } = await startSSOFlow({
        strategy,
        redirectUrl: ExpoLinking.createURL('auth/register'),
        unsafeMetadata: {
          firstName: form.firstName.trim() || undefined,
          lastName: form.lastName.trim() || undefined,
          acceptTerms: true,
          acceptPrivacy: true,
        },
      });

      if (createdSessionId && setOAuthActive) {
        await setOAuthActive({ session: createdSessionId });
        const data = await exchangeClerkForApiSession(getToken, {
          email: form.email.trim() || undefined,
          phoneNumber: form.phoneNumber.trim() || undefined,
          firstName: form.firstName.trim() || undefined,
          lastName: form.lastName.trim() || undefined,
          acceptTerms: true,
          acceptPrivacy: true,
        });

        if (data.user?.phoneNumber && data.user.phoneVerified === false) {
          router.replace({ pathname: '/auth/phone-verify', params: { redirect: '/(tabs)' } } as any);
          return;
        }

        router.replace('/(tabs)' as any);
      }
    } catch (error: any) {
      Alert.alert('Provider sign-up failed', error.errors?.[0]?.message || 'Unable to continue with this provider.');
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
          <Text style={s.kicker}>Create account</Text>

          {pendingVerification ? (
            <>
              <Input
                label={pendingVerification === 'email' ? 'Email verification code' : 'Phone verification code'}
                value={verificationCode}
                onChangeText={setVerificationCode}
                keyboardType="number-pad"
                autoComplete="one-time-code"
                placeholder="Enter code"
              />
              <TouchableOpacity style={[s.btn, loading && s.disabled]} onPress={verifyCode} disabled={loading} activeOpacity={0.85}>
                {loading ? <ActivityIndicator color={BRAND.colors.dark} /> : <Text style={s.btnText}>Verify and continue</Text>}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={s.providerGrid}>
                {providers.map(([label, strategy]) => (
                  <AuthProviderButton key={label} provider={label} onPress={() => oauth(strategy)} disabled={loading || !isLoaded} />
                ))}
                <AuthProviderButton provider="Phone" onPress={() => phoneInputRef.current?.focus()} disabled={loading || !isLoaded} />
              </View>

              <Text style={s.or}>or create your Burner Point account</Text>

              <View style={s.row}>
                <Input label="First name" value={form.firstName} onChangeText={setField('firstName')} autoComplete="given-name" placeholder="Kingsley" />
                <Input label="Last name" value={form.lastName} onChangeText={setField('lastName')} autoComplete="family-name" placeholder="Doe" />
              </View>
              <View style={s.row}>
                <Input label="Email" value={form.email} onChangeText={setField('email')} keyboardType="email-address" autoCapitalize="none" autoComplete="email" placeholder="you@example.com" />
                <Input inputRef={phoneInputRef} label="Phone" value={form.phoneNumber} onChangeText={setField('phoneNumber')} keyboardType="phone-pad" autoComplete="tel" placeholder="+1 415..." />
              </View>
              <Input label="Password" value={form.password} onChangeText={setField('password')} secureTextEntry autoCapitalize="none" autoComplete="new-password" placeholder="8+ chars, mixed case + number" />

              <TouchableOpacity style={[s.btn, loading && s.disabled]} onPress={createAccount} disabled={loading || !isLoaded} activeOpacity={0.85}>
                {loading ? <ActivityIndicator color={BRAND.colors.dark} /> : <Text style={s.btnText}>Get started</Text>}
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity onPress={() => router.push('/auth/login' as any)} style={s.linkRow}>
            <Text style={s.linkText}>Already have an account? <Text style={s.linkStrong}>Sign in</Text></Text>
          </TouchableOpacity>

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
  flex: { flex: 1, justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  logoRow: { alignItems: 'center', marginBottom: 14 },
  logoIcon: { width: 48, height: 48, borderRadius: BRAND.radii.md, backgroundColor: BRAND.colors.cyberGreen, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  logo: { fontSize: 22, fontWeight: '900', color: BRAND.colors.white },
  green: { color: BRAND.colors.cyberGreen },
  card: {
    backgroundColor: BRAND.colors.surface,
    borderWidth: 1,
    borderColor: BRAND.colors.border,
    borderRadius: 22,
    padding: 18,
    gap: 10,
    ...BRAND.shadows.card,
  },
  kicker: { color: BRAND.colors.cyberGreen, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.4 },
  row: { flexDirection: 'row', gap: 8 },
  inputWrap: { flex: 1 },
  label: { color: BRAND.colors.metalStart, fontSize: 11, marginBottom: 6, fontWeight: '700' },
  input: { minHeight: 46, backgroundColor: BRAND.colors.black, borderWidth: 1, borderColor: BRAND.colors.border, borderRadius: BRAND.radii.md, paddingHorizontal: 12, color: BRAND.colors.white, fontSize: 14 },
  btn: { minHeight: 50, backgroundColor: BRAND.colors.cyberGreen, borderRadius: BRAND.radii.sm, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  disabled: { opacity: 0.55 },
  btnText: { color: BRAND.colors.dark, fontWeight: '900', fontSize: 14, textTransform: 'uppercase' },
  or: { color: BRAND.colors.muted, fontSize: 10, textAlign: 'center', marginTop: 2, textTransform: 'uppercase' },
  providerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  linkRow: { alignItems: 'center', paddingTop: 4 },
  linkText: { color: BRAND.colors.metalStart, fontSize: 13 },
  linkStrong: { color: BRAND.colors.cyberGreen, fontWeight: '800' },
  legalText: { color: BRAND.colors.muted, fontSize: 11, lineHeight: 16, textAlign: 'center' },
  legalLink: { color: BRAND.colors.cyberGreen, fontWeight: '800' },
});
