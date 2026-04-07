import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Font from 'expo-font';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { View, Text, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

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
          promptMessage: 'Authenticate to access BurnerPoint',
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
        <Text style={styles.splashTitle}>BurnerPoint</Text>
        <Text style={styles.splashSub}>Privacy is not a feature.</Text>
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" backgroundColor="#0A0A0A"/>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0A0A0A' } }}>
        <Stack.Screen name="(tabs)"/>
        <Stack.Screen name="call/active" options={{ presentation: 'fullScreenModal' }}/>
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, backgroundColor: '#0A0A0A', alignItems: 'center', justifyContent: 'center' },
  logoBox: { width: 64, height: 64, borderRadius: 16, backgroundColor: '#00FF9D', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  logoText: { color: '#0A0A0A', fontSize: 24, fontWeight: 'bold' },
  splashTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  splashSub: { color: '#666666', fontSize: 14 },
});
