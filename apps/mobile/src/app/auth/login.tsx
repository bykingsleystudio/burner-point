import { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Linking, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Eye, EyeOff, ShieldCheck, Zap } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';

const providers = [
  ['Google', `${API_URL}/auth/oauth/google`],
  ['Apple iCloud', `${API_URL}/auth/oauth/apple`],
  ['Microsoft Outlook', `${API_URL}/auth/oauth/microsoft`],
] as const;

export default function LoginScreen() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const login = async () => {
    if (!identifier || !password) {
      Alert.alert('Required fields', 'Enter your email or phone number and password.');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { identifier, password });
      await SecureStore.setItemAsync('accessToken', res.data.accessToken);
      await SecureStore.setItemAsync('refreshToken', res.data.refreshToken);
      router.replace('/(tabs)' as any);
    } catch (error: any) {
      Alert.alert('Login failed', error.response?.data?.message || 'Check your credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.inner}>
        <TouchableOpacity style={s.logo} onPress={() => router.replace('/' as any)} activeOpacity={0.8}>
          <View style={s.logoIcon}><ShieldCheck size={28} color="#03110b" /></View>
          <Text style={s.logoText}>Burner<Text style={s.green}>Point</Text></Text>
          <Text style={s.logoSub}>Welcome back. Private by design.</Text>
        </TouchableOpacity>

        <View style={s.form}>
          <Text style={s.label}>Email or phone number</Text>
          <TextInput value={identifier} onChangeText={setIdentifier} placeholder="you@example.com or +1 415 555 0182" placeholderTextColor="#526157" style={s.input} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="username" />

          <Text style={s.label}>Password</Text>
          <View style={s.passwordWrap}>
            <TextInput value={password} onChangeText={setPassword} placeholder="Password" placeholderTextColor="#526157" style={[s.input, s.passwordInput]} secureTextEntry={!showPassword} autoComplete="current-password" />
            <TouchableOpacity style={s.eye} onPress={() => setShowPassword((value) => !value)}>
              {showPassword ? <EyeOff size={18} color="#95A69D" /> : <Eye size={18} color="#95A69D" />}
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={login} disabled={loading} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color="#03110b" /> : <><Zap size={16} color="#03110b" /><Text style={s.btnText}>Sign In</Text></>}
          </TouchableOpacity>

          <Text style={s.or}>or continue with</Text>
          <View style={s.providerGrid}>
            {providers.map(([label, url]) => (
              <TouchableOpacity key={label} style={s.provider} onPress={() => Linking.openURL(url)} activeOpacity={0.75}>
                <Text style={s.providerText}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity onPress={() => router.push('/auth/register' as any)} style={s.registerLink}>
            <Text style={s.registerText}>No account? <Text style={s.registerHighlight}>Create one free</Text></Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050807' },
  inner: { flex: 1, justifyContent: 'center', padding: 22 },
  logo: { alignItems: 'center', marginBottom: 34 },
  logoIcon: { width: 66, height: 66, borderRadius: 24, backgroundColor: '#00FF9D', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  logoText: { color: '#fff', fontSize: 28, fontWeight: '800', letterSpacing: 1.4 },
  green: { color: '#00FF9D' },
  logoSub: { color: '#8A978F', fontSize: 13, marginTop: 8 },
  form: { backgroundColor: '#0B120F', borderWidth: 1, borderColor: '#1D2A23', borderRadius: 28, padding: 16, gap: 10 },
  label: { color: '#95A69D', fontSize: 12, fontWeight: '700', marginTop: 2 },
  input: { minHeight: 52, backgroundColor: '#050807', borderWidth: 1, borderColor: '#203029', borderRadius: 16, paddingHorizontal: 14, color: '#fff', fontSize: 15 },
  passwordWrap: { position: 'relative' },
  passwordInput: { paddingRight: 48 },
  eye: { position: 'absolute', right: 8, top: 6, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  btn: { minHeight: 52, backgroundColor: '#00FF9D', borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 4 },
  btnDisabled: { opacity: 0.55 },
  btnText: { color: '#03110b', fontWeight: '800', fontSize: 15, textTransform: 'uppercase', letterSpacing: 1 },
  or: { color: '#657268', fontSize: 11, textAlign: 'center', marginVertical: 8, textTransform: 'uppercase', letterSpacing: 2 },
  providerGrid: { gap: 10 },
  provider: { minHeight: 48, borderRadius: 16, borderWidth: 1, borderColor: '#203029', alignItems: 'center', justifyContent: 'center', backgroundColor: '#09100D' },
  providerText: { color: '#DDE8E1', fontSize: 13, fontWeight: '700' },
  registerLink: { alignItems: 'center', paddingTop: 8 },
  registerText: { color: '#8A978F', fontSize: 14 },
  registerHighlight: { color: '#00FF9D', fontWeight: '800' },
});
