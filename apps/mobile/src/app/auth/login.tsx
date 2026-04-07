import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shield } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const login = async () => {
    if (!email || !password) { Alert.alert('Error', 'Please fill in all fields'); return; }
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      await SecureStore.setItemAsync('accessToken', res.data.accessToken);
      await SecureStore.setItemAsync('refreshToken', res.data.refreshToken);
      router.replace('/(tabs)' as any);
    } catch (e: any) {
      Alert.alert('Login Failed', e.response?.data?.message || 'Check your credentials');
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={s.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.inner}>
        <View style={s.logo}>
          <View style={s.logoIcon}><Shield size={28} color="#0A0A0A"/></View>
          <Text style={s.logoText}>BurnerPoint</Text>
          <Text style={s.logoSub}>Privacy is not a feature.</Text>
        </View>

        <View style={s.form}>
          <TextInput value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor="#444"
            style={s.input} keyboardType="email-address" autoCapitalize="none" autoCorrect={false}/>
          <TextInput value={password} onChangeText={setPassword} placeholder="Password" placeholderTextColor="#444"
            style={s.input} secureTextEntry/>
          <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={login} disabled={loading}>
            <Text style={s.btnText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/auth/register' as any)} style={s.registerLink}>
            <Text style={s.registerText}>No account? <Text style={s.registerHighlight}>Create one free</Text></Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  inner: { flex: 1, justifyContent: 'center', padding: 24 },
  logo: { alignItems: 'center', marginBottom: 40 },
  logoIcon: { width: 64, height: 64, borderRadius: 18, backgroundColor: '#00FF9D', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  logoText: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  logoSub: { color: '#666', fontSize: 13, marginTop: 4 },
  form: { gap: 12 },
  input: { backgroundColor: '#111', borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 14, padding: 16, color: '#fff', fontSize: 15 },
  btn: { backgroundColor: '#00FF9D', borderRadius: 14, padding: 16, alignItems: 'center' },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#0A0A0A', fontWeight: 'bold', fontSize: 16 },
  registerLink: { alignItems: 'center', paddingTop: 8 },
  registerText: { color: '#666', fontSize: 14 },
  registerHighlight: { color: '#00FF9D' },
});
