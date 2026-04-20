import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { Bell, ChevronRight, HelpCircle, Key, LogOut, ShieldCheck, SlidersHorizontal, User } from 'lucide-react-native';

import { clearApiSession } from '../../lib/auth';
import { BRAND } from '../../lib/brand';
import { WEB_APP_URL } from '../../lib/config';
import { BURNER_POINT_STACK } from '../../lib/stack';
import { triggerHaptic } from '../../lib/native-ux';

const settings = [
  { label: 'Profile', text: 'Name, email, phone, and account identity', Icon: User, href: '/profile' },
  { label: 'Security and 2FA', text: 'Email, phone, MFA, and active sessions', Icon: ShieldCheck, externalUrl: `${WEB_APP_URL}/dashboard/security` },
  { label: 'API keys', text: 'Developer access, keys, and webhooks', Icon: Key, href: '/developer' },
  { label: 'Notifications', text: 'OTP, rentals, billing, and alerts', Icon: Bell },
  { label: 'Preferences', text: 'Motion, region, privacy defaults', Icon: SlidersHorizontal },
  { label: 'Support', text: 'Tickets, email, and Telegram help channels', Icon: HelpCircle, href: '/support' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { user } = useUser();

  const logout = () => {
    triggerHaptic('warning');
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
            <Text style={s.email}>{user?.primaryEmailAddress?.emailAddress || 'Secure account session'}</Text>
          </View>
        </View>

        <Text style={s.sectionTitle}>Account</Text>
        <View style={s.menu}>
          {settings.map(({ label, text, Icon, href, externalUrl }) => (
            <TouchableOpacity
              key={label}
              style={s.menuItem}
              activeOpacity={0.78}
              onPress={() => {
                triggerHaptic('selection');
                return externalUrl ? Linking.openURL(externalUrl) : href ? router.push(href as any) : Alert.alert(label, text);
              }}
            >
              <View style={s.menuIcon}>
                <Icon size={17} color={BRAND.colors.cyberGreen} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.menuLabel}>{label}</Text>
                <Text style={s.menuText}>{text}</Text>
              </View>
              <ChevronRight size={16} color={BRAND.colors.muted} />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.sectionTitle}>Stack</Text>
        <View style={s.stackGrid}>
          {BURNER_POINT_STACK.map((item) => (
            <View key={item.label} style={s.stackItem}>
              <Text style={s.stackLabel}>{item.label}</Text>
              <Text style={s.stackValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={s.logoutButton} activeOpacity={0.78} onPress={logout}>
          <LogOut size={18} color={BRAND.colors.danger} />
          <Text style={s.logoutText}>Sign out</Text>
        </TouchableOpacity>

        <Text style={s.version}>Burner Point v1.0.0 - Private By Design.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND.colors.black },
  content: { padding: 20, paddingBottom: 36 },
  kicker: { color: BRAND.colors.cyberGreen, fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  title: { color: BRAND.colors.white, fontSize: 36, lineHeight: 36, fontWeight: '900', textTransform: 'uppercase', marginTop: 12 },
  identityCard: { marginTop: 24, flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: BRAND.radii.lg, padding: 18, backgroundColor: BRAND.colors.surface, borderWidth: 1, borderColor: BRAND.colors.border },
  avatar: { width: 56, height: 56, borderRadius: BRAND.radii.lg, backgroundColor: `${BRAND.colors.cyberGreen}12`, borderWidth: 1, borderColor: `${BRAND.colors.cyberGreen}32`, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: BRAND.colors.cyberGreen, fontSize: 22, fontWeight: '900' },
  name: { color: BRAND.colors.white, fontSize: 16, fontWeight: '900' },
  email: { color: BRAND.colors.metalStart, fontSize: 12, marginTop: 4 },
  sectionTitle: { color: BRAND.colors.muted, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', marginTop: 28, marginBottom: 12 },
  menu: { borderRadius: BRAND.radii.lg, overflow: 'hidden', borderWidth: 1, borderColor: BRAND.colors.border, backgroundColor: BRAND.colors.surface },
  menuItem: { minHeight: 72, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: BRAND.colors.border },
  menuIcon: { width: 38, height: 38, borderRadius: BRAND.radii.md, backgroundColor: `${BRAND.colors.cyberGreen}12`, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  menuLabel: { color: BRAND.colors.white, fontSize: 14, fontWeight: '900' },
  menuText: { color: BRAND.colors.muted, fontSize: 12, marginTop: 3 },
  stackGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stackItem: { width: '47.8%', minHeight: 82, borderRadius: BRAND.radii.lg, borderWidth: 1, borderColor: BRAND.colors.border, backgroundColor: BRAND.colors.surface, padding: 12 },
  stackLabel: { color: BRAND.colors.cyberGreen, fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  stackValue: { color: BRAND.colors.metalEnd, fontSize: 12, lineHeight: 18, marginTop: 8, fontWeight: '700' },
  logoutButton: { minHeight: 54, marginTop: 18, borderRadius: BRAND.radii.sm, backgroundColor: `${BRAND.colors.danger}12`, borderWidth: 1, borderColor: `${BRAND.colors.danger}32`, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  logoutText: { color: BRAND.colors.danger, fontSize: 13, fontWeight: '900', textTransform: 'uppercase' },
  version: { color: BRAND.colors.muted, fontSize: 11, textAlign: 'center', marginTop: 22 },
});
