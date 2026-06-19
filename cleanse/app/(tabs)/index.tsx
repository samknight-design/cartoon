import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { createSweep } from '@/lib/db';
import { ThemeName } from '@/lib/scanner';

interface Theme {
  id: ThemeName;
  label: string;
  icon: string;
  description: string;
  aiPowered?: boolean;
}

const THEMES: Theme[] = [
  { id: 'screenshots', label: 'Screenshots', icon: '📸', description: 'Filename & EXIF-based detection' },
  { id: 'duplicates', label: 'Duplicates', icon: '♊', description: 'Hash comparison — keep one copy' },
  { id: 'date_range', label: 'Date Range', icon: '📅', description: 'Before or after a specific date' },
  { id: 'face_match', label: 'Specific Person', icon: '👤', description: 'Match faces to reference photos', aiPowered: true },
];

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function defaultSweepName() {
  return new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function SweepBuilder() {
  const [selected, setSelected] = useState<Set<ThemeName>>(new Set());
  const [name, setName] = useState('');
  const [confidence, setConfidence] = useState(0.75);

  function toggleTheme(id: ThemeName) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function runSweep() {
    if (selected.size === 0) {
      Alert.alert('No themes selected', 'Pick at least one sweep theme to continue.');
      return;
    }
    const id = uid();
    const sweepName = name.trim() || defaultSweepName();
    await createSweep({
      id,
      name: sweepName,
      created_at: Date.now(),
      status: 'pending',
      themes: Array.from(selected),
    });
    router.push(`/sweep/${id}?confidence=${confidence}&themes=${Array.from(selected).join(',')}`);
  }

  const confLabel = confidence >= 0.9 ? 'Aggressive' : confidence >= 0.75 ? 'Balanced' : 'Cautious';

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>New Sweep</Text>
        <Text style={styles.sub}>Select what you want to find and archive.</Text>

        {/* Name */}
        <View style={styles.section}>
          <Text style={styles.label}>Sweep name (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder={defaultSweepName()}
            placeholderTextColor="#52525B"
            value={name}
            onChangeText={setName}
            returnKeyType="done"
          />
        </View>

        {/* Themes */}
        <View style={styles.section}>
          <Text style={styles.label}>Themes</Text>
          <View style={styles.themeGrid}>
            {THEMES.map(t => {
              const active = selected.has(t.id);
              return (
                <Pressable
                  key={t.id}
                  style={[styles.themeCard, active && styles.themeCardActive]}
                  onPress={() => toggleTheme(t.id)}
                >
                  <View style={styles.themeTop}>
                    <Text style={styles.themeIcon}>{t.icon}</Text>
                    {t.aiPowered && (
                      <View style={styles.aiBadge}>
                        <Text style={styles.aiBadgeText}>AI</Text>
                      </View>
                    )}
                    {active && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.themeLabel}>{t.label}</Text>
                  <Text style={styles.themeDesc}>{t.description}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Confidence */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Confidence</Text>
            <Text style={styles.confValue}>{confLabel} ({Math.round(confidence * 100)}%)</Text>
          </View>
          <View style={styles.slider}>
            <Pressable
              style={styles.sliderTrack}
              onPress={e => {
                const x = e.nativeEvent.locationX;
                const w = e.nativeEvent.target as any;
              }}
            >
              {[0.6, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95].map(v => (
                <Pressable
                  key={v}
                  onPress={() => setConfidence(v)}
                  style={[styles.sliderStep, confidence === v && styles.sliderStepActive]}
                >
                  <Text style={[styles.sliderStepLabel, confidence === v && styles.sliderStepLabelActive]}>
                    {Math.round(v * 100)}
                  </Text>
                </Pressable>
              ))}
            </Pressable>
          </View>
          <View style={styles.sliderHints}>
            <Text style={styles.hintText}>Cautious</Text>
            <Text style={styles.hintText}>Aggressive</Text>
          </View>
        </View>

        {/* Run */}
        <Pressable
          style={[styles.runBtn, selected.size === 0 && styles.runBtnDisabled]}
          onPress={runSweep}
        >
          <Text style={styles.runBtnText}>
            Run Sweep {selected.size > 0 ? `· ${selected.size} theme${selected.size > 1 ? 's' : ''}` : ''}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A0A0A' },
  scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  heading: { fontSize: 28, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  sub: { fontSize: 15, color: '#71717A', marginBottom: 28 },
  section: { marginBottom: 28 },
  label: { fontSize: 13, color: '#A1A1AA', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  confValue: { fontSize: 13, color: '#6366F1', fontWeight: '600' },
  input: {
    backgroundColor: '#18181B',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#FFFFFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  themeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  themeCard: {
    width: '47%',
    backgroundColor: '#18181B',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#27272A',
    gap: 6,
  },
  themeCardActive: { borderColor: '#6366F1', backgroundColor: '#1E1B4B' },
  themeTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  themeIcon: { fontSize: 24 },
  aiBadge: {
    backgroundColor: '#7C3AED',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  aiBadgeText: { fontSize: 10, color: '#FFFFFF', fontWeight: '700' },
  checkmark: { fontSize: 16, color: '#6366F1', fontWeight: '700' },
  themeLabel: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
  themeDesc: { fontSize: 12, color: '#71717A', lineHeight: 16 },
  slider: { marginBottom: 8 },
  sliderTrack: { flexDirection: 'row', gap: 4 },
  sliderStep: {
    flex: 1,
    backgroundColor: '#27272A',
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
  },
  sliderStepActive: { backgroundColor: '#6366F1' },
  sliderStepLabel: { fontSize: 11, color: '#71717A', fontWeight: '600' },
  sliderStepLabelActive: { color: '#FFFFFF' },
  sliderHints: { flexDirection: 'row', justifyContent: 'space-between' },
  hintText: { fontSize: 11, color: '#52525B' },
  runBtn: {
    backgroundColor: '#6366F1',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 4,
  },
  runBtnDisabled: { opacity: 0.4 },
  runBtnText: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
});
