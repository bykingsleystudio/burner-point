import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Linking, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Eye, EyeOff, ShieldCheck, Zap } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as ExpoLinking from 'expo-linking';
import { useAuth, useSignIn, useSSO } from '@clerk/clerk-expo';

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

type AuthStep = 'sign-in' | 'reset-request' | 'reset-confirm';
type ResetPasswordStrategy = 'reset_password_email_code' | 'reset_password_phone_code';

export default function LoginScreen() {
  const router = useRouter();
  const { isLoaded, signIn, setActive } = useSignIn();
  const { getToken } = useAuth();
  const { startSSOFlow } = useSSO();
  const identifierInputRef = useRef<TextInput>(null);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [secondFactorStrategy, setSecondFactorStrategy] = useState<string | null>(null);
  const [secondFactorCode, setSecondFactorCode] = useState('');
  const [authStep, setAuthStep] = useState<AuthStep>('sign-in');
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetStrategy, setResetStrategy] = useState<ResetPasswordStrategy>('reset_password_email_code');

  const finishBurnerSession = async (sessionId: string) => {
    await setActive({ session: sessionId });
    const data = await exchangeClerkForApiSession(getToken);
    if (data.user?.phoneNumber && data.user.phoneVerified === false) {
      router.replace({ pathname: '/auth/phone-verify', params: { redirect: '/(tabs)' } } as any);
      return;
    }
    router.replace('/(tabs)' as any);
  };

  const resetAuthState = () => {
    setAuthStep('sign-in');
    setSecondFactorStrategy(null);
    setSecondFactorCode('');
    setResetIdentifier('');
    setResetCode('');
    setNewPassword('');
  };

  const login = async () => {
    triggerHaptic('impact');
    if (!isLoaded) return;
    if (!identifier || !password) {
      Alert.alert('Required fields', 'Enter your email or phone number and password.');
      return;
    }

    setLoading(true);
    try {
      const result = await signIn.create({ identifier, password });
      if (result.status === 'needs_second_factor') {
        const factor = result.supportedSecondFactors?.[0] as any;
        if (factor?.strategy && factor.strategy !== 'totp' && factor.strategy !== 'backup_code') {
          await signIn.prepareSecondFactor(factor);
        }
        setSecondFactorStrategy(factor?.strategy || 'totp');
        Alert.alert('Two-factor required', 'Enter your verification code to continue.');
        return;
      }

      if (result.status !== 'complete' || !result.createdSessionId) {
        Alert.alert('Verification required', 'Another verification step is required before this session can continue.');
        return;
      }

      await finishBurnerSession(result.createdSessionId);
    } catch (error: any) {
      Alert.alert('Sign in failed', error.errors?.[0]?.longMessage || error.errors?.[0]?.message || 'Check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  const requestPasswordReset = async () => {
    triggerHaptic('selection');
    if (!isLoaded || !resetIdentifier.trim()) {
      Alert.alert('Account identifier required', 'Enter the email address or phone number on this Burner Point account.');
      return;
    }

    const strategy: ResetPasswordStrategy = resetIdentifier.includes('@')
      ? 'reset_password_email_code'
      : 'reset_password_phone_code';

    setLoading(true);
    try {
      await signIn.create({
        strategy,
        identifier: resetIdentifier.trim(),
      });
      setResetStrategy(strategy);
      setResetCode('');
      setNewPassword('');
      setAuthStep('reset-confirm');
      Alert.alert(
        'Reset code sent',
        strategy === 'reset_password_email_code'
          ? 'Check your email for the password reset code.'
          : 'Check your phone for the password reset code.',
      );
    } catch (error: any) {
      Alert.alert('Reset failed', error.errors?.[0]?.longMessage || error.errors?.[0]?.message || 'Unable to send a reset code.');
    } finally {
      setLoading(false);
    }
  };

  const submitPasswordReset = async () => {
    triggerHaptic('impact');
    if (!isLoaded || !resetCode.trim() || !newPassword) {
      Alert.alert('Reset details required', 'Enter the reset code and your new password.');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Password too short', 'Use at least 8 characters for your new password.');
      return;
    }

    setLoading(true);
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: resetStrategy,
        code: resetCode.trim(),
        password: newPassword,
      });

      if (result.status === 'complete' && result.createdSessionId) {
        await finishBurnerSession(result.createdSessionId);
        return;
      }

      Alert.alert('Reset not complete', 'Another verification step is required before sign-in can finish.');
    } catch (error: any) {
      Alert.alert('Reset failed', error.errors?.[0]?.longMessage || error.errors?.[0]?.message || 'Unable to reset your password.');
    } finally {
      setLoading(false);
    }
  };

  const verifySecondFactor = async () => {
    triggerHaptic('impact');
    if (!isLoaded || !secondFactorStrategy || !secondFactorCode.trim()) return;

    setLoading(true);
    try {
      const result = await signIn.attemptSecondFactor({
        strategy: secondFactorStrategy as any,
        code: secondFactorCode.trim(),
      });

      if (result.status === 'complete' && result.createdSessionId) {
        await finishBurnerSession(result.createdSessionId);
        return;
      }

      Alert.alert('Verification incomplete', 'Check the code and try again.');
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
        redirectUrl: ExpoLinking.createURL('auth/login'),
      });
      if (createdSessionId && setOAuthActive) {
        await setOAuthActive({ session: createdSessionId });
        const data = await exchangeClerkForApiSession(getToken);
        if (data.user?.phoneNumber && data.user.phoneVerified === false) {
          router.replace({ pathname: '/auth/phone-verify', params: { redirect: '/(tabs)' } } as any);
          return;
        }
        router.replace('/(tabs)' as any);
      }
    } catch (error: any) {
      Alert.alert('Provider sign-in failed', error.errors?.[0]?.message || 'Unable to continue with this provider.');
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
            {secondFactorStrategy
              ? 'Two-factor verification'
              : authStep === 'reset-request'
                ? 'Reset password'
                : authStep === 'reset-confirm'
                  ? 'Enter reset code'
                  : 'Secure sign in'}
          </Text>

          {secondFactorStrategy ? (
            <>
              <Text style={s.label}>Two-factor code</Text>
              <TextInput
                value={secondFactorCode}
                onChangeText={setSecondFactorCode}
                placeholder="Enter verification code"
                placeholderTextColor={BRAND.colors.muted}
                style={s.input}
                keyboardType="number-pad"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="one-time-code"
              />
              <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={verifySecondFactor} disabled={loading} activeOpacity={0.85}>
                {loading ? <ActivityIndicator color={BRAND.colors.dark} /> : <Text style={s.btnText}>Verify</Text>}
              </TouchableOpacity>
            </>
          ) : authStep === 'reset-request' ? (
            <>
              <Text style={s.label}>Email or phone number</Text>
              <TextInput
                value={resetIdentifier}
                onChangeText={setResetIdentifier}
                placeholder="you@example.com or +1 415 555 0182"
                placeholderTextColor={BRAND.colors.muted}
                style={s.input}
                keyboardType="default"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="username"
              />
              <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={requestPasswordReset} disabled={loading || !isLoaded} activeOpacity={0.85}>
                {loading ? <ActivityIndicator color={BRAND.colors.dark} /> : <Text style={s.btnText}>Send reset code</Text>}
              </TouchableOpacity>
              <TouchableOpacity onPress={resetAuthState} style={s.textLink}>
                <Text style={s.textLinkLabel}>Back to sign in</Text>
              </TouchableOpacity>
            </>
          ) : authStep === 'reset-confirm' ? (
            <>
              <Text style={s.label}>{resetStrategy === 'reset_password_email_code' ? 'Email reset code' : 'Phone reset code'}</Text>
              <TextInput
                value={resetCode}
                onChangeText={setResetCode}
                placeholder="Enter reset code"
                placeholderTextColor={BRAND.colors.muted}
                style={s.input}
                keyboardType="number-pad"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="one-time-code"
              />

              <Text style={s.label}>New password</Text>
              <View style={s.passwordWrap}>
                <TextInput
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="New password"
                  placeholderTextColor={BRAND.colors.muted}
                  style={[s.input, s.passwordInput]}
                  secureTextEntry={!showPassword}
                  autoComplete="new-password"
                />
                <TouchableOpacity style={s.eye} onPress={() => setShowPassword((value) => !value)}>
                  {showPassword ? <EyeOff size={18} color={BRAND.colors.metalStart} /> : <Eye size={18} color={BRAND.colors.metalStart} />}
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={submitPasswordReset} disabled={loading || !isLoaded} activeOpacity={0.85}>
                {loading ? <ActivityIndicator color={BRAND.colors.dark} /> : <Text style={s.btnText}>Reset password</Text>}
              </TouchableOpacity>
              <View style={s.resetActions}>
                <TouchableOpacity onPress={requestPasswordReset} disabled={loading}>
                  <Text style={s.textLinkLabel}>Resend code</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={resetAuthState}>
                  <Text style={s.textLinkLabel}>Back to sign in</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View style={s.providerGrid}>
                {providers.map(([label, strategy]) => (
                  <AuthProviderButton key={label} provider={label} onPress={() => oauth(strategy)} disabled={loading || !isLoaded} />
                ))}
                <AuthProviderButton provider="Phone" onPress={() => identifierInputRef.current?.focus()} disabled={loading || !isLoaded} />
              </View>

              <Text style={s.or}>or use your Burner Point account</Text>

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
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  logo: { alignItems: 'center', marginBottom: 14 },
  logoIcon: {
    width: 52,
    height: 52,
    borderRadius: BRAND.radii.md,
    backgroundColor: BRAND.colors.cyberGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  logoText: { color: BRAND.colors.white, fontSize: 24, fontWeight: '900' },
  green: { color: BRAND.colors.cyberGreen },
  form: {
    backgroundColor: BRAND.colors.surface,
    borderWidth: 1,
    borderColor: BRAND.colors.border,
    borderRadius: 22,
    padding: 18,
    gap: 10,
    ...BRAND.shadows.card,
  },
  kicker: { color: BRAND.colors.cyberGreen, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.4 },
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
  passwordWrap: { position: 'relative' },
  passwordInput: { paddingRight: 44 },
  eye: { position: 'absolute', right: 6, top: 4, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  btn: {
    minHeight: 50,
    backgroundColor: BRAND.colors.cyberGreen,
    borderRadius: BRAND.radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.55 },
  btnText: { color: BRAND.colors.dark, fontWeight: '900', fontSize: 14, textTransform: 'uppercase' },
  textLink: { alignItems: 'center', paddingTop: 4 },
  textLinkLabel: { color: BRAND.colors.cyberGreen, fontSize: 12, fontWeight: '800' },
  or: { color: BRAND.colors.muted, fontSize: 10, textAlign: 'center', marginTop: 2, textTransform: 'uppercase' },
  providerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  registerText: { color: BRAND.colors.metalStart, fontSize: 13 },
  registerHighlight: { color: BRAND.colors.cyberGreen, fontWeight: '800' },
  resetActions: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingTop: 4 },
  legalText: { color: BRAND.colors.muted, fontSize: 11, lineHeight: 16, textAlign: 'center' },
  legalLink: { color: BRAND.colors.cyberGreen, fontWeight: '800' },
});
