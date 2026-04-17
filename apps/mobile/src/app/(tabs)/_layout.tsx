import { Tabs } from 'expo-router';
import { Redirect } from 'expo-router';
import { LayoutDashboard, MessageSquare, Phone, ShieldCheck, UserCircle } from 'lucide-react-native';
import { useAuth } from '@clerk/clerk-expo';
import { BRAND } from '../../lib/brand';
import { triggerHaptic } from '../../lib/native-ux';

export default function TabsLayout() {
  const { isLoaded, isSignedIn } = useAuth();

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
          backgroundColor: BRAND.colors.black,
          borderTopColor: BRAND.colors.border,
          borderTopWidth: 1,
          height: 88,
          paddingBottom: 20,
          paddingTop: 10,
        },
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
