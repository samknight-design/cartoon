import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { getDb } from '@/lib/db';

export default function RootLayout() {
  useEffect(() => {
    // Initialise DB on startup
    getDb().catch(console.error);
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#0A0A0A' },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: '#0A0A0A' },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding/welcome" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding/permissions" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding/drive-connect" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="sweep/[id]"
          options={{ title: 'Scanning', headerBackVisible: false }}
        />
        <Stack.Screen
          name="review/[id]"
          options={{ title: 'Review', presentation: 'modal' }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}
