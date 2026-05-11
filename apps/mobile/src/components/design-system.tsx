import type { ComponentType, ReactNode } from 'react';
import {
  ActivityIndicator,
  Linking,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from 'react-native';
import type { ColorValue } from 'react-native';
import { AlertTriangle, Check, ChevronRight, Mail, ShieldCheck } from 'lucide-react-native';

import { BRAND } from '../lib/brand';
import { triggerHaptic } from '../lib/native-ux';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

const HIT_SLOP = { top: 8, right: 8, bottom: 8, left: 8 };

export function NativeButton({
  label,
  onPress,
  href,
  variant = 'primary',
  disabled,
  icon,
}: {
  label: string;
  onPress?: () => void;
  href?: string;
  variant?: ButtonVariant;
  disabled?: boolean;
  icon?: ReactNode;
}) {
  const press = async () => {
    triggerHaptic(variant === 'primary' ? 'impact' : 'selection');
    if (href) {
      await Linking.openURL(href);
      return;
    }
    onPress?.();
  };

  return (
    <TouchableOpacity
      onPress={press}
      disabled={disabled}
      activeOpacity={0.82}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      hitSlop={HIT_SLOP}
      style={[s.buttonBase, s[`${variant}Button`], disabled && s.disabled]}
    >
      <Text style={[s.buttonText, s[`${variant}ButtonText`]]}>{label}</Text>
      {icon}
    </TouchableOpacity>
  );
}

export function NativeCard({
  children,
  elevated,
}: {
  children: ReactNode;
  elevated?: boolean;
}) {
  return <View style={[s.card, elevated && BRAND.shadows.card]}>{children}</View>;
}

export function NativeInput(props: TextInputProps & { label?: string }) {
  const { label, style, ...inputProps } = props;
  return (
    <View style={s.inputWrap}>
      {label ? <Text style={s.inputLabel}>{label}</Text> : null}
      <TextInput placeholderTextColor={BRAND.colors.muted} style={[s.input, style]} {...inputProps} />
    </View>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <Text accessibilityRole="header" style={s.sectionLabel}>{children}</Text>;
}

export function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.metricCard} accessible accessibilityLabel={`${label}: ${value}`}>
      <Text style={s.metricValue}>{value}</Text>
      <Text style={s.metricLabel}>{label}</Text>
    </View>
  );
}

export function TrustBadge({ label }: { label: string }) {
  return (
    <View style={s.trustBadge}>
      <ShieldCheck size={BRAND.iconSizes.xs} color={BRAND.colors.cyberGreen} />
      <Text style={s.trustText}>{label}</Text>
    </View>
  );
}

export function NativeAccordionRow({
  title,
  text,
  open,
  onPress,
}: {
  title: string;
  text: string;
  open?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.78}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={open ? 'Collapse this section' : 'Expand this section'}
      accessibilityState={{ expanded: !!open }}
      hitSlop={HIT_SLOP}
      onPress={() => {
        triggerHaptic('selection');
        onPress();
      }}
      style={s.accordion}
    >
      <View style={s.accordionTop}>
        <Text style={s.accordionTitle}>{title}</Text>
        <ChevronRight size={BRAND.iconSizes.sm} color={BRAND.colors.cyberGreen} style={{ transform: [{ rotate: open ? '90deg' : '0deg' }] }} />
      </View>
      {open ? <Text style={s.accordionText}>{text}</Text> : null}
    </TouchableOpacity>
  );
}

