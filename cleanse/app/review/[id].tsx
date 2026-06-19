import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
  Modal,
} from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCallback, useEffect, useState } from 'react';
import { Asset as MLAsset } from 'expo-media-library';
import { getSweepItems, getSweep, updateItemAction, markItemArchived, updateSweepStatus, Sweep, SweepItem } from '@/lib/db';
import { ensureArchivePath, uploadFile } from '@/lib/drive';

const THEME_LABELS: Record<string, string> = {
  screenshots: 'Screenshots',
  duplicates: 'Duplicates',
  date_range: 'Date Range',
  face_match: 'Person',
};

const THEME_COLORS: Record<string, string> = {
  screenshots: '#3B82F6',
  duplicates: '#F59E0B',
  date_range: '#10B981',
  face_match: '#A855F7',
};

function groupByTheme(items: SweepItem[]): Record<string, SweepItem[]> {
  return items.reduce<Record<string, SweepItem[]>>((acc, item) => {
    (acc[item.theme] ??= []).push(item);
    return acc;
  }, {});
}

function formatDate(ts?: number) {
  if (!ts) return '';
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const THUMB = (width - 48 - 8) / 3;

  const [sweep, setSweep] = useState<Sweep | null>(null);
  const [items, setItems] = useState<SweepItem[]>([]);
  const [actions, setActions] = useState<Record<string, SweepItem['action']>>({});
  const [loading, setLoading] = useState(true);
  const [archiving, setArchiving] = useState(false);
  const [archiveProgress, setArchiveProgress] = useState({ done: 0, total: 0 });
  const [preview, setPreview] = useState<SweepItem | null>(null);

  const load = useCallback(async () => {
    const [s, i] = await Promise.all([getSweep(id), getSweepItems(id)]);
    setSweep(s);
    setItems(i);
    const initialActions: Record<string, SweepItem['action']> = {};
    for (const item of i) initialActions[item.id] = item.action === 'pending' ? 'archive' : item.action;
    setActions(initialActions);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  function setAction(itemId: string, action: SweepItem['action']) {
    setActions(prev => ({ ...prev, [itemId]: action }));
    updateItemAction(itemId, action).catch(console.error);
  }

  function bulkSetTheme(theme: string, action: SweepItem['action']) {
    const themeItems = items.filter(i => i.theme === theme);
    const updates: Record<string, SweepItem['action']> = {};
    for (const item of themeItems) updates[item.id] = action;
    setActions(prev => ({ ...prev, ...updates }));
    Promise.all(themeItems.map(i => updateItemAction(i.id, action))).catch(console.error);
  }

  async function confirmArchive() {
    const toArchive = items.filter(i => actions[i.id] === 'archive');
    if (toArchive.length === 0) {
      Alert.alert('Nothing to archive', 'Mark at least one item as Archive before confirming.');
      return;
    }

    Alert.alert(
      'Archive to Google Drive?',
      `${toArchive.length} item${toArchive.length > 1 ? 's' : ''} will be uploaded to Drive, then removed from your camera roll.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          style: 'destructive',
          onPress: doArchive,
        },
      ]
    );
  }

  async function doArchive() {
    if (!sweep) return;
    setArchiving(true);
    const toArchive = items.filter(i => actions[i.id] === 'archive');
    setArchiveProgress({ done: 0, total: toArchive.length });

    await updateSweepStatus(id, 'archiving');

    const dateStr = new Date().toISOString().slice(0, 10);
    const themeMap: Record<string, string> = {};

    let done = 0;
    let archived = 0;

    for (const item of toArchive) {
      try {
        if (!themeMap[item.theme]) {
          themeMap[item.theme] = await ensureArchivePath(sweep.name, THEME_LABELS[item.theme] ?? item.theme, dateStr);
        }
        const folderId = themeMap[item.theme];
        const filename = item.filename ?? item.asset_id;
        const mimeType = item.media_type === 'video' ? 'video/mp4' : 'image/jpeg';

        const { id: driveId } = await uploadFile(item.asset_uri, filename, mimeType, folderId);
        await markItemArchived(item.id, driveId, `Cleanse/${sweep.name}/${THEME_LABELS[item.theme] ?? item.theme}/${dateStr}`);

        // Remove from camera roll only after confirmed upload
        await MLAsset.delete([new MLAsset(item.asset_id)]);
        archived++;
      } catch (e) {
        console.error('Failed to archive item', item.id, e);
      }
      done++;
      setArchiveProgress({ done, total: toArchive.length });
    }

    await updateSweepStatus(id, 'complete', { total_archived: archived });
    setArchiving(false);

    Alert.alert(
      'Sweep complete',
      `${archived} item${archived !== 1 ? 's' : ''} archived to Google Drive.`,
      [{ text: 'Done', onPress: () => router.replace('/(tabs)') }]
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#6366F1" />
      </View>
    );
  }

  const grouped = groupByTheme(items);
  const archiveCount = items.filter(i => actions[i.id] === 'archive').length;

  const sections: Array<{ theme: string; items: SweepItem[] }> = Object.entries(grouped).map(([t, its]) => ({ theme: t, items: its }));

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* Header summary */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{sweep?.name}</Text>
        <Text style={styles.headerSub}>{items.length} flagged · {archiveCount} to archive</Text>
      </View>

      <FlatList
        data={sections}
        keyExtractor={s => s.theme}
        contentContainerStyle={styles.listContent}
        renderItem={({ item: section }) => {
          const themeArchiveCount = section.items.filter(i => actions[i.id] === 'archive').length;
          return (
            <View style={styles.section}>
              {/* Section header */}
              <View style={styles.sectionHeader}>
                <View style={[styles.themePill, { backgroundColor: THEME_COLORS[section.theme] + '22' }]}>
                  <Text style={[styles.themePillText, { color: THEME_COLORS[section.theme] }]}>
                    {THEME_LABELS[section.theme] ?? section.theme}
                  </Text>
                </View>
                <Text style={styles.sectionCount}>{section.items.length}</Text>
                <View style={styles.bulkActions}>
                  <Pressable onPress={() => bulkSetTheme(section.theme, 'archive')} style={styles.bulkBtn}>
                    <Text style={styles.bulkBtnText}>All</Text>
                  </Pressable>
                  <Pressable onPress={() => bulkSetTheme(section.theme, 'keep')} style={[styles.bulkBtn, styles.bulkBtnKeep]}>
                    <Text style={[styles.bulkBtnText, styles.bulkBtnKeepText]}>Keep all</Text>
                  </Pressable>
                </View>
              </View>

              {/* Grid */}
              <View style={styles.grid}>
                {section.items.map(item => {
                  const action = actions[item.id] ?? 'archive';
                  return (
                    <Pressable
                      key={item.id}
                      style={[styles.thumb, { width: THUMB, height: THUMB }]}
                      onPress={() => setPreview(item)}
                    >
                      <Image
                        source={{ uri: item.asset_uri }}
                        style={[StyleSheet.absoluteFill, styles.thumbImg]}
                        contentFit="cover"
                      />
                      {/* Action badge */}
                      <View style={[
                        styles.actionBadge,
                        action === 'archive' && styles.badgeArchive,
                        action === 'keep' && styles.badgeKeep,
                        action === 'skip' && styles.badgeSkip,
                      ]}>
                        <Text style={styles.badgeText}>
                          {action === 'archive' ? '↑' : action === 'keep' ? '✓' : '—'}
                        </Text>
                      </View>
                      {/* Confidence */}
                      <View style={styles.confBadge}>
                        <Text style={styles.confBadgeText}>{Math.round(item.confidence * 100)}%</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        }}
        ListFooterComponent={
          <View style={styles.footer}>
            <Pressable
              style={[styles.archiveBtn, archiveCount === 0 && styles.archiveBtnDisabled]}
              onPress={confirmArchive}
              disabled={archiveCount === 0}
            >
              <Text style={styles.archiveBtnText}>
                Archive {archiveCount > 0 ? `${archiveCount} item${archiveCount > 1 ? 's' : ''}` : ''} to Drive
              </Text>
            </Pressable>
          </View>
        }
      />

      {/* Preview modal */}
      <Modal visible={!!preview} transparent animationType="fade" onRequestClose={() => setPreview(null)}>
        <View style={styles.modalBg}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setPreview(null)} />
          {preview && (
            <View style={styles.modalCard}>
              <Image
                source={{ uri: preview.asset_uri }}
                style={styles.modalImage}
                contentFit="contain"
              />
              <View style={styles.modalInfo}>
                <Text style={styles.modalFilename}>{preview.filename}</Text>
                <Text style={styles.modalMeta}>{formatDate(preview.created_time)} · {Math.round(preview.confidence * 100)}% confidence</Text>
              </View>
              <View style={styles.modalActions}>
                {(['archive', 'keep', 'skip'] as const).map(a => (
                  <Pressable
                    key={a}
                    style={[styles.modalActionBtn, actions[preview.id] === a && styles.modalActionBtnActive]}
                    onPress={() => { setAction(preview.id, a); setPreview(null); }}
                  >
                    <Text style={[styles.modalActionText, actions[preview.id] === a && styles.modalActionTextActive]}>
                      {a.charAt(0).toUpperCase() + a.slice(1)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* Archiving overlay */}
      {archiving && (
        <View style={styles.archivingOverlay}>
          <View style={styles.archivingCard}>
            <ActivityIndicator color="#6366F1" size="large" />
            <Text style={styles.archivingTitle}>Archiving…</Text>
            <Text style={styles.archivingProgress}>
              {archiveProgress.done} / {archiveProgress.total}
            </Text>
            <View style={styles.archivingBarTrack}>
              <View style={[styles.archivingBarFill, {
                width: `${archiveProgress.total > 0 ? (archiveProgress.done / archiveProgress.total) * 100 : 0}%`
              }]} />
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A0A0A' },
  center: { flex: 1, backgroundColor: '#0A0A0A', justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#18181B' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  headerSub: { fontSize: 13, color: '#71717A', marginTop: 2 },
  listContent: { paddingHorizontal: 16, paddingBottom: 40 },
  section: { marginTop: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  themePill: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  themePillText: { fontSize: 12, fontWeight: '700' },
  sectionCount: { fontSize: 13, color: '#52525B', flex: 1 },
  bulkActions: { flexDirection: 'row', gap: 6 },
  bulkBtn: { backgroundColor: '#6366F1', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  bulkBtnText: { fontSize: 12, color: '#FFFFFF', fontWeight: '600' },
  bulkBtnKeep: { backgroundColor: '#27272A' },
  bulkBtnKeepText: { color: '#A1A1AA' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  thumb: { borderRadius: 8, overflow: 'hidden', backgroundColor: '#18181B' },
  thumbImg: { borderRadius: 8 },
  actionBadge: {
    position: 'absolute', top: 6, right: 6,
    width: 22, height: 22, borderRadius: 11,
    justifyContent: 'center', alignItems: 'center',
  },
  badgeArchive: { backgroundColor: '#6366F1' },
  badgeKeep: { backgroundColor: '#22C55E' },
  badgeSkip: { backgroundColor: '#52525B' },
  badgeText: { fontSize: 11, color: '#FFFFFF', fontWeight: '700' },
  confBadge: { position: 'absolute', bottom: 4, left: 4, backgroundColor: '#00000088', borderRadius: 4, paddingHorizontal: 4, paddingVertical: 2 },
  confBadgeText: { fontSize: 10, color: '#FFFFFF' },
  footer: { marginTop: 24 },
  archiveBtn: { backgroundColor: '#6366F1', borderRadius: 14, paddingVertical: 18, alignItems: 'center' },
  archiveBtnDisabled: { opacity: 0.4 },
  archiveBtnText: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  // Modal
  modalBg: { flex: 1, backgroundColor: '#000000CC', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#111111', borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden' },
  modalImage: { width: '100%', height: 360 },
  modalInfo: { paddingHorizontal: 20, paddingVertical: 12 },
  modalFilename: { fontSize: 14, color: '#A1A1AA', fontWeight: '500' },
  modalMeta: { fontSize: 12, color: '#52525B', marginTop: 4 },
  modalActions: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 32, gap: 10 },
  modalActionBtn: { flex: 1, backgroundColor: '#18181B', borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1.5, borderColor: '#27272A' },
  modalActionBtnActive: { borderColor: '#6366F1', backgroundColor: '#1E1B4B' },
  modalActionText: { fontSize: 15, fontWeight: '600', color: '#71717A' },
  modalActionTextActive: { color: '#6366F1' },
  // Archiving overlay
  archivingOverlay: { ...StyleSheet.absoluteFill, backgroundColor: '#000000CC', justifyContent: 'center', alignItems: 'center' },
  archivingCard: { backgroundColor: '#111111', borderRadius: 20, padding: 32, alignItems: 'center', gap: 16, width: 260 },
  archivingTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  archivingProgress: { fontSize: 14, color: '#71717A' },
  archivingBarTrack: { width: '100%', height: 4, backgroundColor: '#27272A', borderRadius: 2 },
  archivingBarFill: { height: '100%', backgroundColor: '#6366F1', borderRadius: 2 },
});
