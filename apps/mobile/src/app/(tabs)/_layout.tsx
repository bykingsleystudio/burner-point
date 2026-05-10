import { Tabs } from 'expo-router';
import { Redirect } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { LayoutDashboard, MessageSquare, Phone, ShieldCheck, UserCircle } from 'lucide-react-native';
import { useBurnerAuth } from '../../lib/auth-context';
import { BRAND } from '../../lib/brand';
import { triggerHaptic } from '../../lib/native-ux';

export default function TabsLayout() {
  const { isLoaded, isSignedIn } = useBurnerAuth();

  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect href="/auth/login" />;

  return (
    <Tabs
      screenListeners={{
        tabPress: () => triggerHaptic('selection'),
      }}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          left: 12,
          right: 12,
          bottom: 12,
          height: 82,
          borderTopWidth: 0,
          backgroundColor: 'transparent',
          paddingBottom: 12,
          paddingTop: 10,
        },
        tabBarBackground: () => <View style={styles.tabBarBackground} />,
        tabBarActiveTintColor: BRAND.colors.cyberGreen,
        tabBarInactiveTintColor: BRAND.colors.muted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', marginTop: 2 },
        tabBarItemStyle: { minHeight: 58 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Dashboard', tabBarIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} /> }} />
      <Tabs.Screen name="messages" options={{ title: 'Inbox', tabBarIcon: ({ color, size }) => <MessageSquare size={size} color={color} /> }} />
      <Tabs.Screen name="verification" options={{ title: 'Verify', tabBarIcon: ({ color, size }) => <ShieldCheck size={size} color={color} /> }} />
      <Tabs.Screen name="numbers" options={{ title: 'Numbers', tabBarIcon: ({ color, size }) => <Phone size={size} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <UserCircle size={size} color={color} /> }} />
      <Tabs.Screen name="calls" options={{ href: null }} />
      <Tabs.Screen name="contacts" options={{ href: null }} />
      <Tabs.Screen name="activity" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="credits" options={{ href: null }} />
      <Tabs.Screen name="billing" options={{ href: null }} />
      <Tabs.Screen name="rentals" options={{ href: null }} />
      <Tabs.Screen name="voicemail" options={{ href: null }} />
      <Tabs.Screen name="esim" options={{ href: null }} />
      <Tabs.Screen name="proxies" options={{ href: null }} />
      <Tabs.Screen name="vpn" options={{ href: null }} />
      <Tabs.Screen name="support" options={{ href: null }} />
      <Tabs.Screen name="support-tickets" options={{ href: null }} />
      <Tabs.Screen name="developer" options={{ href: null }} />
      <Tabs.Screen name="inbox" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarBackground: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: `${BRAND.colors.white}12`,
    backgroundColor: `${BRAND.colors.surface}F2`,
    shadowColor: '#000000',
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
});