export function NativeTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: string[];
  active: string;
  onChange: (tab: string) => void;
}) {
  return (
    <View style={s.tabs}>
      {tabs.map((tab) => {
        const isActive = tab === active;
        return (
          <TouchableOpacity
            key={tab}
            activeOpacity={0.78}
            accessibilityRole="button"
            accessibilityLabel={tab}
            accessibilityState={{ selected: isActive }}
            hitSlop={HIT_SLOP}
            onPress={() => {
              triggerHaptic('selection');
              onChange(tab);
            }}
            style={[s.tab, isActive && s.tabActive]}
          >
            <Text style={[s.tabText, isActive && s.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function NativeFeatureCard({
  icon: Icon = ShieldCheck,
  title,
  text,
  meta,
}: {
  icon?: ComponentType<{ size?: number | string; color?: ColorValue }>;
  title: string;
  text: string;
  meta?: string;
}) {
  return (
    <NativeCard>
      <View style={s.featureTop}>
        <View style={s.featureIcon}>
          <Icon size={BRAND.iconSizes.md} color={BRAND.colors.cyberGreen} />
        </View>
        {meta ? <Text style={s.featureMeta}>{meta}</Text> : null}
      </View>
      <Text style={s.featureTitle}>{title}</Text>
      <Text style={s.featureText}>{text}</Text>
    </NativeCard>
  );
}

export function NativeSupportWidget() {
  return (
    <NativeCard>
      <Text style={s.widgetKicker}>Support</Text>
      <Text style={s.widgetTitle}>Privacy-safe help.</Text>
      <Text style={s.widgetText}>Use scoped references for verification, rentals, billing, eSIM, proxies, secure tunnel, or account issues.</Text>
      <View style={s.widgetActions}>
        <NativeButton label="Email" href="mailto:info@burnerpoint.com" variant="secondary" icon={<Mail size={BRAND.iconSizes.sm} color={BRAND.colors.white} />} />
        <NativeButton label="Telegram" href="https://t.me/burnerpoint" variant="ghost" />
      </View>
    </NativeCard>
  );
}

export function EmptyState({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <View style={s.state}>
      <ShieldCheck size={BRAND.iconSizes.xl} color={BRAND.colors.cyberGreen} />
      <Text style={s.stateTitle}>{title}</Text>
      <Text style={s.stateText}>{text}</Text>
    </View>
  );
}

export function LoadingState({ label = 'Loading secure state...' }: { label?: string }) {
  return (
    <View style={s.state} accessibilityRole="progressbar" accessibilityLabel={label}>
      <ActivityIndicator color={BRAND.colors.cyberGreen} />
      <Text style={s.stateText}>{label}</Text>
    </View>
  );
}

export function ErrorState({
  title = 'Something needs attention',
  text,
}: {
  title?: string;
  text: string;
}) {
  return (
    <View style={[s.state, s.errorState]} accessibilityRole="alert">
      <AlertTriangle size={BRAND.iconSizes.xl} color={BRAND.colors.danger} />
      <Text style={s.stateTitle}>{title}</Text>
      <Text style={s.stateText}>{text}</Text>
    </View>
  );
}

export function NativeModalShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={s.modalShell}>
      <Text style={s.widgetKicker}>Modal</Text>
      <Text style={s.widgetTitle}>{title}</Text>
      <View style={{ marginTop: BRAND.spacing[4] }}>{children}</View>
    </View>
  );
}

export function NativeCheckItem({ text }: { text: string }) {
  return (
    <View style={s.checkItem}>
      <Check size={BRAND.iconSizes.xs} color={BRAND.colors.cyberGreen} />
      <Text style={s.checkText}>{text}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  buttonBase: {
    minHeight: 50,
    borderRadius: BRAND.radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: BRAND.spacing[2],
    paddingHorizontal: BRAND.spacing[5],
  },
  primaryButton: { backgroundColor: BRAND.colors.cyberGreen, ...BRAND.shadows.glow },
  secondaryButton: { borderWidth: 1, borderColor: BRAND.colors.border, backgroundColor: BRAND.colors.black },
  ghostButton: { backgroundColor: 'transparent' },
  disabled: { opacity: 0.52 },
  buttonText: { fontSize: 13, fontWeight: '900', textTransform: 'uppercase' },
  primaryButtonText: { color: BRAND.colors.black },
  secondaryButtonText: { color: BRAND.colors.white },
  ghostButtonText: { color: BRAND.colors.cyberGreen },
  card: {
    borderRadius: BRAND.radii.lg,
    borderWidth: 1,
    borderColor: BRAND.colors.border,
    backgroundColor: BRAND.colors.surface,
    padding: BRAND.spacing[5],
  },
  inputWrap: { gap: BRAND.spacing[2] },
  inputLabel: { color: BRAND.colors.metalStart, fontSize: 12, fontWeight: '800' },
  input: {
    minHeight: 52,
    borderRadius: BRAND.radii.md,
    borderWidth: 1,
    borderColor: BRAND.colors.border,
    backgroundColor: BRAND.colors.black,
    paddingHorizontal: BRAND.spacing[4],
    color: BRAND.colors.white,
    fontSize: 15,
  },
  sectionLabel: {
    color: BRAND.colors.muted,
    fontSize: 10,
    fontWeight: '900',
    marginHorizontal: BRAND.spacing[5],
    marginTop: BRAND.spacing[5],
    marginBottom: BRAND.spacing[3],
    textTransform: 'uppercase',
  },
  metricCard: {
    flex: 1,
    borderRadius: BRAND.radii.md,
    borderWidth: 1,
    borderColor: BRAND.colors.border,
    backgroundColor: BRAND.colors.dark,
    padding: BRAND.spacing[3],
  },
  metricValue: { color: BRAND.colors.cyberGreen, fontFamily: BRAND.typography.mono, fontSize: 18, fontWeight: '900' },
  metricLabel: { color: BRAND.colors.muted, fontSize: 9, fontWeight: '900', marginTop: 5, textTransform: 'uppercase' },
  trustBadge: {
    minHeight: 34,
    borderRadius: BRAND.radii.sm,
    borderWidth: 1,
    borderColor: `${BRAND.colors.cyberGreen}24`,
    backgroundColor: `${BRAND.colors.cyberGreen}0D`,
    flexDirection: 'row',
    alignItems: 'center',
    gap: BRAND.spacing[2],
    paddingHorizontal: BRAND.spacing[3],
  },
  trustText: { color: BRAND.colors.cyberGreen, fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  accordion: {
    borderRadius: BRAND.radii.lg,
    borderWidth: 1,
    borderColor: BRAND.colors.border,
    backgroundColor: BRAND.colors.surface,
    padding: BRAND.spacing[4],
  },
  accordionTop: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: BRAND.spacing[3] },
  accordionTitle: { flex: 1, color: BRAND.colors.white, fontSize: 14, fontWeight: '900', textTransform: 'uppercase' },
  accordionText: { color: BRAND.colors.metalStart, fontSize: 13, lineHeight: 21, marginTop: BRAND.spacing[3] },
  tabs: {
    flexDirection: 'row',
    gap: BRAND.spacing[2],
    borderWidth: 1,
    borderColor: BRAND.colors.border,
    borderRadius: BRAND.radii.lg,
    padding: BRAND.spacing[2],
    backgroundColor: BRAND.colors.black,
  },
  tab: { minHeight: 40, borderRadius: BRAND.radii.sm, alignItems: 'center', justifyContent: 'center', paddingHorizontal: BRAND.spacing[3] },
  tabActive: { backgroundColor: `${BRAND.colors.cyberGreen}12` },
  tabText: { color: BRAND.colors.muted, fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  tabTextActive: { color: BRAND.colors.cyberGreen },
  featureTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: BRAND.spacing[3] },
  featureIcon: {
    width: 42,
    height: 42,
    borderRadius: BRAND.radii.md,
    backgroundColor: `${BRAND.colors.cyberGreen}12`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureMeta: { color: BRAND.colors.cyberGreen, fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  featureTitle: { color: BRAND.colors.white, fontSize: 15, fontWeight: '900', marginTop: BRAND.spacing[4] },
  featureText: { color: BRAND.colors.metalStart, fontSize: 13, lineHeight: 20, marginTop: BRAND.spacing[2] },
  widgetKicker: { color: BRAND.colors.cyberGreen, fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  widgetTitle: { color: BRAND.colors.white, fontSize: 18, fontWeight: '900', marginTop: BRAND.spacing[2], textTransform: 'uppercase' },
  widgetText: { color: BRAND.colors.metalStart, fontSize: 12, lineHeight: 20, marginTop: BRAND.spacing[2] },
  widgetActions: { gap: BRAND.spacing[2], marginTop: BRAND.spacing[4] },
  state: {
    minHeight: 210,
    borderRadius: BRAND.radii.lg,
    borderWidth: 1,
    borderColor: BRAND.colors.border,
    backgroundColor: BRAND.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: BRAND.spacing[8],
  },
  errorState: { borderColor: `${BRAND.colors.danger}30`, backgroundColor: `${BRAND.colors.danger}08` },
  stateTitle: { color: BRAND.colors.white, fontSize: 16, fontWeight: '900', textTransform: 'uppercase', marginTop: BRAND.spacing[4] },
  stateText: { color: BRAND.colors.metalStart, fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: BRAND.spacing[2] },
  modalShell: {
    borderRadius: BRAND.radii.lg,
    borderWidth: 1,
    borderColor: BRAND.colors.border,
    backgroundColor: BRAND.colors.surface,
    padding: BRAND.spacing[5],
    ...BRAND.shadows.card,
  },
  checkItem: { flexDirection: 'row', alignItems: 'flex-start', gap: BRAND.spacing[2] },
  checkText: { flex: 1, color: BRAND.colors.metalStart, fontSize: 13, lineHeight: 20 },
});
