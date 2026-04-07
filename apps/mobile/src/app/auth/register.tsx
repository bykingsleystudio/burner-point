import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';

export default function RegisterScreen() {
  const [form, setForm] = useState({ firstName: '', email: '', password: '' });
  const f = (k: string) => (v: string) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <KeyboardAvoidingView style={s.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={s.logo}>Burner<Text style={{ color: '#00FF9D' }}>Point</Text></Text>
        <Text style={s.sub}>Your privacy, our priority.</Text>
        {[['First name', 'firstName', false], ['Email', 'email', false], ['Password', 'password', true]].map(([label, key, secure]) => (
          <View key={key as string}>
            <Text style={s.label}>{label as string}</Text>
            <TextInput style={s.input} value={form[key as keyof typeof form]} onChangeText={f(key as string)} placeholder={label as string} placeholderTextColor="#444" secureTextEntry={secure as boolean} autoCapitalize="none" />
          </View>
        ))}
        <TouchableOpacity style={s.btn} onPress={() => router.replace('/(tabs)')}><Text style={s.btnText}>Create account</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/auth/login')}><Text style={s.link}>Already have an account? Sign in</Text></TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#050505', padding: 24, paddingTop: 60 },
  logo: { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 4 },
  sub: { fontSize: 13, color: '#666', marginBottom: 32 },
  label: { fontSize: 12, color: '#888', marginBottom: 6 },
  input: { backgroundColor: '#111', borderWidth: 1, borderColor: '#1A1A1A', borderRadius: 12, padding: 14, color: '#fff', fontSize: 14, marginBottom: 14 },
  btn: { backgroundColor: '#00FF9D', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 4 },
  btnText: { color: '#000', fontWeight: '700', fontSize: 15 },
  link: { color: '#00FF9D', textAlign: 'center', marginTop: 16, fontSize: 13 },
});
