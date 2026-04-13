import { Tabs } from 'expo-router';
import { Redirect } from 'expo-router';
import { Activity, PhoneCall, Settings, Users, LayoutDashboard } from 'lucide-react-native';
import { useAuth } from '@clerk/clerk-expo';

export default function TabsLayout() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect href="/auth/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#000000',
          borderTopColor: '#123425',
          height: 84,
          paddingBottom: 18,
          paddingTop: 10,
        },
        tabBarActiveTintColor: '#00FF9D',
        tabBarInactiveTintColor: '#617169',
        tabBarLabelStyle: { fontSize: 10, fontWeight: '800' },
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
      <Tabs.Screen name="profile" options={{ href: null }} />
      <Tabs.Screen name="inbox" options={{ href: null }} />
    </Tabs>
  );
}
