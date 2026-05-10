import { View, Text, StyleSheet } from 'react-native';
import { ArrowRight, RefreshCw, ShieldCheck } from 'lucide-react-native';

import { BRAND } from '../lib/brand';
import { NativeButton, NativeCard, NativeCheckItem } from './design-system';

export function EntitlementGate({
  eyebrow,
  title,
  text,
  bullets,
  primaryLabel,
  onPrimaryPress,
  secondaryLabel = 'Restore Purchases',
  onSecondaryPress,
  tertiaryLabel = 'Refresh Access',
  onTertiaryPress,
  disabled,
}: {
  eyebrow: string;
  title: string;
  text: string;
  bullets: string[];
  primaryLabel: string;
  onPrimaryPress: () => void;
  secondaryLabel?: string;
  onSecondaryPress?: () => void;
  tertiaryLabel?: string;
  onTertiaryPress?: () => void;
  disabled?: boolean;
}) {
  return (
    <NativeCard elevated>
      <View style={s.top}>
        <Text style={s.eyebrow}>{eyebrow}</Text>
        <View style={s.iconBox}>
          <ShieldCheck size={18} color={BRAND.colors.cyberGreen} />
        </View>
      </View>
      <Text style={s.title}>{title}</Text>
      <Text style={s.text}>{text}</Text>
      <View style={s.bullets}>
        {bullets.map((bullet) => (
          <NativeCheckItem key={bullet} text={bullet} />
        ))}
      </View>
      <View style={s.actions}>
        <NativeButton
          label={primaryLabel}
          onPress={onPrimaryPress}
          disabled={disabled}
          icon={<ArrowRight size={16} color={BRAND.colors.black} />}
        />
        {onSecondaryPress ? (
          <NativeButton
            label={secondaryLabel}
            onPress={onSecondaryPress}
            variant="secondary"
            disabled={disabled}
          />
        ) : null}
        {onTertiaryPress ? (
          <NativeButton
            label={tertiaryLabel}
            onPress={onTertiaryPress}
            variant="ghost"
            disabled={disabled}
            icon={<RefreshCw size={14} color={BRAND.colors.cyberGreen} />}
          />
        ) : null}
      </View>
    </NativeCard>
  );
}

const s = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyebrow: { color: BRAND.colors.cyberGreen, fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: BRAND.radii.md,
    borderWidth: 1,
    borderColor: `${BRAND.colors.cyberGreen}28`,
    backgroundColor: `${BRAND.colors.cyberGreen}10`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: BRAND.colors.white, fontSize: 20, lineHeight: 24, fontWeight: '900', textTransform: 'uppercase', marginTop: 18 },
  text: { color: BRAND.colors.metalStart, fontSize: 13, lineHeight: 21, marginTop: 10 },
  bullets: { gap: 10, marginTop: 16 },
  actions: { gap: 10, marginTop: 18 },
});
