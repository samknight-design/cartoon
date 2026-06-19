import { Tabs } from 'expo-router';
import { Text } from 'react-native';

function TabIcon({ symbol, focused }: { symbol: string; focused: boolean }) {
  return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.45 }}>{symbol}</Text>;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#0A0A0A' },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: '600' },
        tabBarStyle: {
          backgroundColor: '#111111',
          borderTopColor: '#27272A',
          borderTopWidth: 1,
          height: 80,
          paddingBottom: 20,
        },
        tabBarActiveTintColor: '#6366F1',
        tabBarInactiveTintColor: '#52525B',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Sweep',
          tabBarIcon: ({ focused }) => <TabIcon symbol="✦" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ focused }) => <TabIcon symbol="⏱" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
