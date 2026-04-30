import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Check, MessageSquare, Phone, ShieldCheck, Smartphone } from 'lucide-react-native';

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
    title: 'Private Communication',
    text: 'Keep calls, voicemail, SMS, MMS, and secure audio, photo and video sharing separated from your personal number.',
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
      <View style={s.content}>
        <View style={s.header}>
          <View style={s.logoMark}>
            <ShieldCheck size={24} color={BRAND.colors.black} />
          </View>
          <Text style={s.kicker}>Burner Point</Text>
          <Text style={s.tagline}>Private by design. Connected by choice.</Text>
        </View>

        <Text accessibilityRole="header" style={s.title}>Get started</Text>
        <Text style={s.subtitle}>Choose your path into private numbers, verification, rentals, eSIM, proxy access, billing, and support.</Text>

        <View style={s.pillars}>
          {pillars.map(({ icon: Icon, title, text }) => (
            <View key={title} style={s.pillarCard}>
              <View style={s.pillarIcon}>
                <Icon size={18} color={BRAND.colors.cyberGreen} />
              </View>
              <View style={s.pillarCopy}>
                <Text style={s.pillarTitle}>{title}</Text>
                <Text style={s.pillarText}>{text}</Text>
              </View>
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
          <Text style={s.primaryText}>Get Started</Text>
        </TouchableOpacity>
        <View style={s.actionRow}>
          <TouchableOpacity
            style={s.secondaryButton}
            activeOpacity={0.78}
            onPress={goToSignup}
            accessibilityRole="button"
            accessibilityLabel="Create Account"
            hitSlop={HIT_SLOP}
          >
            <Text style={s.secondaryText}>Create Account</Text>
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
        </View>

        <View style={s.trustRow}>
          {['Secure', 'Private', 'Fast'].map((item) => (
            <View key={item} style={s.trustPill}>
              <Check size={12} color={BRAND.colors.cyberGreen} />
              <Text style={s.trustText}>{item}</Text>
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BRAND.colors.black },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 18, paddingVertical: 10 },
  header: { alignItems: 'center', marginBottom: 18 },
  logoMark: {
    width: 48,
    height: 48,
    borderRadius: BRAND.radii.lg,
    backgroundColor: BRAND.colors.cyberGreen,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BRAND.colors.cyberGreen,
    shadowOpacity: 0.3,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
  },
  kicker: { color: BRAND.colors.white, fontSize: 18, fontWeight: '900', textTransform: 'uppercase', marginTop: 10 },
  tagline: { color: BRAND.colors.cyberGreen, fontSize: 12, fontWeight: '700', marginTop: 3, textAlign: 'center' },
  title: { color: BRAND.colors.white, fontSize: 30, lineHeight: 32, fontWeight: '900', textAlign: 'center' },
  subtitle: { color: BRAND.colors.metalStart, fontSize: 13, lineHeight: 19, marginTop: 8, textAlign: 'center' },
  trustRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  trustPill: {
    minHeight: 32,
    flex: 1,
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
  pillars: { gap: 8, marginTop: 16 },
  pillarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: BRAND.radii.md,
    borderWidth: 1,
    borderColor: BRAND.colors.border,
    backgroundColor: BRAND.colors.dark,
    padding: 12,
  },
  pillarIcon: {
    width: 38,
    height: 38,
    borderRadius: BRAND.radii.md,
    backgroundColor: `${BRAND.colors.cyberGreen}12`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillarCopy: { flex: 1 },
  pillarTitle: { color: BRAND.colors.white, fontSize: 14, fontWeight: '900' },
  pillarText: { color: BRAND.colors.metalStart, fontSize: 11, lineHeight: 16, marginTop: 3 },
  primaryButton: {
    minHeight: 48,
    borderRadius: BRAND.radii.sm,
    backgroundColor: BRAND.colors.cyberGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  primaryText: { color: BRAND.colors.black, fontSize: 14, fontWeight: '900', textTransform: 'uppercase' },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  secondaryButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: BRAND.radii.sm,
    borderWidth: 1,
    borderColor: BRAND.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: { color: BRAND.colors.white, fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
});
