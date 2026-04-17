import { Platform, Vibration } from 'react-native';

type HapticKind = 'selection' | 'impact' | 'success' | 'warning';

const PATTERNS: Record<HapticKind, number | number[]> = {
  selection: Platform.OS === 'ios' ? 8 : 12,
  impact: Platform.OS === 'ios' ? 12 : 18,
  success: Platform.OS === 'ios' ? [0, 12, 36, 12] : [0, 18, 45, 18],
  warning: Platform.OS === 'ios' ? [0, 18, 55, 18] : [0, 24, 60, 24],
};

export function triggerHaptic(kind: HapticKind = 'selection') {
  Vibration.vibrate(PATTERNS[kind]);
}

export function withHaptic<T extends (...args: any[]) => any>(callback: T, kind: HapticKind = 'selection') {
  return (...args: Parameters<T>): ReturnType<T> => {
    triggerHaptic(kind);
    return callback(...args);
  };
}
