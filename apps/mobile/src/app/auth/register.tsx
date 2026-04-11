import { useState } from 'react';
import type { ComponentProps } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Linking, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { Check, ShieldCheck } from 'lucide-react-native';
import { API_BASE_URL } from '../../lib/config';

const providers = [
  ['Google', `${API_BASE_URL}/auth/oauth/google`],
  ['Apple iCloud', `${API_BASE_URL}/auth/oauth/apple`],
  ['Microsoft Outlook', `${API_BASE_URL}/auth/oauth/microsoft`],
] as const;

export default function RegisterScreen() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phoneNumber: '', password: '' });
  const setField = (key: keyof typeof form) => (value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const createAccount = async () => {
    if (!form.firstName || !form.lastName || !form.email || !form.phoneNumber || !form.password) {
      Alert.alert('Required fields', 'First name, last name, email, phone number, and password are all required.');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/register`, { ...form, country: 'NG' });
      await SecureStore.setItemAsync('accessToken', res.data.accessToken);
      await SecureStore.setItemAsync('refreshToken', res.data.refreshToken);
      router.replace('/(tabs)' as any);
    } catch (error: any) {
      Alert.alert('Signup failed', error.response?.data?.message || 'Please check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.screen}>
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
          <TouchableOpacity style={s.logoRow} onPress={() => router.replace('/' as any)} activeOpacity={0.8}>
            <View style={s.logoIcon}><ShieldCheck size={22} color="#03110b" /></View>
            <Text style={s.logo}>Burner<Text style={s.green}>Point</Text></Text>
          </TouchableOpacity>
          <Text style={s.title}>Create a private identity layer.</Text>
          <Text style={s.sub}>First name, last name, email, and phone number are required for secure account recovery.</Text>

          <View style={s.card}>
            <View style={s.row}>
              <Input label="First name" value={form.firstName} onChangeText={setField('firstName')} autoComplete="given-name" />
              <Input label="Last name" value={form.lastName} onChangeText={setField('lastName')} autoComplete="family-name" />
            </View>
            <Input label="Email" value={form.email} onChangeText={setField('email')} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
            <Input label="Phone number" value={form.phoneNumber} onChangeText={setField('phoneNumber')} keyboardType="phone-pad" autoComplete="tel" placeholder="+1 415 555 0182" />
            <Input label="Password" value={form.password} onChangeText={setField('password')} secureTextEntry autoCapitalize="none" autoComplete="new-password" />
            <TouchableOpacity style={[s.btn, loading && s.disabled]} onPress={createAccount} disabled={loading} activeOpacity={0.85}>
              {loading ? <ActivityIndicator color="#03110b" /> : <Text style={s.btnText}>Create account</Text>}
            </TouchableOpacity>
          </View>

          <Text style={s.or}>or continue with</Text>
          <View style={s.providerGrid}>
            {providers.map(([label, url]) => (
              <TouchableOpacity key={label} style={s.provider} onPress={() => Linking.openURL(url)} activeOpacity={0.75}>
                <Text style={s.providerText}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={s.bullets}>
            {['Real SIM numbers', 'OTP and voice verification', 'eSIM, proxies, and VPN privacy'].map((item) => (
              <View key={item} style={s.bullet}>
                <Check size={14} color="#00FF9D" />
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
      <TextInput style={s.input} placeholder={placeholder || label} placeholderTextColor="#526157" {...inputProps} />
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#050807' },
  flex: { flex: 1 },
  content: { padding: 22, paddingBottom: 42 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 26 },
  logoIcon: { width: 42, height: 42, borderRadius: 16, backgroundColor: '#00FF9D', alignItems: 'center', justifyContent: 'center' },
  logo: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: 1.4 },
  green: { color: '#00FF9D' },
  title: { color: '#fff', fontSize: 34, fontWeight: '800', lineHeight: 36, textTransform: 'uppercase' },
  sub: { color: '#8A978F', fontSize: 14, lineHeight: 22, marginTop: 12, marginBottom: 22 },
  card: { backgroundColor: '#0B120F', borderWidth: 1, borderColor: '#1D2A23', borderRadius: 28, padding: 16, gap: 12 },
  row: { flexDirection: 'row', gap: 10 },
  inputWrap: { flex: 1 },
  label: { color: '#95A69D', fontSize: 12, marginBottom: 7, fontWeight: '700' },
  input: { minHeight: 50, backgroundColor: '#050807', borderWidth: 1, borderColor: '#203029', borderRadius: 16, paddingHorizontal: 14, color: '#fff', fontSize: 15 },
  btn: { minHeight: 52, backgroundColor: '#00FF9D', borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  disabled: { opacity: 0.55 },
  btnText: { color: '#03110b', fontWeight: '800', fontSize: 15, textTransform: 'uppercase', letterSpacing: 1 },
  or: { color: '#657268', fontSize: 11, textAlign: 'center', marginVertical: 18, textTransform: 'uppercase', letterSpacing: 2 },
  providerGrid: { gap: 10 },
  provider: { minHeight: 48, borderRadius: 16, borderWidth: 1, borderColor: '#203029', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0B120F' },
  providerText: { color: '#DDE8E1', fontSize: 13, fontWeight: '700' },
  bullets: { marginTop: 20, gap: 10 },
  bullet: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  bulletText: { color: '#95A69D', fontSize: 13 },
  link: { color: '#00FF9D', textAlign: 'center', marginTop: 22, fontSize: 14, fontWeight: '700' },
});
