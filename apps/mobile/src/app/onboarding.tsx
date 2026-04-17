import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Check, Lock, MessageSquare, Phone, ShieldCheck, Smartphone } from 'lucide-react-native';

import { BRAND } from '../lib/brand';
import { triggerHaptic } from '../lib/native-ux';

const pillars = [
  {
    icon: Phone,
    title: 'Real Number Access',
    text: 'Use secure numbers for OTP, voice verification, rentals, recovery, and US/Canada conversation workflows.',
  },
  {
    icon: MessageSquare,
    title: 'Private Conversations',
    text: 'Keep calls, voicemail, SMS, MMS, and photo messages separated from your personal number.',
  },
  {
    icon: Smartphone,
    title: 'Connectivity Stack',
    text: 'Manage eSIM data, proxy routing, and in-platform VPN protection from one dark-mode account.',
  },
];

const HIT_SLOP = { top: 8, right: 8, bottom: 8, left: 8 };

export default function OnboardingScreen() {
  const goToSignup = () => {
    triggerHaptic('impact');
    router.push('/auth/register' as any);
  };

  const goToLogin = () => {
    triggerHaptic('selection');
    router.push('/auth/login' as any);
  };

  return (
    <SafeAreaView style={s.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
        <View style={s.logoMark}>
          <ShieldCheck size={30} color={BRAND.colors.black} />
        </View>

        <Text style={s.kicker}>Burner Point</Text>
        <Text accessibilityRole="header" style={s.title}>Private by Design. Stay Anonymous. Stay Connected.</Text>
        <Text style={s.subtitle}>
          A native privacy telecom control surface for numbers, verification, conversation, connectivity, billing, support, and account security.
        </Text>

        <View style={s.trustRow}>
          {['Safe area aware', 'Push alerts', 'Dark mode'].map((item) => (
            <View key={item} style={s.trustPill}>
              <Check size={12} color={BRAND.colors.cyberGreen} />
              <Text style={s.trustText}>{item}</Text>
            </View>
          ))}
        </View>

        <View style={s.stackCard}>
          <View style={s.stackTop}>
            <Lock size={18} color={BRAND.colors.cyberGreen} />
            <Text style={s.stackLabel}>Native app structure</Text>
          </View>
          <Text style={s.stackTitle}>Dashboard, Inbox, Verify, Numbers, Profile.</Text>
          <Text style={s.stackText}>
            Core flows are one tap away from the bottom tab bar. Secondary modules stay reachable inside the app without crowding the primary navigation.
          </Text>
        </View>

        <View style={s.pillars}>
          {pillars.map(({ icon: Icon, title, text }) => (
            <View key={title} style={s.pillarCard}>
              <View style={s.pillarIcon}>
                <Icon size={20} color={BRAND.colors.cyberGreen} />
              </View>
              <Text style={s.pillarTitle}>{title}</Text>
              <Text style={s.pillarText}>{text}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={s.primaryButton}
          activeOpacity={0.84}
          onPress={goToSignup}
          accessibilityRole="button"
          accessibilityLabel="Create Account"
          hitSlop={HIT_SLOP}
        >
          <Text style={s.primaryText}>Create Account</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={s.secondaryButton}
          activeOpacity={0.78}
          onPress={goToLogin}
          accessibilityRole="button"
          accessibilityLabel="Sign In"
          hitSlop={HIT_SLOP}
        >
          <Text style={s.secondaryText}>Sign In</Text>
        </TouchableOpacity>

        <Text style={s.footer}>No standalone VPN. No exposed provider secrets. Burner Point routes sensitive service work through the backend.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BRAND.colors.black },
  content: { paddingHorizontal: 22, paddingBottom: 42, paddingTop: 18 },
  logoMark: {
    width: 66,
    height: 66,
    borderRadius: BRAND.radii.lg,
    backgroundColor: BRAND.colors.cyberGreen,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BRAND.colors.cyberGreen,
    shadowOpacity: 0.3,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
  },
  kicker: { color: BRAND.colors.cyberGreen, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', marginTop: 24 },
  title: { color: BRAND.colors.white, fontSize: 38, lineHeight: 39, fontWeight: '900', textTransform: 'uppercase', marginTop: 10 },
  subtitle: { color: BRAND.colors.metalStart, fontSize: 15, lineHeight: 24, marginTop: 14 },
  trustRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 22 },
  trustPill: {
    minHeight: 36,
    borderRadius: BRAND.radii.sm,
    borderWidth: 1,
    borderColor: `${BRAND.colors.cyberGreen}26`,
    backgroundColor: `${BRAND.colors.cyberGreen}0D`,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
  },
  trustText: { color: BRAND.colors.cyberGreen, fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  stackCard: {
    marginTop: 26,
    borderRadius: BRAND.radii.lg,
    borderWidth: 1,
    borderColor: BRAND.colors.border,
    backgroundColor: BRAND.colors.surface,
    padding: 18,
  },
  stackTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stackLabel: { color: BRAND.colors.cyberGreen, fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  stackTitle: { color: BRAND.colors.white, fontSize: 21, lineHeight: 25, fontWeight: '900', textTransform: 'uppercase', marginTop: 18 },
  stackText: { color: BRAND.colors.metalStart, fontSize: 13, lineHeight: 21, marginTop: 8 },
  pillars: { gap: 10, marginTop: 14 },
  pillarCard: {
    borderRadius: BRAND.radii.lg,
    borderWidth: 1,
    borderColor: BRAND.colors.border,
    backgroundColor: BRAND.colors.dark,
    padding: 16,
  },
  pillarIcon: {
    width: 42,
    height: 42,
    borderRadius: BRAND.radii.md,
    backgroundColor: `${BRAND.colors.cyberGreen}12`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillarTitle: { color: BRAND.colors.white, fontSize: 15, fontWeight: '900', marginTop: 14 },
  pillarText: { color: BRAND.colors.metalStart, fontSize: 12, lineHeight: 19, marginTop: 5 },
  primaryButton: {
    minHeight: 54,
    borderRadius: BRAND.radii.sm,
    backgroundColor: BRAND.colors.cyberGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  primaryText: { color: BRAND.colors.black, fontSize: 14, fontWeight: '900', textTransform: 'uppercase' },
  secondaryButton: {
    minHeight: 52,
    borderRadius: BRAND.radii.sm,
    borderWidth: 1,
    borderColor: BRAND.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  secondaryText: { color: BRAND.colors.white, fontSize: 13, fontWeight: '900', textTransform: 'uppercase' },
  footer: { color: BRAND.colors.muted, fontSize: 11, lineHeight: 18, textAlign: 'center', marginTop: 22 },
});
