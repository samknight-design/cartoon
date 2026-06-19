import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const FEATURES = [
  { icon: '🔒', title: 'Fully private', body: 'All scanning runs on-device. Your photos never leave your phone.' },
  { icon: '☁️', title: 'Archive, never delete', body: 'Items move to your Google Drive before being removed.' },
  { icon: '🎯', title: 'You stay in control', body: 'Review every flagged item and confirm before anything is archived.' },
];

export default function Welcome() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.logo}>✦ Cleanse</Text>
          <Text style={styles.headline}>Your camera roll,{'\n'}decluttered with care.</Text>
          <Text style={styles.sub}>
            Sweep screenshots, duplicates, and more — archived safely to Google Drive.
          </Text>
        </View>

        <View style={styles.features}>
          {FEATURES.map(f => (
            <View key={f.title} style={styles.featureRow}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureBody}>{f.body}</Text>
              </View>
            </View>
          ))}
        </View>

        <Pressable style={styles.btn} onPress={() => router.push('/onboarding/permissions')}>
          <Text style={styles.btnText}>Get started</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A0A0A' },
  container: { flex: 1, paddingHorizontal: 24, justifyContent: 'space-between', paddingBottom: 32 },
  hero: { marginTop: 60, gap: 16 },
  logo: { fontSize: 18, color: '#6366F1', fontWeight: '700', letterSpacing: 1 },
  headline: { fontSize: 34, fontWeight: '700', color: '#FFFFFF', lineHeight: 42 },
  sub: { fontSize: 16, color: '#A1A1AA', lineHeight: 24 },
  features: { gap: 24 },
  featureRow: { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  featureIcon: { fontSize: 26, width: 36 },
  featureText: { flex: 1, gap: 4 },
  featureTitle: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  featureBody: { fontSize: 14, color: '#A1A1AA', lineHeight: 20 },
  btn: {
    backgroundColor: '#6366F1',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnText: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
});
