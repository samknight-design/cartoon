import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useRef, useState } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { runSweep, ThemeConfig, ThemeName, ScanProgress } from '@/lib/scanner';

const THEME_LABELS: Record<ThemeName, string> = {
  screenshots: 'Screenshots',
  duplicates: 'Duplicates',
  date_range: 'Date Range',
  face_match: 'Person',
};

const THEME_ICONS: Record<ThemeName, string> = {
  screenshots: '📸',
  duplicates: '♊',
  date_range: '📅',
  face_match: '👤',
};

export default function SweepRunning() {
  const { id, themes: themesParam, confidence: confParam } = useLocalSearchParams<{
    id: string;
    themes: string;
    confidence: string;
  }>();

  const [progress, setProgress] = useState<ScanProgress>({
    phase: 'loading',
    scanned: 0,
    total: 0,
    flaggedByTheme: {},
  });
  const [error, setError] = useState<string | null>(null);
  const didStart = useRef(false);

  const pulse = useSharedValue(1);
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: pulse.value,
  }));

  useEffect(() => {
    pulse.value = withRepeat(withTiming(0.4, { duration: 900, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, []);

  useEffect(() => {
    if (didStart.current) return;
    didStart.current = true;

    const themeNames = (themesParam ?? '').split(',').filter(Boolean) as ThemeName[];
    const conf = parseFloat(confParam ?? '0.75');

    const themeConfigs: ThemeConfig[] = themeNames.map(name => ({
      name,
      label: THEME_LABELS[name] ?? name,
      confidence: conf,
    }));

    runSweep(id, themeConfigs, setProgress).catch(e => {
      setError(e?.message ?? 'Scan failed');
    });
  }, []);

  useEffect(() => {
    if (progress.phase === 'done') {
      const totalFlagged = Object.values(progress.flaggedByTheme).reduce((a, b) => a + b, 0);
      setTimeout(() => {
        router.replace(`/review/${id}`);
      }, totalFlagged === 0 ? 800 : 1200);
    }
  }, [progress.phase]);

  const pct = progress.total > 0 ? progress.scanned / progress.total : 0;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Pulse icon */}
        <View style={styles.heroArea}>
          <Animated.View style={[styles.pulse, pulseStyle]}>
            <Text style={styles.pulseIcon}>✦</Text>
          </Animated.View>
          <Text style={styles.phase}>
            {progress.phase === 'loading' ? 'Loading library…' :
              progress.phase === 'done' ? 'Done' :
                'Scanning…'}
          </Text>
          {progress.total > 0 && (
            <Text style={styles.counter}>
              {progress.scanned.toLocaleString()} / {progress.total.toLocaleString()}
            </Text>
          )}
        </View>

        {/* Progress bar */}
        <View style={styles.barTrack}>
          <Animated.View style={[styles.barFill, { width: `${Math.round(pct * 100)}%` }]} />
        </View>

        {/* Per-theme counts */}
        {Object.entries(progress.flaggedByTheme).length > 0 && (
          <View style={styles.themeStats}>
            {Object.entries(progress.flaggedByTheme).map(([theme, count]) => (
              <View key={theme} style={styles.themeStatRow}>
                <Text style={styles.themeStatIcon}>{THEME_ICONS[theme as ThemeName] ?? '•'}</Text>
                <Text style={styles.themeStatLabel}>{THEME_LABELS[theme as ThemeName] ?? theme}</Text>
                <Text style={styles.themeStatCount}>{count} flagged</Text>
              </View>
            ))}
          </View>
        )}

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={() => router.back()} style={styles.errorBtn}>
              <Text style={styles.errorBtnText}>Go back</Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A0A0A' },
  container: { flex: 1, paddingHorizontal: 24, justifyContent: 'center', gap: 32 },
  heroArea: { alignItems: 'center', gap: 16 },
  pulse: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#6366F1', justifyContent: 'center', alignItems: 'center' },
  pulseIcon: { fontSize: 36, color: '#FFFFFF' },
  phase: { fontSize: 22, fontWeight: '700', color: '#FFFFFF' },
  counter: { fontSize: 15, color: '#71717A' },
  barTrack: { height: 4, backgroundColor: '#27272A', borderRadius: 2, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: '#6366F1', borderRadius: 2 },
  themeStats: {
    backgroundColor: '#18181B',
    borderRadius: 14,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  themeStatRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  themeStatIcon: { fontSize: 18, width: 26 },
  themeStatLabel: { flex: 1, fontSize: 14, color: '#A1A1AA', textTransform: 'capitalize' },
  themeStatCount: { fontSize: 14, fontWeight: '600', color: '#6366F1' },
  errorBox: { backgroundColor: '#450A0A', borderRadius: 12, padding: 16, gap: 12 },
  errorText: { color: '#FCA5A5', fontSize: 14 },
  errorBtn: { backgroundColor: '#7F1D1D', borderRadius: 8, padding: 10, alignItems: 'center' },
  errorBtnText: { color: '#FFFFFF', fontWeight: '600' },
});
