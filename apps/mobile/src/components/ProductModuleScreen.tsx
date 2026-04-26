import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { BRAND } from '../lib/brand';
import { triggerHaptic } from '../lib/native-ux';
import { MetricCard, NativeButton, NativeCard, SectionLabel } from './design-system';
import type { MobileModuleAction, MobileProductModule } from '../lib/product-modules';

const HIT_SLOP = { top: 8, right: 8, bottom: 8, left: 8 };

export function ProductModuleScreen({ module }: { module: MobileProductModule }) {
  const router = useRouter();

  const runAction = async (action: MobileModuleAction) => {
    triggerHaptic(action.href ? 'impact' : 'selection');
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
          <TouchableOpacity
            onPress={() => router.back()}
            style={s.backButton}
            activeOpacity={0.78}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={HIT_SLOP}
          >
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
            <NativeButton label={module.primaryAction.label} onPress={() => runAction(module.primaryAction)} icon={<ArrowRight size={16} color={BRAND.colors.black} />} />
            {module.secondaryAction ? (
              <NativeButton label={module.secondaryAction.label} onPress={() => runAction(module.secondaryAction!)} variant="secondary" />
            ) : null}
          </View>
        </View>

        <View style={s.statsRow}>
          {module.stats.map((stat) => (
            <MetricCard key={stat.label} label={stat.label} value={stat.value} />
          ))}
        </View>

        <SectionLabel>Product Controls</SectionLabel>
        <View style={s.cards}>
          {module.cards.map((card) => (
            <NativeCard key={card.title}>
              <Text style={s.cardMeta}>{card.meta}</Text>
              <Text style={s.cardTitle}>{card.title}</Text>
              <Text style={s.cardText}>{card.text}</Text>
            </NativeCard>
          ))}
        </View>

        <SectionLabel>Workflow</SectionLabel>
        <View style={s.cards}>
          <NativeCard>
            {module.workflow.map((step, index) => (
              <View key={step} style={s.workflowRow}>
                <Text style={s.stepNumber}>{index + 1}</Text>
                <Text style={s.stepText}>{step}</Text>
              </View>
            ))}
          </NativeCard>
        </View>

        <View style={s.cards}>
          <NativeCard>
            <Text style={s.noteLabel}>Good To Know</Text>
            <Text style={s.noteText}>{module.note}</Text>
          </NativeCard>
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
  statsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20 },
  cards: { paddingHorizontal: 20, gap: 10 },
  cardMeta: { color: BRAND.colors.cyberGreen, fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  cardTitle: { color: BRAND.colors.white, fontSize: 15, fontWeight: '900', marginTop: 8 },
  cardText: { color: BRAND.colors.metalStart, fontSize: 13, lineHeight: 20, marginTop: 6 },
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
  noteLabel: { color: BRAND.colors.cyberGreen, fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  noteText: { color: BRAND.colors.metalEnd, fontSize: 12, lineHeight: 20, marginTop: 8 },
});
