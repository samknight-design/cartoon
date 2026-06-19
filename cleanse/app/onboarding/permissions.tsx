import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as MediaLibrary from 'expo-media-library';
import { useState } from 'react';

export default function Permissions() {
  const [granted, setGranted] = useState(false);

  async function requestPermission() {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status === 'granted') {
      setGranted(true);
      router.push('/onboarding/drive-connect');
    } else {
      Alert.alert(
        'Permission required',
        'Cleanse needs access to your photo library to scan and archive media. Please enable it in Settings.',
        [{ text: 'OK' }]
      );
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.step}>Step 1 of 2</Text>
          <Text style={styles.title}>Allow photo access</Text>
          <Text style={styles.body}>
            Cleanse needs full access to your photo library to scan, flag, and archive media.{'\n\n'}
            Scanning happens entirely on-device — your photos are never uploaded to any server.
          </Text>

          <View style={styles.permBox}>
            <Text style={styles.permIcon}>🖼️</Text>
            <View>
              <Text style={styles.permTitle}>Photo Library</Text>
              <Text style={styles.permDesc}>Read and delete media after archiving to Drive</Text>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable style={styles.btn} onPress={requestPermission}>
            <Text style={styles.btnText}>Grant access</Text>
          </Pressable>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.back}>Back</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A0A0A' },
  container: { flex: 1, paddingHorizontal: 24, justifyContent: 'space-between', paddingBottom: 32 },
  content: { marginTop: 60, gap: 20 },
  step: { fontSize: 13, color: '#6366F1', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  title: { fontSize: 30, fontWeight: '700', color: '#FFFFFF' },
  body: { fontSize: 16, color: '#A1A1AA', lineHeight: 26 },
  permBox: {
    flexDirection: 'row',
    gap: 16,
    backgroundColor: '#18181B',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#27272A',
  },
  permIcon: { fontSize: 28 },
  permTitle: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
  permDesc: { fontSize: 13, color: '#71717A', marginTop: 2 },
  actions: { gap: 12 },
  btn: { backgroundColor: '#6366F1', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  btnText: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  back: { textAlign: 'center', fontSize: 15, color: '#71717A', paddingVertical: 8 },
});
