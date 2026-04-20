import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Activity, CreditCard, LogOut, Shield, Copy, Share2, Key, HelpCircle, ChevronRight } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import axios from 'axios';
import { API_BASE_URL } from '../../lib/config';
import { clearApiSession, getApiAccessToken } from '../../lib/auth';
import { BRAND } from '../../lib/brand';
import { triggerHaptic } from '../../lib/native-ux';

export default function ProfileScreen() {
  const router = useRouter();
  const { getToken, signOut } = useAuth();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const token = await getApiAccessToken(getToken);
      const res = await axios.get(`${API_BASE_URL}/users/me`, { headers: { Authorization: `Bearer ${token}` } });
      setUser(res.data);
    })().catch(() => {});
  }, [getToken]);

  const logout = () => {
    triggerHaptic('warning');
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => {
        await clearApiSession();
        await signOut();
        router.replace('/auth/login' as any);
      }},
    ]);
  };

  const copyReferral = async () => {
    triggerHaptic('success');
    if (user?.referralCode) {
      await Clipboard.setStringAsync(user.referralCode);
      Alert.alert('Copied!', 'Referral code copied to clipboard');
    }
  };

  const menuItems = [
    { icon: CreditCard, label: 'Billing', action: () => router.push('/billing' as any) },
    { icon: Key, label: 'API Keys', action: () => router.push('/developer' as any) },
    { icon: Shield, label: 'Security & Settings', action: () => router.push('/settings' as any) },
    { icon: Activity, label: 'Activity', action: () => router.push('/activity' as any) },
    { icon: Share2, label: 'Referral Program', action: copyReferral },
    { icon: HelpCircle, label: 'Support', action: () => router.push('/support' as any) },
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
          <Text style={s.walletBalance}>NGN {((user?.walletBalanceKobo || 0) / 100).toLocaleString()}</Text>
        </View>

        {/* Referral */}
        {user?.referralCode && (
          <TouchableOpacity style={s.referralCard} onPress={copyReferral}>
            <View>
              <Text style={s.referralLabel}>Your Referral Code</Text>
              <Text style={s.referralCode}>{user.referralCode}</Text>
            </View>
            <Copy size={18} color={BRAND.colors.cyberGreen}/>
          </TouchableOpacity>
        )}

        {/* Menu */}
        <View style={s.menu}>
          {menuItems.map((item) => (
            <TouchableOpacity key={item.label} style={s.menuItem} onPress={() => { triggerHaptic('selection'); item.action(); }}>
              <item.icon size={18} color={BRAND.colors.muted}/>
              <Text style={s.menuLabel}>{item.label}</Text>
              <ChevronRight size={16} color={BRAND.colors.metalStart}/>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={s.logoutBtn} onPress={logout}>
          <LogOut size={18} color={BRAND.colors.danger}/>
          <Text style={s.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={s.version}>Burner Point v1.0.0 - Private By Design.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND.colors.black },
  header: { alignItems: 'center', padding: 24, paddingBottom: 16 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: `${BRAND.colors.cyberGreen}20`, borderWidth: 2, borderColor: `${BRAND.colors.cyberGreen}40`, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { color: BRAND.colors.cyberGreen, fontSize: 28, fontWeight: '900' },
  name: { color: BRAND.colors.white, fontSize: 20, fontWeight: '900' },
  email: { color: BRAND.colors.muted, fontSize: 13, marginTop: 4 },
  walletCard: { marginHorizontal: 16, marginBottom: 12, backgroundColor: BRAND.colors.surface, borderRadius: BRAND.radii.lg, padding: 16, borderWidth: 1, borderColor: BRAND.colors.border },
  walletLabel: { color: BRAND.colors.muted, fontSize: 12, marginBottom: 4 },
  walletBalance: { color: BRAND.colors.cyberGreen, fontSize: 28, fontWeight: '900', fontFamily: BRAND.typography.mono },
  referralCard: { marginHorizontal: 16, marginBottom: 12, backgroundColor: `${BRAND.colors.cyberGreen}08`, borderRadius: BRAND.radii.lg, padding: 16, borderWidth: 1, borderColor: `${BRAND.colors.cyberGreen}30`, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  referralLabel: { color: BRAND.colors.muted, fontSize: 11, marginBottom: 4 },
  referralCode: { color: BRAND.colors.cyberGreen, fontSize: 20, fontWeight: '900', fontFamily: BRAND.typography.mono },
  menu: { marginHorizontal: 16, backgroundColor: BRAND.colors.surface, borderRadius: BRAND.radii.lg, overflow: 'hidden', borderWidth: 1, borderColor: BRAND.colors.border, marginBottom: 12 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: BRAND.colors.border },
  menuLabel: { flex: 1, color: BRAND.colors.white, fontSize: 14 },
  logoutBtn: { marginHorizontal: 16, backgroundColor: `${BRAND.colors.danger}10`, borderRadius: BRAND.radii.sm, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: `${BRAND.colors.danger}30`, marginBottom: 16 },
  logoutText: { color: BRAND.colors.danger, fontWeight: '700', fontSize: 15 },
  version: { color: BRAND.colors.muted, fontSize: 11, textAlign: 'center', marginBottom: 24 },
});
