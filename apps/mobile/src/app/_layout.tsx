import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ClerkProvider } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import * as Font from 'expo-font';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as WebBrowser from 'expo-web-browser';
import { View, Text, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BRAND } from '../lib/brand';

WebBrowser.maybeCompleteAuthSession();

const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function registerForPushNotifications() {
  if (!Device.isDevice) return null;
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;
  const token = await Notifications.getExpoPushTokenAsync();
  return token.data;
}

export default function RootLayout() {
  const [loaded, setLoaded] = useState(false);
  const [authenticated, setAuthenticated] = useState(true); // Skip biometrics if not enrolled

  useEffect(() => {
    (async () => {
      await Font.loadAsync({
        'SpaceGrotesk-Regular': require('@expo-google-fonts/space-grotesk').SpaceGrotesk_400Regular,
        'SpaceGrotesk-SemiBold': require('@expo-google-fonts/space-grotesk').SpaceGrotesk_600SemiBold,
        'SpaceGrotesk-Bold': require('@expo-google-fonts/space-grotesk').SpaceGrotesk_700Bold,
        'DMMono-Regular': require('@expo-google-fonts/dm-mono').DMMono_400Regular,
      }).catch(() => {/* fonts optional */});

      // Biometric authentication check
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (compatible && enrolled) {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Authenticate to access Burner Point',
          fallbackLabel: 'Use passcode',
        });
        setAuthenticated(result.success);
      }

      // Push notifications
      await registerForPushNotifications();

      setLoaded(true);
    })();
  }, []);

  if (!loaded) {
    return (
      <View style={styles.splash}>
        <View style={styles.logoBox}>
          <Text style={styles.logoText}>BP</Text>
        </View>
        <Text style={styles.splashTitle}>Burner Point</Text>
        <Text style={styles.splashSub}>{BRAND.message}</Text>
      </View>
    );
  }

  if (!authenticated) {
    return (
      <View style={styles.splash}>
        <Text style={styles.splashTitle}>Authentication Required</Text>
      </View>
    );
  }

  return (
    <ClerkProvider publishableKey={clerkPublishableKey || ''} tokenCache={tokenCache}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="light" backgroundColor={BRAND.colors.black}/>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: BRAND.colors.black } }}>
          <Stack.Screen name="auth/login"/>
          <Stack.Screen name="auth/register"/>
          <Stack.Screen name="(tabs)"/>
          <Stack.Screen name="call/active" options={{ presentation: 'fullScreenModal' }}/>
        </Stack>
      </GestureHandlerRootView>
    </ClerkProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: BRAND.colors.black,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  logoBox: {
    width: 64,
    height: 64,
    borderRadius: BRAND.radii.lg,
    backgroundColor: BRAND.colors.cyberGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: BRAND.colors.cyberGreen,
    shadowOpacity: 0.28,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
  },
  logoText: { color: BRAND.colors.black, fontSize: 24, fontWeight: '900' },
  splashTitle: { color: BRAND.colors.white, fontSize: 24, fontWeight: '900', marginBottom: 8 },
  splashSub: {
    color: BRAND.colors.metalEnd,
    fontSize: 14,
    lineHeight: 22,
    maxWidth: 290,
    textAlign: 'center',
  },
});
