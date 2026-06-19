import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { isAuthenticated } from '@/lib/auth';
import * as MediaLibrary from 'expo-media-library';

export default function EntryPoint() {
  const [target, setTarget] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [authOk, mediaStatus] = await Promise.all([
        isAuthenticated(),
        MediaLibrary.getPermissionsAsync(),
      ]);
      if (!mediaStatus.granted || !authOk) {
        setTarget('onboarding/welcome');
      } else {
        setTarget('(tabs)');
      }
    })();
  }, []);

  if (!target) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0A0A0A', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#6366F1" />
      </View>
    );
  }

  return <Redirect href={target as any} />;
}
