import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { BRAND } from '../lib/brand';
import type { MobileModuleAction, MobileProductModule } from '../lib/product-modules';

export function ProductModuleScreen({ module }: { module: MobileProductModule }) {
  const router = useRouter();

  const runAction = async (action: MobileModuleAction) => {
    if (!action.href) {
      Alert.alert(action.label, action.message ?? module.status);
      return;
    }
    if (action.href.startsWith('http') || action.href.startsWith('mailto:')) {
      await Linking.openURL(action.href);
      return;
    }
    router.push(action.href as any);
  };

  return (
    <SafeAreaView style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
        <View style={s.topbar}>
          <TouchableOpacity onPress={() => router.back()} style={s.backButton} activeOpacity={0.78}>
            <ArrowLeft size={18} color={BRAND.colors.white} />
          </TouchableOpacity>
          <Text style={s.topbarTitle}>Burner Point</Text>
        </View>

        <View style={s.hero}>
          <View style={s.heroTop}>
            <Text style={s.eyebrow}>{module.eyebrow}</Text>
            <View style={s.statusIcon}>
              <ShieldCheck size={18} color={BRAND.colors.cyberGreen} />
            </View>
          </View>
          <Text style={s.title}>{module.title}</Text>
          <Text style={s.description}>{module.description}</Text>
          <Text style={s.status}>{module.status}</Text>

          <View style={s.actions}>
            <TouchableOpacity style={s.primaryButton} onPress={() => runAction(module.primaryAction)} activeOpacity={0.82}>
              <Text style={s.primaryText}>{module.primaryAction.label}</Text>
              <ArrowRight size={16} color={BRAND.colors.black} />
            </TouchableOpacity>
            {module.secondaryAction ? (
              <TouchableOpacity style={s.secondaryButton} onPress={() => runAction(module.secondaryAction!)} activeOpacity={0.78}>
                <Text style={s.secondaryText}>{module.secondaryAction.label}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <View style={s.statsRow}>
          {module.stats.map((stat) => (
            <View key={stat.label} style={s.statCard}>
              <Text style={s.statValue}>{stat.value}</Text>
              <Text style={s.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <Text style={s.sectionLabel}>Module Controls</Text>
        <View style={s.cards}>
          {module.cards.map((card) => (
            <View key={card.title} style={s.card}>
              <Text style={s.cardMeta}>{card.meta}</Text>
              <Text style={s.cardTitle}>{card.title}</Text>
              <Text style={s.cardText}>{card.text}</Text>
            </View>
          ))}
        </View>

        <Text style={s.sectionLabel}>Workflow</Text>
        <View style={s.workflow}>
          {module.workflow.map((step, index) => (
            <View key={step} style={s.workflowRow}>
              <Text style={s.stepNumber}>{index + 1}</Text>
              <Text style={s.stepText}>{step}</Text>
            </View>
          ))}
        </View>

        <View style={s.note}>
          <Text style={s.noteLabel}>Security Note</Text>
          <Text style={s.noteText}>{module.note}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND.colors.black },
  content: { paddingBottom: 28 },
  topbar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 8 },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: BRAND.radii.md,
    borderWidth: 1,
    borderColor: BRAND.colors.border,
    backgroundColor: BRAND.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topbarTitle: { color: BRAND.colors.metalEnd, fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  hero: {
    margin: 20,
    padding: 20,
    borderRadius: BRAND.radii.lg,
    borderWidth: 1,
    borderColor: BRAND.colors.border,
    backgroundColor: BRAND.colors.surface,
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyebrow: { color: BRAND.colors.cyberGreen, fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: BRAND.radii.md,
    borderWidth: 1,
    borderColor: `${BRAND.colors.cyberGreen}30`,
    backgroundColor: `${BRAND.colors.cyberGreen}10`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: BRAND.colors.white, fontSize: 27, lineHeight: 31, fontWeight: '900', textTransform: 'uppercase', marginTop: 22 },
  description: { color: BRAND.colors.metalStart, fontSize: 14, lineHeight: 22, marginTop: 12 },
  status: { color: BRAND.colors.cyberGreen, fontSize: 12, fontWeight: '800', marginTop: 14 },
  actions: { gap: 10, marginTop: 20 },
  primaryButton: {
    minHeight: 50,
    borderRadius: BRAND.radii.sm,
    backgroundColor: BRAND.colors.cyberGreen,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryText: { color: BRAND.colors.black, fontSize: 13, fontWeight: '900', textTransform: 'uppercase' },
  secondaryButton: {
    minHeight: 48,
    borderRadius: BRAND.radii.sm,
    borderWidth: 1,
    borderColor: BRAND.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: { color: BRAND.colors.white, fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  statsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20 },
  statCard: {
    flex: 1,
    borderRadius: BRAND.radii.md,
    borderWidth: 1,
    borderColor: BRAND.colors.border,
    backgroundColor: BRAND.colors.dark,
    padding: 12,
  },
  statValue: { color: BRAND.colors.cyberGreen, fontFamily: BRAND.typography.mono, fontSize: 18, fontWeight: '900' },
  statLabel: { color: BRAND.colors.muted, fontSize: 9, fontWeight: '900', marginTop: 5, textTransform: 'uppercase' },
  sectionLabel: { color: BRAND.colors.muted, fontSize: 10, fontWeight: '900', marginHorizontal: 20, marginTop: 20, marginBottom: 10, textTransform: 'uppercase' },
  cards: { paddingHorizontal: 20, gap: 10 },
  card: {
    borderRadius: BRAND.radii.lg,
    borderWidth: 1,
    borderColor: BRAND.colors.border,
    backgroundColor: BRAND.colors.surface,
    padding: 16,
  },
  cardMeta: { color: BRAND.colors.cyberGreen, fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  cardTitle: { color: BRAND.colors.white, fontSize: 15, fontWeight: '900', marginTop: 8 },
  cardText: { color: BRAND.colors.metalStart, fontSize: 13, lineHeight: 20, marginTop: 6 },
  workflow: { marginHorizontal: 20, borderRadius: BRAND.radii.lg, borderWidth: 1, borderColor: BRAND.colors.border, backgroundColor: BRAND.colors.surface, padding: 14, gap: 12 },
  workflowRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: BRAND.radii.sm,
    backgroundColor: `${BRAND.colors.cyberGreen}10`,
    borderWidth: 1,
    borderColor: `${BRAND.colors.cyberGreen}25`,
    color: BRAND.colors.cyberGreen,
    textAlign: 'center',
    lineHeight: 26,
    fontFamily: BRAND.typography.mono,
    fontWeight: '900',
  },
  stepText: { flex: 1, color: BRAND.colors.white, fontSize: 13, lineHeight: 20 },
  note: {
    margin: 20,
    padding: 16,
    borderRadius: BRAND.radii.lg,
    borderWidth: 1,
    borderColor: `${BRAND.colors.cyberGreen}25`,
    backgroundColor: `${BRAND.colors.cyberGreen}08`,
  },
  noteLabel: { color: BRAND.colors.cyberGreen, fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  noteText: { color: BRAND.colors.metalEnd, fontSize: 12, lineHeight: 20, marginTop: 8 },
});
