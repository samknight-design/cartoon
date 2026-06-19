import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCallback, useState } from 'react';
import { listSweeps, Sweep } from '@/lib/db';

const STATUS_COLOR: Record<string, string> = {
  pending: '#71717A',
  running: '#EAB308',
  review: '#3B82F6',
  archiving: '#A855F7',
  complete: '#22C55E',
};

function SweepRow({ sweep }: { sweep: Sweep }) {
  const date = new Date(sweep.created_at).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
  const themes = sweep.themes.join(', ').replace(/_/g, ' ');
  const statusColor = STATUS_COLOR[sweep.status] ?? '#71717A';
  const canReview = sweep.status === 'review' || sweep.status === 'complete';

  return (
    <Pressable
      style={styles.row}
      onPress={() => canReview && router.push(`/review/${sweep.id}`)}
    >
      <View style={styles.rowLeft}>
        <Text style={styles.rowName}>{sweep.name}</Text>
        <Text style={styles.rowMeta}>{date} · {themes}</Text>
        <View style={styles.counts}>
          <Text style={styles.countText}>{sweep.total_scanned} scanned</Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.countText}>{sweep.total_flagged} flagged</Text>
          {sweep.total_archived > 0 && (
            <>
              <Text style={styles.dot}>·</Text>
              <Text style={styles.countTextGreen}>{sweep.total_archived} archived</Text>
            </>
          )}
        </View>
      </View>
      <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
    </Pressable>
  );
}

export default function History() {
  const [sweeps, setSweeps] = useState<Sweep[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      listSweeps().then(s => {
        setSweeps(s);
        setLoading(false);
      });
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#6366F1" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {sweeps.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>⏱</Text>
          <Text style={styles.emptyTitle}>No sweeps yet</Text>
          <Text style={styles.emptyBody}>Run your first sweep from the Sweep tab.</Text>
        </View>
      ) : (
        <FlatList
          data={sweeps}
          keyExtractor={s => s.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          renderItem={({ item }) => <SweepRow sweep={item} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A0A0A' },
  center: { flex: 1, backgroundColor: '#0A0A0A', justifyContent: 'center', alignItems: 'center' },
  list: { paddingHorizontal: 20, paddingVertical: 16 },
  sep: { height: 1, backgroundColor: '#18181B' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  rowLeft: { flex: 1, gap: 4 },
  rowName: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  rowMeta: { fontSize: 13, color: '#71717A', textTransform: 'capitalize' },
  counts: { flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: 2 },
  countText: { fontSize: 12, color: '#52525B' },
  countTextGreen: { fontSize: 12, color: '#22C55E' },
  dot: { fontSize: 12, color: '#3F3F46' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8, paddingHorizontal: 40 },
  emptyIcon: { fontSize: 40, marginBottom: 4 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#FFFFFF' },
  emptyBody: { fontSize: 15, color: '#71717A', textAlign: 'center', lineHeight: 22 },
});
