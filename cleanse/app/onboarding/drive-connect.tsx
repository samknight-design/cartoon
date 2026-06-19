import { View, Text, StyleSheet, Pressable, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { saveTokens, saveUser } from '@/lib/auth';
import { ensureFolder } from '@/lib/drive';

/**
 * Google Sign-In requires native module linking.
 * Until @react-native-google-signin/google-signin is installed and configured
 * with a real OAuth client ID, this screen uses a mock flow for development.
 *
 * To enable real auth:
 *   1. npx expo install @react-native-google-signin/google-signin
 *   2. Add plugin to app.json: "@react-native-google-signin/google-signin"
 *   3. Replace mockGoogleSignIn below with GoogleSignin.signIn()
 *   4. Set GOOGLE_WEB_CLIENT_ID in .env
 */
async function mockGoogleSignIn() {
  // Simulate network delay
  await new Promise(r => setTimeout(r, 1200));
  return {
    user: { email: 'demo@gmail.com', name: 'Demo User', photo: undefined },
    accessToken: 'MOCK_TOKEN_' + Date.now(),
  };
}

export default function DriveConnect() {
  const [loading, setLoading] = useState(false);

  async function handleConnect() {
    setLoading(true);
    try {
      const { user, accessToken } = await mockGoogleSignIn();
      await saveTokens(accessToken);
      await saveUser(user);
      // Try to create the /Cleanse/ folder (will fail with mock token in prod)
      try {
        await ensureFolder('Cleanse');
      } catch {
        // Ignore in dev — folder creation needs a real token
      }
      router.replace('/(tabs)');
    } catch (e) {
      Alert.alert('Sign-in failed', 'Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.step}>Step 2 of 2</Text>
          <Text style={styles.title}>Connect Google Drive</Text>
          <Text style={styles.body}>
            Cleanse archives your flagged photos to your own Google Drive — so nothing is ever permanently deleted without a cloud backup.{'\n\n'}
            A folder called <Text style={styles.highlight}>/Cleanse/</Text> will be created in your Drive.
          </Text>

          <View style={styles.box}>
            <View style={styles.boxRow}>
              <Text style={styles.check}>✓</Text>
              <Text style={styles.boxText}>Only Cleanse folder access — not your entire Drive</Text>
            </View>
            <View style={styles.boxRow}>
              <Text style={styles.check}>✓</Text>
              <Text style={styles.boxText}>Restore archived items at any time</Text>
            </View>
            <View style={styles.boxRow}>
              <Text style={styles.check}>✓</Text>
              <Text style={styles.boxText}>No photo content is ever shared with third parties</Text>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable style={[styles.btn, loading && styles.btnDisabled]} onPress={handleConnect} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.btnText}>Connect Google Drive</Text>
            )}
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
  highlight: { color: '#6366F1', fontFamily: 'monospace' },
  box: {
    backgroundColor: '#18181B',
    borderRadius: 14,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  boxRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  check: { color: '#22C55E', fontWeight: '700', fontSize: 15, marginTop: 1 },
  boxText: { flex: 1, color: '#A1A1AA', fontSize: 14, lineHeight: 20 },
  actions: { gap: 12 },
  btn: { backgroundColor: '#6366F1', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  btnDisabled: { opacity: 0.6 },
  btnText: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  back: { textAlign: 'center', fontSize: 15, color: '#71717A', paddingVertical: 8 },
});
