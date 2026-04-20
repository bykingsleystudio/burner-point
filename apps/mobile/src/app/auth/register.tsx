import { useState } from 'react';
import type { ComponentProps } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Linking, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ExpoLinking from 'expo-linking';
import { useAuth, useSignUp, useSSO } from '@clerk/clerk-expo';
import { Check, ShieldCheck } from 'lucide-react-native';

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
  const [loading, setLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [pendingVerification, setPendingVerification] = useState<PendingVerification | null>(null);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    acceptPolicies: false,
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
    if (!form.acceptPolicies) {
      Alert.alert('Policy acceptance required', 'Accept the Terms of Service and Privacy Policy to continue.');
      return false;
    }
    return true;
  };

  const finishBurnerSession = async (sessionId: string) => {
    await setActive({ session: sessionId });
    const data = await exchangeClerkForApiSession(getToken, {
      ...form,
      country: 'NG',
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
          country: 'NG',
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
    if (!validateProfile()) return;

    try {
      const { createdSessionId, setActive: setOAuthActive } = await startSSOFlow({
        strategy,
        redirectUrl: ExpoLinking.createURL('auth/register'),
        unsafeMetadata: {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          acceptTerms: true,
          acceptPrivacy: true,
          country: 'NG',
        },
      });

      if (createdSessionId && setOAuthActive) {
        await setOAuthActive({ session: createdSessionId });
        const data = await exchangeClerkForApiSession(getToken, {
          ...form,
          country: 'NG',
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
          <Text style={s.logoSub}>Private by design. Stay connected.</Text>
        </TouchableOpacity>

        <View style={s.card}>
          <Text style={s.kicker}>Create account</Text>
          <Text style={s.title}>Private identity, ready fast.</Text>
          <Text style={s.sub}>Use one compact Burner Point account across verification, inbox, numbers, billing, and support.</Text>

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
              <View style={s.row}>
                <Input label="First name" value={form.firstName} onChangeText={setField('firstName')} autoComplete="given-name" placeholder="Kingsley" />
                <Input label="Last name" value={form.lastName} onChangeText={setField('lastName')} autoComplete="family-name" placeholder="Doe" />
              </View>
              <View style={s.row}>
                <Input label="Email" value={form.email} onChangeText={setField('email')} keyboardType="email-address" autoCapitalize="none" autoComplete="email" placeholder="you@example.com" />
                <Input label="Phone" value={form.phoneNumber} onChangeText={setField('phoneNumber')} keyboardType="phone-pad" autoComplete="tel" placeholder="+1 415..." />
              </View>
              <Input label="Password" value={form.password} onChangeText={setField('password')} secureTextEntry autoCapitalize="none" autoComplete="new-password" placeholder="8+ chars, mixed case + number" />

              <TouchableOpacity style={s.policyRow} onPress={() => { triggerHaptic('selection'); setField('acceptPolicies')(!form.acceptPolicies); }} activeOpacity={0.78}>
                <View style={[s.checkbox, form.acceptPolicies && s.checkboxOn]}>
                  {form.acceptPolicies ? <Check size={12} color={BRAND.colors.dark} /> : null}
                </View>
                <Text style={s.policyText}>By continuing, you accept the Terms of Service and Privacy Policy.</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[s.btn, loading && s.disabled]} onPress={createAccount} disabled={loading || !isLoaded} activeOpacity={0.85}>
                {loading ? <ActivityIndicator color={BRAND.colors.dark} /> : <Text style={s.btnText}>Create account</Text>}
              </TouchableOpacity>
            </>
          )}

          <Text style={s.or}>or continue with</Text>
          <View style={s.providerRow}>
            {providers.map(([label, strategy]) => (
              <AuthProviderButton key={label} provider={label} onPress={() => oauth(strategy)} disabled={loading || !isLoaded} />
            ))}
          </View>

          <TouchableOpacity onPress={() => router.push('/auth/login' as any)} style={s.linkRow}>
            <Text style={s.linkText}>Already have an account? <Text style={s.linkStrong}>Sign in</Text></Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Input(props: ComponentProps<typeof TextInput> & { label: string }) {
  const { label, placeholder, ...inputProps } = props;
  return (
    <View style={s.inputWrap}>
      <Text style={s.label}>{label}</Text>
      <TextInput style={s.input} placeholder={placeholder || label} placeholderTextColor={BRAND.colors.muted} {...inputProps} />
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
  logoSub: { color: BRAND.colors.metalStart, fontSize: 12, marginTop: 4 },
  card: {
    backgroundColor: BRAND.colors.surface,
    borderWidth: 1,
    borderColor: BRAND.colors.border,
    borderRadius: BRAND.radii.lg,
    padding: 14,
    gap: 8,
    ...BRAND.shadows.card,
  },
  kicker: { color: BRAND.colors.cyberGreen, fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  title: { color: BRAND.colors.white, fontSize: 26, lineHeight: 27, fontWeight: '900', textTransform: 'uppercase' },
  sub: { color: BRAND.colors.metalStart, fontSize: 13, lineHeight: 18, marginBottom: 2 },
  row: { flexDirection: 'row', gap: 8 },
  inputWrap: { flex: 1 },
  label: { color: BRAND.colors.metalStart, fontSize: 11, marginBottom: 6, fontWeight: '700' },
  input: { minHeight: 46, backgroundColor: BRAND.colors.black, borderWidth: 1, borderColor: BRAND.colors.border, borderRadius: BRAND.radii.md, paddingHorizontal: 12, color: BRAND.colors.white, fontSize: 14 },
  policyRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 2 },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1, borderColor: BRAND.colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: BRAND.colors.black, marginTop: 1 },
  checkboxOn: { backgroundColor: BRAND.colors.cyberGreen, borderColor: BRAND.colors.cyberGreen },
  policyText: { flex: 1, color: BRAND.colors.metalStart, fontSize: 11, lineHeight: 16 },
  btn: { minHeight: 50, backgroundColor: BRAND.colors.cyberGreen, borderRadius: BRAND.radii.sm, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  disabled: { opacity: 0.55 },
  btnText: { color: BRAND.colors.dark, fontWeight: '900', fontSize: 14, textTransform: 'uppercase' },
  or: { color: BRAND.colors.muted, fontSize: 10, textAlign: 'center', marginTop: 4, textTransform: 'uppercase' },
  providerRow: { flexDirection: 'row', gap: 8, marginTop: 2 },
  linkRow: { alignItems: 'center', paddingTop: 4 },
  linkText: { color: BRAND.colors.metalStart, fontSize: 13 },
  linkStrong: { color: BRAND.colors.cyberGreen, fontWeight: '800' },
});
