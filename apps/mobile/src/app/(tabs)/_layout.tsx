import { Tabs } from 'expo-router';
import { Redirect } from 'expo-router';
import { Activity, PhoneCall, Settings, Users, LayoutDashboard } from 'lucide-react-native';
import { useAuth } from '@clerk/clerk-expo';
import { BRAND } from '../../lib/brand';

export default function TabsLayout() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect href="/auth/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: BRAND.colors.black,
          borderTopColor: BRAND.colors.border,
          height: 84,
          paddingBottom: 18,
          paddingTop: 10,
        },
        tabBarActiveTintColor: BRAND.colors.cyberGreen,
        tabBarInactiveTintColor: BRAND.colors.muted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Dashboard', tabBarIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} /> }} />
      <Tabs.Screen name="calls" options={{ title: 'Calls', tabBarIcon: ({ color, size }) => <PhoneCall size={size} color={color} /> }} />
      <Tabs.Screen name="contacts" options={{ title: 'Contacts', tabBarIcon: ({ color, size }) => <Users size={size} color={color} /> }} />
      <Tabs.Screen name="activity" options={{ title: 'Activity', tabBarIcon: ({ color, size }) => <Activity size={size} color={color} /> }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: ({ color, size }) => <Settings size={size} color={color} /> }} />
      <Tabs.Screen name="numbers" options={{ href: null }} />
      <Tabs.Screen name="messages" options={{ href: null }} />
      <Tabs.Screen name="credits" options={{ href: null }} />
      <Tabs.Screen name="billing" options={{ href: null }} />
      <Tabs.Screen name="verification" options={{ href: null }} />
      <Tabs.Screen name="rentals" options={{ href: null }} />
      <Tabs.Screen name="voicemail" options={{ href: null }} />
      <Tabs.Screen name="esim" options={{ href: null }} />
      <Tabs.Screen name="proxies" options={{ href: null }} />
      <Tabs.Screen name="vpn" options={{ href: null }} />
      <Tabs.Screen name="support" options={{ href: null }} />
      <Tabs.Screen name="support-tickets" options={{ href: null }} />
      <Tabs.Screen name="developer" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
      <Tabs.Screen name="inbox" options={{ href: null }} />
    </Tabs>
  );
}
