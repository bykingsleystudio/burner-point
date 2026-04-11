import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LogOut, Shield, Copy, Share2, Key, HelpCircle, ChevronRight } from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const token = await SecureStore.getItemAsync('accessToken');
      if (!token) return;
      const res = await axios.get(`${API_URL}/users/me`, { headers: { Authorization: `Bearer ${token}` } });
      setUser(res.data);
    })().catch(() => {});
  }, []);

  const logout = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => {
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
        router.replace('/auth/login' as any);
      }},
    ]);
  };

  const copyReferral = async () => {
    if (user?.referralCode) {
      await Clipboard.setStringAsync(user.referralCode);
      Alert.alert('Copied!', 'Referral code copied to clipboard');
    }
  };

  const menuItems = [
    { icon: Key, label: 'API Keys', action: () => {} },
    { icon: Shield, label: 'Security', action: () => {} },
    { icon: Share2, label: 'Referral Program', action: copyReferral },
    { icon: HelpCircle, label: 'Support', action: () => {} },
  ];

  return (
    <SafeAreaView style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{user?.firstName?.[0]?.toUpperCase() || '?'}</Text>
          </View>
          <Text style={s.name}>{user?.firstName} {user?.lastName}</Text>
          <Text style={s.email}>{user?.email}</Text>
        </View>

        {/* Wallet */}
        <View style={s.walletCard}>
          <Text style={s.walletLabel}>Wallet Balance</Text>
          <Text style={s.walletBalance}>₦{((user?.walletBalanceKobo || 0) / 100).toLocaleString()}</Text>
        </View>

        {/* Referral */}
        {user?.referralCode && (
          <TouchableOpacity style={s.referralCard} onPress={copyReferral}>
            <View>
              <Text style={s.referralLabel}>Your Referral Code</Text>
              <Text style={s.referralCode}>{user.referralCode}</Text>
            </View>
            <Copy size={18} color="#00FF9D"/>
          </TouchableOpacity>
        )}

        {/* Menu */}
        <View style={s.menu}>
          {menuItems.map((item) => (
            <TouchableOpacity key={item.label} style={s.menuItem} onPress={item.action}>
              <item.icon size={18} color="#666"/>
              <Text style={s.menuLabel}>{item.label}</Text>
              <ChevronRight size={16} color="#444"/>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={s.logoutBtn} onPress={logout}>
          <LogOut size={18} color="#FF4444"/>
          <Text style={s.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={s.version}>BurnerPoint v1.0.0 · Privacy is not a feature.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  header: { alignItems: 'center', padding: 24, paddingBottom: 16 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#00FF9D20', borderWidth: 2, borderColor: '#00FF9D40', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { color: '#00FF9D', fontSize: 28, fontWeight: 'bold' },
  name: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  email: { color: '#666', fontSize: 13, marginTop: 4 },
  walletCard: { marginHorizontal: 16, marginBottom: 12, backgroundColor: '#111', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#2A2A2A' },
  walletLabel: { color: '#666', fontSize: 12, marginBottom: 4 },
  walletBalance: { color: '#00FF9D', fontSize: 28, fontWeight: 'bold', fontFamily: 'monospace' },
  referralCard: { marginHorizontal: 16, marginBottom: 12, backgroundColor: '#00FF9D08', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#00FF9D30', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  referralLabel: { color: '#666', fontSize: 11, marginBottom: 4 },
  referralCode: { color: '#00FF9D', fontSize: 20, fontWeight: 'bold', fontFamily: 'monospace', letterSpacing: 2 },
  menu: { marginHorizontal: 16, backgroundColor: '#111', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#2A2A2A', marginBottom: 12 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#1A1A1A' },
  menuLabel: { flex: 1, color: '#fff', fontSize: 14 },
  logoutBtn: { marginHorizontal: 16, backgroundColor: '#FF444410', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: '#FF444430', marginBottom: 16 },
  logoutText: { color: '#FF4444', fontWeight: '600', fontSize: 15 },
  version: { color: '#333', fontSize: 11, textAlign: 'center', marginBottom: 24 },
});
