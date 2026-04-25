import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Phone } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';

import { BRAND } from '../lib/brand';

type ProviderName = 'Google' | 'Apple' | 'Microsoft' | 'Phone';

export function AuthProviderButton({
  provider,
  onPress,
  disabled = false,
}: {
  provider: ProviderName;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.82}
      disabled={disabled}
      onPress={onPress}
      style={[styles.button, disabled && styles.buttonDisabled]}
      accessibilityRole="button"
      accessibilityLabel={`Continue with ${provider}`}
    >
      <ProviderLogo provider={provider} />
      <Text style={styles.providerLabel}>{provider}</Text>
    </TouchableOpacity>
  );
}

function ProviderLogo({ provider }: { provider: ProviderName }) {
  if (provider === 'Phone') {
    return <Phone size={18} color={BRAND.colors.cyberGreen} />;
  }

  if (provider === 'Google') {
    return (
      <Svg viewBox="0 0 24 24" width={18} height={18} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Path fill="#EA4335" d="M12.24 10.285V14.4h5.876c-.257 1.322-1.78 3.878-5.876 3.878-3.536 0-6.415-2.929-6.415-6.54s2.879-6.54 6.415-6.54c2.013 0 3.36.86 4.13 1.603l2.821-2.72C17.385 2.41 15.063 1.5 12.24 1.5 6.99 1.5 2.727 5.763 2.727 11.0s4.263 9.5 9.513 9.5c5.492 0 9.136-3.86 9.136-9.3 0-.625-.07-1.102-.154-1.615H12.24Z" />
        <Path fill="#34A853" d="M2.727 6.91 6.11 9.39c.915-1.812 2.785-3.192 6.13-3.192 2.013 0 3.36.86 4.13 1.603l2.821-2.72C17.385 2.41 15.063 1.5 12.24 1.5 8.585 1.5 5.426 3.59 2.727 6.91Z" />
        <Path fill="#FBBC05" d="M12.24 20.5c2.756 0 5.07-.91 6.76-2.47l-3.128-2.57c-.837.585-1.955.997-3.632.997-4.08 0-5.611-2.51-5.86-3.82l-3.41 2.63c1.68 3.33 5.06 5.23 9.27 5.23Z" />
        <Path fill="#4285F4" d="M21.376 11.2c0-.625-.07-1.102-.154-1.615H12.24V13.7h5.876c-.282 1.53-1.387 2.83-3.116 3.76l3.128 2.57c1.826-1.685 3.248-4.173 3.248-8.83Z" />
      </Svg>
    );
  }

  if (provider === 'Apple') {
    return (
      <Svg viewBox="0 0 24 24" width={18} height={18} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Path
          fill="#FFFFFF"
          d="M16.365 12.79c.024 2.506 2.202 3.34 2.226 3.35-.018.06-.347 1.19-1.142 2.357-.686 1.01-1.398 2.014-2.52 2.035-1.102.02-1.456-.654-2.719-.654-1.262 0-1.656.633-2.698.674-1.083.041-1.909-1.086-2.6-2.092-1.41-2.04-2.486-5.764-1.04-8.275.718-1.247 2.002-2.036 3.395-2.056 1.062-.02 2.066.715 2.719.715.653 0 1.879-.885 3.165-.755.539.022 2.055.218 3.028 1.643-.078.048-1.81 1.054-1.794 3.058Zm-2.013-8.607c.574-.696.963-1.666.857-2.63-.827.034-1.827.55-2.42 1.246-.532.613-1 1.594-.874 2.533.922.072 1.863-.468 2.437-1.149Z"
        />
      </Svg>
    );
  }

  return (
    <Svg viewBox="0 0 24 24" width={18} height={18} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Path fill="#F25022" d="M3 3h8.5v8.5H3z" />
      <Path fill="#7FBA00" d="M12.5 3H21v8.5h-8.5z" />
      <Path fill="#00A4EF" d="M3 12.5h8.5V21H3z" />
      <Path fill="#FFB900" d="M12.5 12.5H21V21h-8.5z" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 60,
    flexBasis: '48%',
    flexGrow: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BRAND.colors.border,
    backgroundColor: BRAND.colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  providerLabel: {
    color: BRAND.colors.metalEnd,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
});
