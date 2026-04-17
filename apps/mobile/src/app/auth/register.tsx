import { useState } from 'react';
import type { ComponentProps } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Linking, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ExpoLinking from 'expo-linking';
import { useAuth, useSignUp, useSSO } from '@clerk/clerk-expo';
import { Check, ShieldCheck } from 'lucide-react-native';
import { exchangeClerkForApiSession } from '../../lib/auth';
import { BRAND } from '../../lib/brand';
import { WEB_APP_URL } from '../../lib/config';
import { triggerHaptic } from '../../lib/native-ux';

const providers = [
  ['Google', 'oauth_google'],
  ['Apple iCloud', 'oauth_apple'],
  ['Microsoft Outlook', 'oauth_microsoft'],
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
    acceptTerms: false,
    acceptPrivacy: false,
  });
  const setField = (key: keyof typeof form) => (value: string | boolean) => setForm((prev) => ({ ...prev, [key]: value }));

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
    if (!form.acceptTerms || !form.acceptPrivacy) {
      Alert.alert('Policy acceptance required', 'Accept the Terms of Service and Privacy Policy to continue.');
      return false;
    }
    return true;
  };

  const finish = async (sessionId: string) => {
    await setActive({ session: sessionId });
    await exchangeClerkForApiSession(getToken, { ...form, country: 'NG' });
    router.replace('/(tabs)' as any);
  };

  const continueVerification = async (result: any) => {
    if (result.status === 'complete' && result.createdSessionId) {
      await finish(result.createdSessionId);
      return;
    }

    if (result.unverifiedFields?.includes('email_address')) {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification('email');
      setVerificationCode('');
      Alert.alert('Check your email', 'Enter the Clerk email verification code to continue signup.');
      return;
    }

    if (result.unverifiedFields?.includes('phone_number')) {
      await signUp.preparePhoneNumberVerification({ strategy: 'phone_code' });
      setPendingVerification('phone');
      setVerificationCode('');
      Alert.alert('Check your phone', 'Enter the Clerk phone verification code to finish signup.');
      return;
    }

    Alert.alert('Verification required', 'Clerk needs additional verification before this signup can be completed.');
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
        emailAddress: form.email,
        phoneNumber: form.phoneNumber,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        legalAccepted: true,
        unsafeMetadata: { ...form, country: 'NG' },
      });

      await continueVerification(result);
    } catch (error: any) {
      Alert.alert('Signup failed', error.errors?.[0]?.longMessage || error.errors?.[0]?.message || 'Please check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyEmail = async () => {
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
      Alert.alert('Verification failed', error.errors?.[0]?.message || 'Unable to verify your Clerk code.');
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
        unsafeMetadata: { ...form, country: 'NG' },
      });
      if (createdSessionId && setOAuthActive) {
        await setOAuthActive({ session: createdSessionId });
        await exchangeClerkForApiSession(getToken, { ...form, country: 'NG' });
        router.replace('/(tabs)' as any);
      }
    } catch (error: any) {
      Alert.alert('OAuth failed', error.errors?.[0]?.message || 'Unable to continue with this provider.');
    }
  };

  return (
    <SafeAreaView style={s.screen}>
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
          <TouchableOpacity style={s.logoRow} onPress={() => Linking.openURL(WEB_APP_URL)} activeOpacity={0.8}>
            <View style={s.logoIcon}><ShieldCheck size={22} color={BRAND.colors.dark} /></View>
            <Text style={s.logo}>Burner<Text style={s.green}>Point</Text></Text>
          </TouchableOpacity>
          <Text style={s.title}>Create a private identity layer.</Text>
          <Text style={s.sub}>Clerk protects sign-up. Burner Point requires first name, last name, email, and phone number for secure account recovery.</Text>

          <View style={s.card}>
            {pendingVerification ? (
              <>
                <Input label={pendingVerification === 'email' ? 'Email verification code' : 'Phone verification code'} value={verificationCode} onChangeText={setVerificationCode} keyboardType="number-pad" autoComplete="one-time-code" />
                <TouchableOpacity style={[s.btn, loading && s.disabled]} onPress={verifyEmail} disabled={loading} activeOpacity={0.85}>
                  {loading ? <ActivityIndicator color={BRAND.colors.dark} /> : <Text style={s.btnText}>Verify and continue</Text>}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={s.row}>
                  <Input label="First name" value={form.firstName} onChangeText={setField('firstName')} autoComplete="given-name" />
                  <Input label="Last name" value={form.lastName} onChangeText={setField('lastName')} autoComplete="family-name" />
                </View>
                <Input label="Email" value={form.email} onChangeText={setField('email')} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
                <Input label="Phone number" value={form.phoneNumber} onChangeText={setField('phoneNumber')} keyboardType="phone-pad" autoComplete="tel" placeholder="+1 415 555 0182" />
                <Input label="Password" value={form.password} onChangeText={setField('password')} secureTextEntry autoCapitalize="none" autoComplete="new-password" />
                <PolicyCheck checked={form.acceptTerms} onPress={() => setField('acceptTerms')(!form.acceptTerms)} text="I accept the Terms of Service." />
                <PolicyCheck checked={form.acceptPrivacy} onPress={() => setField('acceptPrivacy')(!form.acceptPrivacy)} text="I accept the Privacy Policy." />
                <TouchableOpacity style={[s.btn, loading && s.disabled]} onPress={createAccount} disabled={loading || !isLoaded} activeOpacity={0.85}>
                  {loading ? <ActivityIndicator color={BRAND.colors.dark} /> : <Text style={s.btnText}>Create account</Text>}
                </TouchableOpacity>
              </>
            )}
          </View>

          <Text style={s.or}>or continue with</Text>
          <View style={s.providerGrid}>
            {providers.map(([label, strategy]) => (
              <TouchableOpacity key={label} style={s.provider} onPress={() => oauth(strategy)} activeOpacity={0.75}>
                <Text style={s.providerText}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={s.bullets}>
            {['Real SIM numbers', 'OTP and voice verification', 'eSIM, proxies, and VPN privacy'].map((item) => (
              <View key={item} style={s.bullet}>
                <Check size={14} color={BRAND.colors.cyberGreen} />
                <Text style={s.bulletText}>{item}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity onPress={() => router.push('/auth/login' as any)}><Text style={s.link}>Already have an account? Sign in</Text></TouchableOpacity>
        </ScrollView>
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

function PolicyCheck({ checked, onPress, text }: { checked: boolean; onPress: () => void; text: string }) {
  return (
    <TouchableOpacity style={s.policyRow} onPress={() => { triggerHaptic('selection'); onPress(); }} activeOpacity={0.75}>
      <View style={[s.checkbox, checked && s.checkboxOn]}>{checked ? <Check size={12} color={BRAND.colors.dark} /> : null}</View>
      <Text style={s.policyText}>{text}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BRAND.colors.black },
  flex: { flex: 1 },
  content: { padding: 22, paddingBottom: 42 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 26 },
  logoIcon: { width: 42, height: 42, borderRadius: BRAND.radii.md, backgroundColor: BRAND.colors.cyberGreen, alignItems: 'center', justifyContent: 'center' },
  logo: { fontSize: 20, fontWeight: '900', color: BRAND.colors.white },
  green: { color: BRAND.colors.cyberGreen },
  title: { color: BRAND.colors.white, fontSize: 34, fontWeight: '900', lineHeight: 36, textTransform: 'uppercase' },
  sub: { color: BRAND.colors.metalStart, fontSize: 14, lineHeight: 22, marginTop: 12, marginBottom: 22 },
  card: { backgroundColor: BRAND.colors.surface, borderWidth: 1, borderColor: BRAND.colors.border, borderRadius: BRAND.radii.lg, padding: 16, gap: 12 },
  row: { flexDirection: 'row', gap: 10 },
  inputWrap: { flex: 1 },
  label: { color: BRAND.colors.metalStart, fontSize: 12, marginBottom: 7, fontWeight: '700' },
  input: { minHeight: 50, backgroundColor: BRAND.colors.black, borderWidth: 1, borderColor: BRAND.colors.border, borderRadius: BRAND.radii.md, paddingHorizontal: 14, color: BRAND.colors.white, fontSize: 15 },
  policyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1, borderColor: BRAND.colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: BRAND.colors.black },
  checkboxOn: { backgroundColor: BRAND.colors.cyberGreen, borderColor: BRAND.colors.cyberGreen },
  policyText: { flex: 1, color: BRAND.colors.metalStart, fontSize: 12, lineHeight: 18 },
  btn: { minHeight: 52, backgroundColor: BRAND.colors.cyberGreen, borderRadius: BRAND.radii.sm, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  disabled: { opacity: 0.55 },
  btnText: { color: BRAND.colors.dark, fontWeight: '900', fontSize: 15, textTransform: 'uppercase' },
  or: { color: BRAND.colors.muted, fontSize: 11, textAlign: 'center', marginVertical: 18, textTransform: 'uppercase' },
  providerGrid: { gap: 10 },
  provider: { minHeight: 48, borderRadius: BRAND.radii.md, borderWidth: 1, borderColor: BRAND.colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: BRAND.colors.surface },
  providerText: { color: BRAND.colors.metalEnd, fontSize: 13, fontWeight: '700' },
  bullets: { marginTop: 20, gap: 10 },
  bullet: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  bulletText: { color: BRAND.colors.metalStart, fontSize: 13 },
  link: { color: BRAND.colors.cyberGreen, textAlign: 'center', marginTop: 22, fontSize: 14, fontWeight: '700' },
});
