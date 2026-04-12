import { Tabs } from 'expo-router';
import { Redirect } from 'expo-router';
import { StyleSheet, View, Text } from 'react-native';
import { Phone, MessageSquare, CreditCard, User, LayoutDashboard } from 'lucide-react-native';
import { useAuth } from '@clerk/clerk-expo';

export default function TabsLayout() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect href="/auth/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#111111', borderTopColor: '#2A2A2A', height: 80, paddingBottom: 16 },
        tabBarActiveTintColor: '#00FF9D',
        tabBarInactiveTintColor: '#666666',
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color, size }) => <LayoutDashboard size={size} color={color}/> }}/>
      <Tabs.Screen name="numbers" options={{ title: 'Numbers', tabBarIcon: ({ color, size }) => <Phone size={size} color={color}/> }}/>
      <Tabs.Screen name="messages" options={{ title: 'Inbox', tabBarIcon: ({ color, size }) => <MessageSquare size={size} color={color}/> }}/>
      <Tabs.Screen name="credits" options={{ title: 'Credits', tabBarIcon: ({ color, size }) => <CreditCard size={size} color={color}/> }}/>
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <User size={size} color={color}/> }}/>
    </Tabs>
  );
}
