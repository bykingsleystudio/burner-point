import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { Bell, ChevronRight, HelpCircle, Key, LogOut, ShieldCheck, SlidersHorizontal } from 'lucide-react-native';

import { clearApiSession } from '../../lib/auth';

const settings = [
  ['Security and 2FA', 'Email, phone, and session controls', ShieldCheck],
  ['API keys', 'Manage developer access from web', Key],
  ['Notifications', 'OTP, rentals, billing, and alerts', Bell],
  ['Preferences', 'Motion, region, privacy defaults', SlidersHorizontal],
  ['Support', 'Email and Telegram help channels', HelpCircle],
];

export default function SettingsScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { user } = useUser();

  const logout = () => {
    Alert.alert('Sign out', 'End this Burner Point session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await clearApiSession();
          await signOut();
          router.replace('/auth/login' as any);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
        <Text style={s.kicker}>Settings</Text>
        <Text style={s.title}>Control center.</Text>

        <View style={s.identityCard}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{user?.firstName?.[0]?.toUpperCase() || 'B'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.name}>{user?.fullName || 'Burner Point user'}</Text>
            <Text style={s.email}>{user?.primaryEmailAddress?.emailAddress || 'Secure Clerk session'}</Text>
          </View>
        </View>

        <Text style={s.sectionTitle}>Account</Text>
        <View style={s.menu}>
          {settings.map(([label, text, Icon]) => (
            <TouchableOpacity key={label as string} style={s.menuItem} activeOpacity={0.78} onPress={() => Alert.alert(label as string, text as string)}>
              <View style={s.menuIcon}>
                <Icon size={17} color="#00FF9D" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.menuLabel}>{label as string}</Text>
                <Text style={s.menuText}>{text as string}</Text>
              </View>
              <ChevronRight size={16} color="#617169" />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={s.logoutButton} activeOpacity={0.78} onPress={logout}>
          <LogOut size={18} color="#FF4D4D" />
          <Text style={s.logoutText}>Sign out</Text>
        </TouchableOpacity>

        <Text style={s.version}>Burner Point v1.0.0 - Private by design.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  content: { padding: 20, paddingBottom: 36 },
  kicker: { color: '#00FF9D', fontSize: 11, fontWeight: '900', letterSpacing: 2.4, textTransform: 'uppercase' },
  title: { color: '#FFFFFF', fontSize: 36, lineHeight: 36, fontWeight: '900', textTransform: 'uppercase', marginTop: 12 },
  identityCard: { marginTop: 24, flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 28, padding: 18, backgroundColor: '#07140F', borderWidth: 1, borderColor: '#123425' },
  avatar: { width: 56, height: 56, borderRadius: 20, backgroundColor: '#00FF9D12', borderWidth: 1, borderColor: '#00FF9D32', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#00FF9D', fontSize: 22, fontWeight: '900' },
  name: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  email: { color: '#728178', fontSize: 12, marginTop: 4 },
  sectionTitle: { color: '#5B6A61', fontSize: 11, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase', marginTop: 28, marginBottom: 12 },
  menu: { borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: '#123425', backgroundColor: '#07140F' },
  menuItem: { minHeight: 72, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: '#123425' },
  menuIcon: { width: 38, height: 38, borderRadius: 14, backgroundColor: '#00FF9D12', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  menuLabel: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  menuText: { color: '#6F8177', fontSize: 12, marginTop: 3 },
  logoutButton: { minHeight: 54, marginTop: 18, borderRadius: 18, backgroundColor: '#FF4D4D12', borderWidth: 1, borderColor: '#FF4D4D32', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  logoutText: { color: '#FF4D4D', fontSize: 13, fontWeight: '900', letterSpacing: 1.2, textTransform: 'uppercase' },
  version: { color: '#3E4A43', fontSize: 11, textAlign: 'center', marginTop: 22 },
});
